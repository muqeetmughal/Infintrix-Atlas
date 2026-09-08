import frappe
from frappe import _


def _ensure_document_read_access(doctype, docname):
    if doctype == "Task":
        if not frappe.has_permission("Task", "read", doc=frappe.get_doc("Task", docname)):
            frappe.throw(_("Not permitted"), frappe.PermissionError)
        return

    if not frappe.has_permission(doctype, "read", doc=frappe.get_doc(doctype, docname)):
        frappe.throw(_("Not permitted"), frappe.PermissionError)


def _ensure_project_access(project, require_write=False, allow_customer_portal=False):
    if not project:
        frappe.throw(_("Project is required"))

    from infintrix_atlas.role_utils import (
        has_customer_portal_access as has_customer_portal_project_access,
    )

    if allow_customer_portal and has_customer_portal_project_access(project):
        return

    permission_type = "write" if require_write else "read"
    if not frappe.has_permission("Project", permission_type, project):
        frappe.throw(_("Not permitted"), frappe.PermissionError)
