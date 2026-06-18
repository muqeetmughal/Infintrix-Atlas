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
def create_from_ai(project, tasks, phase=None):
    if isinstance(tasks, str):
        tasks = json.loads(tasks)

    frappe.get_doc("Project", project)

    results = []

    for t in tasks:
        try:
            draft_id = t.get("id")
            subject = t["subject"]
            target_phase = phase or t.get("phase")

            # Dedup: skip if same subject + phase already exists
            duplicate = frappe.db.exists("Task", {
                "subject": subject,
                "project": project,
                "custom_phase": target_phase,
                "status": ["!=", "Cancelled"],
            })
            if duplicate:
                if draft_id and frappe.db.exists("AI Task Draft", draft_id):
                    frappe.db.set_value(
                        "AI Task Draft",
                        draft_id,
                        {
                            "status": "Created",
                            "created_task": duplicate,
                            "raw_ai_payload": json.dumps({"creation_status": "DUPLICATE", "task": duplicate}),
                        },
                        update_modified=True,
                    )
                results.append({
                    "id": draft_id,
                    "subject": subject,
                    "status": "DUPLICATE",
                    "task": duplicate,
                })
                continue

            doc = frappe.get_doc({
                "doctype": "Task",
                "subject": subject,
                "project": project,
                "priority": t["priority"],
                "status": "Open",
                "custom_weight": t["weight"],
                "custom_phase": target_phase,
                "description": t.get("description", ""),
                "custom_created_by_ai": 1,
                "custom_ai_session": t.get("session"),
                "custom_ai_confidence": t.get("confidence"),
            })
            doc.insert(ignore_permissions=True)

            if draft_id and frappe.db.exists("AI Task Draft", draft_id):
                frappe.db.set_value(
                    "AI Task Draft",
                    draft_id,
                    {
                        "status": "Created",
                        "created_task": doc.name,
                        "raw_ai_payload": json.dumps({"creation_status": "SUCCESS", "task": doc.name}),
                    },
                    update_modified=True,
                )

            results.append({
                "id": draft_id,
                "subject": t["subject"],
                "status": "SUCCESS",
                "task": doc.name
            })
        except Exception as e:
            draft_id = t.get("id")
            if draft_id and frappe.db.exists("AI Task Draft", draft_id):
                frappe.db.set_value(
                    "AI Task Draft",
                    draft_id,
                    {
                        "status": "Failed",
                        "raw_ai_payload": json.dumps({"creation_status": "FAILED", "error": str(e)}),
                    },
                    update_modified=True,
                )
            results.append({
                "id": draft_id,
                "subject": t["subject"],
                "status": "FAILED",
                "error": str(e)
            })

    return results
