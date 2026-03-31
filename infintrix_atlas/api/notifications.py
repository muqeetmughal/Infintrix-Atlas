from typing import Set, Dict
from datetime import datetime
import frappe

class AtlasNotificationEngine:
    """
    Singleton-style notification engine.
    Declare once, process multiple tasks/events by passing to `process_task`.
    """

    HIGH_SIGNAL_EVENTS = ["status_changed", "assigned", "completed", "comment_added", "cycle_changed"]
    LOW_SIGNAL_EVENTS = ["description_updated", "metadata_changed"]

    def __init__(self):
        # Any global config can go here
        self.default_batch_queue = "default"
        self.instant_dispatch_method = self._dispatch_instant

    # -----------------------------
    # Public API
    # -----------------------------

    def process_task(self, task_doc, event: str):
        """
        Pass task and event here instead of constructor.
        """
        self.task = task_doc
        self.event = event

        if not self.should_notify():
            return

        recipients = self.get_event_recipients()
        if not recipients:
            return

        payload = self.build_payload()

        mode = self.get_notification_mode()
        if mode == "instant":
            self.instant_dispatch_method(recipients, payload)
        elif mode == "batch":
            self.queue_batch(recipients, payload)
        elif mode == "ai_summary":
            self.queue_ai_summary(recipients, payload)

    # -----------------------------
    # Core logic
    # -----------------------------
    def should_notify(self) -> bool:
        return self.event in self.HIGH_SIGNAL_EVENTS + self.LOW_SIGNAL_EVENTS

    def get_event_recipients(self) -> Set[str]:
        recipients = set()

        # Assignee
        if getattr(self.task, "assigned_to", None):
            recipients.add(self.task.assigned_to)

        # Task watchers
        for row in getattr(self.task, "watchers", []):
            if row.user:
                recipients.add(row.user)

        # Project watchers
        if getattr(self.task, "project", None):
            project_watchers = frappe.get_all(
                "Project Watcher",
                filters={"parent": self.task.project},
                pluck="user"
            )
            recipients.update(project_watchers)

        return self.apply_role_filters(recipients)

    def apply_role_filters(self, users: Set[str]) -> Set[str]:
        filtered = set()
        for user in users:
            roles = frappe.get_roles(user)
            if self.event in self.HIGH_SIGNAL_EVENTS and "Developer" in roles:
                filtered.add(user)
            elif self.event in self.LOW_SIGNAL_EVENTS and "PM" in roles:
                filtered.add(user)
            elif self.event in self.HIGH_SIGNAL_EVENTS:
                filtered.add(user)
        return filtered

    def build_payload(self) -> Dict:
        return {
            "task": self.task.name,
            "subject": getattr(self.task, "subject", ""),
            "event": self.event,
            "status": getattr(self.task, "status", ""),
            "project": getattr(self.task, "project", ""),
            "timestamp": datetime.now(),
        }

    def get_notification_mode(self) -> str:
        if self.event in self.HIGH_SIGNAL_EVENTS:
            return "instant"
        elif self.event in self.LOW_SIGNAL_EVENTS:
            return "batch"
        return "instant"

    # -----------------------------
    # Dispatch / Queue
    # -----------------------------
    def _dispatch_instant(self, recipients: Set[str], payload: Dict):
        for user in recipients:
            frappe.get_doc({
                "doctype": "Notification Log",
                "subject": f"Task {payload['event']}: {payload['subject']}",
                "for_user": user,
                "type": "Alert",
                "document_type": "Task",
                "document_name": payload["task"],
            }).insert(ignore_permissions=True)

    def queue_batch(self, recipients: Set[str], payload: Dict):
        frappe.enqueue(
            method="infintrix_atlas.notifications.process_batch_queue",
            task_name=self.task.name,
            event=self.event,
            recipients=list(recipients),
            payload=payload,
            queue=self.default_batch_queue,
            timeout=60
        )

    def queue_ai_summary(self, recipients: Set[str], payload: Dict):
        frappe.enqueue(
            method="infintrix_atlas.notifications.generate_ai_summary",
            task_name=self.task.name,
            event=self.event,
            recipients=list(recipients),
            payload=payload,
            queue=self.default_batch_queue,
            timeout=120
        )