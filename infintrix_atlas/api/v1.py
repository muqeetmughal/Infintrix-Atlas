import frappe
from frappe.query_builder import DocType, functions as fn
from datetime import datetime, timedelta
import json
from infintrix_atlas.permissions import project_permission_query, task_permission_query
from .utils import create_custom_notification


@frappe.whitelist()
def get_tasks():
    project = frappe.request.args.get("project")

    print("Fetching tasks for project:", project)
    Task = DocType("Task")
    ToDo = DocType("ToDo")

    # Step 1: Fetch all tasks
    if project != "null" and project:
        tasks = (
            frappe.qb.from_(Task)
            .select(
                Task.name.as_("id"),
                Task.name,
                Task.subject.as_("title"),
                Task.type,
                Task.priority,
                Task.status,
                Task.project,
                Task.modified,
            )
            .where(Task.project == project)
            .orderby(Task.modified, order=frappe.qb.desc)
            .run(as_dict=True)
        )
    else:
        tasks = (
            frappe.qb.from_(Task)
            .select(
                Task.name.as_("id"),
                Task.name,
                Task.subject.as_("title"),
                Task.type,
                Task.priority,
                Task.status,
                Task.project,
                Task.modified,
                Task.custom_cycle.as_("cycle"),
            )
            .where(Task.project.isnull())
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
            (ToDo.reference_type == "Task")
            & (ToDo.reference_name.isin(task_names))
            & (ToDo.status != "Cancelled")
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
        task["project_name"] = (
            frappe.db.get_value("Project", task.get("project"), "project_name")
            if task.get("project")
            else None
        )

    return tasks


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


@frappe.whitelist()  # Adjust permissions as needed
def switch_assignee_of_task(task_name, new_assignee):
    # task_name = frappe.request.args.get("task")
    # new_assignee = frappe.request.args.get("assignee")
    if not task_name:
        frappe.throw("Task is required")

    task_doc = frappe.get_doc("Task", task_name)

    if new_assignee == "unassigned":
        new_assignee = None
    elif new_assignee == "auto":
        new_assignee = frappe.session.user

    # Get existing assignee
    existing_todo = frappe.db.get_value(
        "ToDo",
        {
            "reference_type": "Task",
            "reference_name": task_name,
            "status": ["!=", "Cancelled"],
        },
        "name",
    )

    existing_assignee = None
    if existing_todo:
        existing_assignee = frappe.db.get_value("ToDo", existing_todo, "allocated_to")

    # Return early if assignee hasn't changed
    if existing_assignee == new_assignee:
        return {"success": True, "message": "No changes made"}

    # Close existing assignee
    if existing_todo:
        frappe.db.set_value("ToDo", existing_todo, "status", "Closed")

    # Create new todo for new assignee only if not unassigned
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
        create_custom_notification(
            user=new_assignee,
            subject=f"Task Assigned: {task_doc.subject}",
            content=f"You have been assigned to task '<b>{task_doc.subject}</b>'.",
            document_type="Task",
            document_name=task_name,
            icons='<i class="fa fa-tasks"></i>',
        )

    frappe.db.commit()
    return {"success": True, "message": "Assignee updated"}


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
def query_tasks(payload=None):
    if isinstance(payload, str):
        payload = json.loads(payload or "{}")

    filters = payload.get("filters", {})
    search = payload.get("search")
    group_by = payload.get("group_by")
    tree = payload.get("tree", False)
    page = int(payload.get("page", 1))
    page_size = int(payload.get("page_size", 20))
    order_by = payload.get("order_by", "t.modified desc")

    offset = (page - 1) * page_size

    conditions = []
    values = []

    # Client → DB field mapping
    field_map = {
        "id": "t.name",
        "name": "t.name",
        "subject": "t.subject",
        "priority": "t.priority",
        "status": "t.status",
        "cycle": "t.custom_cycle",
        "project": "t.project",
        "assignee": "a.owner",
    }

    # -------------------------------
    # Filters
    # -------------------------------
    for key, val in (filters or {}).items():
        col = field_map.get(key, f"t.{key}")

        if isinstance(val, list) and val[0].lower() == "in":
            placeholders = ", ".join(["%s"] * len(val[1]))
            conditions.append(f"{col} IN ({placeholders})")
            values.extend(val[1])
        else:
            conditions.append(f"{col} = %s")
            values.append(val)

    # -------------------------------
    # Search
    # -------------------------------
    if search:
        conditions.append("(t.name LIKE %s OR t.subject LIKE %s)")
        values.extend([f"%{search}%", f"%{search}%"])

    # -------------------------------
    # Tree mode (top level only)
    # -------------------------------
    if tree:
        conditions.append("t.parent_task IS NULL")

    where_clause = " AND ".join(conditions)
    if where_clause:
        where_clause = "WHERE " + where_clause

    # -------------------------------
    # Grouping
    # -------------------------------
    if group_by:
        group_col = field_map.get(group_by, f"t.{group_by}")
        group_clause = f"GROUP BY {group_col}"
    else:
        # Critical: always group by task so aggregates don’t collapse rows
        group_clause = "GROUP BY t.name"

    # -------------------------------
    # SQL
    # -------------------------------
    sql = f"""
        SELECT
            t.name AS id,
            t.subject,
            t.priority,
            t.status,
            t.custom_cycle AS cycle,
            t.project,
            p.project_name,
            COUNT(DISTINCT c.name) AS subtask_count,
            GROUP_CONCAT(DISTINCT u.full_name ORDER BY u.full_name SEPARATOR ', ') AS assignees

        FROM `tabTask` t

        LEFT JOIN `tabTask` c ON c.parent_task = t.name
        LEFT JOIN `tabProject` p ON p.name = t.project
        LEFT JOIN `tabToDo` a ON a.reference_name = t.name
        LEFT JOIN `tabUser` u ON u.name = a.owner

        {where_clause}
        {group_clause}
        ORDER BY {order_by}
        LIMIT %s OFFSET %s
    """

    values.extend([page_size, offset])

    data = frappe.db.sql(sql, values, as_dict=True)

    # -------------------------------
    # Load children for tree mode
    # -------------------------------
    if tree and data:
        parents = [d["id"] for d in data]

        children = frappe.db.sql(
            """
            SELECT
                name AS id,
                subject,
                parent_task
            FROM `tabTask`
            WHERE parent_task IN %s
            """,
            [parents],
            as_dict=True,
        )

        children_map = {}
        for c in children:
            children_map.setdefault(c["parent_task"], []).append(c)

        for row in data:
            row["children"] = children_map.get(row["id"], [])

    return {
        "data": data,
        "page": page,
        "page_size": page_size,
        "has_more": len(data) == page_size,
        "total": frappe.db.count("Task", filters),
    }


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
            "recent_activities": [{"text": "No recent activities found", "time_display": ""}]
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
        """.format(task_where=task_where),
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

    # -----------------------------
    # PROJECTS LIST (visible to the user)
    # -----------------------------
    projects_list = []
    for p in projects:
        try:
            pct = int(p.get("percent_complete") or 0)
        except Exception:
            try:
                pct = round(float(p.get("percent_complete") or 0))
            except Exception:
                pct = 0

        projects_list.append({
            "name": p.get("name"),
            "project_name": p.get("project_name") or p.get("name"),
            "project_type": p.get("project_type") or "",
            "status": p.get("status") or "",
            "percent_complete": pct,
        })

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
        project_activities.append({
            "type": p.type,
            "doc_name": p.doc_name,
            "title": p.title,
            "detail": f"Status: {p.status}",
            "user": p.user,
            "timestamp": p.timestamp,
        })

    activities = task_activities + project_activities
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    activity_data = activities[:activity_limit]

    from frappe.utils import pretty_date

    recent_activities = []
    for d in activity_data:
        user_full_name = frappe.db.get_value("User", d["user"], "full_name") or d["user"]
        text = f"{user_full_name} updated {d['type']}: {d['title']} ({d['detail']})"

        recent_activities.append({
            "text": text,
            "time_display": pretty_date(d["timestamp"]),
            "timestamp": str(d["timestamp"]),
            "type": d["type"],
            "doc_name": d["doc_name"]
        })

    if not recent_activities:
        recent_activities = [{"text": "No recent activities found", "time_display": ""}]

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
        create_custom_notification(
            user=user,
            subject=f"Removed from Project: {project_name}",
            content=f"You have been removed from project '{project_name}'.",
            document_type="Project",
            document_name=project,
            icons='<i class="fa fa-exclamation-triangle"></i>',
        )

    for user in added_users:
        create_custom_notification(
            user=user,
            subject=f"Added to Project: {project_name}",
            content=f"You have been added to project '{project_name}'.",
            document_type="Project",
            document_name=project,
            icons='<i class="fa fa-check-circle"></i>',
        )

    return {"success": True, "message": "Project users updated"}


import frappe


@frappe.whitelist()
def global_search(query: str, limit: int = 10):
    """
    Global search for Tasks and Projects
    """
    if not query or len(query) < 2:
        return []

    query = f"%{query}%"
    results = []

    # ---- TASKS ----
    tasks = frappe.db.sql(
        """
        SELECT
            name,
            subject
        FROM `tabTask`
        WHERE
            docstatus < 2
            AND (
                name LIKE %(query)s
                OR subject LIKE %(query)s
            )
        ORDER BY modified DESC
        LIMIT %(limit)s
        """,
        {"query": query, "limit": limit},
        as_dict=True,
    )

    for task in tasks:
        if frappe.has_permission("Task", "read", task.name):
            results.append(
                {
                    "type": "Task",
                    "name": task.name,
                    "title": task.subject,
                    "route": f"/app/task/{task.name}",
                }
            )

    # ---- PROJECTS ----
    projects = frappe.db.sql(
        """
        SELECT
            name,
            project_name
        FROM `tabProject`
        WHERE
            docstatus < 2
            AND (
                name LIKE %(query)s
                OR project_name LIKE %(query)s
            )
        ORDER BY modified DESC
        LIMIT %(limit)s
        """,
        {"query": query, "limit": limit},
        as_dict=True,
    )

    for project in projects:
        if frappe.has_permission("Project", "read", project.name):
            results.append(
                {
                    "type": "Project",
                    "name": project.name,
                    "title": project.project_name,
                    "route": f"/app/project/{project.name}",
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
		s["user"] for s in sessions if s["lastupdate"] and s["lastupdate"] > online_threshold
	]

	return online_users