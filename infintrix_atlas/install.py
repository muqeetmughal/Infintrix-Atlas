import frappe
from frappe import _


def after_install():
    Task = frappe.qb.DocType("Task")

    # Find affected projects /tasks without custom_phase
    rows = (
        frappe.qb.from_(Task)
        .select(Task.project)
        .where((Task.project.isnotnull()) & (Task.project != "") & (Task.custom_phase.isnull()))
        .groupby(Task.project)
        .run(as_dict=True)
    )
    projects = [r.get("project") for r in rows if r.get("project")]
    if not projects:
        return

    for project in projects:
        # Create a default phase only if project has none
        phase_name = frappe.db.get_value(
            "Project Phase",
            {"project": project},
            "name",
            order_by="creation desc",
        )
        if not phase_name:
            phase_doc = frappe.get_doc(
                {
                    "doctype": "Project Phase",
                    "project": project,
                    "status": "Planned",
                    "title": _("Default Phase"),
                }
            )
            phase_doc.insert(ignore_permissions=True)
            phase_name = phase_doc.name

        # Assign all tasks missing custom_phase for this project
        frappe.db.sql(
            """
            UPDATE `tabTask`
            SET custom_phase = %(phase)s
            WHERE project = %(project)s
              AND (custom_phase IS NULL OR custom_phase = '')
            """,
            {"phase": phase_name, "project": project},
        )

    frappe.db.commit()

