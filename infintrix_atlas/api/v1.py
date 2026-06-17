from cmath import phase
from warnings import filters

from frappe import _
import frappe
from frappe.query_builder import DocType, functions as fn
from datetime import datetime, timedelta
import json
from frappe.utils import now, user, getdate, nowdate, date_diff, cint
from infintrix_atlas.permissions import project_permission_query, task_permission_query
from infintrix_atlas.role_utils import (
    get_customer_portal_customers,
    has_customer_portal_access as has_customer_portal_project_access,
    has_customer_portal_task_access,
    has_projects_manager_role,
)
from .utils import send_notification
from frappe.desk.doctype.tag.tag import add_tag, remove_tag


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
def get_project_flow_metrics(project):
    """
    Returns execution efficiency (%) and backlog health label
    for a project.

    Output:
    {
        "efficiency": int (0–100),
        "health": "Optimized" | "At Risk" | "Unhealthy",
        "message": str (tip to improve)
    }
    """

    project_doc = frappe.get_doc("Project", project)
    execution_mode = project_doc.custom_execution_mode or "Kanban"

    tasks = frappe.get_all(
        "Task",
        filters={"project": project},
        fields=["status", "custom_cycle as cycle", "modified", "creation"],
    )

    open_tasks = []
    in_progress_count = 0
    backlog_tasks = []

    now = datetime.today()
    stale_cutoff = now - timedelta(days=14)

    # -----------------------------
    # Classify tasks
    # -----------------------------

    for t in tasks:
        status = t.status

        if status in ("Working", "Pending Review"):
            in_progress_count += 1
        elif status == "Backlog":
            backlog_tasks.append(t)
        elif status == "Open":
            open_tasks.append(t)

            if execution_mode == "Scrum":
                if not t.cycle:
                    backlog_tasks.append(t)
            else:
                backlog_tasks.append(t)

    # -----------------------------
    # Efficiency calculation
    # -----------------------------

    flow_denominator = in_progress_count + len(open_tasks)

    if flow_denominator == 0:
        efficiency = 100
    else:
        efficiency = round((in_progress_count / flow_denominator) * 100)

    # -----------------------------
    # Backlog health calculation
    # -----------------------------

    backlog_count = len(backlog_tasks)

    if backlog_count == 0:
        health = "Optimized"
    else:
        stale_count = sum(
            1 for t in backlog_tasks if (t.modified or t.creation) < stale_cutoff
        )

        stale_ratio = stale_count / backlog_count

        if backlog_count <= 10 and stale_ratio < 0.3:
            health = "Optimized"
        elif backlog_count <= 25 and stale_ratio < 0.6:
            health = "At Risk"
        else:
            health = "Unhealthy"

    if efficiency < 40 and health == "Optimized":
        health = "At Risk"

    # Generate improvement message
    message = ""
    if health == "Unhealthy":
        message = "Reduce backlog size and address stale tasks to improve health."
    elif health == "At Risk":
        if efficiency < 40:
            message = "Increase tasks in progress and reduce backlog to improve efficiency and health."
        else:
            message = "Address stale backlog items to optimize project health."
    else:  # Optimized
        if efficiency < 40:
            message = "Increase work in progress to improve efficiency."
        else:
            message = "Great! Your project is running smoothly."

    return {
        "efficiency": efficiency,
        "health": health,
        "message": message,
        "color": {"Optimized": "green", "At Risk": "orange", "Unhealthy": "red"}[
            health
        ],
    }


@frappe.whitelist()
def start_cycle(name, cycle_name, duration, start_date, end_date):
    cycle = frappe.get_doc("Cycle", name)
    project_cycle_belongs_to = cycle.project
    print("Cycle Name:", cycle.project)

    if cycle.status != "Planned":
        frappe.throw("Only planned cycles can be started")

    active_cycles = frappe.get_all(
        "Cycle",
        filters={
            "status": "Active",
            "project": project_cycle_belongs_to,
            "name": ["!=", name],
        },
        fields=["name"],
    )

    if active_cycles:
        frappe.throw(
            f"Cannot start cycle. Another cycle '{active_cycles[0].name}' is already active."
        )

    if not start_date:
        cycle.start_date = frappe.utils.nowdate()
    else:
        cycle.start_date = start_date

    if not end_date:
        frappe.throw("Please set an end date before starting the cycle")
    else:
        cycle.end_date = end_date

    cycle.cycle_name = cycle_name
    cycle.status = "Active"
    cycle.save()
    frappe.db.commit()

    return {"success": True, "message": f"Cycle {cycle_name} started successfully"}


