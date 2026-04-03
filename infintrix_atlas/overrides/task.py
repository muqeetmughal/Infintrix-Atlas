# your_app/overrides/task.py

import frappe
from frappe import _
from erpnext.projects.doctype.task.task import Task

print("ATLAS TASK OVERRIDE LOADED")
class TaskOverride(Task):

    def validate(self):
        if self.is_new():
            self._set_default_phase_if_missing()
            self.validate_cycle_phase()
            self.validate_task_allowed()
        # self.validate_task_type_hierarchy()
        # self.validate_cycle_lock()
        # ALWAYS call core validation
        super().validate()

    
    def _set_default_phase_if_missing(self):
        if self.custom_phase or not self.project:
            return

        latest_phase = frappe.db.get_value(
            "Project Phase",
            {"project": self.project},
            "name",
            order_by="creation desc",
        )
        if not latest_phase:
            frappe.throw(_("Please create a phase before creating a task."))

        self.custom_phase = latest_phase
        
    def validate_cycle_phase(self):
         if self.custom_cycle and self.custom_phase:
            cycle = frappe.get_doc("Cycle", self.custom_cycle)
            if cycle.custom_phase != self.custom_phase:
                frappe.throw(
                    f"Cycle {self.custom_cycle} belongs to phase {cycle.custom_phase}, "
                    f"but task is in phase {self.custom_phase}"
                )
                
    def validate_task_allowed(self):
        if self.custom_phase:
            phase = frappe.get_doc("Project Phase", self.custom_phase)
            if phase.status != "Planned":
                frappe.throw(
                    f"Tasks can only be created in phases with 'Planned' status. "
                    f"Phase {self.custom_phase} status: {phase.status}"
                )

    def before_insert(self):
        # Inherit project from parent task if not explicitly set
        if not self.project and self.parent_task:
            parent = frappe.get_doc("Task", self.parent_task)
            if parent.project:
                self.project = parent.project

    def validate_task_type_hierarchy(self):
        if not self.parent_task or not self.type:
            return

        parent = frappe.get_doc("Task", self.parent_task)
        if not parent.type:
            return

        parent_type = frappe.get_doc("Task Type", parent.type)
        child_type = frappe.get_doc("Task Type", self.type)

        # Parent must be container by design
        if not parent_type.custom_is_container:
            frappe.throw(f"{parent_type.name} cannot have child tasks")

        # Validate allowed child task types
        allowed = [
            d.task_type
            for d in parent_type.custom_allowed_child_types
        ] if parent_type.custom_allowed_child_types else []

        if allowed and child_type.name not in allowed:
            frappe.throw(
                f"{child_type.name} cannot be child of {parent_type.name}"
            )

    def validate_cycle_lock(self):
        if not self.project:
            return

        print("Validating cycle lock...")

        active_cycle = frappe.db.get_value(
            "Project",
            self.project,
            "custom_active_cycle"
        )

        if (
            active_cycle
            and self.custom_cycle
            and self.custom_cycle != active_cycle
        ):
            frappe.throw(
                f"Cannot change cycle while project has active cycle: {active_cycle}"
            )

    def has_permission(self, permission_type=None, user=None):
        user = user or frappe.session.user

        if user == "Administrator":
            return True

        roles = frappe.get_roles(user)

        if "System User" in roles:
            return True

        if self.owner == user:
            return True

        # Assigned via ToDo
        if frappe.db.exists(
            "ToDo",
            {
                "reference_type": "Task",
                "reference_name": self.name,
                "allocated_to": user
            }
        ):
            return True

        # Project-based access
        if self.project:
            if frappe.db.get_value("Project", self.project, "owner") == user:
                return True

            if frappe.db.exists(
                "Project User",
                {
                    "parent": self.project,
                    "user": user
                }
            ):
                return True

        return False


# # your_app/overrides/task.py

# import frappe
# # from erpnext.doctype.task.task import Task
# from erpnext.projects.doctype.task.task import Task

# class TaskOverride(Task):

#     # def validate(self):
#     #     self.validate_dates()
#     #     self.validate_progress()
#     #     self.validate_status()
#     #     self.update_depends_on()
#     #     self.validate_dependencies_for_template_task()
#     #     self.validate_completed_on()
#     #     self.validate_parent_is_group()


#     def has_permission(self, permission_type=None, user=None):
#         user = user or frappe.session.user

#         # Admin
#         if user == "Administrator":
#             return True

#         roles = frappe.get_roles(user)

#         # System User
#         if "System User" in roles:
#             return True

#         # Owner
#         if self.owner == user:
#             return True

#         # Assigned via ToDo
#         if frappe.db.exists(
#             "ToDo",
#             {
#                 "reference_type": "Task",
#                 "reference_name": self.name,
#                 "allocated_to": user
#             }
#         ):
#             return True

#         # Project-based access
#         if self.project:
#             # Project owner
#             if frappe.db.get_value("Project", self.project, "owner") == user:
#                 return True

#             # Project User child table
#             if frappe.db.exists(
#                 "Project User",
#                 {
#                     "parent": self.project,
#                     "user": user
#                 }
#             ):
#                 return True

#         return False
