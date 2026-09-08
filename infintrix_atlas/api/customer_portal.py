import frappe
from frappe import _
from frappe.utils import getdate, nowdate, date_diff

from infintrix_atlas.role_utils import (
    get_customer_portal_customers,
    has_customer_portal_access as has_customer_portal_project_access,
)


@frappe.whitelist()
def has_customer_portal_access(project=None):
    return has_customer_portal_project_access(project)


@frappe.whitelist()
def has_any_customer_portal_access():
    return bool(get_customer_portal_customers(frappe.session.user) or [])


@frappe.whitelist()
def get_customer_portal_data(project=None):
    if not project:
        frappe.throw(_("Project is required"))

    if not has_customer_portal_project_access(project):
        frappe.throw(_("Not permitted to access customer portal for this project"))

    project_doc = frappe.get_doc("Project", project)
    task_rows = frappe.get_all(
        "Task",
        filters={"project": project},
        fields=["name", "subject", "status", "exp_end_date"],
        order_by="modified desc",
    )

    action_rows = frappe.get_all(
        "Project Action Request",
        filters={"project": project, "is_portal_visible": 1},
        fields=[
            "name",
            "title",
            "description",
            "action_type",
            "status",
            "due_date",
            "modified",
        ],
        order_by="due_date asc, modified desc",
    )

    requirement_rows = frappe.get_all(
        "Requirement",
        filters={"project": project},
        fields=["name", "title", "status", "owner", "modified"],
        order_by="modified desc",
        limit_page_length=10,
    )

    resource_rows = frappe.get_all(
        "Project Resource",
        filters={"project": project, "visibility": ["in", ["Client", "Both"]]},
        fields=["name", "title", "type", "link", "file", "modified"],
        order_by="modified desc",
        limit_page_length=20,
    )

    task_counts = {
        "completed": 0,
        "in_progress": 0,
        "pending": 0,
        "overdue": 0,
    }

    for task in task_rows:
        if task.status == "Completed":
            task_counts["completed"] += 1
        elif task.status in ("Working", "Pending Review"):
            task_counts["in_progress"] += 1
        else:
            task_counts["pending"] += 1

        if task.exp_end_date and task.status != "Completed" and getdate(task.exp_end_date) < getdate(nowdate()):
            task_counts["overdue"] += 1

    total_tasks = len(task_rows)
    fallback_completion = int(round(project_doc.percent_complete or 0))
    fallback_completed_tasks = task_counts["completed"]

    phases = [
        {
            "id": f"{project}-delivery",
            "title": "Delivery",
            "start_date": project_doc.expected_start_date or project_doc.actual_start_date,
            "end_date": project_doc.expected_end_date or project_doc.actual_end_date,
            "status": "Completed" if project_doc.status == "Completed" else "Active",
            "completion": fallback_completion,
            "tasks_count": total_tasks,
            "completed_tasks": fallback_completed_tasks,
            "open_tasks": max(total_tasks - fallback_completed_tasks, 0),
            "deliverables": [task.subject for task in task_rows[:4] if task.subject],
        }
    ]
    active_phase = phases[0]
    next_milestone_date = project_doc.expected_end_date

    if project_doc.status == "Completed":
        overall_status = "Completed"
    elif task_counts["overdue"] or (
        project_doc.expected_end_date
        and getdate(project_doc.expected_end_date) < getdate(nowdate())
        and (project_doc.percent_complete or 0) < 100
    ):
        overall_status = "At Risk"
    else:
        overall_status = "On Track"

    pending_actions = []
    completed_actions_count = 0
    for action in action_rows:
        if action.status == "Completed":
            completed_actions_count += 1

        if action.status != "Pending":
            continue

        pending_actions.append(
            {
                "id": action.name,
                "title": action.title,
                "description": action.description,
                "type": action.action_type or "Action",
                "due_date": action.due_date,
                "status": action.status,
                "priority": "High" if action.due_date and getdate(action.due_date) <= getdate(nowdate()) else "Medium",

            }
        )

    requirements = []
    for requirement in requirement_rows:
        requirements.append(
            {
                "id": requirement.name,
                "title": requirement.title or requirement.name,
                "submitted_on": requirement.modified.date() if requirement.modified else None,
                "status": requirement.status,
                "owner": frappe.db.get_value("User", requirement.owner, "full_name") or requirement.owner,
            }
        )

    resources = []
    for resource in resource_rows:
        resources.append(
            {
                "id": resource.name,
                "title": resource.title or resource.name,
                "type": resource.type or ("Link" if resource.link else "File"),
                "date": resource.modified.date() if resource.modified else None,
                "url": resource.link or resource.file,
            }
        )

    invoice_rows = frappe.get_all(
        "Sales Invoice",
        filters={"project": project, "docstatus": 1},
        fields=["name", "posting_date", "base_grand_total", "outstanding_amount"],
        order_by="posting_date desc",
    )

    total_invoiced = sum(float(invoice.base_grand_total or 0) for invoice in invoice_rows)
    paid = sum(
        max(float(invoice.base_grand_total or 0) - float(invoice.outstanding_amount or 0), 0)
        for invoice in invoice_rows
    )
    last_invoice_date = invoice_rows[0].posting_date if invoice_rows else None
    total_budget = float(project_doc.total_sales_amount or project_doc.estimated_costing or 0)

    action_total = len(action_rows)
    engagement_score = (
        int(round((completed_actions_count / action_total) * 100))
        if action_total
        else int(project_doc.percent_complete or 0)
    )

    return {
        "summary": {
            "project_name": project_doc.project_name,
            "overall_status": overall_status,
            "percent_complete": int(round(project_doc.percent_complete or 0)),
            "days_to_milestone": date_diff(next_milestone_date, nowdate()) if next_milestone_date else None,
            "active_phase": active_phase,
            "next_milestone_date": next_milestone_date,
            "customer": project_doc.customer,
        },
        "phases": phases,
        "pendingActions": pending_actions,
        "requirements": requirements,
        "progress": {
            **task_counts,
            "total": total_tasks,
        },
        "financials": {
            "currency": frappe.db.get_single_value("Global Defaults", "default_currency"),
            "total_budget": total_budget,
            "total_invoiced": total_invoiced,
            "paid": paid,
            "last_invoice_date": last_invoice_date,
        },
        "resources": resources,
        "portal_metrics": {
            "engagement_score": engagement_score,
            "pending_actions": len(pending_actions),
            "completed_actions": completed_actions_count,
        },
    }
