
import frappe
from infintrix_atlas.utils import is_frappe_version


def check_app_permission():
	if frappe.session.user == "Administrator":
		return True

	allowed_modules = []

	if is_frappe_version("15"):
		allowed_modules = frappe.config.get_modules_from_all_apps_for_user()
	elif is_frappe_version("16", above=True):
		allowed_modules = frappe.utils.modules.get_modules_from_all_apps_for_user()

	allowed_modules = [x["module_name"] for x in allowed_modules]
	if "FCRM" not in allowed_modules:
		return False

	roles = frappe.get_roles()
	if any(role in ["System Manager", "Sales User", "Sales Manager"] for role in roles):
		return True

	return False
