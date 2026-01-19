import frappe
import json
from frappe.utils import now
import requests

GEMINI_KEY = "AIzaSyDZCtpL86p23BBIEzkqeiE7dzmBASXkPvA"


def make_ai_request(prompt="",system_prompt=""):
    
    # The URL for the Gemini 1.5 Flash model
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={GEMINI_KEY}"

    # Define the headers
    headers = {"Content-Type": "application/json"}

    # Define the payload (body) of the request
    data = {
        "system_instruction": {
            "parts": [{
                "text": system_prompt
            }]
        },
        "contents": [
            {
                "parts": [
                    {
                        "text": f"Task: {prompt}. Return the output strictly as a JSON list of objects where each object has a key 'text'."
                    }
                ]
            }
        ],
        "generationConfig": {"response_mime_type": "application/json"},
    }
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()

        # Extract the string content from the API response
        raw_content = response.json()["candidates"][0]["content"]["parts"][0]["text"]

        # Convert the string into a Python list/dictionary
        return json.loads(raw_content)

    except Exception as e:
        return f"Error: {e}"

def make_ai_request(prompt="", system_prompt="", response_schema=None):
    """
    Centralized AI Request Handler for Gemini 2.5 Flash.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={GEMINI_KEY}"
    headers = {"Content-Type": "application/json"}

    payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json",
        }
    }

    if response_schema:
        payload["generationConfig"]["response_schema"] = response_schema

    try:
        # Implementing basic retry logic for reliability
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        raw_content = result["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(raw_content)
    except Exception as e:
        frappe.log_error(f"AI Pipeline Error: {str(e)}", "AI Task Architect")
        return None

def _decompose(prompt):
    """
    STEP 1: Intent Decomposition (AI)
    """
    system_prompt = """
    You are the ERPNext Intent Decomposer. 
    Deconstruct messy requirements into a list of Atomic Intents.
    Rules: Maximum 12 words per intent, start with imperative verbs, no 'and' separators.
    Output Schema: {"intents": [{"text": "intent string"}]}
    """
    output = make_ai_request(prompt, system_prompt)
    return output.get("intents", []) if output else []

def _feasibility_guard(prompt, project_doc):
    """
    STEP 2: Feasibility & Scope Guard (System Rules)
    """
    # Rule 1: Signal Strength
    if len(prompt.split()) < 5:
        return {"status": "BLOCK", "reason": "Insufficient architectural signal"}
    
    # # Rule 2: Project Scope Check (Mock logic for scope boundary)
    # if project_doc.custom_project_scope and "out of scope" in prompt.lower():
    #     return {"status": "BLOCK", "reason": "Intent violates established project scope policy"}
        
    return {"status": "PASS"}

def _draft_tasks(intents, project_doc):
    """
    STEP 3: Task Drafting (AI)
    """
    intent_string = "\n".join([f"- {i['text']}" for i in intents])
    
    system_prompt = f"""
    You are the Project Task Architect. 
    Context: Project '{project_doc.project_name}' (Scope: 'General').
    Convert the following intents into professional Tasks.
    For each task, provide:
    - subject: Professional summary
    - priority: Low, Medium, High, or Urgent
    - weight: Story points (1, 2, 3, 5, 8, 13)
    - confidence: 0.0 to 1.0 based on intent clarity
    - reasoning: Why this priority/weight?

    Output Schema: {{ "tasks": [{{ "subject": "...", "priority": "...", "weight": 0, "confidence": 0.0, "reasoning": "..." }}] }}
    """
    output = make_ai_request(f"Intents:\n{intent_string}", system_prompt)
    return output.get("tasks", []) if output else []

def _validate_task(task):
    """
    STEP 4: Structural Validation (System Rules)
    """
    errors = []
    if not task.get("subject") or len(task["subject"]) < 5:
        errors.append("Subject must be at least 5 characters")
    if not task.get("weight") or task["weight"] <= 0:
        errors.append("Weight must be greater than 0")
    if task.get("priority") not in ["Low", "Medium", "High", "Urgent"]:
        errors.append("Invalid priority level")
        
    return {"valid": not errors, "errors": errors}
# def _decompose(prompt):
#     if len(prompt.split()) < 3:
#         return []
#     output = make_ai_request(prompt
#         ,"""\
# You are the Project Tasks Intent Decomposer. Your sole responsibility is to act as Step 1 in a project management pipeline. You take raw, messy human requirements and deconstruct them into a list of Atomic Intents.

