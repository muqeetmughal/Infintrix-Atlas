import frappe


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


def validate(doc, method):
    if not doc.is_new():
        doc.copy_from_template()
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
