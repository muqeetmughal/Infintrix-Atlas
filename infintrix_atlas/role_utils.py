import frappe


PROJECT_MANAGER_ROLES = ("Projects Manager", "Project Manager")
ATLAS_ACCESS_ROLES = ("System Manager", "Projects User", *PROJECT_MANAGER_ROLES)


def has_projects_manager_role(user=None, roles=None):
    current_roles = roles or frappe.get_roles(user or frappe.session.user)
    return "Administrator" in current_roles or any(
        role in current_roles for role in PROJECT_MANAGER_ROLES
    )


def get_customer_portal_customers(user=None):
    current_user = user or frappe.session.user
    if current_user == "Administrator":
        return None

    return frappe.get_all(
        "Portal User",
        filters={
            "parenttype": "Customer",
            "parentfield": "portal_users",
            "user": current_user,
        },
        pluck="parent",
    )


def has_customer_portal_access(project=None, user=None):
    if not project:
        return False

    current_user = user or frappe.session.user
    if current_user == "Administrator":
        return True

    customer = frappe.db.get_value("Project", project, "customer")
    if not customer:
        return False

    portal_customers = get_customer_portal_customers(current_user) or []
    return customer in portal_customers


def has_customer_portal_task_access(task=None, user=None):
    if not task:
        return False

    project = frappe.db.get_value("Task", task, "project")
    if not project:
        return False

    return has_customer_portal_access(project=project, user=user)
