# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Requirement(Document):
    def validate(self):
        if not self.project:
            frappe.throw("Project is required.")

        if not frappe.db.exists("Project", self.project):
            frappe.throw(f"Project '{self.project}' does not exist.")

        if not self.title:
            frappe.throw("Title is required.")

        allowed_statuses = {"Draft", "Approved", "Rejected", "Implemented"}
        if self.status and self.status not in allowed_statuses:
            frappe.throw(
                f"Status must be one of: {', '.join(sorted(allowed_statuses))}"
            )

        if self.status == "Implemented":
            linked_task_count = frappe.db.count(
                "Task",
                {"project": self.project, "custom_requirement": self.name},
            )
            if linked_task_count == 0:
                frappe.throw(
                    "Requirement cannot be marked Implemented until at least one Task links to it."
                )

    def before_insert(self):
        if not self.status:
            self.status = "Draft"
