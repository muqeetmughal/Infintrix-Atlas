import frappe
from frappe.utils import add_days, flt, get_datetime, get_link_to_form, get_time, get_url, nowtime, today


def create_default_phase(doc):
    phase = frappe.new_doc("Project Phase")
    phase.project = doc.name
    phase.title = "Execution"
    phase.sequence = 1
    phase.status = "Planned"
    phase.insert()


def after_insert(doc, method):
    
    print("Creating default phase for new project...")
    create_default_phase(doc)


def send_welcome_email(doc, method):
    # label = f"{doc.project_name} ({doc.name})"
    # url = get_link_to_form(doc.doctype, doc.name, label)

    url = get_url() + "/atlas/tasks/kanban?project=" + doc.name

    print("URl:", url)

    # Import translation function at the top of the file if not already imported

    # Replace the selection with:

    for user in doc.users:
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
                user_name=frappe.db.get_value(
                    "User", user.user, "full_name") or user.user,
                project_name=doc.project_name,
                role="Member",
                added_by=frappe.db.get_value(
                    "User", doc.owner, "full_name") or doc.owner,
                start_date=doc.expected_start_date or "Not specified",
                project_link=url,
                company_name=doc.company or frappe.defaults.get_user_default(
                    "Company"),
            )

            try:
                print("Sending welcome email to:", user.user, content)
                frappe.sendmail(
                    user.user,
                    subject=_("You’ve been added to a project: {0}").format(
                        doc.project_name),
                    content=content,
                )
                user.welcome_email_sent = 1
            except Exception as e:
                print("Error sending email to:", user.user, "Error:", str(e))
                frappe.log_error(frappe.get_traceback(
                ), f"Failed to send project welcome email to {user.user}")


def validate(doc, method):

    print("Custom Project Validate Logic Here")
    if not doc.is_new():
        doc.copy_from_template()  # nosemgrep
    # send_welcome_email(doc, method)
    doc.update_costing()
    doc.update_percent_complete()
    doc.validate_from_to_dates("expected_start_date", "expected_end_date")
    doc.validate_from_to_dates("actual_start_date", "actual_end_date")


def before_insert(doc, method):
    if not doc.users:
        doc.append("users", {"user": doc.owner, "welcome_email_sent": 0})

# def add_creator_to_users(doc, method):
#     print("Adding creator to project users...", doc, method)
#     if not doc.users:
#         doc.append("users", {"user": doc.owner})
