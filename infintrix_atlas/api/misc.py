import frappe
from datetime import datetime, timedelta


@frappe.whitelist(allow_guest=True)  # Adjust permissions as needed
def get_doctype_meta(doctype_name):
    """
    Fetches the metadata for a given DocType.
    """
    try:
        meta = frappe.get_meta(doctype_name)
        # Convert the meta object to a dictionary for API response
        return meta.as_dict()
    except Exception as e:
        frappe.throw(f"Error fetching metadata: {e}")


@frappe.whitelist()
def global_search(query: str, limit: int = 10):
    if not query or len(query) < 2:
        return []

    results = []

    tasks = frappe.get_all(
        "Task",
        filters=[
            ["subject", "like", f"%{query}%"],
        ],
        fields=["name", "subject", "project"],
        order_by="modified desc",
        limit=limit,
    )

    for task in tasks:
        results.append(
            {
                "type": "Task",
                "name": task.name,
                "title": task.subject,
                "route": f"/tasks/kanban?project={task.project}&selected_task={task.name}",
            }
        )

    projects = frappe.get_all(
        "Project",
        or_filters=[
            ["name", "like", f"%{query}%"],
            ["project_name", "like", f"%{query}%"],
        ],
        fields=["name", "project_name"],
        order_by="modified desc",
        limit=limit,
    )

    for project in projects:
        results.append(
            {
                "type": "Project",
                "name": project.name,
                "title": project.project_name,
                "route": f"/tasks/kanban?project={project.name}",
            }
        )

    cycles = frappe.get_all(
        "Cycle",
        or_filters=[
            ["cycle_name", "like", f"%{query}%"],
        ],
        fields=["name", "cycle_name", "project"],
        order_by="modified desc",
        limit=limit,
    )

    for cycle in cycles:
        project_name = frappe.db.get_value(
            "Project", cycle.project, "project_name") or cycle.project
        results.append(
            {
                "type": "Cycle",
                "name": cycle.name,
                "title": f"{cycle.cycle_name} (Project: {project_name})",
                "route": f"/tasks/backlog?project={cycle.project}",
            }
        )

    return results


@frappe.whitelist()
def online_users():
    sessions = frappe.db.sql(
        """
		SELECT user, MAX(lastupdate) as lastupdate
		FROM `tabSessions`
		WHERE status = 'Active'
		GROUP BY user
	""",
        as_dict=True,
    )

    now = datetime.now()
    online_threshold = now - timedelta(minutes=5)

    online_users = [
        s["user"]
        for s in sessions
        if s["lastupdate"] and s["lastupdate"] > online_threshold
    ]

    return online_users


@frappe.whitelist()
def get_user_roles():
    return frappe.get_roles()


@frappe.whitelist()
def user_details(user=None):
    if not user:
        return None
    details = frappe.db.get_value(
        "User",
        user,
        ["full_name", "email", "user_image"],
        as_dict=True
    )
    return details
