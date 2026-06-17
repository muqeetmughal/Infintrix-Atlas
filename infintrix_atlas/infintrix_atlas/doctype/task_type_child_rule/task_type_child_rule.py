# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class TaskTypeChildRule(Document):
    def validate(self):
        if not self.task_type:
            frappe.throw("Task type is required.")
