import frappe
from frappe import _
from frappe.query_builder import DocType, functions as fn
import json

from infintrix_atlas.role_utils import has_projects_manager_role
from infintrix_atlas.api.utils import send_notification
from infintrix_atlas.api.access import _ensure_document_read_access
from frappe.desk.doctype.tag.tag import add_tag


@frappe.whitelist()
def update_task_sort_order(payload=None):

    if isinstance(payload, str):
        payload = json.loads(payload or "{}")

    if not payload:
        frappe.throw("Payload is required")

    tasks = payload.get("tasks") or []
    if not tasks:
        return {"success": True, "updated": 0}

    # Deduplicate by name (last write wins), validate minimal shape.
    dedup = {}
    for t in tasks:
        name = (t or {}).get("name")
        if not name:
            continue
        dedup[name] = {
            "name": name,
            "custom_sort_order": (t or {}).get("custom_sort_order"),
            "status": (t or {}).get("status"),
        }

    updates = [v for v in dedup.values() if v.get(
        "custom_sort_order") is not None]
    if not updates:
        return {"success": True, "updated": 0}

    # Permission check (SQL update bypasses doc perms otherwise).
    for u in updates:
        if not frappe.has_permission("Task", "write", u["name"]):
            frappe.throw(f"Not permitted to update Task {u['name']}")

    # Build CASE expressions for efficient bulk update
    params = {}
    names = []
    sort_cases = []
    status_cases = []

    for idx, u in enumerate(updates):
        name = u["name"]
        names.append(name)

        params[f"name_{idx}"] = name
        params[f"sort_{idx}"] = int(u["custom_sort_order"])
        sort_cases.append(f"WHEN %(name_{idx})s THEN %(sort_{idx})s")

        if u.get("status") is not None:
            params[f"status_{idx}"] = u["status"]
            status_cases.append(f"WHEN %(name_{idx})s THEN %(status_{idx})s")

    params["names"] = tuple(names)

    set_clauses = []
    if status_cases:
        set_clauses.append(
            f"status = CASE name {' '.join(status_cases)} ELSE status END"
        )
    set_clauses.append(
        f"custom_sort_order = CASE name {' '.join(sort_cases)} ELSE custom_sort_order END"
    )

    sql = f"""
        UPDATE `tabTask`
        SET {', '.join(set_clauses)}
        WHERE name IN %(names)s
    """

    frappe.db.sql(sql, params)
    frappe.db.commit()

    return {"success": True, "updated": len(names)}


@frappe.whitelist()
def switch_assignee_of_task(task_name, new_assignee):
    if not task_name:
        frappe.throw("Task is required")

    task_doc = frappe.get_doc("Task", task_name)

    if new_assignee == "unassigned":
        new_assignee = None
    elif new_assignee == "auto":
        new_assignee = frappe.session.user

    # Get all existing open ToDos for this task
    existing_todos = frappe.db.get_all(
        "ToDo",
        filters={
            "reference_type": "Task",
            "reference_name": task_name,
            "status": "Open",
        },
        fields=["name", "allocated_to"],
    )

    # Check if the only existing open ToDo is already assigned to new_assignee
    if len(existing_todos) == 1 and existing_todos[0]["allocated_to"] == new_assignee:
        return {"success": True, "message": "Task already assigned to this user"}

    # Close all existing open ToDos
    for todo in existing_todos:
        frappe.db.set_value("ToDo", todo["name"], "status", "Closed")

        # Notify old assignee
        send_notification(
            user=todo["allocated_to"],
            subject=f"{task_doc.subject}",
            content=f"The task '<b>{task_doc.subject}</b>' has been removed from you.",
            document_type="Task",
            document_name=task_name,
            icons='<i class="fa fa-trash"></i>',
        )

    # Create new ToDo for new assignee only if not unassigned
    if new_assignee:
        frappe.get_doc(
            {
                "doctype": "ToDo",
                "reference_type": "Task",
                "reference_name": task_name,
                "allocated_to": new_assignee,
                "description": f"Task assigned to {new_assignee}",
                "status": "Open",
                "due_date": None,
                "assigned_by": frappe.session.user,
            }
        ).insert()

        send_notification(
            user=new_assignee,
            subject=f"{task_doc.subject}",
            content=f"You have been assigned to task '<b>{task_doc.subject}</b>'.",
            document_type="Task",
            document_name=task_name,
            icons='<i class="fa fa-tasks"></i>',
        )

        # Auto-add assignee to project users if not already present
        if task_doc.project and not frappe.db.exists(
            "Project User",
            {"parent": task_doc.project, "user": new_assignee}
        ):
            frappe.get_doc({
                "doctype": "Project User",
                "parent": task_doc.project,
                "parenttype": "Project",
                "parentfield": "users",
                "user": new_assignee,
            }).insert(ignore_permissions=True)

    frappe.db.commit()
    return {"success": True, "message": "Assignee updated"}


