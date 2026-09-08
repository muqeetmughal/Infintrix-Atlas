frappe.pages["task_detail"].on_page_load = function (wrapper) {
	inject_task_detail_styles();

	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Task Detail"),
		single_column: true,
	});
	page.task_detail = new TaskDetailPage(wrapper, page);
};

frappe.pages["task_detail"].on_page_show = function (wrapper) {
	const route = frappe.get_route();
	const task_name = route[1] || "";
	const page = wrapper.page;
	if (page.task_detail) {
		page.task_detail.set_task(task_name);
	}
};

const TASK_DETAIL_STATUS_INDICATOR = {
	"Open": "gray",
	"Working": "orange",
	"In Progress": "orange",
	"Pending Review": "yellow",
	"Overdue": "red",
	"Done": "green",
	"Completed": "green",
	"Template": "gray",
	"Closed": "gray",
	"Cancelled": "red",
};

const TASK_DETAIL_PRIORITY_INDICATOR = {
	"Low": "gray",
	"Medium": "yellow",
	"High": "orange",
	"Urgent": "red",
};

function inject_task_detail_styles() {
	if (document.getElementById("task-detail-page-styles")) return;

	const style = document.createElement("style");
	style.id = "task-detail-page-styles";
	style.textContent = `
		.atlas-detail-page {
			max-width: 860px;
			margin: 0 auto;
			padding-bottom: 40px;
		}
		.atlas-detail-toolbar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			padding: 12px 16px;
			background: var(--card-bg);
			border: 1px solid var(--border-color);
			border-radius: var(--border-radius-md);
			box-shadow: var(--shadow-sm);
			margin-bottom: 16px;
		}
		.atlas-detail-toolbar-left,
		.atlas-detail-toolbar-right {
			display: flex;
			align-items: center;
			gap: 10px;
			min-width: 0;
		}
		.atlas-detail-toolbar-right { flex-shrink: 0; }
		.atlas-detail-back-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 32px;
			height: 32px;
			border: 1px solid var(--border-color);
			border-radius: var(--border-radius-sm);
			background: var(--control-bg);
			color: var(--text-light);
			cursor: pointer;
			flex-shrink: 0;
		}
		.atlas-detail-back-btn:hover {
			background: var(--control-bg-on-gray);
			color: var(--text-color);
		}
		.atlas-detail-avatar {
			width: 34px;
			height: 34px;
			border-radius: var(--border-radius-md);
			background: linear-gradient(135deg, var(--blue-500), #8b5cf6);
			color: #fff;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 13px;
			font-weight: 700;
			flex-shrink: 0;
		}
		.atlas-detail-title { min-width: 0; }
		.atlas-detail-title h1 {
			font-size: var(--text-xl);
			font-weight: 600;
			color: var(--heading-color);
			margin: 0;
		}
		.atlas-detail-title .atlas-detail-pills {
			display: flex;
			align-items: center;
			gap: 6px;
			margin-top: 4px;
			flex-wrap: wrap;
		}
		.atlas-detail-card {
			background: var(--card-bg);
			border: 1px solid var(--border-color);
			border-radius: var(--border-radius-md);
			box-shadow: var(--shadow-sm);
			margin-bottom: 16px;
			overflow: hidden;
		}
		.atlas-detail-card-head {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 12px 16px;
			border-bottom: 1px solid var(--border-color);
			background: var(--control-bg-on-gray);
		}
		.atlas-detail-card-head .icon { color: var(--text-light); }
		.atlas-detail-card-head h3 {
			font-size: var(--text-sm);
			font-weight: 600;
			color: var(--text-color);
			margin: 0;
		}
		.atlas-detail-card-body { padding: 20px 24px; }
		.atlas-detail-description {
			font-size: var(--text-md);
			line-height: 1.7;
			color: var(--text-color);
			white-space: pre-wrap;
			word-break: break-word;
			margin: 0;
		}
		.atlas-detail-empty {
			text-align: center;
			color: var(--text-muted);
			font-size: var(--text-sm);
			padding: 32px 0;
		}
		.atlas-detail-empty .icon { margin-bottom: 8px; }
		.atlas-detail-meta {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			flex-wrap: wrap;
			padding: 12px 16px;
			border-top: 1px solid var(--border-color);
			font-size: var(--text-sm);
			color: var(--text-muted);
		}
		.atlas-detail-meta .atlas-detail-meta-item {
			display: inline-flex;
			align-items: center;
			gap: 6px;
		}
		.atlas-detail-meta a { color: var(--text-light); }
		.atlas-detail-meta a:hover { color: var(--blue-500); }
		.atlas-detail-loading,
		.atlas-detail-error {
			background: var(--card-bg);
			border: 1px solid var(--border-color);
			border-radius: var(--border-radius-md);
			padding: 48px 24px;
			text-align: center;
			color: var(--text-muted);
		}
	`;
	document.head.appendChild(style);
}

