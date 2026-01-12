import frappe
from frappe.query_builder import DocType, functions as fn
from datetime import datetime, timedelta


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

    if not task_name or not new_assignee:
        frappe.throw("Task and assignee are required")

    # Update existing assignee or create new one
    existing_todo = frappe.db.get_value(
        "ToDo",
        {
            "reference_type": "Task",
            "reference_name": task_name,
            "status": ["!=", "Cancelled"],
        },
        "name",
    )

    if existing_todo:
        frappe.db.set_value("ToDo", existing_todo, "allocated_to", new_assignee)
    else:
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
def start_cycle(cycle_name, duration, start_date, end_date):
    cycle = frappe.get_doc("Cycle", cycle_name)

    if cycle.status != "Planned":
        frappe.throw("Only planned cycles can be started")
    
    active_cycles = frappe.get_all(
        "Cycle",
        filters={"status": "Active", "name": ["!=", cycle_name]},
        fields=["name"]
    )
    
    if active_cycles:
        frappe.throw(f"Cannot start cycle. Another cycle '{active_cycles[0].name}' is already active.")
    
    if not start_date:
        cycle.start_date = frappe.utils.nowdate()
    else:
        cycle.start_date = start_date
    
    if not end_date:
        frappe.throw("Please set an end date before starting the cycle")
    else:
        cycle.end_date = end_date
    
    cycle.status = "Active"
    cycle.save()
    frappe.db.commit()
    
    return {"success": True, "message": f"Cycle {cycle_name} started successfully"}


def complete_cycle(cycle_name):
    cycle = frappe.get_doc("Cycle", cycle_name)

    if cycle.status != "Active":
        frappe.throw("Only active cycles can be completed")
    
    cycle.status = "Completed"
    cycle.actual_end_date = frappe.utils.nowdate()
    cycle.save()
    frappe.db.commit()
    
    return {"success": True, "message": f"Cycle {cycle_name} completed successfully"}