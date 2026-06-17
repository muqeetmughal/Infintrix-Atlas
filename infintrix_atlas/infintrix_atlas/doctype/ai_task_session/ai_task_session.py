# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class AITaskSession(Document):
    def validate(self):
        if not self.project:
            frappe.throw("Project is required.")
        if self.execution_mode not in {"Scrum", "Kanban"}:
            frappe.throw("Execution mode must be Scrum or Kanban.")
