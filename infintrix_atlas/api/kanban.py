import frappe


@frappe.whitelist()
def get_project_kanban(project):
    """Ensure a Task Kanban Board exists for the project and return its name."""
    from infintrix_atlas.events.project import create_task_kanban_board

    return create_task_kanban_board(project)


@frappe.whitelist()
def get_kanban_boards(doctype):
    """Override of frappe's get_kanban_boards.

    If no Task Kanban Board exists for the doctype, create one automatically
    so the Kanban view never renders an empty board list.
    """
    if doctype == "Task":
        from infintrix_atlas.events.project import create_task_kanban_board

        create_task_kanban_board(None)

    return frappe.get_list(
        "Kanban Board",
        fields=["name", "filters", "reference_doctype", "private"],
        filters={"reference_doctype": doctype},
    )
