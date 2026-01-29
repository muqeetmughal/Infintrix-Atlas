
from annotated_types import doc
import frappe
from erpnext.projects.doctype.project.project import Project
from frappe.utils import add_days, flt, get_datetime, get_link_to_form, get_time, get_url, nowtime, today
from frappe import _

class ProjectOverride(Project):
	def validate(self):

		print("Custom Project Validate Logic Here")
		if not self.is_new():
			self.copy_from_template()  # nosemgrep
		self.send_welcome_email()
		self.update_costing()
		self.update_percent_complete()
		self.validate_from_to_dates("expected_start_date", "expected_end_date")
		self.validate_from_to_dates("actual_start_date", "actual_end_date")

	def send_welcome_email(self):
		# label = f"{self.project_name} ({self.name})"
		# url = get_link_to_form(self.doctype, self.name, label)

		url = get_url() + "/atlas/tasks/kanban?project=" + self.name

		print("URl:", url)

		# Import translation function at the top of the file if not already imported

		# Replace the selection with:

		for user in self.users:
			if user.welcome_email_sent == 0:
				content = """
				<p>Hi {user_name},</p>

				<p>You've been added to the project <strong>{project_name}</strong>.</p>

				<h3>Project details</h3>

				<ul>
				<li><strong>Project:</strong> {project_name}</li>
				<li><strong>Role:</strong> {role}</li>
				<li><strong>Added by:</strong> {added_by}</li>
				<li><strong>Start date:</strong> {start_date}</li>
				</ul>

				<p>You can access the project here:<br>
				{project_link}</p>

				<p>If you believe this was a mistake or you need a role change, contact the project manager directly.</p>

				<p>—<br>
				{company_name}</p>
				""".format(
					user_name=frappe.db.get_value("User", user.user, "full_name") or user.user,
					project_name=self.project_name,
					role="Member",
					added_by=frappe.db.get_value("User", self.owner, "full_name") or self.owner,
					start_date=self.expected_start_date or "Not specified",
					project_link=url,
					company_name=self.company or frappe.defaults.get_user_default("Company"),
				)

				try:
					print("Sending welcome email to:", user.user, content)
					frappe.sendmail(
						user.user,
						subject=_("You’ve been added to a project: {0}").format(self.project_name),
						content=content,
					)
					user.welcome_email_sent = 1
				except Exception as e:
					frappe.log_error(frappe.get_traceback(), f"Failed to send project welcome email to {user.user}")




	def before_insert(self):
		if not self.users:
			self.append("users", {"user": self.owner,"welcome_email_sent" : 0})
