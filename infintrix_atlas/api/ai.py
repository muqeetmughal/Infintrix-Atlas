import frappe
import json

@frappe.whitelist()
def decompose_intent(project, prompt):
    frappe.get_doc("Project", project)

    if len(prompt.strip().split()) < 3:
        return {"intents": []}

    # 🔒 Replace with real LLM call
    intents = [
        {"id": "I1", "text": f"Analyze scope for {project}"},
        {"id": "I2", "text": "Define security and availability constraints"}
    ]

    return {"intents": intents}


@frappe.whitelist()
def feasibility_guard(project, prompt, intents):
    if isinstance(intents, str):
        intents = json.loads(intents)

    # HARD RULES
    if len(intents) == 0:
        return {"status": "BLOCK", "reason": "No actionable intents"}

    if len(prompt.split()) < 5:
        return {"status": "BLOCK", "reason": "Insufficient architectural signal"}

    return {"status": "PASS"}


@frappe.whitelist()
def draft_tasks(project, intents):
    if isinstance(intents, str):
        intents = json.loads(intents)

    drafts = []
    for i, intent in enumerate(intents, start=1):
        drafts.append({
            "id": f"T{i}",
            "subject": intent["text"],
            "priority": "Medium",
            "weight": 3,
            "confidence": 0.75
        })

    return {"drafts": drafts}


@frappe.whitelist()
def validate_tasks(drafts):
    if isinstance(drafts, str):
        drafts = json.loads(drafts)

    validated = []

    for d in drafts:
        errors = []

        if not d.get("subject") or len(d["subject"]) < 5:
            errors.append("Subject too short")

        if not d.get("weight") or d["weight"] <= 0:
            errors.append("Weight must be greater than 0")

        validated.append({
            **d,
            "validation": {
                "valid": len(errors) == 0,
                "errors": errors
            }
        })

    return {"drafts": validated}


@frappe.whitelist()
def create_from_ai(project, tasks):
    if isinstance(tasks, str):
        tasks = json.loads(tasks)

    frappe.get_doc("Project", project)

    results = []

    for t in tasks:
        try:
            doc = frappe.get_doc({
                "doctype": "Task",
                "subject": t["subject"],
                "project": project,
                "priority": t["priority"],
                "status": "Open",
                "custom_weight": t["weight"],
                "custom_created_by": "AI"
            })
            doc.insert(ignore_permissions=True)

            results.append({
                "subject": t["subject"],
                "status": "SUCCESS",
                "task": doc.name
            })
        except Exception as e:
            results.append({
                "subject": t["subject"],
                "status": "FAILED",
                "error": str(e)
            })

    return {"results": results}
