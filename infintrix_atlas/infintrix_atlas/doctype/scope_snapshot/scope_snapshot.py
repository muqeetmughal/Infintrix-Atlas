# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

from frappe.model.document import Document
import frappe


class ScopeSnapshot(Document):
    def before_insert(self):
        if self.version is None:
            self.version = self._get_next_version()
        if not self.snapshot_date:
            self.snapshot_date = frappe.utils.now_datetime()

    def validate(self):
        if not self.project:
            frappe.throw("Project is required")

        if self.version is None:
            frappe.throw("Version is required")

        if not self.snapshot_date:
            frappe.throw("Snapshot Date is required")

        if not self.requirements:
            frappe.throw(
                "At least one requirement must be added to the snapshot")

        requirement_ids = [row.requirement for row in self.requirements if row.requirement]
        if len(requirement_ids) != len(set(requirement_ids)):
            frappe.throw("Duplicate requirements found in snapshot")

        for row in self.requirements:
            requirement_project = frappe.db.get_value(
                "Requirement", row.requirement, "project"
            )
            if requirement_project != self.project:
                frappe.throw("All snapshot requirements must belong to the same project")

        if not self.is_new():
            previous = frappe.get_doc(self.doctype, self.name)
            immutable_fields = ("project", "version", "snapshot_date")
            if previous.docstatus == 1:
                for fieldname in immutable_fields:
                    if getattr(previous, fieldname) != getattr(self, fieldname):
                        frappe.throw("Submitted Scope Snapshots are immutable")
                previous_requirements = [row.requirement for row in previous.requirements]
                current_requirements = [row.requirement for row in self.requirements]
                if previous_requirements != current_requirements:
                    frappe.throw("Submitted Scope Snapshots are immutable")

    def _get_next_version(self):
        latest_version = frappe.db.sql(
            """
            SELECT MAX(version)
            FROM `tabScope Snapshot`
            WHERE project = %s
            """,
            self.project,
        )[0][0]
        if latest_version is None:
            return 1.0
        return round(float(latest_version) + 0.1, 1)
