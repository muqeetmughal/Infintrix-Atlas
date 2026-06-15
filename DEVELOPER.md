# Infintrix Atlas — Developer Documentation

## Architecture

Infintrix Atlas is a Frappe/ERPNext app that adds a project management layer with phases, cycles (sprints), AI copilot, meeting sync, and a React SPA frontend.

### Backend
- **Frappe Module**: `infintrix_atlas` — extends Project & Task with custom fields + lifecycle hooks
- **DocType Class Overrides** (`hooks.py` → `override_doctype_class`):
  - `Task` → `infintrix_atlas.overrides.task.TaskOverride`
  - `Project` → `infintrix_atlas.overrides.project.AtlasProject`
- **Event Hooks** (`doc_events`):
  - `Project.after_insert`
- **Permission Queries** (`permission_query_conditions`):
  - `Project`, `Task`, `Fathom Meeting`, `Fathom Account`
- **Scheduled Tasks**:
  - Hourly: `fathom_integration.api.sync_accounts`

### Frontend
- **React SPA** at `atlas/`, served via `www/atlas.html` + `www/atlas.py`
- Routes: Dashboard, Tasks, Projects, Team, Profile, AI Architect, Customer Portal

---

## Custom DocTypes

| DocType | Type | Key Fields | Controller |
|---|---|---|---|
| Cycle | Master | project, phase, cycle_name, start_date, end_date, status | `doctype/cycle/cycle.py` |
| Project Phase | Master | project, title, sequence, status, start_date, end_date | `doctype/project_phase/project_phase.py` |
| Scope Snapshot | Master | project, version, snapshot_date, requirements (child) | `doctype/scope_snapshot/scope_snapshot.py` |
| Work Item Relationship | Master | source_doctype, source_name, target_doctype, target_name, relation_type | `doctype/work_item_relationship/work_item_relationship.py` |
| Requirement | Master | project, title, description, status, priority | — |
| Change Request | Master | project, title, description, impact_analysis | — |
| Project Action Request | Master | project, title, request_type, status, assigned_to | — |
| Project Resource | Master | project, resource_type, name, allocation_percentage | — |
| AI Task Session | Master | reference_doctype, reference_name, status | — |
| AI Task Draft | Master | session, title, description, acceptance_criteria | — |
| Watcher | Master | user, document_type, document_name | — |
| Phase Template | Master | phases (child table → Phase Template CT) | — |
| Phase Template CT | Child Table | phase_name, description, sequence | — |
| Requirement CT | Child Table | requirement_id, title, description | — |
| Task Type Child Rule | Child Table | task_type | — |
| Atlas Settings | Singleton | llm_provider, gemini_api_key, openai_api_key, enable_ai_architect | — |

---

## Custom Fields on Standard DocTypes

### Project (`custom/project.json`)
- `custom_execution_mode` (Select: Scrum / Kanban) — reqd
- `custom_phase` (Link → Project Phase)
- `custom_ai_policy` (Long Text)
- `custom_enable_ai_architect` (Check)
- `custom_is_archived` (Check)
- `custom_resource_allocation_percentage`
- Various property setters (allow_in_quick_entry for customer, project_name, status, etc.)

### Task (`custom/task.json`)
- `custom_phase` (Link → Project Phase)
- `custom_cycle` (Link → Cycle)
- `custom_cycle_status` (read-only)
- `custom_is_epic` (Check)
- `custom_sprint_goal` (Data)
- `custom_ai_guidance` (Long Text)
- `custom_acceptance_criteria` (Long Text)
- `custom_sort_order` (Int)

### Task Type (`custom/task_type.json`)
- `custom_icon` (Data)
- `custom_color` (Data)
- `custom_is_container` (Check)
- `custom_allowed_child_types` (Table → Task Type Child Rule)

---

