import frappe


def validate_task_hierarchy(doc, method):
    print("Validating task hierarchy...", doc, method)

    if not doc.parent_task or not doc.task_type:
        return

    parent = frappe.get_doc("Task", doc.parent_task)

    if not parent.type:
        return

    parent_type = frappe.get_doc("Task Type", parent.type)
    child_type = frappe.get_doc("Task Type", doc.type)

    # Parent must be a container
    if not parent_type.is_container:
        frappe.throw(f"{parent_type.name} cannot have child tasks")

    # Validate allowed child types
    allowed = [d.task_type for d in parent_type.allowed_child_types]

    if allowed and child_type.name not in allowed:
        frappe.throw(f"{child_type.name} cannot be child of {parent_type.name}")


def before_task_save(doc, method):
    print("Before saving task...", doc, method)

    is_container = frappe.db.get_value(
        "Task Type",
        doc.type,
        "custom_is_container"
    )

    doc.is_group = 1 if is_container else 0
