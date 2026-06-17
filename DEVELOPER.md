# Infintrix Atlas — Developer Documentation

## Architecture

Infintrix Atlas is a Frappe/ERPNext app that adds a project delivery layer on top of standard `Project` and `Task`, with:
- lifecycle management through **Project Phases**
- execution planning through **Cycles**
- customer portal access tied to **Customer Portal Users**
- a React SPA frontend under `atlas/`
- AI/copilot-related supporting doctypes and services

### Core principles in the current codebase

- **Lifecycle ≠ Execution**
- **Phase ≠ Cycle**
- **Status ≠ Cycle**
- **Hierarchy ≠ Planning**
- **Requirements drive Tasks**
- **Change Requests drive Scope Changes**
- **Execution mode changes behavior, not schema**
- **Backlog is derived, never stored**
- **Reports should be derivable from source data**
- **Customer portal access is based on `Customer.portal_users`, not a `Client` role**

### Backend

- **Frappe module**: `infintrix_atlas`
- **DocType class overrides**:
  - `Task` → `infintrix_atlas.overrides.task.TaskOverride`
  - `Project` is referenced in the app architecture, but most active lifecycle enforcement happens through project/task events and project-linked doctypes
- **Doc events**:
  - project lifecycle hooks
  - task lifecycle hooks
- **Permission query conditions**:
  - `Project`
  - `Task`
  - `Requirement`
  - `Scope Snapshot`
  - `Change Request`
  - `Project Resource`
  - `Project Action Request`
  - `Project Phase`
  - `Cycle`
  - `Fathom Meeting`
  - `Fathom Account`
- **Scheduled tasks**:
  - hourly Fathom sync

### Frontend

- **React SPA** in `atlas/`
- Served via `www/atlas.html` + `www/atlas.py`
- Main app routes currently include:
  - `dashboard`
  - `projects`
  - `tasks/:view`
  - `team`
  - `profile`
  - `ai-gen`
- Customer-facing portal content is currently rendered through the project insights flow, not through a broad standalone CRUD app for every doctype

## Custom DocTypes

| DocType | Type | Key Fields | Controller / Status |
|---|---|---|---|
| Cycle | Master | `project`, `phase`, `cycle_name`, `start_date`, `end_date`, `status` | `doctype/cycle/cycle.py` |
| Project Phase | Master | `project`, `title`, `sequence`, `status`, `start_date`, `end_date`, `completion_percentage` | `doctype/project_phase/project_phase.py` |
| Scope Snapshot | Master | `project`, `version`, `snapshot_date`, `requirements` | `doctype/scope_snapshot/scope_snapshot.py` |
| Work Item Relationship | Master | `source_doctype`, `source_name`, `target_doctype`, `target_name`, `relation_type` | `doctype/work_item_relationship/work_item_relationship.py` |
| Requirement | Master | `project`, `title`, `description`, `acceptance_criteria`, `priority`, `source`, `status` | `doctype/requirement/requirement.py` |
| Change Request | Master | `project`, `title`, `description`, `status`, `related_requirement`, `impact_*` | `doctype/change_request/change_request.py` |
| Project Action Request | Master | `project`, `phase`, `related_task`, `title`, `description`, `action_type`, `status`, `assigned_to_user`, `is_portal_visible` | `doctype/project_action_request/project_action_request.py` |
| Project Resource | Master | `project`, `title`, `type`, `link`, `file`, `visibility` | `doctype/project_resource/project_resource.py` |
| AI Task Session | Master | `project`, `execution_mode`, `cycle`, `prompt`, `status` | `doctype/ai_task_session/ai_task_session.py` |
| AI Task Draft | Master | `session`, `project`, `subject`, `priority`, `weight`, `confidence`, `status` | `doctype/ai_task_draft/ai_task_draft.py` |
| Watcher | Child Table | `user`, `notify_mode` | `doctype/watcher/watcher.py` |
| Phase Template | Master | `phases` | `doctype/phase_template/phase_template.py` |
| Phase Template CT | Child Table | `phase_name`, `description`, `sequence` | `doctype/phase_template_ct/phase_template_ct.py` |
| Requirement CT | Child Table | `requirement` | `doctype/requirement_ct/requirement_ct.py` |
| Task Type Child Rule | Child Table | `task_type` | `doctype/task_type_child_rule/task_type_child_rule.py` |
| Atlas Settings | Singleton | `llm_provider`, `gemini_api_key`, `openai_api_key`, `enable_ai_architect`, `openai_model` | `doctype/atlas_settings/atlas_settings.py` |

### Current implementation status

#### Implemented with real business rules

- `Project Phase`
- `Cycle`
- `Requirement`
- `Change Request`
- `Project Action Request`
- `Project Resource`
- `Scope Snapshot`
- `Watcher`
- `Work Item Relationship`
- `Phase Template`

#### Implemented structurally but still lightweight / mostly Desk-managed

- `AI Task Session`
- `AI Task Draft`
- `Atlas Settings`
- `Requirement CT`
- `Phase Template CT`
- `Task Type Child Rule`

#### What does **not** exist yet

- A full custom SPA CRUD module for all Atlas doctypes
- A dedicated internal governance UI for:
  - requirement administration
  - change request approval workflow
  - scope snapshot authoring / comparison
  - project resource administration
  - action request administration
- Full change-request-to-scope-baseline orchestration
- Scope snapshot diff / compare tooling
- A complete SPA UX for work item relationships
- A mature AI executor workflow that safely creates/updates all Atlas records end-to-end
- Broad automated tests for lifecycle invariants across all doctypes

## Custom Fields on Standard DocTypes

### Project

- `custom_execution_mode`
- `custom_phase`
- `custom_ai_policy`
- `custom_enable_ai_architect`
- `custom_is_archived`
- customer/project quick-entry related property setter changes

