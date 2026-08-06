import frappe
from frappe import _
from frappe.utils import cint
import json
import os

from infintrix_atlas.api.access import _ensure_project_access


# -----------------------------
# REQUIREMENTS
# -----------------------------

@frappe.whitelist()
def list_project_requirements(project):
    _ensure_project_access(project, allow_customer_portal=True)

    requirements = frappe.get_all(
        "Requirement",
        filters={"project": project},
        fields=["name", "title", "status", "priority", "source", "modified", "owner"],
        order_by="modified desc",
    )

    requirement_names = [row.name for row in requirements]
    task_counts = {}
    if requirement_names:
        for row in frappe.db.sql(
            """
            SELECT custom_requirement, COUNT(*) AS task_count
            FROM `tabTask`
            WHERE custom_requirement IN %(requirements)s
            GROUP BY custom_requirement
            """,
            {"requirements": tuple(requirement_names)},
            as_dict=True,
        ):
            task_counts[row.custom_requirement] = row.task_count

    for row in requirements:
        row["task_count"] = task_counts.get(row["name"], 0)
        row["owner_name"] = frappe.db.get_value("User", row.owner, "full_name") or row.owner

    return requirements


@frappe.whitelist()
def update_requirement_status(requirement, status):
    doc = frappe.get_doc("Requirement", requirement)
    _ensure_project_access(doc.project, require_write=True)

    allowed_statuses = {"Draft", "Approved", "Rejected", "Implemented"}
    if status not in allowed_statuses:
        frappe.throw(f"Status must be one of: {', '.join(sorted(allowed_statuses))}")

    doc.status = status
    doc.save(ignore_permissions=True)

    return {"name": doc.name, "status": doc.status, "message": f"Requirement status updated to {status}"}


@frappe.whitelist()
def create_task_from_requirement(requirement, subject=None, type=None, priority="Medium"):
    req = frappe.get_doc("Requirement", requirement)
    _ensure_project_access(req.project, require_write=True)

    if not subject:
        subject = req.title

    task = frappe.get_doc(
        {
            "doctype": "Task",
            "project": req.project,
            "subject": f"[{req.name}] {subject}",
            "type": type or "Task",
            "priority": priority,
            "description": req.description or "",
            "custom_requirement": req.name,
            "status": "Open",
        }
    )
    task.insert(ignore_permissions=True)

    if req.status == "Draft":
        req.status = "Approved"
        req.save(ignore_permissions=True)

    return {
        "name": task.name,
        "message": f"Task {task.name} created from requirement",
    }


@frappe.whitelist()
def submit_portal_requirement(
    project,
    title,
    description=None,
    acceptance_criteria=None,
    priority="Medium",
    source="Meeting",
):
    _ensure_project_access(project, allow_customer_portal=True)

    requirement = frappe.get_doc(
        {
            "doctype": "Requirement",
            "project": project,
            "title": title,
            "description": description,
            "acceptance_criteria": acceptance_criteria,
            "priority": priority,
            "source": source,
            "status": "Draft",
        }
    )
    requirement.insert(ignore_permissions=True)

    return {
        "name": requirement.name,
        "message": "Requirement submitted successfully",
    }


# -----------------------------
# CHANGE REQUESTS
# -----------------------------

@frappe.whitelist()
def list_project_change_requests(project):
    _ensure_project_access(project, allow_customer_portal=True)

    rows = frappe.get_all(
        "Change Request",
        filters={"project": project},
        fields=[
            "name",
            "title",
            "description",
            "status",
            "related_requirement",
            "requested_by",
            "request_date",
            "impact_hours",
            "impact_cost",
            "impact_days",
            "approval_date",
            "apprived_by",
        ],
        order_by="request_date desc, modified desc",
    )

    for row in rows:
        row["related_requirement_title"] = (
            frappe.db.get_value("Requirement", row.related_requirement, "title")
            if row.related_requirement
            else None
        )
        row["requested_by_name"] = (
            frappe.db.get_value("User", row.requested_by, "full_name") or row.requested_by
            if row.requested_by
            else None
        )

    return rows


@frappe.whitelist()
def submit_change_request(
    project,
    title,
    description,
    related_requirement=None,
    impact_hours=None,
    impact_cost=None,
    impact_days=None,
):
    _ensure_project_access(project, allow_customer_portal=True)

    doc = frappe.get_doc(
        {
            "doctype": "Change Request",
            "project": project,
            "title": title,
            "description": description,
            "related_requirement": related_requirement,
            "requested_by": frappe.session.user,
            "request_date": frappe.utils.now_datetime(),
            "impact_hours": impact_hours or 0,
            "impact_cost": impact_cost or 0,
            "impact_days": impact_days or 0,
            "status": "Under Review",
        }
    )
    doc.insert(ignore_permissions=True)

    return {"name": doc.name, "message": "Change request submitted successfully"}