class TaskDetailPage {
	constructor(wrapper, page) {
		this.wrapper = wrapper;
		this.page = page;
		this.task_name = "";
		this.doc = null;
		this.loading = false;

		this.$container = $(this.wrapper).find(".layout-main-section");
		this.$container.empty();
		this.$container.css("background", "var(--bg-color)");

		this.$content = $(`
			<div class="atlas-detail-page"></div>
		`).appendTo(this.$container);

		this.$toolbar = $(`<div class="atlas-detail-toolbar"></div>`).appendTo(this.$content);
		this.$body = $(`<div></div>`).appendTo(this.$content);
	}

	set_task(task_name) {
		if (this.task_name === task_name && this.doc) return;
		this.task_name = task_name;
		this.doc = null;
		this.render_toolbar();
		if (task_name) {
			this.fetch_task();
		} else {
			this.$body.html(this._empty_state(__("No Task Selected"), __("Open a task and click Detail View from the Task form.")));
		}
	}

	fetch_task() {
		this.loading = true;
		this.$body.html(`
			<div class="atlas-detail-loading">
				${frappe.utils.icon("loader", "lg")}
				<div style="margin-top: 8px;">${__("Loading task...")}</div>
			</div>
		`);

		frappe.call({
			method: "frappe.client.get",
			args: { doctype: "Task", name: this.task_name },
			callback: (r) => {
				this.loading = false;
				if (r.message) {
					this.doc = r.message;
					this.render();
				} else {
					this.$body.html(this._error_state(__("Task not found")));
				}
			},
			error: (r) => {
				this.loading = false;
				const msg = r.message || __("You do not have permission to view this task.");
				this.$body.html(this._error_state(msg));
			},
		});
	}

	render() {
		if (!this.doc) return;
		this.page.set_title(this.doc.subject || this.doc.name);
		this.render_toolbar();
		this.render_body();
	}

	render_toolbar() {
		const doc = this.doc;
		const pills = doc ? this._pill_html(doc) : "";

		this.$toolbar.html(`
			<div class="atlas-detail-toolbar-left">
				<button class="atlas-detail-back-btn" title="${__("Back")}">${frappe.utils.icon("arrow-left", "sm")}</button>
				<div class="atlas-detail-avatar">${this._initials(this.task_name)}</div>
				<div class="atlas-detail-title">
					<h1 class="ellipsis">${doc ? frappe.utils.escape_html(doc.subject || doc.name) : this._escape(this.task_name)}</h1>
					<div class="atlas-detail-pills">${pills}</div>
				</div>
			</div>
			<div class="atlas-detail-toolbar-right">
				${doc && doc.project ? `<button class="btn btn-secondary btn-sm detail-backlog-btn">${frappe.utils.icon("kanban", "xs")} ${__("Backlog")}</button>` : ""}
				${doc ? `<button class="btn btn-primary btn-sm detail-open-form">${frappe.utils.icon("external-link", "xs")} ${__("Open in Form")}</button>` : ""}
			</div>
		`);

		this.$toolbar.find(".atlas-detail-back-btn").on("click", () => {
			if (window.history.length > 1) {
				window.history.back();
			} else {
				frappe.set_route("Task", "List", "Task");
			}
		});

		if (doc) {
			this.$toolbar.find(".detail-open-form").on("click", () => {
				frappe.set_route("Form", "Task", doc.name);
			});
			if (doc.project) {
				this.$toolbar.find(".detail-backlog-btn").on("click", () => {
					frappe.set_route("project_backlog", doc.project);
				});
			}
		}
	}

