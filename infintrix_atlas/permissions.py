import frappe


def project_permission_query(user):
    # 1. Full access users
    if user == "Administrator":
        return ""

    user_roles = frappe.get_roles(user)

    # System User: see everything
    if "System User" in user_roles:
        return ""

    escaped_user = frappe.db.escape(user)

    # 2. Project Manager logic
    if "Project Manager" in user_roles:
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
        `tabProject`.name IN (
            SELECT parent
            FROM `tabProject User`
            WHERE user = {escaped_user}
        )
    """


def task_permission_query(user):
        if user == "Administrator":
            return ""

        roles = frappe.get_roles(user)

        if "System User" in roles:
            return ""

        escaped_user = frappe.db.escape(user)

        # Project Manager logic
        if "Project Manager" in roles:
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
                `tabTask`.project IN (
                    SELECT parent
                    FROM `tabProject User`
                    WHERE user = {escaped_user}
                )
            """

def fathom_meeting_permission_query_conditions(user):
    if user == "Administrator":
        return ""

    roles = frappe.get_roles(user)

    if "System User" in roles:
        return ""

    escaped_user = frappe.db.escape(user)
    
    # return ""
    
    print(f"Building permission query for user: {user}, escaped_user: {escaped_user}")

    # # Only show meetings where user is the owner or is in the attendees child table
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

    if "System User" in roles:
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

    if "System User" in roles:
        return ""

    escaped_user = frappe.db.escape(user)

    # Only show accounts where user is the owner
    return f"`tabFathom Account`.user = {escaped_user}"



def fathom_account_has_permission(doc, user):
    if user == "Administrator":
        return True

    roles = frappe.get_roles(user)

    if "System User" in roles:
        return True

    # Only allow access if user is the owner of the account
    return doc.user == user