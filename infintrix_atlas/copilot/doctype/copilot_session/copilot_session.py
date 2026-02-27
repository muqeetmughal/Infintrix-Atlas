# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class CopilotSession(Document):
	
	def before_insert(self):
		if not self.started_by:
			self.started_by = frappe.session.user