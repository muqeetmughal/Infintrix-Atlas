import frappe
from frappe.query_builder import DocType
from datetime import datetime, timedelta
import json

from infintrix_atlas.role_utils import has_projects_manager_role
from infintrix_atlas.permissions import project_permission_query, task_permission_query
from infintrix_atlas.api.utils import send_notification


@frappe.whitelist()
def get_project_flow_metrics(project):
    """
    Returns execution efficiency (%) and backlog health label
    for a project.

    Output:
    {
        "efficiency": int (0-100),
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


def is_project_manager():
    user = frappe.session.user
    user_roles = frappe.get_roles(user)

    return has_projects_manager_role(roles=user_roles)


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
