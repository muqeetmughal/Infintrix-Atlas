import frappe


def execute():
    # task_detail Desk page was removed; the Task form view replaces it.
    if frappe.db.exists("Page", "task_detail"):
        frappe.delete_doc("Page", "task_detail", force=True, ignore_permissions=True)
