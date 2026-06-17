# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ProjectResource(Document):
    def validate(self):
        if not self.project:
            frappe.throw("Project is required.")

        if not self.title:
            frappe.throw("Title is required.")

        if not self.link and not self.file:
            frappe.throw("Either a link or a file is required.")

        if self.link and self.file:
            frappe.throw("Use either link or file, not both.")

        if self.visibility not in {"Internal", "Client", "Both"}:
            frappe.throw("Visibility must be Internal, Client, or Both.")

        if self.type not in {"PDF", "DOC", "Link"}:
            frappe.throw("Type must be PDF, DOC, or Link.")

        if self.type == "Link" and not self.link:
            frappe.throw("Link type resources must include a URL.")
