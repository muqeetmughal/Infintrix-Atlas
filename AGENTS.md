# AGENTS.md — Infintrix Atlas

## Architecture

- **Backend**: Frappe/ERPNext app (`infintrix_atlas/`), modifies standard `Project` & `Task` via custom fields + custom doc types (Cycle, Project Phase, Requirement, etc.)
- **Frontend**: React SPA (`atlas/`), served via `www/atlas.html` + `www/atlas.py` with boot context. Routes: Dashboard, Tasks, Projects, Team, Profile, AI Architect, Customer Portal
- **Frontend port**: `8080` (Vite dev server proxies to Frappe)

## Developer commands

```bash
# Frontend dev (from atlas/ — separate terminal from bench)
yarn dev                  # vite on port 8080

# Frontend build + deploy
yarn build                # builds to infintrix_atlas/public/atlas/, then copies index.html to www/atlas.html

# Backend
bench migrate             # loads fixtures after python changes
bench --site sitename clear-cache
bench watch               # auto-compile assets

# Lint
ruff check infintrix_atlas/  # Python (ruff config in pyproject.toml)
cd atlas && yarn lint        # JS (eslint)

# Pre-commit (CI)
pre-commit run --all-files
```

## Frappe v16 gotchas

- **Query builder rejects raw SQL strings in `.select()`**: `frappe.get_all(fields=["'Task' as type"])` fails. Use `frappe.db.sql(...)` or dict syntax instead.
- **`override_doctype_class` allows only one app per doctype**: HRMS already overrides `Project`. `AtlasProject` extends `EmployeeProject` but Frappe won't chain them automatically. Use `doc_events` for Project hooks instead.
- **`hooks.py` has duplicate `doc_events`** — only the last one takes effect. Keep merged.
- **Class name mismatch**: `overrides/project.py` has `AtlasProject` but hooks.py may reference `Project`. Fix the string.

## Permission model

- **Administrator**: full access (no filter)
- **Project Manager**: owned projects OR projects where user is in `Project User` child table OR has a task assigned (via ToDo)
- **Regular user**: only projects where user is in `Project User` child table
- Backend: `permissions.py` provides `permission_query_conditions` for Project, Task, Fathom Meeting/Account
- `TaskOverride.has_permission` in `overrides/task.py`: admin, task owner, ToDo assignee, project owner, or `Project User` member can view task detail

## React frontend conventions

- **Framework**: React 19 + React Router v7 + Antd v6 + `frappe-react-sdk` + Tailwind v4
- **React hooks must be unconditional**: No hooks after early return (e.g. `if (isLoading) return <Spin />`) — causes error #310
- **Calling backend**: Use `useFrappeGetCall`, `useFrappePostCall`, `useFrappeGetDoc` etc. from `frappe-react-sdk`
- **CSRF token**: Set as `window.csrf_token` from template. Dev mode fetches must include `X-Frappe-CSRF-Token: window.csrf_token` header
- **Auth guard**: `RequireRole` / `RoleGate` components in `components/auth/RequireRole.jsx`; `useHasRole` hook

## Backend API key endpoints (`infintrix_atlas.api.v1`)

| Endpoint | Purpose |
|---|---|
| `list_projects` | Filtered project list (respects Project User permission) |
| `list_tasks` | Filtered task list with group_by, permission-filtered |
| `backlog_with_phases` | Backlog grouped by phase + cycles per phase |
| `switch_assignee_of_task` | Reassigns task (closes old ToDo, creates new, auto-adds to Project User) |
| `set_project_mode` | Scrum/Kanban toggle (requires Project Manager role) |
| `get_user_roles` | Returns current user's roles |
| `get_project_user_stats` | Dashboard stats for user (uses `frappe.db.sql` — not `frappe.get_all`) |

## Important backend files

| File | Purpose |
|---|---|
| `api/v1.py` | All REST endpoints |
| `events/project.py` | Project lifecycle hooks (validate, before_insert, after_insert) |
| `events/task.py` | Task lifecycle hooks (validate_task_hierarchy, before/after save) |
| `overrides/task.py` | `TaskOverride` — custom validate, has_permission, auto-assign on status change |
| `permissions.py` | Permission query condition builders |
| `dashboard.py` | Extends Project Connections tab with Atlas doctypes |
| `hooks.py` | App config, overrides, events, fixtures, scheduler |

## Custom DocTypes (with project link)

Project Phase, Cycle, Requirement, Scope Snapshot, Project Resource, Project Action Request, Change Request, AI Task Session, AI Task Draft — all have a `project` Link field.

## Backlog behavior

- **Scrum**: `backlog_by_phase` excludes tasks with a cycle (`not t["cycle"]`)
- **Kanban**: `backlog_by_phase` includes all open tasks (cycled tasks not hidden)
- **Backlog = derived concept** (Open + No Cycle in Scrum, Open in Kanban)

## Git conventions

- Branch: `muqeet`, remote: `upstream` (`https://github.com/muqeetmughal/Infintrix-Atlas.git`)
- Each logical fix in its own commit with descriptive message

## Known issues

- HRMS override conflict for Project (see ISSUES.md)
- `notify_status_changed` referenced in `events/task.py` but not defined in `api/v1.py`
