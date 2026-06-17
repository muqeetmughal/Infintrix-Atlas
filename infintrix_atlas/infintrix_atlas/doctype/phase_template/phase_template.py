# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class PhaseTemplate(Document):
    def validate(self):
        if not self.phases:
            frappe.throw("At least one phase is required.")

        seen_names = set()
        seen_sequences = set()
        for index, row in enumerate(self.phases, start=1):
            if not row.phase_name:
                frappe.throw(f"Phase name is required for row {index}.")
            sequence = row.sequence or index
            row.sequence = sequence
            if row.phase_name in seen_names:
                frappe.throw("Duplicate phase names are not allowed in a template.")
            if sequence in seen_sequences:
                frappe.throw("Duplicate phase sequences are not allowed in a template.")
            seen_names.add(row.phase_name)
            seen_sequences.add(sequence)
