import frappe
from frappe.query_builder import DocType

from infintrix_atlas.api.utils import send_notification
from infintrix_atlas.api.access import _ensure_document_read_access


@frappe.whitelist()
def get_watchers(doctype, docname):
    _ensure_document_read_access(doctype, docname)

    Watcher = DocType("Watcher")
    User = DocType("User")
    watchers = (
        frappe.qb.from_(Watcher)
        .select(
            Watcher.user,
            Watcher.parent,
            Watcher.parenttype,
            User.full_name,
            User.email,
            User.enabled,
            User.user_image
        )
        .left_join(User).on(User.name == Watcher.user)
        .where(
            (Watcher.parenttype == doctype)
            & (Watcher.parent == docname)
        )
        .run(as_dict=True)
    )
    return watchers


def watcher_exists(doctype, docname, user):
    existing_watcher = frappe.db.sql(
        """
        SELECT name FROM `tabWatcher`
        WHERE parent = %s AND parenttype = %s AND user = %s
        LIMIT 1
        """,
        (docname, doctype, user),
    )
    return existing_watcher


@frappe.whitelist()
def add_watcher(doctype, docname, user):
    try:
        _ensure_document_read_access(doctype, docname)
        existing_watcher = watcher_exists(doctype, docname, user)

        if existing_watcher:
            return {"success": False, "message": f"User {user} is already a watcher"}

        # Add watcher directly to child table
        parentfield = None
        for df in frappe.get_meta(doctype).get_table_fields():
            if df.options == "Watcher":
                parentfield = df.fieldname
                break
        if not parentfield:
            return {"success": False, "message": f"No Watcher child table found on {doctype}"}

        frappe.get_doc({
            "doctype": "Watcher",
            "parent": docname,
            "parenttype": doctype,
            "parentfield": parentfield,
            "user": user
        }).insert(ignore_permissions=True)

        # If doctype is Task, get the project and add user to project if not already there
        if doctype == "Task":
            task_doc = frappe.get_doc("Task", docname)
            project = task_doc.project

            if project:
                existing_project_user = frappe.db.get_value(
                    "Project User",
                    {"parent": project, "user": user}
                )

                if not existing_project_user:
                    frappe.get_doc({
                        "doctype": "Project User",
                        "parent": project,
                        "parenttype": "Project",
                        "parentfield": "users",
                        "user": user
                    }).insert()

        frappe.db.commit()

        if user is not frappe.session.user:
            send_notification(
                user=user,
                subject=f"Watcher Added",
                content=f"You have been added as a watcher to {doctype} '{docname}'.",
                document_type=doctype,
                document_name=docname,
                icons='<i class="fa fa-eye"></i>',
            )

        return {"success": True, "message": f"User {user} added as watcher to {doctype} {docname}"}
    except Exception as e:
        frappe.log_error(f"Error adding watcher: {e}", "Add Watcher Error")
        return {"success": False, "message": str(e)}


@frappe.whitelist()
def remove_watcher(doctype, docname, user):
    try:
        _ensure_document_read_access(doctype, docname)
        # Remove watcher directly from child table
        frappe.db.sql("""
            DELETE FROM `tabWatcher`
            WHERE parent = %s AND parenttype = %s AND user = %s
        """, (docname, doctype, user))

        frappe.db.commit()

        return {"success": True, "message": f"User {user} removed from watchers of {doctype} {docname}"}
    except Exception as e:
        frappe.log_error(
            f"Error removing watcher: {e}", "Remove Watcher Error")
        return {"success": False, "message": str(e)}


@frappe.whitelist()
def toggle_self_watch(doctype, docname):
    _ensure_document_read_access(doctype, docname)

    user = frappe.session.user
    existing_watcher = watcher_exists(doctype, docname, user)
    if existing_watcher:
        # Remove watcher
        return remove_watcher(doctype, docname, user)
    else:
        # Add watcher
        return add_watcher(doctype, docname, user)


@frappe.whitelist()
def current_user_is_watching(doctype, docname):
    _ensure_document_read_access(doctype, docname)

    user = frappe.session.user

    existing_watcher = frappe.db.get_value(
        "Watcher",
        {
            "parent": docname,
            "parenttype": doctype,
            "user": user
        }
    )

    return bool(existing_watcher)
