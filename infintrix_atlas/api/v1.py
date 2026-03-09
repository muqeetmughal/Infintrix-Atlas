from frappe import _
import frappe
from frappe.query_builder import DocType, functions as fn
from datetime import datetime, timedelta
import json
from frappe.utils import user
from infintrix_atlas.permissions import project_permission_query, task_permission_query
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
        fields=["status", "custom_cycle as cucle", "modified", "creation"],
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
            "status": ["in", ["Open", "Working", "Pending Review"]],
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
    task_activities = frappe.get_all(
        "Task",
        filters={
            "docstatus": ["<", 2],
            "project": ["in", project_names],
        },
        fields=[
            "'Task' as type",
            "name as doc_name",
            "subject as title",
            "status as detail",
            "owner as user",
            "modified as timestamp",
        ],
    )

    # ---- Project Activities ----
    project_activities_raw = frappe.get_all(
        "Project",
        filters={
            "docstatus": ["<", 2],
            "name": ["in", project_names],
        },
        fields=[
            "'Project' as type",
            "name as doc_name",
            "project_name as title",
            "status",
            "owner as user",
            "modified as timestamp",
        ],
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

    activities = task_activities + project_activities
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
    """
    Global search for Tasks and Projects
    """
    results = []

    if not query or len(query) < 2:
        # Return last 5 from all if query is empty
        tasks = frappe.get_all(
            "Task",
            fields=["name", "subject", "project"],
            order_by="modified desc",
            limit=5,
            filters={"project": ["!=", ""]},
        )

        projects = frappe.get_all(
            "Project",
            fields=["name", "project_name"],
            order_by="modified desc",
            limit=5,
        )
        cycles = frappe.get_all(
            "Cycle",
            fields=["name", "cycle_name", "project"],
            order_by="modified desc",
            limit=5,
        )

        for task in tasks:
            print(f"Checking permissions for task '{task.project}'")
            if frappe.has_permission("Task", "read", task.name):
                results.append(
                    {
                        "type": "Task",
                        "name": task.name,
                        "title": task.subject,
                        "route": f"/tasks/kanban?project={task.project}&selected_task={task.name}",
                    }
                )

        for project in projects:
            if frappe.has_permission("Project", "read", project.name):
                results.append(
                    {
                        "type": "Project",
                        "name": project.name,
                        "title": project.project_name,
                        "route": f"/tasks/kanban?project={project.name}",
                    }
                )

        for cycle in cycles:
            project_name = frappe.db.get_value(
                "Project", cycle.project, "project_name") or cycle.project
            if frappe.has_permission("Cycle", "read", cycle.name):
                results.append(
                    {
                        "type": "Cycle",
                        "name": cycle.name,
                        "title": f"{cycle.cycle_name} (Project: {project_name})",
                        "route": f"/tasks/backlog?project={cycle.project}",
                    }
                )

        return results

    # ---- TASKS ----
    tasks = frappe.get_all(
        "Task",
        filters=[
            ["subject", "like", f"%{query}%"],
        ],
        fields=["name", "subject", "project"],
        order_by="modified desc",
        limit=limit,
    )

    print(f"Found {len(tasks)} tasks matching query '{query}'")

    for task in tasks:
        if frappe.has_permission("Task", "read", task.name):
            results.append(
                {
                    "type": "Task",
                    "name": task.name,
                    "title": task.subject,
                    "route": f"/tasks/kanban?project={task.project}&selected_task={task.name}",
                }
            )

    # ---- PROJECTS ----
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
    print(f"Found {len(projects)} projects matching query '{query}'")

    for project in projects:
        print(f"Checking permissions for project '{project.project_name}'")
        if frappe.has_permission("Project", "read", project.name):
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

    print(f"Found {len(cycles)} cycles matching query '{query}'")
    for cycle in cycles:
        project_name = frappe.db.get_value(
            "Project", cycle.project, "project_name") or cycle.project
        if frappe.has_permission("Cycle", "read", cycle.name):
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

    def get_children(parent):
        filters = {"parent_task": parent}
        if project:
            filters["project"] = project

        children = frappe.get_all(
            "Task",
            filters=filters,
            fields=["name", "subject", "status", "priority"],
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
        fields=["name", "subject", "status", "priority"],
    )

    for root in roots:
        print("task:", root)
        root["children"] = get_children(root["name"])

    return roots


@frappe.whitelist()
def get_task_activity(task):
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
def get_customer_portal_data(project=None):
    print(f"Fetching customer portal data for project: {project}")
    project_doc = frappe.get_doc("Project", project)
    print(f"Project found: {project_doc.project_name}")
    over_all_status = "On Track"  # This could be calculated based on project metrics

    if project_doc.status == "Open":
        over_all_status = "On Track"
    elif project_doc.status == "Completed":
        over_all_status = "Completed"
    else:
        over_all_status = "At Risk"

    percent_complete = project_doc.percent_complete or 0
    active_cycle = frappe.db.get_value(
        "Cycle",
        {"project": project, "status": "Active"},
        ["cycle_name as title", "start_date", "end_date"],
        as_dict=True,
    )

    next_milestone_date = frappe.db.sql(
        """
        SELECT end_date FROM `tabCycle`
        WHERE project = %s AND end_date > CURDATE()
        ORDER BY end_date ASC
        LIMIT 1
        """,
        (project,),
        as_dict=True,
    )

    # print(f"Active cycle: {active_cycle}")
    # print(f"Next milestone date: {next_milestone_date}")

    cycles = frappe.get_all(
        "Cycle",
        filters={"project": project},
        fields=["name as id", "name", "cycle_name as title",
                "start_date", "end_date", "status"],
        order_by="start_date asc",
    )

    data = {
        "summary": {
            "project_name": project_doc.project_name,
            "overall_status": over_all_status,
            "percent_complete": percent_complete,
            "days_to_milestone": 14,
            "project_mode": project_doc.custom_execution_mode or "Kanban",
            "active_cycle": active_cycle,
            "next_milestone_date": next_milestone_date[0]["end_date"] if next_milestone_date else None,
        },
        "cycles": cycles,
        "cycles2": [
            {
                "id": "C1",
                "title": "Discovery & UX",
                "start_date": "2024-01-01",
                "end_date": "2024-02-15",
                "status": "Completed",
                "deliverables": ["Architecture Doc", "User Flow Maps"],
                "completion": 100,
            },
            {
                "id": "C2",
                "title": "Visual Design",
                "start_date": "2024-02-16",
                "end_date": "2024-04-30",
                "status": "Completed",
                "deliverables": ["Hi-Fi Prototypes", "Brand Guidelines"],
                "completion": 100,
            },
            {
                "id": "C3",
                "title": "Core Integration",
                "start_date": "2024-05-01",
                "end_date": "2024-05-30",
                "status": "Active",
                "deliverables": ["Stripe Connect API", "KYC Module"],
                "completion": 45,
            },
            {
                "id": "C4",
                "title": "UAT & Scaling",
                "start_date": "2024-06-01",
                "end_date": "2024-07-01",
                "status": "Planned",
                "deliverables": ["Security Audit", "Beta Launch"],
                "completion": 0,
            },
        ],
        "pendingActions": [
            {
                "id": "ACT-001",
                "title": "Approve Design Prototype (v2.4)",
                "type": "Approval",
                "due_date": "2024-05-18",
                "status": "Pending",
                "priority": "High",
            },
            {
                "id": "ACT-002",
                "title": "Submit Bank API Documentation",
                "type": "Requirement Submission",
                "due_date": "2024-05-20",
                "status": "Pending",
                "priority": "Medium",
            },
        ],
        "requirements": [
            {
                "id": "REQ-1",
                "title": "Auth Specification",
                "submitted_on": "2024-04-10",
                "status": "Approved",
                "owner": "Alex Rivera",
            },
            {
                "id": "REQ-2",
                "title": "KYC Flow Prototype",
                "submitted_on": "2024-05-02",
                "status": "In Review",
                "owner": "Jane Doe",
            },
            {
                "id": "REQ-3",
                "title": "Performance Benchmarks",
                "submitted_on": "2024-05-12",
                "status": "Submitted",
                "owner": "Alex Rivera",
            },
            {
                "id": "REQ-4",
                "title": "Mobile UI Kit",
                "submitted_on": "2024-05-14",
                "status": "Approved",
                "owner": "Jane Doe",
            },
        ],
        "progress": {
            "completed": 45,
            "in_progress": 12,
            "pending": 8,
        },
        "financials": {
            "total_budget": 185000,
            "total_invoiced": 125000,
            "paid": 110000,
            "last_invoice_date": "2024-05-01",
        },
        "team": [
            {
                "id": "T-1",
                "name": "Sarah Chen",
                "role": "Account Manager",
                "avatar": "SC",
                "color": "#f56a00",
                "email": "sarah@erp.io",
            },
            {
                "id": "T-2",
                "name": "Mike Ross",
                "role": "Lead Engineer",
                "avatar": "MR",
                "color": "#87d068",
                "email": "mike@erp.io",
            },
            {
                "id": "T-3",
                "name": "Jane Doe",
                "role": "UI Designer",
                "avatar": "JD",
                "color": "#1677ff",
                "email": "jane@erp.io",
            },
        ],
        "resources": [
            {
                "id": "RES-1",
                "title": "Brand Identity Guidelines",
                "type": "PDF",
                "size": "4.2 MB",
                "date": "2024-02-10",
            },
            {
                "id": "RES-2",
                "title": "Project Kickoff Notes",
                "type": "Doc",
                "size": "124 KB",
                "date": "2024-01-05",
            },
            {
                "id": "RES-3",
                "title": "API Security Baseline",
                "type": "PDF",
                "size": "1.8 MB",
                "date": "2024-04-22",
            },
        ],
    }
    return data


@frappe.whitelist()
def set_project_mode(project, mode):
    if mode not in ("Kanban", "Scrum"):
        return {"success": False, "message": "Invalid mode"}

    try:
        frappe.db.sql(
            "UPDATE `tabProject` SET custom_execution_mode = %s WHERE name = %s",
            (mode, project)
        )
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

    user = frappe.session.user
    user_roles = frappe.get_roles(user)
    is_admin = "Administrator" in user_roles
    is_project_manager = "Project Manager" in user_roles

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
        # Project Managers see projects they created OR projects where they're assigned to any task
        query = query.where(
            (Project.owner == user) |
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
        # Regular users see only projects they're added to in Project User
        query = query.inner_join(ProjectUser).on(
            (ProjectUser.parent == Project.name) &
            (ProjectUser.user == user)
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
def list_tasks(project, group_by=None, filters={}, limit=20, offset=0):

    project_execution_mode = frappe.db.get_value(
        "Project", project, "custom_execution_mode") or "Kanban"

    filters = {"project": project}
    filters.update(filters)
    if project_execution_mode == "Scrum":
        active_cycle = frappe.db.get_value(
            "Cycle",
            {"project": project, "status": "Active"},
            "name"
        )
        filters.update({"custom_cycle": active_cycle})

    Task = DocType("Task")
    ToDo = DocType("ToDo")

    ProjectUser = DocType("Project User")

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
            fn.GroupConcat(ToDo.allocated_to).as_("assignee"),
        )
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
    is_project_manager = "Project Manager" in user_roles

    if not is_admin:
        if is_project_manager:
            # Project Manager sees only projects they created
            query = query.inner_join(frappe.qb.DocType("Project")).on(
                frappe.qb.DocType("Project").name == Task.project
            ).where(frappe.qb.DocType("Project").owner == user)
        else:
            # Project User sees projects they're assigned to
            query = query.inner_join(ProjectUser).on(
                (ProjectUser.parent == Task.project)
                & (ProjectUser.user == user)
            )

    query = query.limit(limit).offset(offset)
    query = query.groupby(Task.name).orderby(
        Task.modified, order=frappe.qb.desc)

    tasks = query.run(as_dict=True)

    # Apply filters
    for key, value in filters.items():
        if key == "project":
            query = query.where(Task.project == value)
        elif key == "custom_cycle":
            query = query.where(Task.custom_cycle == value)
        elif key == "status":
            query = query.where(Task.status == value)

    query = query.groupby(Task.name).orderby(
        Task.modified, order=frappe.qb.desc)

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
def get_watchers(doctype, docname):
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

    <p>{data.get("description","")}</p>

    <h3>Task Details</h3>
    <ul>
        <li><strong>Task Type:</strong> {data.get("task_type","")}</li>
        <li><strong>Priority:</strong> {data.get("priority","")}</li>
        <li><strong>Complexity:</strong> {data.get("complexity","")}</li>
        <li><strong>Estimated Effort:</strong> {data.get("estimated_effort","")}</li>
        <li><strong>Estimated Hours:</strong> {data.get("estimated_hours","")}</li>
        <li><strong>Execution Order:</strong> {data.get("execution_order","")}</li>
        <li><strong>Suggested Role:</strong> {data.get("suggested_role","")}</li>
        <li><strong>Risk Level:</strong> {data.get("risk_level","")}</li>
        <li><strong>Automatable:</strong> {"Yes" if data.get("automatable") else "No"}</li>
    </ul>

    <h3>Reason</h3>
    <p>{data.get("reason","")}</p>

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