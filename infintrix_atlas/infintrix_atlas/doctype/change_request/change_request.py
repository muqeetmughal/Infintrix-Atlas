# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ChangeRequest(Document):
    def validate(self):
        if not self.project:
            frappe.throw("Project is required.")

        if not self.title or not self.description:
            frappe.throw("Title and description are required.")

        allowed_statuses = {
            "Draft",
            "Under Review",
            "Approved",
            "Rejected",
            "Implemented",
        }
        if self.status and self.status not in allowed_statuses:
            frappe.throw("Invalid change request status.")

        if self.related_requirement:
            requirement_project = frappe.db.get_value(
                "Requirement", self.related_requirement, "project"
            )
            if requirement_project != self.project:
                frappe.throw("Related requirement must belong to the same project.")

        for fieldname in ("impact_hours", "impact_cost", "impact_days"):
            value = float(getattr(self, fieldname) or 0)
            if value < 0:
                frappe.throw(f"{fieldname.replace('_', ' ').title()} cannot be negative.")

        if self.status in {"Approved", "Implemented"} and not self.requested_by:
            frappe.throw("Requested By is required before approval.")

    def before_insert(self):
        if not self.status:
            self.status = "Draft"
        if not self.requested_by:
            self.requested_by = frappe.session.user
        if not self.request_date:
            self.request_date = frappe.utils.now_datetime()