# Definitions

# Atomic Intent: A single, granular business or technical objective. It describes what needs to happen, not how it will be implemented.

# Deconstruction: The process of breaking a complex paragraph into its constituent parts without losing the original requirement's essence.

# Constraints

# Granularity: If an intent contains the word "and" (e.g., "Setup server and install DB"), it is NOT atomic. Split it.

# No Implementation Details: Do not suggest specific technologies unless explicitly mentioned in the input.

# Tone: Professional, concise, and executive-level.

# No Fluff: Remove phrases like "We should," "It would be nice to," or "I think."

# Structural Rules

# Each intent must be a maximum of 12 words.

# Each intent must start with an imperative verb (e.g., "Establish," "Configure," "Audit," "Draft").

# Output Format

# You must return a valid JSON object. Do not include markdown formatting, preambles, or postambles.

# Schema

# {
#   "intents": [
#     {
#       "text": "The atomic intent string"
#     }
#   ]
# }


# Strategy

# Read the raw requirements carefully.

# Identify every distinct action or deliverable requested.

# Rewrite them as atomic, imperative statements.

# Ensure they are specific enough for a project manager to understand but broad enough for a technical architect to draft tasks from.

# Example

# Input: "We need to move our website to a new server, make sure it's secure with SSL, and also update the team page with the new hires."
# Output:

# {
#   "intents": [
#     {"text": "Migrate web application to new server infrastructure" },
#     { "text": "Configure SSL certificates for domain security" },
#     { "text": "Update team directory with recent personnel additions" }
#   ]
# }
# """
#     )
#     # print(output)
#     return output.get("intents", [])


# def _feasibility_guard(prompt, intents):
#     if len(prompt.split()) < 5:
#         return {"status": "BLOCK", "reason": "Insufficient architectural signal"}
#     return {"status": "PASS"}


# def _draft_tasks(intents):
#     tasks = []
#     for i, intent in enumerate(intents, 1):
#         tasks.append(
#             {
#                 "subject": intent["text"],
#                 "priority": "Medium",
#                 "weight": 3,
#                 "confidence": 0.8,
#             }
#         )
#     return tasks


def _validate_task(task):
    errors = []
    if len(task["subject"]) < 5:
        errors.append("Subject too short")
    if task["weight"] <= 0:
        errors.append("Invalid weight")
    return {"valid": not errors, "errors": errors}


def _blocked_response(session):
    return {
        "session": session.name,
        "status": "BLOCKED",
        "reason": session.blocked_reason,
    }


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

    # ---------- STEP 1: DECOMPOSE ----------
    intents = _decompose(prompt)

    if not intents:
        session.status = "Blocked"
        session.blocked_reason = "No actionable intents"
        session.save()
        return _blocked_response(session)

    # ---------- STEP 2: GUARD ----------
    guard = _feasibility_guard(prompt, project_doc)
    if guard["status"] == "BLOCK":
        session.status = "Blocked"
        session.blocked_reason = guard["reason"]
        session.save()
        return _blocked_response(session)

    # ---------- STEP 3: DRAFT ----------
    drafts = _draft_tasks(intents,project_doc)

    # ---------- STEP 4: VALIDATE ----------
    validated = []
    for d in drafts:
        validation = _validate_task(d)
        draft_doc = frappe.get_doc(
            {
                "doctype": "AI Task Draft",
                "session": session.name,
                "project": project,
                "subject": d["subject"],
                "priority": d["priority"],
                "weight": d["weight"],
                "confidence": d["confidence"],
                "status": "Draft" if validation["valid"] else "Draft",
                "validation_errors": ", ".join(validation["errors"]),
            }
        ).insert(ignore_permissions=True)

        validated.append(
            {
                "id": draft_doc.name,
                "subject": draft_doc.subject,
                "priority": draft_doc.priority,
                "weight": draft_doc.weight,
                "confidence": draft_doc.confidence,
                "validation": validation,
            }
        )

    session.status = "Reviewing"
    session.save()

    return {"session": session.name, "status": "REVIEWING", "drafts": validated,"intents":intents}