@frappe.whitelist()
def get_assignee_of_task(task_name):
    if not task_name:
        frappe.throw("Task is required")

    assignee = frappe.db.get_value(
        "ToDo",
        {
            "reference_type": "Task",
            "reference_name": task_name,
            "status": ["=", "Open"],
        },
        "allocated_to",

    )

    return assignee


@frappe.whitelist()
def tasks_accountability_report(project=None):
    """
    Returns accountability report with metrics per assignee:
    - Open: count of open tasks
    - Overdue: count of overdue tasks
    - Aging > 3d: count of tasks not updated for > 3 days
    - Pending Review: count of pending review tasks
    - Avg Delay: average days overdue
    - Completed: count of completed tasks
    """

    conditions = []
    params = {}

    if project:
        conditions.append("t.project = %(project)s")
        params["project"] = project

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    tasks = frappe.db.sql(
        f"""
                SELECT
                    u.name AS assignee,
                    u.full_name,
                    COUNT(CASE WHEN t.status = 'Open' THEN 1 END) AS open_count,
                    COUNT(CASE WHEN t.status = 'Open' AND t.modified < DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN 1 END) AS overdue_count,
                    COUNT(CASE WHEN DATE_SUB(NOW(), INTERVAL 3 DAY) > t.modified THEN 1 END) AS aging_3d_count,
                    COUNT(CASE WHEN t.status = 'Pending Review' THEN 1 END) AS pending_review_count,
                    ROUND(AVG(CASE WHEN t.modified < CURDATE() THEN DATEDIFF(CURDATE(), t.modified) ELSE 0 END), 2) AS avg_delay,
                    COUNT(CASE WHEN t.status = 'Completed' THEN 1 END) AS completed_count
                FROM `tabTask` t
                LEFT JOIN `tabToDo` td ON td.reference_name = t.name AND td.reference_type = 'Task' AND td.status != 'Cancelled'
                LEFT JOIN `tabUser` u ON u.name = td.allocated_to
                {where_clause}
                GROUP BY u.name, u.full_name
                ORDER BY open_count DESC, overdue_count DESC
                """,
        params,
        as_dict=True,
    )

    return tasks


@frappe.whitelist()
def get_task_tree(project=None):

    fields = ["name", "subject", "status", "priority", "project"]

    def get_children(parent):
        filters = {"parent_task": parent}
        if project:
            filters["project"] = project

        children = frappe.get_all(
            "Task",
            filters=filters,
            fields=fields,
        )

        for child in children:
            child["children"] = get_children(child["name"])

        return children

    # ROOT tasks → parent_task == ""
    root_filters = {"parent_task": ""}
    if project:
        root_filters["project"] = project

    roots = frappe.get_all(
        "Task",
        filters=root_filters,
        fields=fields,
    )

    for root in roots:
        print("task:", root)
        root["children"] = get_children(root["name"])

    return roots


@frappe.whitelist()
def get_task_activity(task):
    if not frappe.has_permission("Task", "read", doc=frappe.get_doc("Task", task)):
        frappe.throw(_("Not permitted"), frappe.PermissionError)

    versions = frappe.get_all(
        "Version",
        filters={"ref_doctype": "Task", "docname": task},
        fields=["owner", "creation", "data"],
        order_by="creation desc",
        limit_page_length=10
    )

    comments = frappe.get_all(
        "Comment",
        filters={"reference_doctype": "Task", "reference_name": task},
        fields=["comment_type", "content", "owner", "creation"],
        order_by="creation desc",
        limit_page_length=10
    )

    return {
        "versions": versions,
        "comments": comments
    }