## API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `infintrix_atlas.api.check_app_permission` | GET | Permission gate for `/atlas` page |
| `infintrix_atlas.api.copilot.get_or_create_session` | GET/POST | Create/get AI copilot session |
| `infintrix_atlas.api.v1.update_task_sort_order` | POST | Bulk update task sort order |
| `infintrix_atlas.api.v1.get_doctype_meta` | GET | Fetch doctype metadata |
| `infintrix_atlas.api.v1.switch_assignee_of_task` | POST | Reassign task assignee |
| `infintrix_atlas.api.v1.get_assignee_of_task` | GET | Get task assignee |
| `infintrix_atlas.api.v1.get_project_flow_metrics` | GET | Efficiency + backlog health |
| `infintrix_atlas.api.v1.start_cycle` | POST | Start a cycle |
| `infintrix_atlas.api.v1.complete_cycle` | POST | Complete a cycle |
| `infintrix_atlas.api.v1.get_project_user_stats` | GET | Dashboard stats for user |
| `infintrix_atlas.api.v1.users_on_project` | GET | List project users |
| `infintrix_atlas.api.v1.update_users_on_project` | POST | Bulk update project users |
| `infintrix_atlas.api.v1.global_search` | GET | Search tasks/projects/cycles |
| `infintrix_atlas.api.v1.online_users` | GET | Currently active users |
| `infintrix_atlas.api.v1.tasks_accountability_report` | GET | Assignee metrics report |
| `infintrix_atlas.api.v1.get_task_tree` | GET | Hierarchical task tree |
| `infintrix_atlas.api.v1.get_task_activity` | GET | Version history + comments |
| `infintrix_atlas.api.v1.get_customer_portal_data` | GET | Customer-facing project data |
| `infintrix_atlas.api.v1.set_project_mode` | POST | Switch Scrum/Kanban |
| `infintrix_atlas.api.v1.list_projects` | GET | Filtered project list |
| `infintrix_atlas.api.v1.list_tasks` | GET | Filtered task list with group_by |
| `infintrix_atlas.api.v1.list_subtasks` | GET | Subtasks of a parent task |
| `infintrix_atlas.api.v1.backlog_with_phases` | GET | Backlog grouped by phase + cycle |
| `infintrix_atlas.api.v1.backlog` | GET | Backlog view data |

---

## Permission System

### Permission Query Conditions (`permissions.py`)
- **Administrator**: full access (no filter)
- **System User**: full access (no filter) — **NB**: all desk users have this role
- **Project Manager**: sees owned projects + projects where user is in Project User table
- **Regular User**: sees only projects where user appears in Project User table

### DocType-level Permissions (JSON schema)
All custom doctypes grant full CRUD to **System Manager** role only. Additional DocPerm fixtures grant access to other roles.

### API-level Permission Checks
- `check_app_permission`: gates the `/atlas` page — allows System Manager, Projects User, Projects Manager
- `set_project_mode`: checks is_project_manager() (Administrator or Projects Manager)

---

## Installation

```bash
bench get-app https://github.com/muqeetmughal786/infintrix_atlas
bench --site yoursite install-app infintrix_atlas
```

### Dependencies
- `erpnext`, `hrms` (required apps)
- `openai` (Python package)

### after_install
- Creates default Project Phase records for existing projects that have tasks but no custom_phase set
- Runs on `after_migrate` hook as well

---

## Important Code Files

| File | Purpose |
|---|---|
| `hooks.py` | App config, overrides, events, permissions, fixtures, scheduler |
| `permissions.py` | Permission query builders for Project, Task, Fathom |
| `install.py` | Post-install migration logic |
| `overrides/task.py` | `TaskOverride(Task)` — custom validate, before_save, before_insert, has_permission |
| `overrides/project.py` | `AtlasProject(EmployeeProject)` — custom validate, after_insert, send_welcome_email, before_insert |
| `events/project.py` | DocEvents handlers for Project (after_insert, validate, before_insert) |
| `events/task.py` | DocEvents handlers for Task (validate_task_hierarchy, before_task_save, after_task_save) |
| `events/file.py` | File attachment notification handler (disabled) |
| `api/v1.py` | All REST API endpoints |
| `api/notifications.py` | `AtlasNotificationEngine` — instant, batch, AI-summary dispatch |
| `api/ai.py` | AI stub functions (decompose_intent, feasibility_guard, draft_tasks, validate_tasks) |
| `api/ai_pipeline.py` | OpenAI structured pipeline with exponential backoff |
| `copilot/llm/` | System prompt dispatcher + OpenAI client |
| `fathom_integration/api.py` | Fathom meeting sync |

---

## Fixtures (loaded on migrate)

| Fixture File | Contents |
|---|---|
| `custom_docperm.json` | Extended DocPerm rows for Project, Task, Phase Template, Cycle, etc. |
| `custom_field.json` | Custom field definitions |
| `property_setter.json` | Property setter overrides |
| `task_type.json` | Preset task types (Epic, Story, Task, Bug, Sub-Task) |
| `phase_template.json` | Phase templates |
| `cycle_template.json` | Cycle templates |

---

## Known Issues & TODO

See `ISSUES.md` in the root directory for the current audit findings.
