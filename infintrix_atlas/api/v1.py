import frappe


import frappe
from frappe.query_builder import DocType


@frappe.whitelist()
def get_tasks():
    Task = DocType("Task")
    ToDo = DocType("ToDo")

    # Step 1: Fetch all tasks
    tasks = (
        frappe.qb.from_(Task)
        .select("*")
        .orderby(Task.modified, order=frappe.qb.desc)
        .run(as_dict=True)
    )


    if not tasks:
        return []

    task_names = [t["name"] for t in tasks]

    # Step 2: Fetch all assignees in ONE query
    assignees = (
        frappe.qb.from_(ToDo)
        .select(
            ToDo.reference_name,
            ToDo.allocated_to,
        )
        .where(
            (ToDo.reference_type == "Task") &
            (ToDo.reference_name.isin(task_names)) &
            (ToDo.status != "Cancelled")
        )
        .run(as_dict=True)
    )

    # Step 3: Map assignees to tasks
    assignee_map = {}
    for row in assignees:
        assignee_map.setdefault(row.reference_name, []).append(row.allocated_to)

    # Step 4: Attach assignees and project name to tasks
    for task in tasks:
        task["assignees"] = assignee_map.get(task["name"], [])
        task["project_name"] = frappe.db.get_value("Project", task.get("project"), "project_name") if task.get("project") else None

    return tasks

@frappe.whitelist(allow_guest=True) # Adjust permissions as needed
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