@frappe.whitelist()
def complete_cycle(name, move_tasks_to):
    cycle = frappe.get_doc("Cycle", name)
    if cycle.status != "Active":
        frappe.throw("Only active cycles can be completed")

    open_tasks = frappe.get_all(
        "Task",
        filters={
            "custom_cycle": name,
            "status": ["in", ["Open", "Working", "Pending Review", "Blocked"]],
        },
        fields=["name"],
    )

    if open_tasks and not move_tasks_to:
        frappe.throw(
            f"Cycle has {len(open_tasks)} open tasks. Please specify a cycle to move them to."
        )

    if open_tasks and move_tasks_to:
        for t in open_tasks:
            task_doc = frappe.get_doc("Task", t.name)
            task_doc.custom_cycle = move_tasks_to
            task_doc.save()

    cycle.status = "Completed"
    cycle.actual_end_date = frappe.utils.nowdate()
    cycle.save()
    frappe.db.commit()

    return {"success": True, "message": f"Cycle {name} completed successfully"}


@frappe.whitelist()
def get_project_user_stats(user=None, activity_limit=5):

    user = user or frappe.session.user

    # -----------------------------
    # PROJECTS
    # -----------------------------
    project_conditions = project_permission_query(user)
    project_where = f"WHERE {project_conditions}" if project_conditions else ""

    projects = frappe.db.sql(
        f"""
        SELECT * FROM `tabProject`
        {project_where}
        """,
        as_dict=True,
    )

    project_names = [p.name for p in projects]
    total_projects = len(projects)

    if not project_names:
        return {
            "total_projects": 0,
            "active_tasks": 0,
            "avg_progress": 0,
            "team_members": 0,
            "recent_activities": [
                {"text": "No recent activities found", "time_display": ""}
            ],
        }

    # -----------------------------
    # TASKS (active only)
    # -----------------------------
    task_conditions = task_permission_query(user)
    task_where = f"AND {task_conditions}" if task_conditions else ""

    active_tasks = frappe.db.sql(
        """
        SELECT COUNT(*)
        FROM `tabTask`
        WHERE status NOT IN ('Completed', 'Cancelled')
        AND project IN %(projects)s
        {task_where}
        """.format(
            task_where=task_where
        ),
        {"projects": tuple(project_names)},
    )[0][0]

    # -----------------------------
    # AVG PROGRESS
    # -----------------------------
    avg_progress = (
        round(sum(p.percent_complete for p in projects) / total_projects)
        if total_projects > 0
        else 0
    )

    # -----------------------------
    # TEAM MEMBERS
    # -----------------------------
    team_members = frappe.db.sql(
        """
        SELECT COUNT(DISTINCT pu.user)
        FROM `tabProject User` pu
        WHERE pu.parent IN %(projects)s
        """,
        {"projects": tuple(project_names)},
    )[0][0]

    # TODAY'S TASKS
    today = frappe.utils.nowdate()
    today_tasks = frappe.db.sql(
        """
        SELECT
            td.name,
            td.description,
            td.status,
            td.date,
            td.priority,
            td.reference_name,
            td.allocated_to AS assignee,
            u.full_name AS assignee_full_name,
            t.subject AS task_subject,
            t.project AS task_project,
            p.project_name AS task_project_name
        FROM `tabToDo` td
        LEFT JOIN `tabTask` t
            ON t.name = td.reference_name
            AND td.reference_type = 'Task'
        LEFT JOIN `tabProject` p
            ON p.name = t.project
        LEFT JOIN `tabUser` u
            ON u.name = td.allocated_to
        WHERE td.allocated_to = %(user)s
            AND td.date = %(today)s
            AND td.status != 'Closed'
            AND td.status != 'Cancelled'
        ORDER BY td.date ASC, td.modified DESC
        """,
        {"user": user, "today": today},
        as_dict=True,
    )

    projects_list = []
    for p in projects:
        try:
            pct = int(p.get("percent_complete") or 0)
        except Exception:
            try:
                pct = round(float(p.get("percent_complete") or 0))
            except Exception:
                pct = 0

        projects_list.append(
            {
                "name": p.get("name"),
                "project_name": p.get("project_name") or p.get("name"),
                "project_type": p.get("project_type") or "",
                "status": p.get("status") or "",
                "percent_complete": pct,
            }
        )

    try:
        activity_limit = int(activity_limit)
    except (ValueError, TypeError):
        activity_limit = 5

    # ---- Task Activities ----
    task_activities_raw = frappe.db.sql(
        """
        SELECT 'Task' AS type, name AS doc_name, subject AS title,
               status AS detail, owner AS user, modified AS timestamp
        FROM `tabTask`
        WHERE docstatus < 2 AND project IN %(projects)s
        ORDER BY modified DESC
        """,
        {"projects": project_names},
        as_dict=True,
    )

    # ---- Project Activities ----
    project_activities_raw = frappe.db.sql(
        """
        SELECT 'Project' AS type, name AS doc_name, project_name AS title,
               status, owner AS user, modified AS timestamp
        FROM `tabProject`
        WHERE docstatus < 2 AND name IN %(projects)s
        ORDER BY modified DESC
        """,
        {"projects": project_names},
        as_dict=True,
    )

    project_activities = []
    for p in project_activities_raw:
        project_activities.append(
            {
                "type": p.type,
                "doc_name": p.doc_name,
                "title": p.title,
                "detail": f"Status: {p.status}",
                "user": p.user,
                "timestamp": p.timestamp,
            }
        )

    activities = task_activities_raw + project_activities
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    activity_data = activities[:activity_limit]

    from frappe.utils import pretty_date

    recent_activities = []
    for d in activity_data:
        user_full_name = (
            frappe.db.get_value("User", d["user"], "full_name") or d["user"]
        )
        text = f"{user_full_name} updated {d['type']}: {d['title']} ({d['detail']})"

        recent_activities.append(
            {
                "text": text,
                "time_display": pretty_date(d["timestamp"]),
                "timestamp": str(d["timestamp"]),
                "type": d["type"],
                "doc_name": d["doc_name"],
            }
        )

    if not recent_activities:
        recent_activities = [
            {"text": "No recent activities found", "time_display": ""}]

    return {
        "total_projects": total_projects,
        "active_tasks": active_tasks,
        "avg_progress": avg_progress,
        "team_members": team_members,
        "projects": projects_list,
        "recent_activities": recent_activities,
        "today_tasks": today_tasks,
    }


