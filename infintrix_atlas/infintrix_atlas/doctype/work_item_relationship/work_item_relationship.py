# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class WorkItemRelationship(Document):
	def validate(self):
		if not self.source_doctype or not self.source_name:
			frappe.throw("Source document is required.")
		if not self.target_doctype or not self.target_name:
			frappe.throw("Target document is required.")
		if self.source_doctype == self.target_doctype and self.source_name == self.target_name:
			frappe.throw("A work item cannot relate to itself.")

		existing = frappe.db.exists(
			"Work Item Relationship",
			{
				"source_doctype": self.source_doctype,
				"source_name": self.source_name,
				"target_doctype": self.target_doctype,
				"target_name": self.target_name,
				"relation_type": self.relation_type,
				"name": ["!=", self.name],
			},
		)
		if existing:
			frappe.throw("This relationship already exists.")

	def after_insert(self):
		if self.relation_type == "Blocks":
			if frappe.db.exists(
				"Work Item Relationship",
				{
					"source_doctype": self.target_doctype,
					"source_name": self.target_name,
					"target_doctype": self.source_doctype,
					"target_name": self.source_name,
					"relation_type": "Is Blocked By",
				},
			):
				return
			frappe.get_doc({
				"doctype": "Work Item Relationship",
				"source_doctype": self.target_doctype,
				"source_name": self.target_name,
				"relation_type": "Is Blocked By",
				"target_doctype": self.source_doctype,
				"target_name": self.source_name,
				"is_reverse": 1
			}).insert(ignore_permissions=True)
