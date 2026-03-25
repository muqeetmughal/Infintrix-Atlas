# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
import re
import frappe


class ScopeSnapshot(Document):

    def before_save(self):
        if not self.name:
            self.name = f"{self.project}-{self.version}"

    def validate(self):
        # Ensure project is set
        if not self.project:
            frappe.throw("Project is required")

        # Ensure version follows semantic versioning (v1.0, v1.1, etc)
        if not self.version or not self._is_valid_version():
            frappe.throw("Version must follow format: v1.0, v1.1, v1.2, etc")

        # Ensure snapshot_date is set
        if not self.snapshot_date:
            frappe.throw("Snapshot Date is required")

        # Ensure at least one requirement exists
        if not self.requirements:
            frappe.throw(
                "At least one requirement must be added to the snapshot")

        # Check for duplicate requirement IDs within this snapshot
        req_ids = [row.requirement_id for row in self.requirements]
        if len(req_ids) != len(set(req_ids)):
            frappe.throw("Duplicate requirement IDs found in snapshot")

    def _is_valid_version(self):
        pattern = r'^v\d+\.\d+$'
        return re.match(pattern, self.version) is not None
