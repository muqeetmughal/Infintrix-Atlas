# v1.py is now a facade for backward compatibility.
#
# All API endpoints have been moved into domain modules under
# `infintrix_atlas.api`:
#
#   tasks.py           - task operations, list, backlog, subtasks
#   cycles.py          - start/complete cycle
#   projects.py        - project operations, stats, mode
#   kanban.py          - kanban board helpers
#   watchers.py        - watcher operations
#   customer_portal.py - customer portal access + data
#   lifecycle.py       - requirements, change requests, action requests, scope, resources
#   misc.py            - meta, search, users
#   resources.py       - document preview
#   access.py          - shared permission helpers
#
# Existing callers (Desk JS + deprecated React app) keep using
# `infintrix_atlas.api.v1.<fn>`; this module re-exports everything so those
# paths still resolve. New code should import from the domain modules directly.

from infintrix_atlas.api.tasks import (  # noqa: F401
    update_task_sort_order,
    switch_assignee_of_task,
    get_assignee_of_task,
    tasks_accountability_report,
    get_task_tree,
    get_task_activity,
    list_tasks,
    list_subtasks,
    backlog,
    remove_subtask,
    subtask_to_quill_html,
    create_subtask_from_ai_session,
    check_subtask_exists,
    remove_task,
    bulk_delete_tasks,
    _move_task,
    set_backlog_position,
    set_task_status,
)
from infintrix_atlas.api.cycles import (  # noqa: F401
    start_cycle,
    complete_cycle,
)
from infintrix_atlas.api.projects import (  # noqa: F401
    get_project_flow_metrics,
    get_project_user_stats,
    users_on_project,
    update_users_on_project,
    recent_projects_with_activity_of_current_user,
    toggle_archive_project,
    list_projects,
    is_project_manager,
    set_project_mode,
)
from infintrix_atlas.api.kanban import (  # noqa: F401
    get_project_kanban,
    get_kanban_boards,
)
from infintrix_atlas.api.watchers import (  # noqa: F401
    get_watchers,
    watcher_exists,
    add_watcher,
    remove_watcher,
    toggle_self_watch,
    current_user_is_watching,
)
from infintrix_atlas.api.customer_portal import (  # noqa: F401
    has_customer_portal_access,
    has_any_customer_portal_access,
    get_customer_portal_data,
)
from infintrix_atlas.api.lifecycle import (  # noqa: F401
    list_project_requirements,
    update_requirement_status,
    create_task_from_requirement,
    submit_portal_requirement,
    list_project_change_requests,
    submit_change_request,
    approve_change_request,
    reject_change_request,
    implement_change_request,
    create_action_request,
    complete_action_request,
    reject_action_request,
    expire_action_request,
    list_project_action_requests,
    list_scope_snapshots,
    create_scope_snapshot,
    create_project_resource,
    list_project_resources,
)
from infintrix_atlas.api.misc import (  # noqa: F401
    get_doctype_meta,
    global_search,
    online_users,
    get_user_roles,
    user_details,
)
from infintrix_atlas.api.resources import preview_document  # noqa: F401
from infintrix_atlas.api.access import (  # noqa: F401
    _ensure_document_read_access,
    _ensure_project_access,
)
