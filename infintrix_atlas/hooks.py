app_name = "infintrix_atlas"
app_title = "Infintrix Atlas"
app_publisher = "Muqeet Mughal"
app_description = "A Project Management Software Built Specifically for the Software Development Teams"
app_email = "muqeetmughal786@gmail.com"
app_license = "mit"
app_icon_url = "/assets/infintrix_atlas/atlas/images/logo.svg"
app_icon_title = "Atlas"
app_icon_route = "/atlas"
add_to_apps_screen = [
    {
        "name": "atlas",
        "logo": "/assets/infintrix_atlas/atlas/images/logo.svg",
        "title": "Atlas",
        "route": "/atlas",
        "has_permission": "infintrix_atlas.api.check_app_permission",
    }
]

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "infintrix_atlas",
# 		"logo": "/assets/infintrix_atlas/logo.png",
# 		"title": "Infintrix Atlas",
# 		"route": "/infintrix_atlas",
# 		"has_permission": "infintrix_atlas.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/infintrix_atlas/css/infintrix_atlas.css"
# app_include_js = "/assets/infintrix_atlas/js/infintrix_atlas.js"

# include js, css files in header of web template
# web_include_css = "/assets/infintrix_atlas/css/infintrix_atlas.css"
# web_include_js = "/assets/infintrix_atlas/js/infintrix_atlas.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "infintrix_atlas/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "infintrix_atlas/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "infintrix_atlas.utils.jinja_methods",
# 	"filters": "infintrix_atlas.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "infintrix_atlas.install.before_install"
# after_install = "infintrix_atlas.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "infintrix_atlas.uninstall.before_uninstall"
# after_uninstall = "infintrix_atlas.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "infintrix_atlas.utils.before_app_install"
# after_app_install = "infintrix_atlas.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "infintrix_atlas.utils.before_app_uninstall"
# after_app_uninstall = "infintrix_atlas.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "infintrix_atlas.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"infintrix_atlas.tasks.all"
# 	],
# 	"daily": [
# 		"infintrix_atlas.tasks.daily"
# 	],
# 	"hourly": [
# 		"infintrix_atlas.tasks.hourly"
# 	],
# 	"weekly": [
# 		"infintrix_atlas.tasks.weekly"
# 	],
# 	"monthly": [
# 		"infintrix_atlas.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "infintrix_atlas.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "infintrix_atlas.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "infintrix_atlas.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["infintrix_atlas.utils.before_request"]
# after_request = ["infintrix_atlas.utils.after_request"]

# Job Events
# ----------
# before_job = ["infintrix_atlas.utils.before_job"]
# after_job = ["infintrix_atlas.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"infintrix_atlas.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Translation
# ------------
# List of apps whose translatable strings should be excluded from this app's translations.
# ignore_translatable_strings_from = []

doc_events = {
    "Task": {
        "validate": "infintrix_atlas.events.task.validate_task_hierarchy",
        "before_save": "infintrix_atlas.events.task.before_task_save",
        # "has_permission": "infintrix_atlas.permissions.task_has_permission"
    },
    #  "Project": {
    #     "before_insert": "infintrix_atlas.events.project.add_creator_to_users"
    #     # "before_save": "infintrix_atlas.events.task.before_task_save"
    # },
}
fixtures = [
    {"dt": "Custom Field", "filters": [["module", "in", ["Infintrix Atlas"]]]},
    {"dt": "Property Setter", "filters": [["module", "in", ["Infintrix Atlas"]]]},
    {"dt": "Task Type"},
    {"dt": "Cycle Template"},
    {
        "dt": "Custom DocPerm",
        "filters": [
            [
                "parent",
                "in",
                [
                    "Task",
                    "Cycle Template",
                    "Cycle",
                    "Customer",
                    "Comment",
                    "Version",
                ],
            ]
        ],
    },
]


website_route_rules = [
    {"from_route": "/atlas/<path:app_path>", "to_route": "atlas"},
]


permission_query_conditions = {
    "Project": "infintrix_atlas.permissions.project_permission_query",
    "Task": "infintrix_atlas.permissions.task_permission_query",
}


override_doctype_class = {
    "Task": "infintrix_atlas.overrides.task.TaskOverride",
    "Project": "infintrix_atlas.overrides.project.ProjectOverride",
}