@frappe.whitelist()
def approve_change_request(change_request):
    doc = frappe.get_doc("Change Request", change_request)
    _ensure_project_access(doc.project, require_write=True)

    if doc.status not in {"Draft", "Under Review"}:
        frappe.throw(_("Only draft or under review change requests can be approved"))

    doc.status = "Approved"
    doc.approval_date = frappe.utils.now_datetime()
    doc.apprived_by = frappe.session.user
    doc.save(ignore_permissions=True)

    requirement = frappe.get_doc(
        {
            "doctype": "Requirement",
            "project": doc.project,
            "title": f"CR: {doc.title}",
            "description": doc.description,
            "acceptance_criteria": f"Generated from Change Request {doc.name}",
            "priority": "Medium",
            "source": "Meeting",
            "status": "Approved",
        }
    )
    requirement.insert(ignore_permissions=True)

    return {
        "change_request": doc.name,
        "requirement": requirement.name,
        "message": "Change request approved and new requirement created",
    }


@frappe.whitelist()
def reject_change_request(change_request):
    doc = frappe.get_doc("Change Request", change_request)
    _ensure_project_access(doc.project, require_write=True)

    if doc.status not in {"Draft", "Under Review"}:
        frappe.throw(_("Only draft or under review change requests can be rejected"))

    doc.status = "Rejected"
    doc.rejected_by = frappe.session.user
    doc.rejection_date = frappe.utils.now_datetime()
    doc.save(ignore_permissions=True)

    return {
        "change_request": doc.name,
        "message": "Change request rejected",
    }


@frappe.whitelist()
def implement_change_request(change_request):
    doc = frappe.get_doc("Change Request", change_request)
    _ensure_project_access(doc.project, require_write=True)

    if doc.status != "Approved":
        frappe.throw(_("Only approved change requests can be implemented"))

    doc.status = "Implemented"
    doc.implemented_by = frappe.session.user
    doc.implemented_date = frappe.utils.now_datetime()
    doc.save(ignore_permissions=True)

    return {
        "change_request": doc.name,
        "message": "Change request implemented",
    }


# -----------------------------
# ACTION REQUESTS
# -----------------------------

@frappe.whitelist()
def create_action_request(
    project,
    title,
    description,
    action_type="Approval",
    due_date=None,
    related_task=None,
    is_portal_visible=1,
):
    _ensure_project_access(project, require_write=True)

    doc = frappe.get_doc(
        {
            "doctype": "Project Action Request",
            "project": project,
            "title": title,
            "description": description,
            "action_type": action_type,
            "due_date": due_date,
            "related_task": related_task,
            "is_portal_visible": cint(is_portal_visible),
            "status": "Pending",
        }
    )
    doc.insert(ignore_permissions=True)

    return {"name": doc.name, "message": "Action request created"}


@frappe.whitelist()
def complete_action_request(action_request):
    doc = frappe.get_doc("Project Action Request", action_request)
    _ensure_project_access(doc.project, allow_customer_portal=True)

    if doc.status != "Pending":
        frappe.throw(_("Only pending action requests can be completed"))

    doc.status = "Completed"
    doc.completed_by = frappe.session.user
    doc.completed_date = frappe.utils.now_datetime()
    doc.save(ignore_permissions=True)

    return {"name": doc.name, "message": "Action request completed"}


@frappe.whitelist()
def reject_action_request(action_request):
    doc = frappe.get_doc("Project Action Request", action_request)
    _ensure_project_access(doc.project, allow_customer_portal=True)

    if doc.status != "Pending":
        frappe.throw(_("Only pending action requests can be rejected"))

    doc.status = "Rejected"
    doc.rejected_by = frappe.session.user
    doc.rejection_date = frappe.utils.now_datetime()
    doc.save(ignore_permissions=True)

    return {"name": doc.name, "message": "Action request rejected"}


@frappe.whitelist()
def expire_action_request(action_request):
    doc = frappe.get_doc("Project Action Request", action_request)
    _ensure_project_access(doc.project, require_write=True)

    if doc.status != "Pending":
        frappe.throw(_("Only pending action requests can be expired"))

    doc.status = "Expired"
    doc.expired_by = frappe.session.user
    doc.expiration_date = frappe.utils.now_datetime()
    doc.save(ignore_permissions=True)

    return {"name": doc.name, "message": "Action request expired"}


