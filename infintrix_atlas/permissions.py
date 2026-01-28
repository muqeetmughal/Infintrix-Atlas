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
    # 1. Full access
    # return ""
    if user == "Administrator":
        return ""

    roles = frappe.get_roles(user)

    # System User → full access
    if "System User" in roles:
        return ""

    escaped_user = frappe.db.escape(user)

    # Project Manager logic
    if "Project Manager" in roles:
        return f"""
            (
                `tabTask`.owner = {escaped_user}

                OR `tabTask`.name IN (
                    SELECT reference_name
                    FROM `tabToDo`
                    WHERE
                        reference_type = 'Task'
                        AND allocated_to = {escaped_user}
                )

                OR `tabTask`.project IN (
                    SELECT p.name
                    FROM `tabProject` p
                    WHERE
                        p.owner = {escaped_user}
                        OR p.name IN (
                            SELECT parent
                            FROM `tabProject User`
                            WHERE user = {escaped_user}
                        )
                )
            )
        """

    # Regular Project User
    return f"""
        (
            `tabTask`.name IN (
                SELECT reference_name
                FROM `tabToDo`
                WHERE
                    reference_type = 'Task'
                    AND allocated_to = {escaped_user}
            )

            OR `tabTask`.project IN (
                SELECT parent
                FROM `tabProject User`
                WHERE user = {escaped_user}
            )
        )
    """