### Task

- `custom_phase`
- `custom_cycle`
- `custom_cycle_status`
- `custom_requirement`
- `custom_sort_order`
- AI / acceptance-criteria related custom fields

### Task Type

- `custom_icon`
- `custom_color`
- `custom_is_container`
- `custom_allowed_child_types` → `Task Type Child Rule`

## API Endpoints

### Core project/task APIs

- `infintrix_atlas.api.check_app_permission`
- `infintrix_atlas.api.v1.update_task_sort_order`
- `infintrix_atlas.api.v1.get_doctype_meta`
- `infintrix_atlas.api.v1.switch_assignee_of_task`
- `infintrix_atlas.api.v1.get_assignee_of_task`
- `infintrix_atlas.api.v1.get_project_flow_metrics`
- `infintrix_atlas.api.v1.start_cycle`
- `infintrix_atlas.api.v1.complete_cycle`
- `infintrix_atlas.api.v1.get_project_user_stats`
- `infintrix_atlas.api.v1.users_on_project`
- `infintrix_atlas.api.v1.update_users_on_project`
- `infintrix_atlas.api.v1.global_search`
- `infintrix_atlas.api.v1.online_users`
- `infintrix_atlas.api.v1.tasks_accountability_report`
- `infintrix_atlas.api.v1.get_task_tree`
- `infintrix_atlas.api.v1.get_task_activity`
- `infintrix_atlas.api.v1.set_project_mode`
- `infintrix_atlas.api.v1.list_projects`
- `infintrix_atlas.api.v1.list_tasks`
- `infintrix_atlas.api.v1.list_subtasks`
- `infintrix_atlas.api.v1.backlog_with_phases`
- `infintrix_atlas.api.v1.backlog`

### Customer portal / lifecycle APIs

- `infintrix_atlas.api.v1.has_customer_portal_access`
- `infintrix_atlas.api.v1.has_any_customer_portal_access`
- `infintrix_atlas.api.v1.get_customer_portal_data`
- `infintrix_atlas.api.v1.list_project_requirements`
- `infintrix_atlas.api.v1.submit_portal_requirement`
- `infintrix_atlas.api.v1.list_project_change_requests`
- `infintrix_atlas.api.v1.submit_change_request`
- `infintrix_atlas.api.v1.approve_change_request`
- `infintrix_atlas.api.v1.list_scope_snapshots`
- `infintrix_atlas.api.v1.create_scope_snapshot`
- `infintrix_atlas.api.v1.list_project_resources`
- `infintrix_atlas.api.v1.list_project_action_requests`

### Watcher APIs

- `infintrix_atlas.api.v1.get_watchers`
- `infintrix_atlas.api.v1.add_watcher`
- `infintrix_atlas.api.v1.remove_watcher`
- `infintrix_atlas.api.v1.toggle_self_watch`
- `infintrix_atlas.api.v1.current_user_is_watching`

## Permission System

### Role model

- **Administrator**: unrestricted
- **System Manager**: unrestricted
- **Projects Manager**: owned projects + project membership + relevant lifecycle records
- **Projects User**: project membership + relevant lifecycle records
- **Customer portal users**: access to projects and project-linked records where `Project.customer` matches a `Customer.portal_users` row for the logged-in user

### Current permissionized lifecycle doctypes

- `Requirement`
- `Scope Snapshot`
- `Change Request`
- `Project Resource`
- `Project Action Request`
- `Project Phase`
- `Cycle`

### Notes

- Many custom doctypes still ship with conservative DocPerm defaults
- Practical access is enforced through server-side permission query conditions and `has_permission` checks
- Customer portal access is **not** based on adding the user to `Project User`

## Installation

```bash
bench get-app https://github.com/muqeetmughal786/infintrix_atlas
bench --site yoursite install-app infintrix_atlas
```

### Dependencies

- `erpnext`
- `hrms`
- `openai`

### Post-install behavior

- Creates default `Project Phase` records for projects with tasks but missing phase assignment
- Post-migrate logic also loads fixtures and keeps legacy data aligned

## Important Code Files

| File | Purpose |
|---|---|
| `hooks.py` | App config, overrides, events, permissions, fixtures, scheduler |
| `permissions.py` | Permission query builders for project-linked doctypes |
| `role_utils.py` | Role aliases and customer portal membership helpers |
| `install.py` | Post-install migration logic |
| `overrides/task.py` | Task validation and custom permission logic |
| `overrides/project.py` | Project extension / legacy override support |
| `events/project.py` | Project lifecycle event handlers |
| `events/task.py` | Task lifecycle event handlers |
| `api/v1.py` | Main REST-style API surface |
| `api/notifications.py` | Watcher / notification dispatch support |
| `api/ai.py` | AI helper stubs |
| `api/ai_pipeline.py` | AI pipeline orchestration |
| `copilot/llm/` | Prompt / LLM client wiring |
| `fathom_integration/api.py` | Fathom meeting sync |

## Fixtures

| Fixture File | Contents |
|---|---|
| `custom_docperm.json` | Extra DocPerm rows |
| `custom_field.json` | Custom field definitions |
| `property_setter.json` | Property setter overrides |
| `task_type.json` | Preset task types |
| `phase_template.json` | Phase templates |
| `cycle_template.json` | Cycle templates |

## Known Gaps / TODO

See `ISSUES.md` for the broader audit.

The following are still incomplete in the current repo state:

- No dedicated SPA admin module for all lifecycle doctypes
- Change request approval UI is only partially exposed
- Scope snapshot comparison / diff tooling does not exist
- AI advisory vs executor separation is not fully enforced through end-user product flows
- Some doctypes are validated and usable, but remain primarily Frappe Desk-managed instead of custom-frontend managed
