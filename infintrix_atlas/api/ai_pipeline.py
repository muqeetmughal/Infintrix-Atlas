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
    Makes a request to the LLM using the OpenAI SDK with Structured Outputs (Pydantic).
    Supports OpenAI, OpenAI Compatible (OpenRouter, etc.), and Gemini.
    Includes exponential backoff for rate limits.
    """
    settings = frappe.get_single("Atlas Settings")

    if settings.llm_provider not in ("OpenAI", "OpenAI Compatible"):
        raise RuntimeError("Only OpenAI / OpenAI Compatible provider is supported for structured outputs")

    api_key = settings.get_password(fieldname="openai_api_key", raise_exception=True)

    model = settings.openai_model or "gpt-4o-mini"

    client_kwargs = {"api_key": api_key}
    if settings.llm_provider == "OpenAI Compatible" and settings.api_base:
        client_kwargs["base_url"] = settings.api_base

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
    try:
        # Request parsed IntentResponse object
        output = make_ai_request(prompt, system_prompt, response_format=IntentResponse)
        if output and hasattr(output, "intents"):
            # Convert Pydantic models to dicts for existing pipeline compatibility
            return [i.model_dump() for i in output.intents]
        return []
    except Exception as e:
        frappe.log_error(f"Decomposition failed: {str(e)}", "AI Pipeline Error")
        return []


# ============================================================
# STEP 2: FEASIBILITY GUARD
# ============================================================


def _feasibility_guard(prompt, project_doc):
    if len(prompt.split()) < 5:
        return {"status": "BLOCK", "reason": "Insufficient architectural signal"}
    return {"status": "PASS"}


# ============================================================
# STEP 3: TASK DRAFTING
# ============================================================


def _draft_tasks(intents, project_doc):
    intent_text = "\n".join(f"- {i['text']}" for i in intents)

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

    try:
        # Request parsed TaskResponse object
        output = make_ai_request(
            f"Project: {project_doc.project_name}\n\nIntents:\n{intent_text}",
            system_prompt,
            response_format=TaskResponse,
        )
        if output and hasattr(output, "tasks"):
            return [t.model_dump() for t in output.tasks]
        return []
    except Exception as e:
        frappe.log_error(f"Task drafting failed: {str(e)}", "AI Pipeline Error")
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
def run_phase_pipeline(project, phase, prompt, resource_context=None, context_resources=None):
    """
    Unified pipeline for phase-level AI task generation.
    Creates an AI Task Session, decomposes prompt into intents,
    drafts tasks, creates AI Task Draft records, and returns results.
    """
    project_doc = frappe.get_doc("Project", project)
    phase_doc = frappe.get_doc("Project Phase", phase) if phase else None

    if context_resources and isinstance(context_resources, str):
        context_resources = json.loads(context_resources)

    enriched_prompt = prompt
    if context_resources:
        resource_lines = []
        for r in context_resources:
            parts = [f"- {r.get('title', 'Untitled')} ({r.get('type', 'DOC')})"]
            if r.get("description"):
                parts.append(f": {r['description']}")
            resource_lines.append("".join(parts))
        enriched_prompt += "\n\nReferenced Resources:\n" + "\n".join(resource_lines)

    session = frappe.get_doc({
        "doctype": "AI Task Session",
        "project": project,
        "phase": phase,
        "execution_mode": project_doc.custom_execution_mode,
        "prompt": prompt,
        "resource_context": resource_context or "",
        "status": "Decomposing",
        "started_on": now(),
    }).insert(ignore_permissions=True)

    # STEP 1: Decomposition
    intents = _decompose(enriched_prompt)
    if not intents:
        session.status = "Blocked"
        session.blocked_reason = "No actionable intents found"
        session.save()
        return {"session": session.name, "status": "BLOCKED", "reason": session.blocked_reason}

    session.status = "Guarding"
    session.save()

    # STEP 2: Guard
    guard = _feasibility_guard(enriched_prompt, project_doc)
    if guard["status"] == "BLOCK":
        session.status = "Blocked"
        session.blocked_reason = guard["reason"]
        session.save()
        return {"session": session.name, "status": "BLOCKED", "reason": session.blocked_reason}

    # STEP 3: Drafting
    session.status = "Creating"
    session.save()
    drafts = _draft_tasks(intents, project_doc)

    if not drafts:
        session.status = "Failed"
        session.blocked_reason = "Failed to generate task drafts"
        session.save()
        return {"session": session.name, "status": "FAILED", "reason": session.blocked_reason}

    # STEP 4: Create AI Task Draft records + validate
    session.status = "Reviewing"
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
            "session": session.name,
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

    session.completed_on = now()
    session.save()

    return {
        "session": session.name,
        "status": "REVIEWING",
        "intents": intents,
        "drafts": validated,
    }
