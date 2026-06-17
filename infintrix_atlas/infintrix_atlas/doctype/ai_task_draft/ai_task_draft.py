# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class AITaskDraft(Document):
    def validate(self):
        if not self.project:
            frappe.throw("Project is required.")
        if not self.subject:
            frappe.throw("Subject is required.")
        if self.status and self.status not in {"Draft", "Validated", "Rejected", "Created"}:
            frappe.throw("Invalid AI Task Draft status.")
