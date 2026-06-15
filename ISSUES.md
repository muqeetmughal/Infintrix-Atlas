# Infintrix Atlas — Code Audit Findings

## Critical Issues (will cause errors)

### 1. Duplicate `doc_events` in `hooks.py`
**File**: `infintrix_atlas/hooks.py`, lines 152–156 vs 266–278

The `doc_events` dict is defined **twice**. The second definition (line 266) completely overwrites the first (line 152). This means the `File.after_insert` hook is silently lost.

```python
# Line 152 — overwritten
doc_events = { "File": { "after_insert": "..." } }

# Line 266 — overwrites the above
doc_events = { "Project": { "after_insert": "..." } }
```

**Fix**: Merge into a single `doc_events` dict:
```python
doc_events = {
    "File": {
        "after_insert": "infintrix_atlas.events.file.on_file_insert",
    },
    "Project": {
        "after_insert": "infintrix_atlas.events.project.after_insert",
    },
}
```

### 2. Class name mismatch in `override_doctype_class`
**File**: `infintrix_atlas/hooks.py`, line 330

```python
"Project": "infintrix_atlas.overrides.project.Project",
```

But the class in `overrides/project.py` is named `AtlasProject`, not `Project`. This will raise an `AttributeError` when Frappe tries to load the override.

**Fix**: Change to `"infintrix_atlas.overrides.project.AtlasProject"`.

### 3. Override conflict: HRMS already overrides Project
**Error**: `App infintrix_atlas overrides a doctype that is already overridden by another app.`

`hrms` registers `EmployeeProject` as an override for `Project` via its own `override_doctype_class`. Frappe v16 only allows **one** app per doctype in `override_doctype_class`.

`AtlasProject` extends `EmployeeProject` correctly, but Frappe's registry doesn't chain them automatically.

**Fix**: Either:
- **Option A**: Remove Project from `override_doctype_class` and use `doc_events` for all Project hooks (already partially done in `events/project.py`). This is the simplest fix.
- **Option B**: Use `__frappe_doctype_override` mechanism or manually register after HRMS.

---

## Important Bugs

### 4. `System User` role bypasses all permission filtering
**File**: `infintrix_atlas/permissions.py`

```python
if "System User" in user_roles:
    return ""  # ← no filter = see ALL records
```

Every Frappe desk user has the `System User` role. This means **all** permission queries return unfiltered for any desk user. The Project Manager / regular user filters never apply.

**Fix**: Remove the `System User` shortcut, or replace with `System Manager` if admin-level access is intended.

### 5. `validate()` calls `send_welcome_email()` on every save
**File**: `infintrix_atlas/overrides/project.py`, line 16

```python
def validate(self):
    ...
    self.send_welcome_email()  # runs on EVERY save
```

This iterates all project users and checks `welcome_email_sent` on every project save — wasteful and potentially triggers email-sending on every edit.

**Fix**: Move to a dedicated event (e.g., only when the users table changes, or in `after_insert`).

### 6. `send_welcome_email()` may not persist `welcome_email_sent = 1`
**File**: `infintrix_atlas/overrides/project.py`, line 91

```python
user.welcome_email_sent = 1
```

This modifies the child table row in memory but never calls `self.save()` or `db.commit()`. If the document save fails later, the flag is lost and the email will be re-sent.

**Fix**: Use `frappe.db.set_value()` to persist immediately, or rely on document save.

### 7. Debug print left in production code
**File**: `infintrix_atlas/permissions.py`, line 86

```python
print(f"Building permission query for user: {user}, escaped_user: {escaped_user}")
```

This prints on every permission check, filling logs.

**Fix**: Remove or use `frappe.logger()`.

### 8. Typo: `cucle` instead of `cycle`
**File**: `infintrix_atlas/api/v1.py`, line 212

```python
fields=["status", "custom_cycle as cucle", "modified", "creation"],
```