@frappe.whitelist()
def list_tasks(project, group_by=None, filters=None, limit=None, offset=0):

    project_execution_mode = frappe.db.get_value(
        "Project", project, "custom_execution_mode") or "Kanban"
    isScrum = project_execution_mode == "Scrum"

    filters = json.loads(filters) or {}
    print("filters received:", filters, type(filters))

    filters.update({"project": project})
    filters.update(filters)
    # if isScrum:
    #     active_cycle = frappe.db.get_value(
    #         "Cycle",
    #         {"project": project, "status": "Active"},
    #         "name"
    #     )
    #     filters.update({"custom_cycle": active_cycle})
    # else:
    #     # For Kanban mode, don't filter by cycle
    #     pass

    Task = DocType("Task")
    ToDo = DocType("ToDo")
    Project = DocType("Project")

    ProjectUser = DocType("Project User")
    PortalUser = DocType("Portal User")

    query = (
        frappe.qb.from_(Task)
        .select(
            Task.name,
            Task.name.as_("id"),
            Task.subject,
            Task.status,
            Task.type,
            Task.custom_cycle.as_("cycle"),
            Task.priority,
            Task.modified,
            Task.project,
            Project.project_name,
            Task.custom_reopen_count,
            Task.custom_review_cycles,
            Task.custom_last_reopened_on,
            fn.GroupConcat(ToDo.allocated_to).as_("assignee"),
        ).inner_join(Project).on(Project.name == Task.project)
        .left_join(ToDo).on(
            (ToDo.reference_name == Task.name)
            & (ToDo.reference_type == "Task")
            & (ToDo.status == "Open")
        )
    )
    # Permission-based filtering
    user = frappe.session.user
    user_roles = frappe.get_roles(user)
    is_admin = "Administrator" in user_roles
    is_project_manager = has_projects_manager_role(roles=user_roles)
    customer_portal_subquery = (
        frappe.qb.from_(PortalUser)
        .select(PortalUser.parent)
        .where(
            (PortalUser.parenttype == "Customer")
            & (PortalUser.parentfield == "portal_users")
            & (PortalUser.user == user)
        )
    )

    if not is_admin:
        if is_project_manager:
            # Projects Manager sees tasks from projects they own OR are added to in Project User
            query = query.where(
                (Project.owner == user) |
                (Project.name.isin(
                    frappe.qb.from_(ProjectUser)
                    .select(ProjectUser.parent)
                    .where(ProjectUser.user == user)
                ))
            )
        else:
            # Project User sees tasks from projects they're assigned to or customer-owned projects they can access
            query = query.where(
                (Project.name.isin(
                    frappe.qb.from_(ProjectUser)
                    .select(ProjectUser.parent)
                    .where(ProjectUser.user == user)
                )) |
                (Project.customer.isin(customer_portal_subquery))
            )

    if limit:
        query = query.limit(limit).offset(offset)

    query = query.groupby(Task.name).orderby(
        Task.modified, order=frappe.qb.desc)
    # Only return parent tasks (exclude subtasks)
    # query = query.where((Task.parent_task.isnull()) | (Task.parent_task == ""))
    # tasks = query.run(as_dict=True)

    # Apply filters
    for key, value in filters.items():
        if key == "subject":
            query = query.where(Task.subject.like(f"%{value}%"))
        if key == "project":
            query = query.where(Task.project == value)
        elif key == "priority":
            query = query.where(Task.priority == value)
        elif key == "type":
            query = query.where(Task.type == value)
        elif key == "custom_cycle":

            query = query.where(Task.custom_cycle == value)
        elif key == "status":
            query = query.where(Task.status == value)

    query = query.groupby(Task.name).orderby(
        Task.modified, order=frappe.qb.desc)

    # Only return parent tasks (exclude subtasks)
    query = query.where((Task.parent_task.isnull()))

    tasks = query.run(as_dict=True)

    # Group tasks by specified field
    if group_by:
        grouped_data = {}
        for task in tasks:
            group_key = task.get(group_by, "Ungrouped")
            if group_key not in grouped_data:
                grouped_data[group_key] = {
                    "name": str(group_key),
                    "id": str(group_key),
                    "title": str(group_key),
                    group_by: group_key,
                    "children": []
                }
            grouped_data[group_key]["children"].append(task)

        return list(grouped_data.values())

    return tasks