@frappe.whitelist()
def users_on_project(project):
    users = frappe.db.sql(
        """
        SELECT u.name, u.full_name, u.email
        FROM `tabProject User` pu
        JOIN `tabUser` u ON u.name = pu.user
        WHERE pu.parent = %s
    """,
        (project,),
        as_dict=True,
    )

    plain_array = [u.name for u in users]

    return plain_array


@frappe.whitelist()
def update_users_on_project(project, users):
    if isinstance(users, str):
        users = json.loads(users)

    # Get existing users
    existing_users = frappe.db.sql(
        """
            SELECT user FROM `tabProject User`
            WHERE parent = %s
        """,
        (project,),
        as_dict=True,
    )
    existing_user_list = [u.user for u in existing_users]

    # Find removed and added users
    users_set = set(users)
    existing_set = set(existing_user_list)
    removed_users = existing_set - users_set
    added_users = users_set - existing_set

    # Remove existing users
    frappe.db.sql(
        """
            DELETE FROM `tabProject User`
            WHERE parent = %s
        """,
        (project,),
    )

    # Add new users
    for user in users:
        frappe.get_doc(
            {
                "doctype": "Project User",
                "parent": project,
                "parenttype": "Project",
                "parentfield": "users",
                "user": user,
            }
        ).insert()

    frappe.db.commit()

    # Send notifications
    project_name = frappe.db.get_value("Project", project, "project_name")

    for user in removed_users:
        send_notification(
            user=user,
            subject=f"Removed from Project: {project_name}",
            content=f"You have been removed from project '{project_name}'.",
            document_type="Project",
            document_name=project,
            icons='<i class="fa fa-exclamation-triangle"></i>',
        )

    for user in added_users:
        send_notification(
            user=user,
            subject=f"Added to Project: {project_name}",
            content=f"You have been added to project '{project_name}'.",
            document_type="Project",
            document_name=project,
            icons='<i class="fa fa-check-circle"></i>',
        )

    return {"success": True, "message": "Project users updated"}


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


# file: your_app/your_app/api/task_tree.py


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