	render_body() {
		const doc = this.doc;
		const description = (doc.description || "").trim();

		let project_html = doc.project
			? `<span class="atlas-detail-meta-item">${frappe.utils.icon("folder-open", "xs")} <a href="#" class="detail-project-link">${this._escape(doc.project)}</a></span>`
			: "";

		this.$body.html(`
			<div class="atlas-detail-card">
				<div class="atlas-detail-card-head">
					${frappe.utils.icon("file-text", "sm")}
					<h3>${__("Description")}</h3>
				</div>
				<div class="atlas-detail-card-body">
					${description
						? `<p class="atlas-detail-description">${this._escape(description)}</p>`
						: `<div class="atlas-detail-empty">${frappe.utils.icon("file-text", "lg")}<div>${__("No description yet.")}</div></div>`}
				</div>
				<div class="atlas-detail-meta">
					<div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap; min-width: 0;">
						${project_html}
						<span class="atlas-detail-meta-item">${frappe.utils.icon("calendar-days", "xs")} ${__("Created")} ${frappe.datetime.prettyDate(doc.creation)}</span>
						<span class="atlas-detail-meta-item">${frappe.utils.icon("clock", "xs")} ${__("Modified")} ${frappe.datetime.prettyDate(doc.modified)}</span>
					</div>
					<span class="atlas-detail-meta-item">${frappe.utils.icon("users", "xs")} ${this._escape(doc.modified_by || "")}</span>
				</div>
			</div>
		`);

		if (doc.project) {
			this.$body.find(".detail-project-link").on("click", (e) => {
				e.preventDefault();
				frappe.set_route("project_backlog", doc.project);
			});
		}
	}

	_pill_html(doc) {
		const status = TASK_DETAIL_STATUS_INDICATOR[doc.status] || "gray";
		const priority = TASK_DETAIL_PRIORITY_INDICATOR[doc.priority] || "gray";
		const pills = [
			`<span class="indicator-pill ${status}">${this._escape(doc.status)}</span>`,
			`<span class="indicator-pill ${priority}">${this._escape(doc.priority || "Low")}</span>`,
		];
		if (doc.type) {
			pills.push(`<span class="indicator-pill light-blue">${this._escape(doc.type)}</span>`);
		}
		return pills.join("");
	}

	_initials(name) {
		const parts = String(name || "?").split(/[^a-zA-Z0-9]+/).filter(Boolean);
		return (parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2)) || "?";
	}

	_escape(value) {
		return frappe.utils.escape_html(String(value || ""));
	}

	_empty_state(title, subtitle) {
		return `
			<div class="atlas-detail-error">
				${frappe.utils.icon("inbox", "lg")}
				<div style="font-weight: 600; color: var(--text-color); margin-top: 8px;">${this._escape(title)}</div>
				<div style="margin-top: 4px;">${this._escape(subtitle)}</div>
			</div>
		`;
	}

	_error_state(message) {
		return `
			<div class="atlas-detail-error">
				${frappe.utils.icon("circle-alert", "lg")}
				<div style="font-weight: 600; color: var(--text-color); margin-top: 8px;">${__("Something went wrong")}</div>
				<div style="margin-top: 4px;">${this._escape(message)}</div>
			</div>
		`;
	}
}