@frappe.whitelist()
def list_subtasks(parent_task):
    Task = DocType("Task")
    ToDo = DocType("ToDo")

    subtasks = (
        frappe.qb.from_(Task)
        .select(
            Task.name,
            Task.name.as_("id"),
            Task.subject,
            Task.status,
            Task.type,
            Task.custom_cycle.as_("cycle"),
            Task.priority,
            Task.modified,
            Task.project,
            Task.parent_task,
            fn.GroupConcat(ToDo.allocated_to).as_("assignee"),

        )
        .left_join(ToDo).on(
            (ToDo.reference_name == Task.name)
            & (ToDo.reference_type == "Task")
            & (ToDo.status == "Open")
        )
        .where(Task.parent_task == parent_task)
        .groupby(Task.name)
        .orderby(Task.modified, order=frappe.qb.desc)
        .run(as_dict=True)
    )

    return subtasks


@frappe.whitelist()
def backlog(project=None):
    user = frappe.session.user
    user_roles = frappe.get_roles(user)
    is_admin = "Administrator" in user_roles
    is_project_manager = has_projects_manager_role(roles=user_roles)

    project_execution_mode = frappe.db.get_value(
        "Project", project, "custom_execution_mode") or "Kanban"

    isScrum = project_execution_mode == "Scrum"

    filters = {"project": project}
    if isScrum:
        active_cycle = frappe.db.get_value(
            "Cycle",
            {"project": project, "status": "Active"},
            "name"
        )
        filters.update({"custom_cycle": active_cycle})

    Cycle = DocType("Cycle")
    Task = DocType("Task")
    ToDo = DocType("ToDo")
    ProjectUser = DocType("Project User")

    if isScrum:
        cycles = (
            frappe.qb.from_(Cycle)
            .select(
                Cycle.name,
                Cycle.cycle_name,
                Cycle.start_date,
                Cycle.end_date,
                Cycle.status,
            )
            .where(Cycle.project == project)
            .orderby(Cycle.start_date, order=frappe.qb.desc)
            .run(as_dict=True)
        )

        # Fetch tasks for each cycle
        for cycle in cycles:
            tasks = (
                frappe.qb.from_(Task)
                .select(
                    Task.name,
                    Task.name.as_("id"),
                    Task.subject,
                    Task.status,
                    Task.priority,
                    Task.modified,
                    Task.type,
                    fn.GroupConcat(ToDo.allocated_to).as_("assignee"),
                )
                .left_join(ToDo).on(
                    (ToDo.reference_name == Task.name)
                    & (ToDo.reference_type == "Task")
                    & (ToDo.status == "Open")
                )
                .where(
                    (Task.project == project)
                    & (Task.custom_cycle == cycle["name"])
                )
                .groupby(Task.name)
                .orderby(Task.modified, order=frappe.qb.desc)
                # Only return parent tasks (exclude subtasks)
                .where((Task.parent_task.isnull()))
                .run(as_dict=True)
            )
            cycle["tasks"] = tasks
    else:
        cycles = None

    # Fetch backlog tasks not assigned to any cycle (all statuses)
    if isScrum:
        open_tasks = (
            frappe.qb.from_(Task)
            .select(
                Task.name,
                Task.name.as_("id"),
                Task.subject,
                Task.status,
                Task.priority,
                Task.modified,
                Task.type,
                fn.GroupConcat(ToDo.allocated_to).as_("assignee"),
            )
            .left_join(ToDo).on(
                (ToDo.reference_name == Task.name)
                & (ToDo.reference_type == "Task")
                & (ToDo.status == "Open")
            )
            .where(
                (Task.project == project)
                & (Task.custom_cycle.isnull())
                & (Task.status == "Open")
            )
            .groupby(Task.name)
            .orderby(Task.modified, order=frappe.qb.desc)
            .where((Task.parent_task.isnull()))
            .run(as_dict=True)
        )
    else:
        # Kanban: show all tasks
        open_tasks = (
            frappe.qb.from_(Task)
            .select(
                Task.name,
                Task.name.as_("id"),
                Task.subject,
                Task.status,
                Task.priority,
                Task.modified,
                Task.type,
                fn.GroupConcat(ToDo.allocated_to).as_("assignee"),
            )
            .left_join(ToDo).on(
                (ToDo.reference_name == Task.name)
                & (ToDo.reference_type == "Task")
                & (ToDo.status == "Open")
            )
            .where(
                (Task.project == project)
                & (Task.status == "Open")
            )
            .groupby(Task.name)
            .orderby(Task.modified, order=frappe.qb.desc)
            .where(Task.parent_task.isnull())
            .run(as_dict=True)
        )

    all_tasks = (
        frappe.qb.from_(Task)
        .select(
            Task.name,
            Task.name.as_("id"),
            Task.subject,
            Task.status,
            Task.priority,
            Task.modified,
            Task.type,
            fn.GroupConcat(ToDo.allocated_to).as_("assignee"),
        )
        .left_join(ToDo).on(
            (ToDo.reference_name == Task.name)
            & (ToDo.reference_type == "Task")
            & (ToDo.status == "Open")
        )
        .where(
            (Task.project == project)
        )
        .groupby(Task.name)
        .orderby(Task.modified, order=frappe.qb.desc)
        .run(as_dict=True)
    )

    return {
        "cycles": cycles,
        "backlog": open_tasks,
        "all_tasks": all_tasks,
        "is_scrum": isScrum,
        "active_cycle_name": frappe.db.get_value(
            "Cycle",
            {"project": project, "status": "Active"},
            "name"
        ) if isScrum else None,
    }


