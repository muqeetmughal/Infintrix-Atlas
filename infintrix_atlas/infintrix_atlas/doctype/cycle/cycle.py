# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Cycle(Document):


	def project_abbreviation(self):
		if self.project:
			project = frappe.get_doc("Project", self.project)
			return project.project_name
		return ""


	def before_insert(self):
		self.cycle_name = f"{self.project_abbreviation()} - {frappe.db.count('Cycle', {'project': self.project}) + 1}"



	def validate(self):
		if self.status not in ["Planned", "Active", "Completed", "Archived"]:
			frappe.throw("Status must be one of: Planned, Active, Completed, Archived")
		if self.status == "Active" and (not self.start_date or not self.end_date):
			frappe.throw("Cycle cannot be active without start and end date")
		if self.start_date and self.end_date and self.start_date > self.end_date:
			frappe.throw("End date cannot be before start date")
			
		if self.project:
			active_cycle = frappe.db.get_value(
				"Cycle",
				{
					"project": self.project,
					"status": "Active",
					"name": ["!=", self.name],
				},
				"name",
			)
			if active_cycle and self.status == "Active":
				frappe.throw(f"Project already has an active cycle: {active_cycle}")
		if self.project:
			project = frappe.get_doc("Project", self.project)
			if project.custom_execution_mode != "Scrum":
				frappe.throw("Cycles can only be created for projects with Scrum execution mode")
				

		# if self.status == "Completed" and not self.actual_end_date:
		# 	frappe.throw("Please set actual end date before marking cycle as completed")

	def on_update(self):
		# If cycle is marked completed, set actual end date if not set
		if self.status == "Completed" and not self.actual_end_date:
			self.actual_end_date = frappe.utils.now()
			self.save()

	def on_trash(self):
		# Prevent deletion of active cycles
		if self.is_active:
			frappe.throw("Cannot delete an active cycle")
		if self.status == "Completed":
			frappe.throw("Cannot delete a completed cycle")


	@property
	def is_active(self):
		return self.status == "Active"

