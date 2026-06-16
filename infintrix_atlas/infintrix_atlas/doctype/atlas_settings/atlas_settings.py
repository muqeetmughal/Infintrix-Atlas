# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class AtlasSettings(Document):
    def validate(self):
        if self.llm_provider == "OpenAI" and not self.openai_api_key:
            frappe.throw("OpenAI API Key is required when provider is OpenAI.")
        if self.llm_provider == "Gemini" and not self.gemini_api_key:
            frappe.throw("Gemini API Key is required when provider is Gemini.")