@frappe.whitelist()
def remove_subtask(parent_task, subtask):
    try:
        # Remove entry from Task Depends On child table in parent task
        frappe.db.sql(
            "DELETE FROM `tabTask Depends On` WHERE parent = %s AND task = %s",
            (parent_task, subtask)
        )

        # Delete the subtask document
        frappe.delete_doc("Task", subtask)

        frappe.db.commit()
        return {"success": True, "message": f"Subtask {subtask} removed and deleted"}
    except Exception as e:
        frappe.log_error(
            f"Error removing subtask: {e}", "Remove Subtask Error")
        return {"success": False, "message": str(e)}


def subtask_to_quill_html(data: dict) -> str:
    def list_to_html(items):
        if not items:
            return "<p>None</p>"
        return "<ul>" + "".join(f"<li>{item}</li>" for item in items) + "</ul>"

    html = f"""

    <p>{data.get("description", "")}</p>

    <h3>Task Details</h3>
    <ul>
        <li><strong>Task Type:</strong> {data.get("task_type", "")}</li>
        <li><strong>Priority:</strong> {data.get("priority", "")}</li>
        <li><strong>Complexity:</strong> {data.get("complexity", "")}</li>
        <li><strong>Estimated Effort:</strong> {data.get("estimated_effort", "")}</li>
        <li><strong>Estimated Hours:</strong> {data.get("estimated_hours", "")}</li>
        <li><strong>Execution Order:</strong> {data.get("execution_order", "")}</li>
        <li><strong>Suggested Role:</strong> {data.get("suggested_role", "")}</li>
        <li><strong>Risk Level:</strong> {data.get("risk_level", "")}</li>
        <li><strong>Automatable:</strong> {"Yes" if data.get("automatable") else "No"}</li>
    </ul>

    <h3>Reason</h3>
    <p>{data.get("reason", "")}</p>

    <h3>Required Skills</h3>
    {list_to_html(data.get("required_skills", []))}

    <h3>Dependencies</h3>
    {list_to_html(data.get("depends_on", []))}

    <h3>Deliverables</h3>
    {list_to_html(data.get("deliverables", []))}

    <h3>Acceptance Criteria</h3>
    {list_to_html(data.get("acceptance_criteria", []))}

    <h3>Tags</h3>
    {list_to_html(data.get("tags", []))}
    """

    return html.strip()


