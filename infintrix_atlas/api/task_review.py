import frappe
from frappe import _
from frappe.utils import now
from infintrix_atlas.role_utils import PROJECT_MANAGER_ROLES, has_projects_manager_role
from .tasks import switch_assignee_of_task
from .utils import send_notification


def _get_task(task_name):
    task = frappe.get_doc("Task", task_name)
    return task


def _get_assignee(task_name, include_closed=False):
    # Completing a task closes its ToDos (ERPNext Task.validate), so for completed
    # tasks pass include_closed=True to find who the task belonged to.
    filters = {"reference_type": "Task", "reference_name": task_name}
    filters["status"] = ["!=", "Cancelled"] if include_closed else "Open"
    return frappe.db.get_value("ToDo", filters, "allocated_to", order_by="creation desc")


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
    if task.get("custom_reviewer") == user:
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
    assignee = _get_assignee(task.name, include_closed=True)
    if assignee == user:
        return True
    return False


def _is_review_privileged(user):
    if user == "Administrator":
        return True
    if "System Manager" in frappe.get_roles(user):
        return True
    return has_projects_manager_role(user=user)


@frappe.whitelist()
def get_review_actions(task_name):
    """Review workflow actions the current user may take on a task, for Desk UI.

    Mirrors the checks in submit_for_review / approve_task / request_changes /
    reopen_task without throwing, so the UI only shows usable buttons.
    """
    task = _get_task(task_name)
    task.check_permission("read")

    user = frappe.session.user
    privileged = _is_review_privileged(user)
    is_assignee = _get_assignee(task.name, include_closed=task.status == "Completed") == user

    actions = []
    if task.status == "Working" and (privileged or is_assignee):
        actions.append("submit_for_review")
    elif task.status == "Pending Review" and (privileged or task.get("custom_reviewer") == user):
        actions.extend(["approve", "request_changes"])
    elif task.status == "Completed" and (privileged or is_assignee):
        actions.append("reopen")

    return {
        "actions": actions,
        "is_assignee": is_assignee,
        "reviewer": task.get("custom_reviewer"),
    }


def _validate_reviewer(task, reviewer):
    if not reviewer:
        frappe.throw(_("Please select a reviewer"))
    if not frappe.db.get_value("User", {"name": reviewer, "enabled": 1}):
        frappe.throw(_("Reviewer {0} is not an active user").format(reviewer))
    if reviewer == frappe.session.user:
        frappe.throw(_("You cannot assign yourself as the reviewer"))
    if reviewer == _get_assignee(task.name):
        frappe.throw(_("The task assignee cannot be the reviewer"))
    # TaskOverride.has_permission holds the real access rule (owner, assignee, project
    # member); frappe.has_permission(doc=...) only checks role perms and lets every
    # Projects User through.
    if not (task.has_permission("read", user=reviewer) or _is_review_privileged(reviewer)):
        frappe.throw(_("Reviewer {0} does not have access to this task").format(reviewer))


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def reviewer_query(doctype, txt, searchfield, start, page_len, filters):
    """Reviewer picker. Offers the same users _validate_reviewer accepts: project
    owner + members, plus System Manager / Projects Manager users (and Administrator).

    Excludes the current user and the task assignee.
    """
    task_name = frappe.parse_json(filters or {}).get("task")
    project = frappe.db.get_value("Task", task_name, "project") if task_name else None
    exclude = {frappe.session.user, "Guest"}
    if task_name:
        exclude.add(_get_assignee(task_name))

    user_filters = {"enabled": 1, "user_type": "System User"}
    if project:
        candidates = set(frappe.get_all("Project User", filters={"parent": project}, pluck="user"))
        candidates.add(frappe.db.get_value("Project", project, "owner"))
        candidates.update(
            frappe.get_all(
                "Has Role",
                filters={"parenttype": "User", "role": ["in", ["System Manager", *PROJECT_MANAGER_ROLES]]},
                pluck="parent",
            )
        )
        candidates.add("Administrator")
        user_filters["name"] = ["in", list(candidates - exclude) or [""]]
    else:
        user_filters["name"] = ["not in", list(exclude - {None})]

    return frappe.get_all(
        "User",
        filters=user_filters,
        or_filters={"name": ["like", f"%{txt}%"], "full_name": ["like", f"%{txt}%"]},
        fields=["name", "full_name"],
        order_by="full_name asc",
        start=start,
        page_length=page_len,
        as_list=True,
    )


@frappe.whitelist()
def submit_for_review(task_name, reviewer=None):
    task = _get_task(task_name)

    if not _can_submit_for_review(task):
        frappe.throw(_("Not permitted to submit this task for review"))

    if task.status != "Working":
        frappe.throw(_("Only tasks in Working status can be submitted for review"))

    _validate_reviewer(task, reviewer)

    task.status = "Pending Review"
    task.custom_reviewer = reviewer
    task.custom_review_cycles = (task.custom_review_cycles or 0) + 1
    task.save(ignore_permissions=True)

    submitter = frappe.utils.get_fullname(frappe.session.user)
    send_notification(
        user=reviewer,
        subject=f"Review requested: {task.subject}",
        content=f"{submitter} has asked you to review task '<b>{task.subject}</b>'.",
        document_type="Task",
        document_name=task.name,
    )
    _notify_project_managers(task, "submitted_for_review",
        f"Task '<b>{task.subject}</b>' has been submitted for review.",
        exclude={reviewer})

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

    _notify_assignee(task, "approved",
        f"Your task '<b>{task.subject}</b>' has been approved and completed.")

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

    _notify_assignee(task, "changes_requested",
        f"Changes have been requested on your task '<b>{task.subject}</b>'.")

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

    # Hand the task back to whoever last worked on it; otherwise the auto-assign in
    # TaskOverride.before_save would give it to the user clicking Reopen.
    last_assignee = _get_assignee(task.name, include_closed=True)
    if last_assignee:
        switch_assignee_of_task(task.name, last_assignee)

    task.status = "Working"
    task.custom_reopen_count = reopen_sequence
    task.custom_last_reopened_on = now()
    task.custom_last_reopened_by = frappe.session.user
    task.save(ignore_permissions=True)

    _notify_project_managers(task, "reopened",
        f"Task '<b>{task.subject}</b>' has been reopened. Reason: {reason}")

    frappe.db.commit()

    return {"success": True, "message": _("Task reopened")}


def _get_project_managers(task):
    managers = set()
    if task.project:
        project_owner = frappe.db.get_value("Project", task.project, "owner")
        if project_owner:
            managers.add(project_owner)
        project_users = frappe.get_all(
            "Project User",
            filters={"parent": task.project},
            pluck="user",
        )
        for user in project_users:
            roles = frappe.get_roles(user)
            if has_projects_manager_role(roles=roles):
                managers.add(user)
    return managers


def _notify_assignee(task, event, content):
    assignee = _get_assignee(task.name, include_closed=task.status == "Completed")
    if assignee:
        send_notification(
            user=assignee,
            subject=f"Task {event}: {task.subject}",
            content=content,
            document_type="Task",
            document_name=task.name,
        )


def _notify_project_managers(task, event, content, exclude=None):
    managers = _get_project_managers(task) - (exclude or set())
    for manager in managers:
        send_notification(
            user=manager,
            subject=f"Task {event}: {task.subject}",
            content=content,
            document_type="Task",
            document_name=task.name,
        )
