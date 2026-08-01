# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ProjectActionRequest(Document):
    def validate(self):
        if not self.project:
            frappe.throw("Project is required.")

        if not self.title or not self.description:
            frappe.throw("Title and description are required.")

        if self.status not in {"Pending", "Completed", "Rejected", "Expired"}:
            frappe.throw("Invalid action request status.")

        if self.action_type not in {
            "Approval",
            "Document Submission",
            "Payment",
            "Feedback",
            "Signature",
        }:
            frappe.throw("Invalid action type.")

        if self.related_task:
            task_project = frappe.db.get_value("Task", self.related_task, "project")
            if task_project != self.project:
                frappe.throw("Related task must belong to the same project.")

        if self.blocking_task:
            task_project = frappe.db.get_value("Task", self.blocking_task, "project")
            if task_project != self.project:
                frappe.throw("Blocking task must belong to the same project.")

    def before_insert(self):
        if not self.status:
            self.status = "Pending"