@frappe.whitelist()
def create_subtask_from_ai_session(subtask, message_id):
    if not subtask or not message_id:
        return {"success": False, "message": "Subtask and message_id are required"}
    message_doc = frappe.get_doc("Copilot Message", message_id)
    session_id = message_doc.session

    session = frappe.get_doc("Copilot Session", session_id)

    reference_doctype = session.reference_doctype
    reference_name = session.reference_name

    if reference_doctype != "Task":
        return {"success": False, "message": "Subtasks can only be created for Tasks"}
    task_doc = frappe.get_doc("Task", reference_name)

    # Check if subtask with same subject already exists
    existing_subtask = frappe.db.get_value(
        "Task",
        {
            "subject": subtask.get("subject", "Subtask for " + task_doc.subject),
            "parent_task": task_doc.name,
        }
    )

    if existing_subtask:
        return {
            "success": False,
            "message": f"Subtask with this subject already exists under Task '{task_doc.subject}'"
        }

    new_subtask = frappe.get_doc({
        "doctype": "Task",
        "subject": subtask.get("subject", "Subtask for " + task_doc.subject),
        "description": subtask_to_quill_html(subtask),
        "project": task_doc.project,
        "parent_task": task_doc.name,
        "priority": subtask.get("priority", "Medium"),
    })

    # new_subtask.tags = ",".join(subtask.get("tags", []))
    new_subtask.insert(ignore_permissions=True)

    frappe.db.commit()
    for tag in subtask.get("tags", []):

        add_tag(
            dt="Task",
            dn=new_subtask.name,
            tag=tag)

    return {
        "success": True,
        "message": f"Subtask '{new_subtask.subject}' created under Task '{task_doc.subject}'",
        "subtask_id": new_subtask.name
    }


@frappe.whitelist()
def check_subtask_exists(message_id, subject):
    message_doc = frappe.get_doc("Copilot Message", message_id)
    session_id = message_doc.session

    session = frappe.get_doc("Copilot Session", session_id)

    reference_doctype = session.reference_doctype
    reference_name = session.reference_name

    if reference_doctype != "Task":
        return False

    existing_subtask = frappe.db.get_value(
        "Task",
        {
            "subject": subject,
            "parent_task": reference_name,
            # "docstatus": ["!=", 2]
        }
    )
    return bool(existing_subtask)


@frappe.whitelist()
def remove_task(task_name):
    try:
        frappe.delete_doc("Task", task_name)
        frappe.db.commit()

        return {"success": True, "message": f"Task {task_name} removed and deleted"}
    except Exception as e:
        frappe.log_error(
            f"Error removing task: {e}", "Remove Task Error")
        return {"success": False, "message": str(e)}


@frappe.whitelist()
def bulk_delete_tasks(task_names):
    task_names = frappe.parse_json(task_names) if task_names else []
    task_names = [name for name in task_names if name]

    if not task_names:
        return {"success": False, "message": "No tasks selected"}

    deleted = []
    failed = []

    for task_name in task_names:
        try:
            frappe.delete_doc("Task", task_name)
            deleted.append(task_name)
        except Exception as e:
            failed.append({"task_name": task_name, "error": str(e)})

    frappe.db.commit()

    if deleted and not failed:
        return {
            "success": True,
            "message": f"{len(deleted)} task(s) deleted successfully",
            "deleted": deleted,
            "failed": failed,
        }

    if deleted:
        return {
            "success": True,
            "message": f"{len(deleted)} task(s) deleted, {len(failed)} failed",
            "deleted": deleted,
            "failed": failed,
        }

    return {
        "success": False,
        "message": failed[0]["error"] if failed else "Failed to delete tasks",
        "deleted": deleted,
        "failed": failed,
    }


