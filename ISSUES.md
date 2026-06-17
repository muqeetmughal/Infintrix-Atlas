# Infintrix Atlas — Current Audit Findings

This file tracks the **current** gaps and risks in the repo. Older issues that have already been fixed have been removed to keep this document actionable.

## High Priority Gaps

### 1. No full custom frontend CRUD for lifecycle doctypes
**Status**: still open

The custom React frontend does **not** yet provide a complete internal UI for:
- `Requirement`
- `Change Request`
- `Scope Snapshot`
- `Project Resource`
- `Project Action Request`
- `Work Item Relationship`

Some customer-facing flows now exist in the portal, but internal governance still depends heavily on Frappe Desk.

**Impact**
- Product behavior is split across the custom frontend and Desk
- Internal teams cannot manage all lifecycle records from one place

**Recommended next step**
- Build a dedicated internal governance area in the SPA

---

### 2. Change Request workflow is only partially implemented
**Status**: still open

The backend now supports:
- submitting change requests
- listing change requests
- approving a change request and generating a new `Requirement`

But the broader workflow is still incomplete:
- no robust approval UI in the custom frontend
- no scope-baseline diff view before/after approval
- no strong linking from approved change request → task planning workflow

**Impact**
- Scope creep is recorded, but not yet fully governed operationally

---

### 3. Scope Snapshot lifecycle is incomplete
**Status**: still open

`Scope Snapshot` now has versioning and immutability rules, and snapshots can be created/listed via API. However:
- there is no snapshot comparison UI
- there is no scope creep report built from snapshot deltas
- there is no approval/review flow around baselines

**Impact**
- Baselines exist, but cannot yet be used effectively for scope governance

---

### 4. AI executor layer is not complete
**Status**: still open

The repo contains AI-related doctypes and pipeline code, but the “Executor Mode” described in product intent is not fully realized.

Missing pieces include:
- invariant-aware orchestration across phase / cycle / task / requirement / action request creation
- stronger separation between advisory-only and executor behavior
- end-user product flows that expose the full executor safely

**Impact**
- AI support exists, but the system should not yet be treated as a complete autonomous project operator

---

### 5. Work Item Relationship is backend-only in practice
**Status**: still open

`Work Item Relationship` has backend validation and reverse-link creation for blocking relationships, but lacks a meaningful frontend experience.

**Missing**
- create/manage relationships in SPA
- visualize dependency graph
- use relationship data in scheduling / reporting

---

## Medium Priority Gaps

### 6. Some doctypes remain structurally implemented but lightweight
**Status**: still open

These doctypes now validate basic shape, but are still relatively thin:
- `AI Task Session`
- `AI Task Draft`
- `Atlas Settings`
- `Requirement CT`
- `Phase Template CT`
- `Task Type Child Rule`

**Impact**
- Stable enough for current use
- Not yet fully modeled as rich product features

---

### 7. Customer portal action handling is still mostly presentational
**Status**: still open

The customer portal now shows real project data and allows requirement / change request submission, but action fulfillment is still shallow.

Examples:
- action requests show in portal
- action buttons are still mostly UI-level confirmation patterns
- customer approvals/signatures/payments are not yet backed by a full transactional workflow

**Impact**
- The portal is more truthful than before, but not yet fully operational for all client obligations

---

### 8. Reporting is not yet fully derived from all source data
**Status**: still open

The product principle says every report should be derivable from source data. The codebase has moved in that direction, but not all reporting/dashboard views are fully grounded in the lifecycle doctypes yet.

**Impact**
- Some metrics are real and dynamic
- Some intended governance/reporting outputs still do not exist

---

## Resolved Since Earlier Audit

The following older issues are **no longer current** and should not be treated as active findings:

- Hardcoded mock customer insights data has been replaced with dynamic project/customer data
- Customer portal task access now works for task modal, activity, and watcher reads
- Customer visibility no longer depends on a `Client` role; it uses `Customer.portal_users`
- Project/task queries now support customer visibility by project customer ownership
- Several lifecycle doctypes that were previously stub-like now enforce real validation rules
- Additional project-linked doctypes now participate in permission query conditions and `has_permission` checks

---

## Operational Notes

Before testing backend permission or doctype changes, clear/reload runtime state:

```bash
bench --site <site-name> clear-cache
bench migrate
```

If override behavior still looks stale, restart the relevant bench processes as well.
