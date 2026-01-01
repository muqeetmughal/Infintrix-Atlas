# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class WorkItemRelationship(Document):
	def after_insert(self):
		if self.relation_type == "Blocks":
			frappe.get_doc({
				"doctype": "Work Item Relationship",
				"source_doctype": self.target_doctype,
				"source_name": self.target_name,
				"relation_type": "Is Blocked By",
				"target_doctype": self.source_doctype,
				"target_name": self.source_name,
				"is_reverse": 1
			}).insert(ignore_permissions=True)