@frappe.whitelist()
def _move_task(task_name, target_type, target_id):
    """Move a single task. target_type: 'cycle', 'backlog', or 'phase'"""
    task_doc = frappe.get_doc("Task", task_name)
    project_doc = frappe.get_doc("Project", task_doc.project)

    if target_type == "cycle":
        cycle_name = target_id

        if project_doc.custom_execution_mode != "Scrum":
            return {"success": False, "message": f"Project '{project_doc.project_name}' is not in Scrum mode"}

        if task_doc.custom_cycle == cycle_name:
            return {"success": False, "message": f"Task '{task_doc.subject}' is already in cycle '{cycle_name}'"}

        active_cycle = frappe.db.get_value("Cycle", {"project": project_doc.name, "status": "Active"}, "name")
        if active_cycle and task_doc.custom_cycle == active_cycle and cycle_name != active_cycle:
            return {"success": False, "message": f"Cannot move tasks out of active cycle '{active_cycle}'. Please complete it first."}

        if task_doc.custom_cycle:
            current_cycle = frappe.get_doc("Cycle", task_doc.custom_cycle)
            if current_cycle.status == "Completed":
                return {"success": False, "message": f"Cannot move tasks out of completed cycle '{current_cycle.cycle_name}'."}

        if cycle_name:
            cycle_doc = frappe.get_doc("Cycle", cycle_name)
            if cycle_doc.project != project_doc.name:
                return {"success": False, "message": f"Cycle '{cycle_doc.cycle_name}' does not belong to project '{project_doc.project_name}'"}
            if cycle_doc.status == "Completed":
                return {"success": False, "message": f"Cannot move tasks into completed cycle '{cycle_doc.cycle_name}'."}

        task_doc.custom_cycle = cycle_name
        task_doc.save()
        frappe.db.commit()
        return {"success": True, "message": f"Task '{task_doc.subject}' moved to '{cycle_name or 'Backlog'}'"}

    elif target_type == "backlog":
        if project_doc.custom_execution_mode != "Scrum":
            return {"success": False, "message": f"Project '{project_doc.project_name}' is not in Scrum mode"}

        active_cycle = frappe.db.get_value("Cycle", {"project": project_doc.name, "status": "Active"}, "name")
        if active_cycle and task_doc.custom_cycle == active_cycle:
            return {"success": False, "message": f"Cannot move tasks out of active cycle '{active_cycle}'. Please complete it first."}

        if task_doc.custom_cycle:
            current_cycle = frappe.get_doc("Cycle", task_doc.custom_cycle)
            if current_cycle.status == "Completed":
                return {"success": False, "message": f"Cannot move tasks out of completed cycle '{current_cycle.cycle_name}'."}

        task_doc.custom_cycle = None
        task_doc.save()
        frappe.db.commit()
        return {"success": True, "message": f"Task '{task_doc.subject}' moved to backlog"}

    return {"success": False, "message": "Unknown target type"}

@frappe.whitelist()
def set_backlog_position(type, task_name, target_id, task_names=None):
    if task_names:
        task_names = frappe.parse_json(task_names)
    else:
        task_names = [task_name]

    first_error = None
    moved = 0
    for name in task_names:
        result = _move_task(name, type, target_id)
        if result.get("success"):
            moved += 1
        elif first_error is None:
            first_error = result

    if moved > 0:
        return {"success": True, "message": f"{moved} task(s) moved successfully"}
    if first_error:
        return first_error
    return {"success": False, "message": "No tasks were moved"}

def set_task_status(task_name, new_status):
    try:
        task_doc = frappe.get_doc("Task", task_name)
        old_status = task_doc.status
        if old_status == new_status:
            return {"success": False, "message": f"Task '{task_doc.subject}' is already in status '{new_status}'"}

        task_doc.status = new_status
        task_doc.save()
        frappe.db.commit()

        return {"success": True, "message": f"Task '{task_doc.subject}' status changed from '{old_status}' to '{new_status}'"}
    except Exception as e:
        frappe.log_error(
            f"Error setting task status: {e}", "Set Task Status Error")
        return {"success": False, "message": str(e)}