@frappe.whitelist()
def list_project_action_requests(project, include_completed=True):
    _ensure_project_access(project, allow_customer_portal=True)

    filters = {"project": project}
    if not cint(include_completed):
        filters["status"] = "Pending"

    rows = frappe.get_all(
        "Project Action Request",
        filters=filters,
        fields=[
            "name",
            "title",
            "description",
            "action_type",
            "status",
            "due_date",
            "phase",
            "related_task",
            "is_portal_visible",
            "completed_by",
            "completed_date",
            "rejected_by",
            "rejection_date",
            "expired_by",
            "expiration_date",
        ],
        order_by="due_date asc, modified desc",
    )

    return rows


# -----------------------------
# SCOPE SNAPSHOTS
# -----------------------------

@frappe.whitelist()
def list_scope_snapshots(project):
    _ensure_project_access(project, allow_customer_portal=True)

    rows = frappe.get_all(
        "Scope Snapshot",
        filters={"project": project},
        fields=["name", "version", "snapshot_date", "docstatus", "modified"],
        order_by="version desc, modified desc",
    )

    for row in rows:
        row["requirements_count"] = frappe.db.count(
            "Requirement CT",
            {"parent": row.name, "parenttype": "Scope Snapshot"},
        )

    return rows


@frappe.whitelist()
def create_scope_snapshot(project, version=None, requirement_names=None):
    _ensure_project_access(project, require_write=True)

    if isinstance(requirement_names, str):
        requirement_names = json.loads(requirement_names or "[]")

    selected_requirements = requirement_names or frappe.get_all(
        "Requirement",
        filters={"project": project, "status": ["in", ["Approved", "Implemented"]]},
        pluck="name",
    )

    if not selected_requirements:
        frappe.throw(_("No approved requirements available for snapshot"))

    snapshot = frappe.get_doc(
        {
            "doctype": "Scope Snapshot",
            "project": project,
            "version": version,
            "snapshot_date": frappe.utils.now_datetime(),
            "requirements": [
                {"doctype": "Requirement CT", "requirement": requirement}
                for requirement in selected_requirements
            ],
        }
    )
    snapshot.insert(ignore_permissions=True)
    snapshot.submit()

    return {
        "name": snapshot.name,
        "version": snapshot.version,
        "message": "Scope snapshot created successfully",
    }


# -----------------------------
# RESOURCES
# -----------------------------

@frappe.whitelist()
def create_project_resource(project, title=None, file_url=None, link=None, visibility="Internal", content=None):
    _ensure_project_access(project, require_write=True)

    if file_url and link:
        frappe.throw("Use either a file or a link, not both.")

    if content:
        resource_type = "Plain Text"
    elif link and not file_url:
        resource_type = "Link"
    elif file_url:
        ext = os.path.splitext(file_url)[1].lower().lstrip(".")
        if ext == "pdf":
            resource_type = "PDF"
        elif ext in ("xlsx", "xls", "csv"):
            resource_type = "Spreadsheet"
        elif ext in ("pptx", "ppt"):
            resource_type = "Presentation"
        elif ext in ("docx", "doc", "odt", "rtf"):
            resource_type = "Document"
        elif ext in ("png", "jpg", "jpeg", "gif", "webp", "svg"):
            resource_type = "Image"
        else:
            resource_type = "DOC"
    else:
        frappe.throw("Either a file, a link, or content is required.")

    if not title:
        if content:
            first_line = content.strip().split("\n")[0]
            title = first_line[:100] if first_line else "Untitled"
        else:
            title = link or file_url or "Untitled"

    doc = frappe.get_doc(
        {
            "doctype": "Project Resource",
            "project": project,
            "title": title,
            "type": resource_type,
            "content": content,
            "file": file_url,
            "link": link,
            "visibility": visibility,
        }
    )
    doc.insert(ignore_permissions=True)

    return {"name": doc.name, "message": "Resource added"}


@frappe.whitelist()
def list_project_resources(project, include_internal=False):
    allow_customer_portal = not frappe.has_permission("Project", "write", project)
    _ensure_project_access(project, allow_customer_portal=allow_customer_portal)

    visibility = ["Client", "Both"]
    if include_internal and frappe.has_permission("Project", "write", project):
        visibility = ["Internal", "Client", "Both"]

    rows = frappe.get_all(
        "Project Resource",
        filters={"project": project, "visibility": ["in", visibility]},
        fields=["name", "title", "type", "content", "link", "file", "visibility", "phase", "modified"],
        order_by="modified desc",
    )

    return rows
