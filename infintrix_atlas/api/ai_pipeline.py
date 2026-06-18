import frappe
import json
import time
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from openai import OpenAI
from frappe.utils import now
import uuid
from frappe import _
# ============================================================
# SCHEMAS FOR STRUCTURED OUTPUTS
# ============================================================


class Intent(BaseModel):
    text: str


class IntentResponse(BaseModel):
    intents: List[Intent]


class ValidationResult(BaseModel):
    valid: bool = True
    errors: List[str] = Field(default_factory=list)


class TaskDraft(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject: str
    priority: str = "Medium"
    weight: int
    confidence: float
    reasoning: str
    description: str
    status: str = "Draft"
    type: Literal["Task", "Feature", "Epic"] = "Task"
    cycle: Optional[str] = None
    validation: ValidationResult = Field(default_factory=ValidationResult)

class TaskResponse(BaseModel):
    tasks: List[TaskDraft]


# ============================================================
# OPEN-PROVIDER AI REQUEST (OPENAI SDK + STRUCTURED OUTPUTS)
# ============================================================


def make_ai_request(
    prompt: str,
    system_prompt: str = "",
    response_format: type[BaseModel] = None,
    max_retries: int = 5,
):
    """
    Makes a request to the LLM via OpenRouter (OpenAI-compatible API).
    Uses the OpenAI SDK with Structured Outputs (Pydantic).
    Includes exponential backoff for rate limits.
    """
    settings = frappe.get_single("Atlas Settings")

    api_key = settings.get_password(fieldname="api_key", raise_exception=True)

    model = settings.openai_model or "openai/gpt-4o-mini"

    client_kwargs = {"api_key": api_key}
    base_url = settings.api_base or "https://openrouter.ai/api/v1"
    client_kwargs["base_url"] = base_url

    client = OpenAI(**client_kwargs)

    messages = [
        {"role": "system", "content": system_prompt.strip()},
        {"role": "user", "content": prompt},
    ]

    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            # Using beta.chat.completions.parse for Structured Outputs
            completion = client.beta.chat.completions.parse(
                model=model,
                messages=messages,
                response_format=response_format,
                timeout=120,
            )

            # Return the parsed Pydantic object
            return completion.choices[0].message.parsed

        except Exception as e:
            last_error = str(e)

            # Handle Rate Limiting (429) via string check or error code
            if "429" in last_error or "rate_limit_exceeded" in last_error:
                wait_time = 2**attempt
                time.sleep(wait_time)
                continue

            # Log other failures
            frappe.log_error(
                f"Attempt {attempt} failed\n{last_error}",
                "Open AI SDK Failure",
            )

            # Small delay for generic errors before retry
            time.sleep(1)

    raise RuntimeError(
        f"LLM failed after {max_retries} attempts. Last error: {last_error}"
    )


# ============================================================
# STEP 1: INTENT DECOMPOSITION
# ============================================================


def _decompose(prompt):
    system_prompt = """
You are the ERPNext Intent Decomposer.
Goal: Extract clear, atomic, epic-level intents from a user prompt for ERP/CRM work.

Rules:
- Produce as many intents as needed to fully cover the request
- Each intent must be a single, standalone action (no compound actions)
- Each intent is epic-level (end-to-end outcome, not a subtask)
- Max 12 words per intent
- Start with an imperative verb (e.g., "Create", "Configure", "Implement")
- No "and", no commas, no slashes, no conjunctions
- Avoid vague verbs like "Handle" or "Do"
- Prefer business/ERP terms (e.g., "Define", "Configure", "Integrate", "Automate")
- Use explicit objects and scope (modules, documents, workflows)
- Do not include assumptions, solutions, or technical steps
"""
    output = make_ai_request(prompt, system_prompt, response_format=IntentResponse)
    if output and hasattr(output, "intents"):
        return [i.model_dump() for i in output.intents]
    return []


# ============================================================
# STEP 2: FEASIBILITY GUARD
# ============================================================


def _feasibility_guard(prompt, project_doc):
    return {"status": "PASS"}


# ============================================================
# STEP 3: TASK DRAFTING
# ============================================================


def _draft_tasks(intents, project_doc, context_notes=""):
    intent_text = "\n".join(f"- {i['text']}" for i in intents)
    prompt_parts = [f"Project: {project_doc.project_name}"]

    if context_notes:
        prompt_parts.append(context_notes)

    prompt_parts.append(f"Intents:\n{intent_text}")

    system_prompt = """
You are the Project Task Architect.
Generate a comprehensive, actionable task list from the given intents.

Rules:
- Treat each intent as an epic
- Create as many tasks as needed to fully realize each epic
- Use distinct, non-overlapping tasks
- Keep tasks concise but specific
- Prefer smaller atomic tasks over large ones
"""

    output = make_ai_request(
        "\n\n".join(prompt_parts),
        system_prompt,
        response_format=TaskResponse,
    )
    if output and hasattr(output, "tasks"):
        return [t.model_dump() for t in output.tasks]
    return []


# ============================================================
# STEP 4: TASK VALIDATION
# ============================================================


def _validate_task(task):
    errors = []
    if len(task.get("subject", "")) < 5:
        errors.append("Subject too short")
    if task.get("priority") not in ["Low", "Medium", "High", "Urgent"]:
        errors.append("Invalid priority")
    if task.get("weight") not in [1, 2, 3, 5, 8, 13]:
        errors.append("Invalid weight")

    confidence = task.get("confidence")
    if not isinstance(confidence, (int, float)) or not (0 <= confidence <= 1):
        errors.append("Invalid confidence")

    return {"valid": not errors, "errors": errors}


# ============================================================
# BLOCKED RESPONSE
# ============================================================


def _blocked_response(session):
    return {
        "session": session.name,
        "status": "BLOCKED",
        "reason": session.blocked_reason,
    }


def _update_session_fields(session_name, **fields):
    frappe.db.set_value("AI Task Session", session_name, fields, update_modified=True)


def _build_user_chat_message(prompt, context_resources):
    message = prompt
    if context_resources:
        message += f"\n*(Using {len(context_resources)} resource(s) as context)*"
    return message


def _append_chat_message(session_name, role, text, max_retries=3):
    last_error = None

    for attempt in range(max_retries):
        try:
            doc = frappe.get_doc("AI Task Session", session_name)
            seq = len(doc.chat_messages) + 1
            doc.append(
                "chat_messages",
                {
                    "role": role,
                    "text": text,
                    "sequence": seq,
                },
            )
            doc.save(ignore_permissions=True)
            return
        except (frappe.TimestampMismatchError, frappe.QueryDeadlockError) as exc:
            last_error = exc
            time.sleep(0.1 * (attempt + 1))

    if last_error:
        raise last_error


def _get_recent_chat_context(session_name, limit=8):
    if not session_name:
        return ""

    doc = frappe.get_doc("AI Task Session", session_name)
    recent_messages = sorted(doc.chat_messages, key=lambda message: message.sequence or 0)[-limit:]
    if not recent_messages:
        return ""

    lines = []
    for message in recent_messages:
        speaker = "User" if message.role == "user" else "Assistant"
        content = (message.text or "").strip()
        if content:
            lines.append(f"{speaker}: {content}")

    if not lines:
        return ""

    return "Recent Conversation:\n" + "\n".join(lines)


def _get_session_task_snapshot(session_name):
    drafts = frappe.get_all(
        "AI Task Draft",
        filters={"session": session_name},
        fields=["name", "subject", "priority", "weight", "confidence", "validation_errors", "status", "created_task", "raw_ai_payload"],
        order_by="creation asc",
    )

    snapshot = []
    for draft in drafts:
        errors = [error.strip() for error in (draft.validation_errors or "").split(",") if error.strip()]
        creation_status = None
        if draft.raw_ai_payload:
            try:
                creation_status = json.loads(draft.raw_ai_payload).get("creation_status")
            except Exception:
                creation_status = None

        if creation_status == "SUCCESS" or (draft.status == "Created" and draft.created_task):
            ui_creation_status = "SUCCESS"
        elif creation_status == "DUPLICATE":
            ui_creation_status = "DUPLICATE"
        elif creation_status == "FAILED" or draft.status == "Failed":
            ui_creation_status = "FAILED"
        else:
            ui_creation_status = None

        snapshot.append(
            {
                "id": draft.name,
                "subject": draft.subject,
                "priority": draft.priority,
                "weight": draft.weight,
                "confidence": draft.confidence,
                "status": "PENDING",
                "createdTask": draft.created_task,
                "creationStatus": ui_creation_status,
                "validation": {
                    "valid": not errors,
                    "errors": errors,
                },
            }
        )

    return snapshot


def _build_resource_context(project, resource_names):
    if not resource_names:
        return "", []

    resources = frappe.get_all(
        "Project Resource",
        filters={"project": project, "name": ["in", resource_names]},
        fields=["name", "title", "type", "content", "link", "file"],
    )
    resources_by_name = {resource.name: resource for resource in resources}

    lines = []
    used_resources = []

    for resource_name in resource_names:
        resource = resources_by_name.get(resource_name)
        if not resource:
            continue

        resource_content = (resource.content or "").strip()

        if not resource_content and resource.file:
            try:
                from infintrix_atlas.api.v1 import preview_document

                preview = preview_document(resource.file)
                resource_content = (preview or {}).get("content", "").strip()
            except Exception:
                resource_content = ""

        if not resource_content and resource.link:
            resource_content = f"External link: {resource.link}"

        if not resource_content:
            continue

        lines.append(
            f"- {resource.title or resource.name} ({resource.type or 'Resource'})\n{resource_content[:4000]}"
        )
        used_resources.append(resource)

    if not lines:
        return "", used_resources

    return "Selected Project Resources:\n\n" + "\n\n".join(lines), used_resources


# ============================================================
# MAIN PIPELINE
# ============================================================


@frappe.whitelist()
def open_ai_pipeline(project, prompt, cycle=None):
    project_doc = frappe.get_doc("Project", project)

    session = frappe.get_doc(
        {
            "doctype": "AI Task Session",
            "project": project,
            "execution_mode": project_doc.custom_execution_mode,
            "cycle": cycle,
            "prompt": prompt,
            "status": "Decomposing",
            "started_on": now(),
        }
    ).insert(ignore_permissions=True)

    # STEP 1: Decomposition
    intents = _decompose(prompt)
    if not intents:
        session.status = "Blocked"
        session.blocked_reason = "No actionable intents found or AI service unavailable"
        session.save()
        return _blocked_response(session)

    # STEP 2: Guard
    guard = _feasibility_guard(prompt, project_doc)
    if guard["status"] == "BLOCK":
        session.status = "Blocked"
        session.blocked_reason = guard["reason"]
        session.save()
        return _blocked_response(session)

    # STEP 3: Drafting
    drafts = _draft_tasks(intents, project_doc)
    if not drafts:
        session.status = "Blocked"
        session.blocked_reason = "Failed to generate task drafts"
        session.save()
        return _blocked_response(session)

    # STEP 4: Validation
    validated = []
    for d in drafts:
        validation = _validate_task(d)
        doc = frappe.get_doc(
            {
                "doctype": "AI Task Draft",
                "session": session.name,
                "project": project,
                "subject": d["subject"],
                "priority": d["priority"],
                "weight": d["weight"],
                "confidence": d["confidence"],
                "status": "Draft",
                "validation_errors": ", ".join(validation["errors"]),
            }
        ).insert(ignore_permissions=True)

        validated.append(
            {
                "id": doc.name,
                "subject": doc.subject,
                "priority": doc.priority,
                "weight": doc.weight,
                "confidence": doc.confidence,
                "validation": validation,
            }
        )

    session.status = "Reviewing"
    session.save()

    return {
        "session": session.name,
        "status": "REVIEWING",
        "intents": intents,
        "drafts": validated,
    }


@frappe.whitelist()
def request_intent_decomposition(prompt, project):
    project_doc = frappe.get_doc("Project", project)
    return _decompose(prompt)


@frappe.whitelist()
def request_task_drafting(intents, project):
    project_doc = frappe.get_doc("Project", project)
    return _draft_tasks(intents, project_doc)


@frappe.whitelist()
def run_phase_pipeline(project, phase, prompt, resource_context=None, context_resources=None, session=None):
    """
    Unified pipeline for phase-level AI task generation.
    Creates an AI Task Session, decomposes prompt into intents,
    drafts tasks, creates AI Task Draft records, and returns results.
    Accepts optional existing session name to reuse.
    """
    project_doc = frappe.get_doc("Project", project)
    phase_doc = frappe.get_doc("Project Phase", phase) if phase else None

    selected_resource_names = []
    if resource_context:
        if isinstance(resource_context, str):
            try:
                parsed_resource_context = json.loads(resource_context)
                if isinstance(parsed_resource_context, list):
                    selected_resource_names = parsed_resource_context
                elif resource_context.strip():
                    selected_resource_names = [resource_context]
            except Exception:
                if resource_context.strip():
                    selected_resource_names = [resource_context]
        elif isinstance(resource_context, list):
            selected_resource_names = resource_context

    if context_resources and isinstance(context_resources, str):
        context_resources = json.loads(context_resources)

    enriched_prompt = prompt
    resolved_resource_context, resolved_resources = _build_resource_context(project, selected_resource_names)

    if resolved_resource_context:
        enriched_prompt += "\n\n" + resolved_resource_context
    elif context_resources:
        resource_lines = []
        for r in context_resources:
            parts = [f"- {r.get('title', 'Untitled')} ({r.get('type', 'DOC')})"]
            if r.get("description"):
                parts.append(f": {r['description']}")
            resource_lines.append("".join(parts))
        enriched_prompt += "\n\nReferenced Resources:\n" + "\n".join(resource_lines)

    session_name = session
    if session:
        session_doc = frappe.get_doc("AI Task Session", session)
        session_name = session_doc.name
        _append_chat_message(
            session_name,
            "user",
            _build_user_chat_message(prompt, context_resources),
        )
        _update_session_fields(
            session_name,
            status="Decomposing",
            prompt=prompt,
            resource_context=json.dumps(selected_resource_names) if selected_resource_names else (resource_context or ""),
            blocked_reason="",
            completed_on=None,
        )
    else:
        session_doc = frappe.get_doc({
            "doctype": "AI Task Session",
            "project": project,
            "phase": phase,
            "execution_mode": project_doc.custom_execution_mode,
            "prompt": prompt,
            "resource_context": json.dumps(selected_resource_names) if selected_resource_names else (resource_context or ""),
            "status": "Decomposing",
            "started_on": now(),
        }).insert(ignore_permissions=True)
        session_name = session_doc.name
        _append_chat_message(
            session_name,
            "user",
            _build_user_chat_message(prompt, context_resources),
        )

    recent_chat_context = _get_recent_chat_context(session_name)
    if recent_chat_context:
        enriched_prompt += "\n\n" + recent_chat_context

    # STEP 1: Decomposition
    try:
        intents = _decompose(enriched_prompt)
    except Exception as e:
        reason = f"LLM error during decomposition: {str(e)}"[:500]
        _update_session_fields(session_name, status="Blocked", blocked_reason=reason)
        return {"session": session_name, "status": "BLOCKED", "reason": reason}
    if not intents:
        reason = "No actionable intents found"
        _update_session_fields(session_name, status="Blocked", blocked_reason=reason)
        return {"session": session_name, "status": "BLOCKED", "reason": reason}

    _update_session_fields(session_name, status="Guarding")

    # STEP 2: Guard
    guard = _feasibility_guard(enriched_prompt, project_doc)
    if guard["status"] == "BLOCK":
        _update_session_fields(session_name, status="Blocked", blocked_reason=guard["reason"])
        return {"session": session_name, "status": "BLOCKED", "reason": guard["reason"]}

    # STEP 3: Drafting
    _update_session_fields(session_name, status="Creating")
    try:
        drafts = _draft_tasks(intents, project_doc, context_notes=recent_chat_context)
    except Exception as e:
        reason = f"LLM error during drafting: {str(e)}"
        _update_session_fields(session_name, status="Failed", blocked_reason=reason)
        return {"session": session_name, "status": "FAILED", "reason": reason}

    if not drafts:
        reason = "Failed to generate task drafts"
        _update_session_fields(session_name, status="Failed", blocked_reason=reason)
        return {"session": session_name, "status": "FAILED", "reason": reason}

    # STEP 4: Create AI Task Draft records + validate
    _update_session_fields(session_name, status="Reviewing", blocked_reason="")
    validated = []
    for d in drafts:
        validation = _validate_task(d)

        # Check for duplicate in the same phase
        duplicate = frappe.db.exists("Task", {
            "subject": d["subject"],
            "project": project,
            "custom_phase": phase,
            "status": ["!=", "Cancelled"],
        })
        if duplicate:
            validation["errors"].append("Duplicate: similar task already exists in this phase")
            validation["valid"] = False

        doc = frappe.get_doc({
            "doctype": "AI Task Draft",
            "session": session_name,
            "project": project,
            "subject": d["subject"],
            "priority": d["priority"],
            "weight": d["weight"],
            "confidence": d["confidence"],
            "status": "Draft",
            "validation_errors": ", ".join(validation["errors"]),
        }).insert(ignore_permissions=True)

        validated.append({
            "id": doc.name,
            "subject": doc.subject,
            "description": d.get("description", ""),
            "priority": doc.priority,
            "weight": doc.weight,
            "confidence": doc.confidence,
            "status": "PENDING",
            "validation": validation,
        })

    _update_session_fields(session_name, completed_on=now())

    return {
        "session": session_name,
        "status": "REVIEWING",
        "intents": intents,
        "drafts": validated,
    }


@frappe.whitelist()
def create_or_get_chat_session(project, phase, force_new_session=0):
    force_new_session = frappe.utils.cint(force_new_session)

    if not force_new_session:
        existing = frappe.get_all(
            "AI Task Session",
            filters={"project": project, "phase": phase},
            limit=1,
            order_by="modified desc",
        )
        if existing:
            return existing[0].name

    doc = frappe.get_doc({
        "doctype": "AI Task Session",
        "project": project,
        "phase": phase,
        "status": "Draft",
        "started_on": now(),
    }).insert(ignore_permissions=True)
    return doc.name


@frappe.whitelist()
def save_chat_message(session, role, text):
    _append_chat_message(session, role, text)
    return {"status": "ok"}


@frappe.whitelist()
def get_chat_messages(session):
    doc = frappe.get_doc("AI Task Session", session)
    messages = []
    for m in doc.chat_messages:
        messages.append({
            "role": m.role,
            "text": m.text,
            "sequence": m.sequence,
        })
    messages.sort(key=lambda x: x["sequence"])

    task_snapshot = _get_session_task_snapshot(session)
    if task_snapshot:
        for message in reversed(messages):
            if message.get("role") == "assistant":
                message["taskSnapshot"] = task_snapshot
                break

    return messages