def _ensure_document_read_access(doctype, docname):
    if doctype == "Task":
        if not frappe.has_permission("Task", "read", doc=frappe.get_doc("Task", docname)):
            frappe.throw(_("Not permitted"), frappe.PermissionError)
        return

    if not frappe.has_permission(doctype, "read", doc=frappe.get_doc(doctype, docname)):
        frappe.throw(_("Not permitted"), frappe.PermissionError)


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
        fields=["name", "subject", "status", "custom_phase", "exp_end_date"],
        order_by="modified desc",
    )

    phase_rows = frappe.get_all(
        "Project Phase",
        filters={"project": project},
        fields=[
            "name",
            "title",
            "sequence",
            "status",
            "start_date",
            "end_date",
            "completion_percentage",
        ],
        order_by="sequence asc, creation asc",
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
            "phase",
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
    tasks_by_phase = {}

    for task in task_rows:
        phase_name = task.custom_phase or "__unassigned__"
        tasks_by_phase.setdefault(phase_name, []).append(task)

        if task.status == "Completed":
            task_counts["completed"] += 1
        elif task.status in ("Working", "Pending Review"):
            task_counts["in_progress"] += 1
        else:
            task_counts["pending"] += 1

        if task.exp_end_date and task.status != "Completed" and getdate(task.exp_end_date) < getdate(nowdate()):
            task_counts["overdue"] += 1

    total_tasks = len(task_rows)

    def get_phase_completion(phase_doc_tasks, saved_completion):
        if saved_completion is not None:
            return int(round(float(saved_completion or 0)))
        if not phase_doc_tasks:
            return 0
        completed = sum(1 for task in phase_doc_tasks if task.status == "Completed")
        return int(round((completed / len(phase_doc_tasks)) * 100))

    phases = []
    active_phase = None
    next_milestone_date = None

    for phase_row in phase_rows:
        phase_tasks = tasks_by_phase.get(phase_row.name, [])
        completed_tasks = sum(1 for task in phase_tasks if task.status == "Completed")
        open_tasks = len(phase_tasks) - completed_tasks
        completion = get_phase_completion(phase_tasks, phase_row.completion_percentage)
        deliverables = [task.subject for task in phase_tasks[:4] if task.subject]

        phase_item = {
            "id": phase_row.name,
            "title": phase_row.title or phase_row.name,
            "start_date": phase_row.start_date,
            "end_date": phase_row.end_date,
            "status": phase_row.status,
            "completion": completion,
            "tasks_count": len(phase_tasks),
            "completed_tasks": completed_tasks,
            "open_tasks": open_tasks,
            "deliverables": deliverables,
        }
        phases.append(phase_item)

        if not active_phase and phase_row.status == "Active":
            active_phase = phase_item

        if (
            not next_milestone_date
            and phase_row.end_date
            and phase_row.status in ("Active", "Planned")
            and getdate(phase_row.end_date) >= getdate(nowdate())
        ):
            next_milestone_date = phase_row.end_date

    if not phase_rows:
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

    if not active_phase and phases:
        active_phase = next(
            (phase for phase in phases if phase["status"] == "Planned"),
            phases[-1],
        )

    if not next_milestone_date:
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
                "phase": frappe.db.get_value("Project Phase", action.phase, "title") if action.phase else None,
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


def _ensure_project_access(project, require_write=False, allow_customer_portal=False):
    if not project:
        frappe.throw(_("Project is required"))

    if allow_customer_portal and has_customer_portal_project_access(project):
        return

    permission_type = "write" if require_write else "read"
    if not frappe.has_permission("Project", permission_type, project):
        frappe.throw(_("Not permitted"), frappe.PermissionError)


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
def list_project_phases(project):
    _ensure_project_access(project, allow_customer_portal=True)
    return frappe.get_all(
        "Project Phase",
        filters={"project": project},
        fields=["name", "title", "status", "sequence"],
        order_by="sequence asc",
    )


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
def create_task_from_requirement(requirement, subject=None, type=None, priority="Medium", phase=None):
    req = frappe.get_doc("Requirement", requirement)
    _ensure_project_access(req.project, require_write=True)

    if not subject:
        subject = req.title

    if not phase:
        phase = frappe.db.get_value("Project Phase", {"project": req.project, "status": "Active"}, "name")
    if not phase:
        phase = frappe.db.get_value("Project Phase", {"project": req.project, "status": "Planned"}, "name", order_by="sequence asc")

    task = frappe.get_doc(
        {
            "doctype": "Task",
            "project": req.project,
            "subject": f"[{req.name}] {subject}",
            "type": type or "Task",
            "priority": priority,
            "description": req.description or "",
            "custom_requirement": req.name,
            "custom_phase": phase,
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


@frappe.whitelist()
def create_action_request(
    project,
    title,
    description,
    action_type="Approval",
    phase=None,
    due_date=None,
    related_task=None,
    is_portal_visible=1,
):
    _ensure_project_access(project, require_write=True)

    if not phase:
        active = frappe.db.get_value("Project Phase", {"project": project, "status": "Active"}, "name")
        if active:
            phase = active
        else:
            phase = frappe.db.get_value("Project Phase", {"project": project, "status": "Planned"}, "name", order_by="sequence asc")

    doc = frappe.get_doc(
        {
            "doctype": "Project Action Request",
            "project": project,
            "title": title,
            "description": description,
            "action_type": action_type,
            "phase": phase,
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


@frappe.whitelist()
def list_project_resources(project, include_internal=False):
    allow_customer_portal = not frappe.has_permission("Project", "write", project)
    _ensure_project_access(project, allow_customer_portal=allow_customer_portal)

    visibility = ["Client", "Both"]
    if include_internal and frappe.has_permission("Project", "write", project):
        visibility = ["Internal", "Client", "Both"]

    return frappe.get_all(
        "Project Resource",
        filters={"project": project, "visibility": ["in", visibility]},
        fields=["name", "title", "type", "link", "file", "visibility", "modified"],
        order_by="modified desc",
    )


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

    for row in rows:
        row["phase_title"] = (
            frappe.db.get_value("Project Phase", row.phase, "title") if row.phase else None
        )

    return rows


def is_project_manager():
    user = frappe.session.user
    user_roles = frappe.get_roles(user)

    return has_projects_manager_role(roles=user_roles)


@frappe.whitelist()
def get_user_roles():
    return frappe.get_roles()


@frappe.whitelist()
def set_project_mode(project, mode):

    if not is_project_manager():
        return {"success": False, "message": "Unauthorized"}

    if mode not in ("Kanban", "Scrum"):
        return {"success": False, "message": "Invalid mode"}

    try:
        frappe.db.sql(
            "UPDATE `tabProject` SET custom_execution_mode = %s WHERE name = %s",
            (mode, project)
        )
        # if mode == "Kanban":
        #     frappe.db.sql(
        #         "UPDATE `tabTask` SET custom_cycle = NULL WHERE project = %s",
        #         (project,)
        #     )
        frappe.db.commit()
        return {"success": True, "message": f"Project mode set to {mode}"}
    except Exception as e:
        frappe.log_error(
            f"Failed to set project mode: {e}",
            "Set Project Mode Error",
        )
        return {"success": False, "message": str(e)}


@frappe.whitelist()
def list_projects(filters={}, limit=20, offset=0):
    Project = DocType("Project")
    Task = DocType("Task")
    ToDo = DocType("ToDo")
    ProjectUser = DocType("Project User")
    PortalUser = DocType("Portal User")

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

    query = (
        frappe.qb.from_(Project)
        .select(
            Project.name,
            Project.project_name,
            Project.project_type,
            Project.status,
            Project.percent_complete,
            Project.modified,
        )
        .distinct()
    )

    # Permission-based filtering
    if is_admin:
        # Administrators see all projects
        pass
    elif is_project_manager:
        # Projects Managers see projects they created, OR projects they're added to in Project User,
        # OR projects where they're assigned to any task
        query = query.where(
            (Project.owner == user) |
            (Project.name.isin(
                frappe.qb.from_(ProjectUser)
                .select(ProjectUser.parent)
                .where(ProjectUser.user == user)
            )) |
            (Project.name.isin(
                frappe.qb.from_(Task)
                .inner_join(ToDo).on(
                    (ToDo.reference_name == Task.name) &
                    (ToDo.reference_type == "Task") &
                    (ToDo.allocated_to == user)
                )
                .select(Task.project)
            ))
        )
    else:
        # Regular users see projects they belong to directly or through their customer portal access
        query = query.where(
            (Project.name.isin(
                frappe.qb.from_(ProjectUser)
                .select(ProjectUser.parent)
                .where(ProjectUser.user == user)
            )) |
            (Project.customer.isin(customer_portal_subquery))
        )

    # Apply filters
    for key, value in filters.items():
        if key == "status":
            query = query.where(Project.status == value)
        elif key == "project_type":
            query = query.where(Project.project_type == value)

    query = query.limit(limit).offset(offset).orderby(
        Project.modified, order=frappe.qb.desc)

    projects = query.run(as_dict=True)
    return projects


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

    ProjectPhase = DocType("Project Phase")

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
            Task.custom_phase,
            ProjectPhase.title.as_("phase_name"),
            Task.custom_reopen_count,
            Task.custom_review_cycles,
            Task.custom_last_reopened_on,
            fn.GroupConcat(ToDo.allocated_to).as_("assignee"),
        ).inner_join(Project).on(Project.name == Task.project)
        .left_join(ProjectPhase).on(ProjectPhase.name == Task.custom_phase)
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
        elif key == "custom_phase":
            query = query.where(Task.custom_phase == value)
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
def backlog_with_phases(project=None):
    if not project:
        return {"error": "Project parameter is required"}
    isScrum = frappe.db.get_value(
        "Project", project, "custom_execution_mode") == "Scrum"
    filters = {"project": project}
    Task = DocType("Task")
    ToDo = DocType("ToDo")
    active_phase = frappe.db.get_value(
        "Project Phase",
        {"project": project, "status": "Active"},
        ["name", "title", "start_date", "end_date", "status"],
        as_dict=True,
    )
    phases = frappe.qb.from_(DocType("Project Phase")).select(
        DocType("Project Phase").name,
        DocType("Project Phase").title,
        DocType("Project Phase").start_date,
        DocType("Project Phase").end_date,
        DocType("Project Phase").status,
        DocType("Project Phase").sequence,
    ).where(DocType("Project Phase").project == project).orderby(DocType("Project Phase").sequence, order=frappe.qb.asc).run(as_dict=True)

    # Calculate phase_progress for each phase
    for phase in phases:
        total_tasks = frappe.db.count(
            "Task",
            filters={"custom_phase": phase["name"], "project": project}
        )
        completed_tasks = frappe.db.count(
            "Task",
            filters={"custom_phase": phase["name"],
                     "project": project, "status": "Completed"}
        )
        phase["phase_progress"] = round(
            (completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0

    all_tasks = frappe.qb.from_(Task).select(
        Task.name.as_("id"),
        Task.name,
        Task.subject,
        Task.status,
        Task.type,
        Task.custom_cycle.as_("cycle"),
        Task.priority,
        Task.modified,
        Task.project,
        Task.custom_phase,
        fn.GroupConcat(ToDo.allocated_to).as_("assignee"),
    ).left_join(ToDo).on(
        (ToDo.reference_name == Task.name)
        & (ToDo.reference_type == "Task")
        & (ToDo.status == "Open")
    ).where(Task.project == project).groupby(Task.name).orderby(Task.modified, order=frappe.qb
                                                                .desc).run(as_dict=True)

    tasks_by_phases = {}
    cycles_by_phase = {}
    for phase in phases:
        phase_tasks = frappe.qb.from_(Task).select(
            Task.name.as_("id"),
            Task.name,
            Task.subject,
            Task.status,
            Task.type,
            Task.custom_cycle.as_("cycle"),
            Task.priority,
            Task.modified,
            Task.project,
            Task.custom_phase,
            fn.GroupConcat(ToDo.allocated_to).as_("assignee"),
        ).left_join(ToDo).on(
            (ToDo.reference_name == Task.name)
            & (ToDo.reference_type == "Task")
            & (ToDo.status == "Open")
        ).where(
            (Task.project == project) &
            (Task.custom_phase == phase["name"])
        ).groupby(Task.name).orderby(Task.modified, order=frappe.qb.desc).run(as_dict=True)
        phase_cycles = frappe.qb.from_(DocType("Cycle")).select(
            DocType("Cycle").name,
            DocType("Cycle").cycle_name,
            DocType("Cycle").start_date,
            DocType("Cycle").end_date,
            DocType("Cycle").status,
        ).where(
            (DocType("Cycle").project == project) &
            (DocType("Cycle").phase == phase["name"])
        ).orderby(DocType("Cycle").start_date, order=frappe.qb.asc).run(as_dict=True)
        cycles_by_phase[phase["name"]] = phase_cycles
        tasks_by_phases[phase["name"]] = {
            "phase": phase,
            "tasks": phase_tasks
        }

    cycles = frappe.qb.from_(DocType("Cycle")).select(
        DocType("Cycle").name,
        DocType("Cycle").cycle_name,
        DocType("Cycle").start_date,
        DocType("Cycle").end_date,
        DocType("Cycle").status,
    ).where(DocType("Cycle").project == project).orderby(DocType("Cycle").start_date, order=frappe.qb.asc).run(as_dict=True)
    active_cycle = next((c for c in cycles if c["status"] == "Active"), None)

    cycles_by_tasks = {}
    for task in all_tasks:
        cycle = task.get("cycle")
        if cycle:
            if cycle not in cycles_by_tasks:
                cycles_by_tasks[cycle] = []
            cycles_by_tasks[cycle].append(task)
    for phase_name, phase_cycles in cycles_by_phase.items():
        for cycle in phase_cycles:
            cycle["tasks"] = cycles_by_tasks.get(cycle["name"], [])
    return {
        "is_scrum": isScrum,
        "active_phase": active_phase,
        "phases": phases,
        "tasks_by_phases": tasks_by_phases,
        "cycles_by_phase": cycles_by_phase,
        "all_tasks": all_tasks,
        "cycles": cycles,
        "active_cycle_name": active_cycle["cycle_name"] if active_cycle else None,
        "cycles_by_tasks": cycles_by_tasks,
        "backlog_by_phase": {
            phase["name"]: [t for t in tasks_by_phases[phase["name"]]
                            ["tasks"] if (not t["cycle"] if isScrum else True) and t["status"] == "Open"]
            for phase in phases
        }

    }
    # open_tasks =


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

    # Fetch open tasks (backlog) not assigned to any cycle
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
                & (Task.status.isin(["Open"]))
            )
            .groupby(Task.name)
            .orderby(Task.modified, order=frappe.qb.desc)
            # Only return parent tasks (exclude subtasks)
            .where((Task.parent_task.isnull()))
            .run(as_dict=True)
        )
    else:
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
            # Only return parent tasks (exclude subtasks)
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
def get_watchers(doctype, docname):
    _ensure_document_read_access(doctype, docname)

    Watcher = DocType("Watcher")
    User = DocType("User")
    watchers = (
        frappe.qb.from_(Watcher)
        .select(
            Watcher.user,
            Watcher.parent,
            Watcher.parenttype,
            User.full_name,
            User.email,
            User.enabled,
            User.user_image
        )
        .left_join(User).on(User.name == Watcher.user)
        .where(
            (Watcher.parenttype == doctype)
            & (Watcher.parent == docname)
        )
        .run(as_dict=True)
    )
    return watchers


def watcher_exists(doctype, docname, user):
    existing_watcher = frappe.db.sql(
        """
        SELECT name FROM `tabWatcher`
        WHERE parent = %s AND parenttype = %s AND user = %s
        LIMIT 1
        """,
        (docname, doctype, user),
    )
    return existing_watcher


@frappe.whitelist()
def add_watcher(doctype, docname, user):
    try:
        _ensure_document_read_access(doctype, docname)
        existing_watcher = watcher_exists(doctype, docname, user)

        if existing_watcher:
            return {"success": False, "message": f"User {user} is already a watcher"}

        # Add watcher directly to child table
        frappe.get_doc({
            "doctype": "Watcher",
            "parent": docname,
            "parenttype": doctype,
            # "parentfield": "watcher",
            "user": user
        }).insert(ignore_permissions=True)

        # If doctype is Task, get the project and add user to project if not already there
        if doctype == "Task":
            task_doc = frappe.get_doc("Task", docname)
            project = task_doc.project

            if project:
                existing_project_user = frappe.db.get_value(
                    "Project User",
                    {"parent": project, "user": user}
                )

                if not existing_project_user:
                    frappe.get_doc({
                        "doctype": "Project User",
                        "parent": project,
                        "parenttype": "Project",
                        "parentfield": "users",
                        "user": user
                    }).insert()

        frappe.db.commit()

        if user is not frappe.session.user:
            send_notification(
                user=user,
                subject=f"Watcher Added",
                content=f"You have been added as a watcher to {doctype} '{docname}'.",
                document_type=doctype,
                document_name=docname,
                icons='<i class="fa fa-eye"></i>',
            )

        return {"success": True, "message": f"User {user} added as watcher to {doctype} {docname}"}
    except Exception as e:
        frappe.log_error(f"Error adding watcher: {e}", "Add Watcher Error")
        return {"success": False, "message": str(e)}


@frappe.whitelist()
def remove_watcher(doctype, docname, user):
    try:
        _ensure_document_read_access(doctype, docname)
        # Remove watcher directly from child table
        frappe.db.sql("""
            DELETE FROM `tabWatcher`
            WHERE parent = %s AND parenttype = %s AND user = %s
        """, (docname, doctype, user))

        frappe.db.commit()

        return {"success": True, "message": f"User {user} removed from watchers of {doctype} {docname}"}
    except Exception as e:
        frappe.log_error(
            f"Error removing watcher: {e}", "Remove Watcher Error")
        return {"success": False, "message": str(e)}


@frappe.whitelist()
def toggle_self_watch(doctype, docname):
    _ensure_document_read_access(doctype, docname)

    user = frappe.session.user
    existing_watcher = watcher_exists(doctype, docname, user)
    if existing_watcher:
        # Remove watcher
        return remove_watcher(doctype, docname, user)
    else:
        # Add watcher
        return add_watcher(doctype, docname, user)


@frappe.whitelist()
def current_user_is_watching(doctype, docname):
    _ensure_document_read_access(doctype, docname)

    user = frappe.session.user

    existing_watcher = frappe.db.get_value(
        "Watcher",
        {
            "parent": docname,
            "parenttype": doctype,
            "user": user
        }
    )

    return bool(existing_watcher)


@frappe.whitelist()
def recent_projects_with_activity_of_current_user(limit=5):
    user = frappe.session.user

    projects = frappe.db.sql(
        """
        SELECT DISTINCT p.name, p.project_name
        FROM `tabProject` p
        JOIN `tabTask` t ON t.project = p.name
        JOIN `tabToDo` td ON td.reference_name = t.name AND td.reference_type = 'Task' AND td.allocated_to = %s
        ORDER BY t.modified DESC
        LIMIT %s
        """,
        (user, limit),
        as_dict=True,
    )
    return projects


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


@frappe.whitelist()
def toggle_archive_project(project):
    try:
        # project_doc = frappe.get_doc("Project", project)
        current_status = frappe.db.get_value(
            "Project", project, "custom_is_archived") or 0
        new_status = 0 if current_status != 0 else 1
        frappe.db.sql(
            "UPDATE `tabProject` SET custom_is_archived = %s WHERE name = %s",
            (new_status, project)
        )
        frappe.db.commit()
        return {"success": True, "message": f"Project archived status toggled"}
    except Exception as e:
        frappe.log_error(
            f"Error toggling archive status: {e}", "Toggle Archive Error")
        return {"success": False, "message": str(e)}


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

    elif target_type == "phase":
        phase_name = target_id
        phase_title = "None"
        if phase_name:
            phase_doc = frappe.get_doc("Project Phase", phase_name)
            if phase_doc.project != project_doc.name:
                return {"success": False, "message": f"Phase '{phase_doc.title}' does not belong to project '{project_doc.project_name}'"}
            phase_title = phase_doc.title

        task_doc.custom_phase = phase_name
        task_doc.save()
        frappe.db.commit()
        return {"success": True, "message": f"Task '{task_doc.subject}' moved to phase '{phase_title}'"}

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


@frappe.whitelist()
def create_phases_for_project(project_name, phase_template_name):
    try:
        project_doc = frappe.get_doc("Project", project_name)
        if project_doc.custom_execution_mode != "Scrum":
            return {"success": False, "message": f"Project '{project_doc.project_name}' is not in Scrum mode"}

        template_doc = frappe.get_doc("Phase Template", phase_template_name)
        if not template_doc:
            return {"success": False, "message": f"Phase Template '{phase_template_name}' not found"}

        for phase in template_doc.phases:
            new_cycle = frappe.get_doc({
                "doctype": "Cycle",
                "cycle_name": phase.phase_name,
                "project": project_name,
                "start_date": phase.start_date,
                "end_date": phase.end_date,
                "status": "Planned"
            })
            new_cycle.insert()

        frappe.db.commit()
        return {"success": True, "message": f"Phases from template '{phase_template_name}' created for project '{project_doc.project_name}'"}
    except Exception as e:
        frappe.log_error(
            f"Error creating phases from template: {e}", "Create Phases Error")
        return {"success": False, "message": str(e)}