The aliased field `cucle` is never used in the function, so this is currently harmless but confusing.

**Fix**: `s/cucle/cycle/`.

### 9. Hardcoded mock data in `get_customer_portal_data`
**File**: `infintrix_atlas/api/v1.py`, lines 1019–1164

The function returns hardcoded placeholder data for `cycles2`, `pendingActions`, `requirements`, `resources`, `team`, `financials`. These sections are never queried from the database.

**Fix**: Replace with actual database queries or remove unused sections.

---

## Redundancies & Code Quality

### 10. Duplicate Project logic in `events/project.py` and `overrides/project.py`
Both files implement the same functionality:
- `after_insert` → `create_default_phase`
- `validate` → copy_from_template, update_costing, update_percent_complete
- `before_insert` → add owner to users
- `send_welcome_email`

`events/project.py` is unused because `doc_events` for Project events are registered via `override_doctype_class`. But the `doc_events` in hooks.py also has `Project.after_insert` in the second `doc_events` block (which is the one that survives).

**Fix**: Pick ONE approach — either override class OR doc_events, then remove the other.

### 11. Duplicate permission logic in `list_projects` and `list_tasks`
**File**: `infintrix_atlas/api/v1.py`, lines 1208–1400

These functions re-implement permission filtering that is already handled by `permission_query_conditions`. This is duplicative and can get out of sync.

**Fix**: Rely on `frappe.get_list()` or `frappe.get_all()` with `ignore_permissions=False` instead of raw queries.

### 12. `doc_events` for Task hooks commented out
**File**: `infintrix_atlas/hooks.py`, lines 267–272

```python
# "Task": {
#     "validate": "infintrix_atlas.events.task.validate_task_hierarchy",
#     "before_save": "infintrix_atlas.events.task.before_task_save",
#     "after_save": "infintrix_atlas.events.task.after_task_save",
# },
```

These Task event hooks are commented out, meaning the Task validation logic in `events/task.py` (validate_task_hierarchy, before_task_save, after_task_save) is **never executed**. The Task events only run through `TaskOverride` class.

**Fix**: Either uncomment these or remove the dead `events/task.py` code.

---

## Documentation Schema Issues

### 13. All custom doctypes grant full CRUD only to `System Manager`
DocTypes like `Cycle`, `Project Phase`, `Phase Template` only have a single permission row:

```json
{ "role": "System Manager", "create": 1, "delete": 1, "read": 1, "write": 1, ... }
```

This means non-System-Manager users cannot create cycles or phases through standard Frappe UI, even if they have Project-level permissions.

**Fix**: If API endpoints create these programmatically (they use `ignore_permissions=True`), this is intentional. But if desk users need to manage them, add role-based permissions.

### 14. `Cycle.phase` field is `reqd` but Cycle lifecycle in API doesn't always set it
**File**: `infintrix_atlas/api/v1.py`, `start_cycle` / `complete_cycle`

The Cycle doctype schema requires `phase` (reqd=1), but the API controllers update cycles by loading them (which already have `phase` set), so this should be fine.

### 15. `AtlasSettings.enable_ai_architect` default is `"1"` (string) not `1` (int)
**File**: `infintrix_atlas/infintrix_atlas/doctype/atlas_settings/atlas_settings.json`, line 35

```json
{ "default": "1", "fieldtype": "Check", ... }
```

Frappe Check fields expect `1` or `0` as integer. A string `"1"` may be auto-coerced but is non-standard.

**Fix**: Change `"default": "1"` to `"default": 1`.

---

## Installation Error

The error `App infintrix_atlas overrides a doctype that is already overridden by another app` is caused by **Issue #3** above (HRMS already overrides Project). The class name mismatch in **Issue #2** will cause an additional failure once that's resolved.

**Quick fix**: Remove `Project` from `override_doctype_class` in `hooks.py` and route all Project logic through `doc_events` instead. The `events/project.py` file already has the necessary handlers ready.
