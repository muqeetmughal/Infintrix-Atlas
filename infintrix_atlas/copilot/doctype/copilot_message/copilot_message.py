# Copyright (c) 2026, Muqeet Mughal
# For license information, please see license.txt

import json
import frappe
from frappe.model.document import Document
from frappe.utils import now
import frappe
from infintrix_atlas.copilot.llm.dispatcher import run_copilot_llm




def process_copilot_message(message_name: str):
    """
    Generates AI response for a user message and publishes realtime.
    """

    message = frappe.get_doc("Copilot Message", message_name)

    # Safety check: only user messages trigger AI
    if message.role != "user":
        return

    # Call LLM
    session = message.session
    session_doc = frappe.get_doc("Copilot Session", session)
    doc = frappe.get_doc(session_doc.reference_doctype, session_doc.reference_name)

    if session_doc.reference_doctype == "Task":
        # For tasks, we can provide more context to the LLM
        context = f"""
        Task Title: {doc.subject}
        Task Description: {doc.description}
        Current Status: {doc.status}
        Priority: {doc.priority}
        Weight: {doc.task_weight}

        User Message: {message.content}
        """
    else:
        # For other doctypes, just pass the user message
        context = message.content




    
    result = run_copilot_llm(
        mode=message.mode,
        context=context,
        session=session,
    )
    

    # Persist assistant message
    ai_message = frappe.new_doc("Copilot Message")
    ai_message.session = message.session
    ai_message.role = "assistant"
    ai_message.mode = message.mode
    ai_message.content = result.model_dump_json() if hasattr(result, "model_dump_json") else str(result)
    # ai_message.structured = json.dumps(
    #     result.dict()) if hasattr(result, "dict") else None
    ai_message.insert(ignore_permissions=True)

    # Publish realtime event
    frappe.publish_realtime(
        event=message.session,
        message={
            "event": "response",
            "ai_response": result,
            "record": ai_message.as_dict(),
        },
        user=frappe.session.user,
        # room=f"copilot_session:{message.session}",
    )


class CopilotMessage(Document):
    """
    Handles messages in Copilot sessions.
    - Only USER messages trigger AI.
    - ASSISTANT messages are terminal.
    - Stores sequence, structured data, timestamps.
    """

    def before_insert(self):
        self.validate_session()
        self.set_sequence()
        self.set_created_on()
        # self.validate_structured_json()

    def after_insert(self):
        """
        Trigger AI only for user messages.
        Enqueue job for async execution to prevent blocking.
        """
        if self.role != "user":
            return

        # Enqueue background job to generate AI response
        # frappe.enqueue(
        #     process_copilot_message,
        #     message_name=self.name,
        #     queue="long",
        # )

        process_copilot_message(self.name)  # For simplicity, call directly (can be async later)

    # -------------------------
    # VALIDATION / HELPERS
    # -------------------------

    def validate_session(self):
        if not self.session:
            frappe.throw("Session is required")

        if not frappe.db.exists("Copilot Session", self.session):
            frappe.throw(f"Copilot Session '{self.session}' does not exist")

    def set_sequence(self):
        last_sequence = frappe.db.get_value(
            "Copilot Message",
            {"session": self.session},
            "max(sequence)",
        )
        self.sequence = (last_sequence or 0) + 1

    def set_created_on(self):
        if not getattr(self, "creation", None):
            self.creation = now()

    # def validate_structured_json(self):
    #     if not self.structured:
    #         return

    #     if isinstance(self.structured, dict):
    #         return

    #     try:
    #         json.loads(self.structured)
    #     except Exception:
    #         frappe.throw("Structured field must be valid JSON or dict")


# # Copyright (c) 2026, Muqeet Mughal and contributors
# # For license information, please see license.txt

# # import frappe
# import frappe
# from frappe.model.document import Document
# from frappe.utils import now
# import json

# from infintrix_atlas.copilot.doctype.copilot_session.copilot_session import CopilotSession
# from pydantic import BaseModel
# from infintrix_atlas.copilot.llm.dispatcher import run_copilot_llm


# class CopilotMessage(Document):

#     def after_insert(self):
#         """
#         After inserting a user message, automatically create a placeholder AI response.
#         """
#         # Only create AI response if this is a user message, not an assistant message
#         if self.role != "assistant":
#             print("Publishing typing event for session", self.session)
#             frappe.publish_realtime(
#                 event=self.session,
#                 user=frappe.session.user,
#                 message={"event": "typing", "message": "Thinking...",
#                          "session": self.session}
#             )

#         result = run_copilot_llm(
#             mode=self.mode,
#             context=self.content
#             #     context="""
#             # Task: Implement WebSocket-based Copilot chat
#             # Description: Realtime messaging with persistence
#             # """
#         )

#         print("LLM Result:", result)
#         self.create_ai_response(result)
#         frappe.publish_realtime(
#             event=self.session,
#             user=frappe.session.user,
#             message={"event": "response",
#                      "message": result, "session": self.session}
#         )

#     def create_ai_response(self, result):
#         ai_message = frappe.new_doc("Copilot Message")
#         ai_message.session = self.session
#         ai_message.role = "assistant"
#         ai_message.content = result
#         ai_message.mode = self.mode
#         ai_message.insert(ignore_permissions=True)
#         return ai_message

#     def before_insert(self):
#         """
#         Runs automatically when inserting via REST or backend.
#         Handles sequence, timestamps, structured JSON.
#         """
#         self.validate_session()
#         self.set_sequence()
#         # self.set_created_on()
#         self.validate_structured_json()

#     def validate_session(self):
#         if not self.session:
#             frappe.throw("Session is required")
#         if not frappe.db.exists("Copilot Session", self.session):
#             frappe.throw(f"Copilot Session '{self.session}' does not exist")

#     def set_sequence(self):
#         """
#         Automatically assign next sequence number for this session
#         """
#         last_sequence = frappe.db.get_value(
#             "Copilot Message", {"session": self.session}, "max(sequence)"
#         )
#         self.sequence = (last_sequence or 0) + 1

#     # def set_created_on(self):
#     #     if not self.created_on:
#     #         self.created_on = now()

#     def validate_structured_json(self):
#         if self.structured:
#             # Allow dicts, store as JSON automatically
#             if isinstance(self.structured, dict):
#                 return
#             # If it's a string, try to parse
#             try:
#                 json.loads(self.structured)
#             except Exception:
#                 frappe.throw("Structured field must be valid JSON or dict")
