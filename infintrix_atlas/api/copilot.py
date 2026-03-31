# copilot/api.py
import frappe
from frappe.utils import now

@frappe.whitelist(allow_guest=False)
def get_or_create_session(reference_doctype,reference_name ):
    """
    Usage:
    /api/method/copilot.api.v1.get_or_create_session?reference_doctype=Task&reference_name=TASK-0001
    """

    if not reference_doctype or not reference_name:
        frappe.throw("reference_doctype and reference_name are required")

    # Try to find an active session
    session = frappe.get_all(
        "Copilot Session",
        filters={
            "reference_doctype": reference_doctype,
            "reference_name": reference_name,
            "status": "Active"
        },
        limit_page_length=1,
        order_by="creation desc"
    )

    if session:
        return frappe.get_doc("Copilot Session", session[0].name).as_dict()

    # Not found → create new session
    new_session = frappe.get_doc({
        "title" : f"Copilot - {reference_doctype} {reference_name}",
        "doctype": "Copilot Session",
        "reference_doctype": reference_doctype,
        "reference_name": reference_name,
        "started_by": frappe.session.user,
        "status": "Active",
        "started_on": now()
    })
    new_session.insert(ignore_permissions=True)
    frappe.db.commit()

    return new_session.as_dict()