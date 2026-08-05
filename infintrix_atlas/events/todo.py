import frappe


def enforce_single_assignee(doc, method=None):
	"""Ensure only one active assignee per Task.

	Runs when a new ToDo is inserted for a Task (e.g. from the Assign To
	dialog -> frappe.desk.form.assign_to.add). Any other open ToDo for the
	same task is closed so the task has exactly one active assignee.
	"""
	if doc.reference_type != "Task":
		return

	if doc.status != "Open":
		return

	other_open = frappe.db.get_all(
		"ToDo",
		filters={
			"reference_type": "Task",
			"reference_name": doc.reference_name,
			"status": "Open",
			"name": ["!=", doc.name],
		},
		pluck="name",
	)

	for todo_name in other_open:
		frappe.db.set_value("ToDo", todo_name, "status", "Closed")
