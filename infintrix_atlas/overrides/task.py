# your_app/overrides/task.py

import frappe
# from erpnext.doctype.task.task import Task
from erpnext.projects.doctype.task.task import Task

class TaskOverride(Task):

    def has_permission(self, permission_type=None, user=None):
        user = user or frappe.session.user

        # Admin
        if user == "Administrator":
            return True

        roles = frappe.get_roles(user)

        # System User
        if "System User" in roles:
            return True

        # Owner
        if self.owner == user:
            return True

        # Assigned via ToDo
        if frappe.db.exists(
            "ToDo",
            {
                "reference_type": "Task",
                "reference_name": self.name,
                "allocated_to": user
            }
        ):
            return True

        # Project-based access
        if self.project:
            # Project owner
            if frappe.db.get_value("Project", self.project, "owner") == user:
                return True

            # Project User child table
            if frappe.db.exists(
                "Project User",
                {
                    "parent": self.project,
                    "user": user
                }
            ):
                return True

        return False
