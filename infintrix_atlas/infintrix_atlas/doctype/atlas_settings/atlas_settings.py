# Copyright (c) 2026, Muqeet Mughal and contributors
# For license information, please see license.txt

import frappe
import requests
from frappe.model.document import Document


class AtlasSettings(Document):
    def validate(self):
        if not self.api_key:
            frappe.throw("API Key is required for OpenRouter.")


@frappe.whitelist()
def get_openrouter_models():
    models = frappe.cache().get_value("openrouter_models")
    if models:
        return models

    try:
        resp = requests.get("https://openrouter.ai/api/v1/models", timeout=10)
        resp.raise_for_status()
        data = resp.json().get("data", [])
        models = sorted(m["id"] for m in data if m.get("id"))
        frappe.cache().set_value("openrouter_models", models, expires_in_sec=3600)
        return models
    except Exception:
        return _fallback_models()


@frappe.whitelist()
def refresh_openrouter_models():
    frappe.cache().delete_key("openrouter_models")
    return get_openrouter_models()


def _fallback_models():
    return [
        "openrouter/auto",
        "openrouter/free",
        "openai/gpt-4o-mini",
        "openai/gpt-4o",
        "anthropic/claude-3.5-sonnet",
        "google/gemini-2.0-flash-001",
        "google/gemini-3.1-flash-image",
        "meta-llama/llama-3.3-70b-instruct",
        "deepseek/deepseek-chat",
    ]
