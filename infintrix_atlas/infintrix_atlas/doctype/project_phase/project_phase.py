# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
import frappe


class ProjectPhase(Document):

    def validate(self):
        """Main validation entry point"""
        self.validate_sequence_order()
        self.validate_active_status()
        self.validate_completion_status()
        self.validate_status_change()
        # self.validate_phase_dates()
        self.validate_duplicate_sequence()
        self.validate_project_exists()
        self.validate_status_value()

    def validate_project_exists(self):
        """Check if project exists"""
        if not self.project:
            frappe.throw("Project is required.")

        if not frappe.db.exists("Project", self.project):
            frappe.throw(f"Project '{self.project}' does not exist.")

    def validate_status_value(self):
        """Validate status is one of allowed values"""
        allowed_statuses = ["Active", "Completed", "Planned", "Cancelled"]
        if self.status and self.status not in allowed_statuses:
            frappe.throw(
                f"Status must be one of: {', '.join(allowed_statuses)}")

    def validate_active_status(self):
        """Check if status is Active and project is set"""
        if self.status != "Active" or not self.project:
            return

        # Ensure only one active phase per project
        active_count = frappe.db.count(
            "Project Phase",
            {
                "project": self.project,
                "status": "Active",
                "name": ["!=", self.name],
            },
        )

        if active_count > 0:
            frappe.throw(
                "There can be only one Active Project Phase per project.")

    def validate_sequence_order(self):
        """Check that previous phase is completed before activating"""
        if self.status != "Active" or not self.project or not self.sequence:
            return

        previous_phase = frappe.db.get_value(
            "Project Phase",
            {"project": self.project, "sequence": self.sequence - 1},
            "status"
        )

        if previous_phase and previous_phase != "Completed":
            frappe.throw(
                "Previous phase must be Completed before activating this phase.")

    def validate_duplicate_sequence(self):
        """Check that sequence is unique per project"""
        if not self.project or not self.sequence:
            return

        existing = frappe.db.exists(
            "Project Phase",
            {"project": self.project, "sequence": self.sequence,
             "name": ["!=", self.name]}
        )

        if existing:
            frappe.throw(
                f"Sequence {self.sequence} already exists for this project.")

    def validate_phase_dates(self):
        """Validate phase dates are logical"""
        if self.start_date and self.end_date:
            if self.end_date < self.start_date:
                frappe.throw("End date cannot be before start date.")

        if self.status == "Completed" and not self.end_date:
            frappe.throw("End date is required for completed phases.")

    def validate_completion_status(self):
        """Check no open tasks when marking phase as completed"""
        if self.status != "Completed":
            return

        open_tasks = frappe.db.count(
            "Task",
            {"custom_phase": self.name, "status": ["!=", "Completed"]}
        )

        if open_tasks > 0:
            frappe.throw("Cannot complete phase with open tasks.")

    def validate_status_change(self):
        """Prevent status change if phase is already completed"""
        if not self.name:
            return

        current_status = frappe.db.get_value(
            "Project Phase", self.name, "status")

        if current_status == "Completed" and self.status != "Completed":
            frappe.throw("Cannot change status of a completed phase.")

    def before_insert(self):
        """Set default sequence and title"""
        self._set_sequence()
        self._set_title()

    def _set_sequence(self):
        """Assign sequence number if not provided"""
        if not self.sequence and self.project:
            max_sequence = frappe.db.get_value(
                "Project Phase",
                {"project": self.project},
                "MAX(sequence)"
            ) or 0
            self.sequence = max_sequence + 1

    def _set_title(self):
        """Set default title if not provided"""
        if not self.title and self.sequence:
            self.title = f"Phase {self.sequence}"

    def set_defaults(self):
        """Set default dates based on status"""
        if self.status == "Active" and not self.start_date:
            self.start_date = frappe.utils.today()

        if self.status == "Completed" and not self.end_date:
            self.end_date = frappe.utils.today()

    def before_save(self):
        """Set default dates based on status"""
        self.set_defaults()
