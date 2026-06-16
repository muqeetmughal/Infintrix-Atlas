# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Watcher(Document):
    def validate(self):
        if not self.user:
            frappe.throw("User is required.")

        if not self.parent or not self.parenttype:
            frappe.throw("Watcher must belong to a parent document.")

        if self.notify_mode and self.notify_mode not in {"Instant", "Batch", "AI Summary"}:
            frappe.throw("Invalid notify mode.")

        existing = frappe.db.exists(
            "Watcher",
            {
                "parent": self.parent,
                "parenttype": self.parenttype,
                "user": self.user,
                "name": ["!=", self.name],
            },
        )
        if existing:
            frappe.throw("This user is already watching the document.")

    def before_insert(self):
        if not self.notify_mode:
            self.notify_mode = "Instant"
