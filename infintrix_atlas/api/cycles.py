import frappe


@frappe.whitelist()
def list_project_cycles(project):
    cycles = frappe.get_all(
        "Cycle",
        filters={"project": project},
        fields=["name", "cycle_name", "status", "start_date", "end_date", "actual_end_date"],
        order_by="start_date desc, creation desc",
    )
    if not cycles:
        return cycles

    counts = frappe.db.sql(
        """
        SELECT custom_cycle,
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed
        FROM `tabTask`
        WHERE project = %s AND custom_cycle IS NOT NULL
        GROUP BY custom_cycle
        """,
        (project,),
        as_dict=True,
    )
    counts_by_cycle = {c.custom_cycle: c for c in counts}

    for cycle in cycles:
        c = counts_by_cycle.get(cycle.name)
        cycle["total_tasks"] = c.total if c else 0
        cycle["completed_tasks"] = c.completed if c else 0

    return cycles


@frappe.whitelist()
def start_cycle(name, cycle_name=None, duration=None, start_date=None, end_date=None):
    cycle = frappe.get_doc("Cycle", name)
    project_cycle_belongs_to = cycle.project

    if cycle.status != "Planned":
        return {"success": False, "message": f"Cycle '{cycle.cycle_name}' is already {cycle.status.lower()}.", "code": "not_planned"}

    active_cycles = frappe.get_all(
        "Cycle",
        filters={
            "status": "Active",
            "project": project_cycle_belongs_to,
            "name": ["!=", name],
        },
        fields=["name", "cycle_name"],
    )

    if active_cycles:
        active = active_cycles[0]
        return {
            "success": False,
            "message": f"Another cycle '{active.get('cycle_name') or active['name']}' is already active.",
            "code": "another_active",
            "active_cycle": active["name"],
        }

    if not start_date or not end_date:
        return {
            "success": False,
            "message": "Please provide start and end dates before starting the cycle.",
            "code": "dates_required",
        }

    cycle.start_date = start_date
    cycle.end_date = end_date
    if cycle_name:
        cycle.cycle_name = cycle_name
    cycle.status = "Active"
    cycle.save()
    frappe.db.commit()

    return {"success": True, "message": f"Cycle {cycle.cycle_name} started successfully"}


@frappe.whitelist()
def complete_cycle(name, move_tasks_to=None):
    cycle = frappe.get_doc("Cycle", name)
    if cycle.status != "Active":
        return {"success": False, "message": "Only active cycles can be completed", "code": "not_active"}

    open_tasks = frappe.get_all(
        "Task",
        filters={
            "custom_cycle": name,
            "status": ["in", ["Open", "Working", "Pending Review", "Blocked"]],
        },
        fields=["name"],
    )

    if open_tasks:
        for t in open_tasks:
            task_doc = frappe.get_doc("Task", t.name)
            task_doc.custom_cycle = move_tasks_to or None
            task_doc.save()

    cycle.status = "Completed"
    cycle.actual_end_date = frappe.utils.nowdate()
    cycle.save()
    frappe.db.commit()

    return {"success": True, "message": f"Cycle {name} completed successfully"}
