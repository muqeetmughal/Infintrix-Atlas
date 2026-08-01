import frappe
from frappe import _
from infintrix_atlas.role_utils import has_projects_manager_role


def after_insert(doc, method):
    pass


def validate(doc, method):
    if not doc.is_new():
        doc.copy_from_template()
    doc.update_costing()
    doc.update_percent_complete()
    doc.validate_from_to_dates("expected_start_date", "expected_end_date")
    doc.validate_from_to_dates("actual_start_date", "actual_end_date")

    if doc.has_value_changed("custom_execution_mode"):
        user_roles = frappe.get_roles()
        if not has_projects_manager_role(roles=user_roles):
            frappe.throw(
                _("Only Projects Manager can change the Execution Mode.")
            )


def before_insert(doc, method):
    if not doc.users:
        doc.append("users", {"user": doc.owner, "welcome_email_sent": 0})

# def add_creator_to_users(doc, method):
#     print("Adding creator to project users...", doc, method)
#     if not doc.users:
#         doc.append("users", {"user": doc.owner})
