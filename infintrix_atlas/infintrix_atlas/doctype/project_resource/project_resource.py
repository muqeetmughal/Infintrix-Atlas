# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ProjectResource(Document):
    def validate(self):
        if not self.project:
            frappe.throw("Project is required.")

        if not self.title:
            if self.content:
                first_line = self.content.strip().split("\n")[0]
                self.title = first_line[:100] if first_line else "Untitled"
            else:
                self.title = self.file or self.link or "Untitled"

        if self.phase:
            phase_project = frappe.db.get_value("Project Phase", self.phase, "project")
            if phase_project != self.project:
                frappe.throw("Phase must belong to the same project.")

        if not self.link and not self.file:
            if self.type != "Plain Text":
                frappe.throw("Either a link or a file is required for this resource type.")
            elif not self.content:
                frappe.throw("Content is required for Plain Text resources.")

        if self.link and self.file:
            frappe.throw("Use either link or file, not both.")

        if self.visibility not in {"Internal", "Client", "Both"}:
            frappe.throw("Visibility must be Internal, Client, or Both.")

        if self.type not in {"PDF", "DOC", "Link", "Spreadsheet", "Presentation", "Document", "Image", "Plain Text"}:
            frappe.throw("Type must be PDF, DOC, Link, Spreadsheet, Presentation, Document, Image, or Plain Text.")

        if self.type == "Link" and not self.link:
            frappe.throw("Link type resources must include a URL.")
