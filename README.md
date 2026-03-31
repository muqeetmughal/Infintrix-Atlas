*# 🚀 Infintrix Atlas

> AI-Augmented Project Management built on top of ERPNext  
> Inspired by Jira. Designed for execution clarity. Built Open-Source.

Atlas is a next-generation project execution layer built on top of ERPNext, with a modern React UI and intelligent workflow design.

It separates **execution from planning**, enforces **clean hierarchy rules**, and introduces an AI-powered task intelligence layer.

---

# 🧠 Core Philosophy

Most tools mix planning and execution.

Atlas doesn’t.

- **Status ≠ Cycle**
- **Hierarchy ≠ Planning**
- **Execution Mode changes behavior, not schema**
- **Backlog is derived, not stored**

This keeps the system predictable, scalable, and analyzable.

---

# ✅ Available Features

## 📦 Project Management

- Create Projects (Scrum or Kanban mode)
- Execution mode controls UI behavior
- Derived project completion metrics
- Clean project → task → cycle separation

---

## 🧩 Task Engine (Work Item System)

- Atomic work item model
- Parent / child hierarchy
- Task Types with hierarchy validation
- Status lifecycle:
  - Open
  - Working
  - Pending Review
  - Completed
  - Cancelled
- Priority management
- Assignee support
- Independent task creation (cycle optional)

---

## 🔁 Cycle (Sprint) Management

- Timeboxed planning container
- Planned / Active / Completed / Archived
- One active cycle per project (enforced)
- Tasks reference cycles (cycles don’t own tasks)

---

## 🧱 Task Type System

- Custom task classifications
- Container vs atomic type
- Allowed child type rules
- Prevents invalid hierarchies (e.g., Bug under Bug)

---

## 📊 Derived Concepts

No unnecessary doctypes. Everything computed.

### Backlog

- Scrum → Open + No Cycle
- Kanban → Open

### Efficiency Metric

In Progress / (Open + In Progress)

### Backlog Health

Based on:
- Backlog size
- Task staleness
- Efficiency threshold

---

## 🔔 Realtime System

- Task assignment notifications
- Status change notifications
- Watcher-based alerts
- Socket-based event system
- Live “Who is working on what” visibility

---

## 🎨 Custom React UI

- Built on top of ERPNext backend
- Clean execution dashboard
- Cycle board (Scrum)
- Status board (Kanban)
- Assignee avatars
- Hierarchical task view

---

## 🤖 AI Layer (Early Version)

- Task clarity suggestions
- Scope drift detection
- Backlog health insights
- Execution bottleneck hints

---

# 🏗 Architecture

- Backend: Frappe / ERPNext
- Custom module with custom fields
- React frontend (decoupled UI layer)
- Derived metrics (no redundant storage)

### Core Invariants

- Task can exist without Cycle
- Cycle can exist without Tasks
- Status is execution
- Cycle is planning

---

# 🚧 Upcoming Features

## 🔐 Responsibility & Ownership Model

- Single-owner strict mode
- Accountability scoring
- Delayed task penalty logic
- Assignee performance insights

## 📈 Advanced Metrics

- Lead time
- Cycle time
- Throughput tracking
- Staleness heatmap
- Project execution risk score

## 🧠 AI Copilot (Full Version)

- Auto task breakdown suggestions
- Smart subtask generation
- Scope change impact estimation
- Automatic backlog prioritization
- Sprint load balancing

## 🔗 Integrations

- Slack notifications
- GitHub issue sync
- Git commit linking
- Push notifications (PWA)

## 📊 Executive Dashboard

- Portfolio-level metrics
- Team efficiency comparison
- Execution drag detection

---

# 🎯 Why Atlas?

Because:

- Jira is powerful but rigid.
- ERPNext projects are flexible but shallow.
- Most tools mix planning and execution.
- AI in PM tools is mostly marketing fluff.

Atlas focuses on execution clarity first. Intelligence second. UI third.

---

# 📌 Current Status

- 🟡 Active Development
- 🧪 Early production usage
- 🔓 Open for contributors

---

# 🤝 Contributing

Contributions are welcome.

Areas that need help:

- React UI refinement
- AI workflow logic
- Metrics optimization
- Real-time architecture improvements
- Documentation

Open an issue. Challenge assumptions. Propose better invariants.

---

# 📜 License

MIT
*