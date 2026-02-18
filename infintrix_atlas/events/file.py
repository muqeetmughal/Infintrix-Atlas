import frappe
from .utils import create_custom_notification

def on_file_insert(doc, method):
    """
    Send notification to task assignee when a file is attached to a task.
    """
    # Check if the file is attached to a Task
    if doc.attached_to_doctype != "Task":
        return

    task_name = doc.attached_to_name
    if not task_name:
        return

    try:
        # Get the task document
        task_doc = frappe.get_doc("Task", task_name)
        
        # Get the assignee of the task
        assignee = frappe.db.get_value(
            "ToDo",
            {
                "reference_type": "Task",
                "reference_name": task_name,
                "status": ["!=", "Cancelled"],
            },
            "allocated_to"
        )

        # If there's an assignee, send them a notification
        if assignee:
            create_custom_notification(
                user=assignee,
                subject=f"File attached to task: {task_doc.subject}",
                content=f"A new file '<b>{doc.file_name}</b>' has been attached to task '<b>{task_doc.subject}</b>'.",
                document_type="Task",
                document_name=task_name,
                icons='<i class="fa fa-paperclip"></i>',
            )
    except Exception as e:
        frappe.log_error(f"Failed to send attachment notification: {e}", "Attachment Notification Error")
