import frappe
from infintrix_atlas.role_utils import (
    get_customer_portal_customers,
    has_customer_portal_access,
    has_projects_manager_role,
)


def project_permission_query(user):
    # 1. Full access users
    if user == "Administrator":
        return ""

    user_roles = frappe.get_roles(user)

    # System Manager: see everything
    if "System Manager" in user_roles:
        return ""

    escaped_user = frappe.db.escape(user)
    portal_customers = get_customer_portal_customers(user) or []
    customer_condition = ""
    if portal_customers:
        escaped_customers = ", ".join(frappe.db.escape(customer) for customer in portal_customers)
        customer_condition = f"""
            OR `tabProject`.customer IN ({escaped_customers})
        """

    # 2. Projects Manager logic
    if has_projects_manager_role(roles=user_roles):
        return f"""
				(
					`tabProject`.owner = {escaped_user}
					OR `tabProject`.name IN (
						SELECT parent
						FROM `tabProject User`
						WHERE user = {escaped_user}
					)
				)
			"""

    # 3. Regular Project User
    return f"""
        (
            `tabProject`.name IN (
                SELECT parent
                FROM `tabProject User`
                WHERE user = {escaped_user}
            )
            {customer_condition}
        )
    """


def task_permission_query(user):
        if user == "Administrator":
            return ""

        roles = frappe.get_roles(user)

        if "System Manager" in roles:
            return ""

        escaped_user = frappe.db.escape(user)
        portal_customers = get_customer_portal_customers(user) or []
        customer_condition = ""
        if portal_customers:
            escaped_customers = ", ".join(frappe.db.escape(customer) for customer in portal_customers)
            customer_condition = f"""
                    OR `tabTask`.project IN (
                        SELECT name
                        FROM `tabProject`
                        WHERE customer IN ({escaped_customers})
                    )
                """

        # Projects Manager logic
        if has_projects_manager_role(roles=roles):
            return f"""
                    (
                        `tabTask`.owner = {escaped_user}
                        OR `tabTask`.project IN (
                            SELECT parent
                            FROM `tabProject User`
                            WHERE user = {escaped_user}
                        )
                    )
                """
        
        # Regular Project User - see only tasks from projects where user is in Project User child table
        return f"""
                (
                `tabTask`.project IN (
                    SELECT parent
                    FROM `tabProject User`
                    WHERE user = {escaped_user}
                )
                {customer_condition}
                )
            """


def _project_linked_permission_query(user, table, project_field="project"):
    if user == "Administrator":
        return ""

    roles = frappe.get_roles(user)

    if "System Manager" in roles:
        return ""

    escaped_user = frappe.db.escape(user)
    portal_customers = get_customer_portal_customers(user) or []
    customer_condition = ""
    if portal_customers:
        escaped_customers = ", ".join(
            frappe.db.escape(customer) for customer in portal_customers
        )
        customer_condition = f"""
            OR `tab{table}`.{project_field} IN (
                SELECT name
                FROM `tabProject`
                WHERE customer IN ({escaped_customers})
            )
        """

    if has_projects_manager_role(roles=roles):
        return f"""
            (
                `tab{table}`.{project_field} IN (
                    SELECT name
                    FROM `tabProject`
                    WHERE owner = {escaped_user}
                )
                OR `tab{table}`.{project_field} IN (
                    SELECT parent
                    FROM `tabProject User`
                    WHERE user = {escaped_user}
                )
                {customer_condition}
            )
        """

    return f"""
        (
            `tab{table}`.{project_field} IN (
                SELECT parent
                FROM `tabProject User`
                WHERE user = {escaped_user}
            )
            {customer_condition}
        )
    """


def _project_linked_has_permission(doc, user, project_field="project"):
    if user == "Administrator":
        return True

    roles = frappe.get_roles(user)
    if "System Manager" in roles:
        return True

    project = getattr(doc, project_field, None)
    if not project:
        return False

    if frappe.db.get_value("Project", project, "owner") == user:
        return True

    if frappe.db.exists("Project User", {"parent": project, "user": user}):
        return True

    return has_customer_portal_access(project=project, user=user)


def requirement_permission_query(user):
    return _project_linked_permission_query(user, "Requirement")


def requirement_has_permission(doc, user):
    return _project_linked_has_permission(doc, user)


def scope_snapshot_permission_query(user):
    return _project_linked_permission_query(user, "Scope Snapshot")


def scope_snapshot_has_permission(doc, user):
    return _project_linked_has_permission(doc, user)


def change_request_permission_query(user):
    return _project_linked_permission_query(user, "Change Request")


def change_request_has_permission(doc, user):
    return _project_linked_has_permission(doc, user)


def project_resource_permission_query(user):
    return _project_linked_permission_query(user, "Project Resource")


def project_resource_has_permission(doc, user):
    return _project_linked_has_permission(doc, user)


def project_action_request_permission_query(user):
    return _project_linked_permission_query(user, "Project Action Request")


def project_action_request_has_permission(doc, user):
    return _project_linked_has_permission(doc, user)


def project_phase_permission_query(user):
    return _project_linked_permission_query(user, "Project Phase")


def project_phase_has_permission(doc, user):
    return _project_linked_has_permission(doc, user)


def cycle_permission_query(user):
    return _project_linked_permission_query(user, "Cycle")


def cycle_has_permission(doc, user):
    return _project_linked_has_permission(doc, user)

def fathom_meeting_permission_query_conditions(user):
    if user == "Administrator":
        return ""

    roles = frappe.get_roles(user)

    if "System Manager" in roles:
        return ""

    escaped_user = frappe.db.escape(user)

    # Only show meetings where user is the owner or is in the attendees child table
    account_condition = f"""
        `tabFathom Meeting`.account IN (
            SELECT name
            FROM `tabFathom Account`
            WHERE user = {escaped_user}
        )
    """
    
    docshare_condition = f"""
        `tabFathom Meeting`.name IN (
            SELECT share_name
            FROM `tabDocShare`
            WHERE share_doctype = 'Fathom Meeting'
            AND user = {escaped_user}
        )
    """
    
    return f"({account_condition} OR {docshare_condition})"
    
def fathom_meeting_has_permission(doc, user):
    if user == "Administrator":
        return True

    roles = frappe.get_roles(user)

    if "System Manager" in roles:
        return True

    # Check if meeting belongs to current user's account
    accounts = frappe.get_all("Fathom Account", filters={"user": user}, fields=["name"])
    account_names = [acc.name for acc in accounts]
    
    if doc.account in account_names:
        return True
    
    # Check if meeting is shared with current user
    shared_with = frappe.get_all(
        "DocShare",
        filters={
            "share_doctype": "Fathom Meeting",
            "share_name": doc.name,
            "user": user,
            "read": 1,
        }
    )
    
    return len(shared_with) > 0



def fathom_account_permission_query_conditions(user):
    if user == "Administrator":
        return ""

    roles = frappe.get_roles(user)

    if "System Manager" in roles:
        return ""

    escaped_user = frappe.db.escape(user)

    # Only show accounts where user is the owner
    return f"`tabFathom Account`.user = {escaped_user}"



def fathom_account_has_permission(doc, user):
    if user == "Administrator":
        return True

    roles = frappe.get_roles(user)

    if "System Manager" in roles:
        return True

    # Only allow access if user is the owner of the account
    return doc.user == user
