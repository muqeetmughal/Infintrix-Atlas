import frappe

def create_custom_notification(user, subject, content, document_type=None, document_name=None, icons=None):
    """
    Creates a Notification Log entry for a specific user.

    :param user: The recipient username (e.g., 'administrator@example.com').
    :param subject: The notification subject/title.
    :param content: The main message content (HTML is accepted).
    :param document_type: Optional, the DocType related to the notification.
    :param document_name: Optional, the name of the document related to the notification.
    :param icons: Optional, icon HTML (e.g., '<i class="fa fa-info"></i>').
    """
    try:
        # Create a new Notification Log document
        doc = frappe.get_doc({
            "doctype": "Notification Log",
            "for_user": user,
            "subject": subject,
            "email_content": content,  # Use email_content for the main message
            "type": "Alert",  # Other types: Mention, System Notification, etc.
            "document_type": document_type,
            "document_name": document_name,
            "read": 0,  # Set as unread
            # "icons": icons,
            # Additional fields can be set as needed
        })
        
        # Insert the document into the database
        doc.insert(ignore_permissions=True)
        
        # Optional: Publish a real-time event to show the notification immediately in the UI
        # This makes the notification pop up in the user's desk view
        frappe.publish_realtime(
            event='update_system_notifications',
            user=user,
            after_commit=True,
            message={"subject": subject, "content": content}
        )
        
        frappe.db.commit() # Commit the transaction

    except Exception as e:
        frappe.log_error(f"Failed to create notification for {user}: {e}", "Notification Creation Error")

