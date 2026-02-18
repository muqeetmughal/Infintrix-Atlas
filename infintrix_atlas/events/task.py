import frappe


def validate_task_hierarchy(doc, method):
    print("Validating task hierarchy...", doc, method)

    if not doc.parent_task or not doc.type:
        return

    parent = frappe.get_doc("Task", doc.parent_task)

    if not parent.type:
        return
    
    # Check if project has active cycles
    if doc.project:
        active_cycle = frappe.db.get_value(
            "Cycle",
            doc.project,
            "custom_active_cycle"
        )
        if active_cycle and doc.custom_cycle and doc.custom_cycle != active_cycle:
            frappe.throw(f"Cannot change cycle while project has active cycle: {active_cycle}")

    parent_type = frappe.get_doc("Task Type", parent.type)
    child_type = frappe.get_doc("Task Type", doc.type)

    # Parent must be a container
    if not parent_type.custom_is_container:
        frappe.throw(f"{parent_type.name} cannot have child tasks")

    # Validate allowed child types
    allowed = [d.task_type for d in parent_type.custom_allowed_child_types] if parent_type.custom_allowed_child_types else []

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
    
    # Store old status if it has changed (for notification in after_save)
    if doc.has_value_changed("status") and not doc.is_new():
        doc._old_status = doc.get_doc_before_save().get("status") if doc.get_doc_before_save() else None


def after_task_save(doc, method):
    """
    Hook that triggers after a Task document is saved.
    Sends notification to assigned users if status has changed.
    """
    # Check if status was changed (stored in before_save)
    if hasattr(doc, "_old_status") and doc._old_status is not None:
        old_status = doc._old_status
        new_status = doc.status
        
        # Only notify if status actually changed
        if old_status != new_status:
            try:
                # Call the whitelisted function using frappe.call
                frappe.call(
                    "infintrix_atlas.api.v1.notify_status_changed",
                    task_name=doc.name,
                    old_status=old_status,
                    new_status=new_status
                )
            except Exception as e:
                frappe.log_error(f"Failed to notify status change for task {doc.name}: {e}", "Task Status Notification Hook Error")