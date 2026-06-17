import frappe
from frappe import _
from frappe.utils import now
from infintrix_atlas.role_utils import has_projects_manager_role


def _get_task(task_name):
    task = frappe.get_doc("Task", task_name)
    return task


def _get_assignee(task_name):
    todo = frappe.db.get_value(
        "ToDo",
        {
            "reference_type": "Task",
            "reference_name": task_name,
            "status": "Open",
        },
        "allocated_to",
        order_by="modified desc",
    )
    return todo


def _can_submit_for_review(task, user=None):
    user = user or frappe.session.user
    if user == "Administrator":
        return True
    if "System Manager" in frappe.get_roles(user):
        return True
    if has_projects_manager_role(user=user):
        return True
    assignee = _get_assignee(task.name)
    if assignee == user:
        return True
    return False


def _can_approve(task, user=None):
    user = user or frappe.session.user
    if user == "Administrator":
        return True
    if "System Manager" in frappe.get_roles(user):
        return True
    if has_projects_manager_role(user=user):
        return True
    assignee = _get_assignee(task.name)
    if assignee == user:
        frappe.throw(_("Assignee cannot approve their own task"))
    return False


def _can_reopen(task, user=None):
    user = user or frappe.session.user
    if user == "Administrator":
        return True
    if "System Manager" in frappe.get_roles(user):
        return True
    if has_projects_manager_role(user=user):
        return True
    assignee = _get_assignee(task.name)
    if assignee == user:
        return True
    return False


@frappe.whitelist()
def submit_for_review(task_name):
    task = _get_task(task_name)

    if not _can_submit_for_review(task):
        frappe.throw(_("Not permitted to submit this task for review"))

    if task.status != "Working":
        frappe.throw(_("Only tasks in Working status can be submitted for review"))

    task.status = "Pending Review"
    task.custom_review_cycles = (task.custom_review_cycles or 0) + 1
    task.save(ignore_permissions=True)

    frappe.db.commit()

    return {"success": True, "message": _("Task submitted for review")}


@frappe.whitelist()
def approve_task(task_name, comments=None):
    task = _get_task(task_name)

    if not _can_approve(task):
        frappe.throw(_("Not permitted to approve this task"))

    if task.status != "Pending Review":
        frappe.throw(_("Only tasks in Pending Review can be approved"))

    task.append("custom_task_review_logs", {
        "reviewer": frappe.session.user,
        "reviewed_on": now(),
        "decision": "Approved",
        "comments": comments or "",
        "from_status": "Pending Review",
        "to_status": "Completed",
    })

    task.status = "Completed"
    frappe.flags.is_review_approval = True
    task.save(ignore_permissions=True)
    frappe.flags.is_review_approval = False

    frappe.db.commit()

    return {"success": True, "message": _("Task approved")}


@frappe.whitelist()
def request_changes(task_name, comments):
    task = _get_task(task_name)

    if not _can_approve(task):
        frappe.throw(_("Not permitted to request changes on this task"))

    if task.status != "Pending Review":
        frappe.throw(_("Only tasks in Pending Review can have changes requested"))

    if not comments or not comments.strip():
        frappe.throw(_("Comments are mandatory when requesting changes"))

    task.append("custom_task_review_logs", {
        "reviewer": frappe.session.user,
        "reviewed_on": now(),
        "decision": "Changes Requested",
        "comments": comments,
        "from_status": "Pending Review",
        "to_status": "Working",
    })

    task.status = "Working"
    task.save(ignore_permissions=True)

    frappe.db.commit()

    return {"success": True, "message": _("Changes requested")}


@frappe.whitelist()
def reopen_task(task_name, reason, reopen_type):
    task = _get_task(task_name)

    if not _can_reopen(task):
        frappe.throw(_("Not permitted to reopen this task"))

    if task.status != "Completed":
        frappe.throw(_("Only completed tasks can be reopened"))

    if not reason or not reason.strip():
        frappe.throw(_("Reason is mandatory when reopening a task"))

    valid_types = [
        "Client Feedback",
        "Bug Found",
        "QA Failure",
        "Requirement Missed",
        "Change Request",
        "Other",
    ]
    if reopen_type not in valid_types:
        frappe.throw(_("Invalid reopen type"))

    reopen_sequence = (task.custom_reopen_count or 0) + 1

    employee = frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "name")

    task.append("custom_task_reopen_logs", {
        "employee": employee,
        "user": frappe.session.user,
        "reopened_on": now(),
        "reason": reason,
        "reopen_type": reopen_type,
        "from_status": "Completed",
        "to_status": "Working",
        "reopen_sequence": reopen_sequence,
    })

    task.status = "Working"
    task.custom_reopen_count = reopen_sequence
    task.custom_last_reopened_on = now()
    task.custom_last_reopened_by = frappe.session.user
    task.save(ignore_permissions=True)

    frappe.db.commit()

    return {"success": True, "message": _("Task reopened")}
