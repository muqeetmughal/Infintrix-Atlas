import frappe
from frappe import _
from frappe.utils import get_url
from infintrix_atlas.role_utils import has_projects_manager_role


def create_task_kanban_board(project=None):
    """Create the Task Kanban Board (idempotent).

    project=None creates a general "Task Kanban" board covering all tasks.
    """
    board_name = f"Task Kanban - {project}" if project else "Task Kanban"
    if frappe.db.exists("Kanban Board", board_name):
        return board_name

    from frappe.desk.doctype.kanban_board.kanban_board import quick_kanban_board

    quick_kanban_board(
        doctype="Task",
        board_name=board_name,
        field_name="status",
        project=project or None,
    )
    return board_name


def validate(doc, method):
    if not doc.is_new():
        doc.copy_from_template()
    doc.update_costing()
    doc.update_percent_complete()
    doc.validate_from_to_dates("expected_start_date", "expected_end_date")
    doc.validate_from_to_dates("actual_start_date", "actual_end_date")

    if doc.has_value_changed("custom_execution_mode"):
        user_roles = frappe.get_roles()
        if not has_projects_manager_role(roles=user_roles):
            frappe.throw(
                _("Only Projects Manager can change the Execution Mode.")
            )


def before_insert(doc, method):
    if not doc.users:
        doc.append("users", {"user": doc.owner, "welcome_email_sent": 0})

# def add_creator_to_users(doc, method):
#     print("Adding creator to project users...", doc, method)
#     if not doc.users:
#         doc.append("users", {"user": doc.owner})


# ---------------------------------------------------------------------------
# Welcome emails
# ---------------------------------------------------------------------------
# ERPNext's Project.validate() calls send_welcome_email() inline, which raises
# OutgoingEmailError and aborts the whole insert when no default outgoing Email
# Account exists. We cannot subclass Project (HRMS already owns
# override_doctype_class for it), so we shadow the bound method on the instance
# and take over sending ourselves, asynchronously, in after_insert/on_update.


def before_validate(doc, method=None):
    # Instance attribute shadows the class method for this document only.
    doc.send_welcome_email = lambda: None


def after_insert(doc, method):
    create_task_kanban_board(doc.name)


def on_update(doc, method=None):
    # on_update also fires on insert (Document._action defaults to "save"), so this
    # is the single enqueue point for both new projects and newly added members.
    queue_welcome_emails(doc)


def has_outgoing_email_account() -> bool:
    """True if Frappe can resolve a default outgoing account (DB or site_config)."""
    from frappe.email.doctype.email_account.email_account import EmailAccount

    try:
        return bool(EmailAccount.find_default_outgoing())
    except Exception:
        return False


def pending_welcome_users(doc) -> list[str]:
    return [u.user for u in (doc.users or []) if not u.welcome_email_sent and u.user]


def queue_welcome_emails(doc):
    """Enqueue welcome emails. Never blocks the save."""
    recipients = pending_welcome_users(doc)
    if not recipients:
        return

    if not has_outgoing_email_account():
        # Non-blocking notice: the project is saved, the emails simply aren't sent.
        frappe.msgprint(
            _("Project saved. Welcome emails were not sent because no default outgoing Email Account is set up."),
            indicator="orange",
            alert=True,
        )
        return

    frappe.enqueue(
        "infintrix_atlas.events.project.send_welcome_emails",
        queue="short",
        enqueue_after_commit=True,
        project=doc.name,
        recipients=recipients,
    )


def send_welcome_emails(project: str, recipients: list[str] | None = None):
    """Background job: send project welcome emails and mark the rows as sent."""
    if not frappe.db.exists("Project", project):
        return

    doc = frappe.get_doc("Project", project)
    url = get_url() + "/app/project_backlog/" + doc.name
    content = "<p>{}</p>".format(
        _("You have been invited to collaborate on the project {0}.").format(
            f'<a href="{url}">{doc.project_name}</a>'
        )
    )

    for row in doc.users or []:
        if row.welcome_email_sent or (recipients and row.user not in recipients):
            continue

        user_info = frappe.db.get_value("User", row.user, ["enabled", "email"], as_dict=True)
        if not (user_info and user_info.enabled and user_info.email):
            continue

        try:
            frappe.sendmail(
                recipients=[user_info.email],
                subject=_("Project Collaboration Invitation"),
                content=content,
            )
            frappe.db.set_value("Project User", row.name, "welcome_email_sent", 1, update_modified=False)
        except Exception:
            frappe.log_error(
                frappe.get_traceback(),
                f"Failed to send project welcome email to {row.user} for {project}",
            )

    frappe.db.commit()
