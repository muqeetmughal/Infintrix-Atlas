const ATLAS_SORTABLE_CDN = "https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js";

class AtlasBacklog {
	constructor(opts = {}) {
		this.opts = opts;
		this.$container = opts.container || $(`<div></div>`);
		this.project_name = opts.project_name || "";
		this.embedded = Boolean(opts.embedded);

		this.data = {};
		this.selected_tasks = new Set();
		this.is_scrum = false;
		this.active_cycle_name = null;
		this.expanded_cycles = new Set();
		this._backlog_expanded = true;
		this.sortables = [];
		this.search_query = "";
		this._dragging = false;

		this.inject_styles();

		this.$container.empty();
		this.$container.css("background", "var(--control-bg-on-gray)");

		this.$content = $(`
			<div class="atlas-backlog-root">
				<div class="atlas-toolbar-slot"></div>
				<div class="atlas-actions-slot hidden"></div>
				<div class="atlas-body-slot"></div>
			</div>
		`).appendTo(this.$container);

		this.$toolbar = this.$content.find(".atlas-toolbar-slot");
		this.$actions = this.$content.find(".atlas-actions-slot");
		this.$body = this.$content.find(".atlas-body-slot");

		this.bind_shortcuts();
	}

	bind_shortcuts() {
		const me = this;
		$(document).off("keydown.atlas_backlog").on("keydown.atlas_backlog", (e) => {
			if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
			const tag = (e.target && e.target.tagName) || "";
			if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
			if (!me.$container.closest(document).length) return;
			const $input = me.$toolbar.find(".atlas-search-input");
			if ($input.length) {
				e.preventDefault();
				$input.trigger("focus");
			}
		});
	}

	inject_styles() {
		if (document.getElementById("atlas-backlog-styles")) return;
		const style = document.createElement("style");
		style.id = "atlas-backlog-styles";
		style.textContent = `
			.atlas-backlog-root {
				display: flex;
				flex-direction: column;
				gap: 8px;
				padding-bottom: 4px;
			}
			.atlas-toolbar-card {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 12px;
				flex-wrap: wrap;
				background: var(--card-bg);
				border: 1px solid var(--border-color);
				border-radius: var(--border-radius-sm);
				box-shadow: var(--shadow-xs);
				padding: 8px 12px;
			}
			.atlas-toolbar-left {
				display: flex;
				align-items: center;
				gap: 12px;
				min-width: 0;
			}
			.atlas-toolbar-right {
				display: flex;
				align-items: center;
				gap: 8px;
				flex-shrink: 0;
				flex-wrap: wrap;
			}
			.atlas-toolbar-avatar {
				width: 30px;
				height: 30px;
				border-radius: var(--border-radius-sm);
				background: linear-gradient(135deg, var(--blue-500), var(--purple-500));
				color: #fff;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 12px;
				font-weight: 700;
				flex-shrink: 0;
			}
			.atlas-toolbar-title { min-width: 0; }
			.atlas-toolbar-title h1 {
				font-size: var(--text-md);
				font-weight: 600;
				color: var(--heading-color);
				margin: 0;
			}
			.atlas-toolbar-badges {
				display: flex;
				align-items: center;
				gap: 6px;
				margin-top: 3px;
				flex-wrap: wrap;
			}
			.atlas-section-card {
				background: var(--card-bg);
				border: 1px solid var(--border-color);
				border-radius: var(--border-radius-sm);
				box-shadow: var(--shadow-xs);
				overflow: hidden;
			}
			.atlas-section-card.is-active { border-color: var(--green-500); }
			.atlas-section-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 10px;
				padding: 8px 12px;
				cursor: pointer;
				transition: background 0.15s;
			}
			.atlas-section-header:hover { background: var(--control-bg-on-gray); }
			.atlas-section-header-left {
				display: flex;
				align-items: center;
				gap: 12px;
				flex: 1;
				min-width: 0;
			}
			.atlas-section-header-left .icon { color: var(--text-muted); }
			.atlas-section-header-right {
				display: flex;
				align-items: center;
				gap: 8px;
				flex-shrink: 0;
			}
			.atlas-section-title { min-width: 0; }
			.atlas-section-title h3 {
				font-size: var(--text-sm);
				font-weight: 600;
				color: var(--heading-color);
				margin: 0;
			}
			.atlas-section-subtitle {
				font-size: var(--text-xs);
				color: var(--text-muted);
				margin: 0;
			}
			.atlas-section-chevron {
				color: var(--text-muted);
				transition: transform 0.2s;
				display: inline-flex;
			}
			.atlas-section-chevron.expanded { transform: rotate(180deg); }
			.atlas-dropzone {
				padding: 6px 10px;
				min-height: 36px;
				transition: background 0.15s;
			}
			.atlas-dropzone.collapsed { background: var(--control-bg-on-gray); }
			.atlas-dropzone.dragover { background: var(--highlight-color); }
			.atlas-dropzone .atlas-empty {
				color: var(--text-muted);
				text-align: center;
				padding: 20px 8px;
				font-size: var(--text-xs);
			}
			.atlas-drop-hint {
				color: var(--text-muted);
				text-align: center;
				padding: 6px;
				font-size: var(--text-xs);
			}
			.atlas-task-card {
				display: flex;
				align-items: center;
				gap: 10px;
				padding: 7px 10px;
				margin-bottom: 4px;
				border: 1px solid var(--border-color);
				border-radius: var(--border-radius-sm);
				background: var(--card-bg);
				cursor: grab;
				box-shadow: var(--shadow-xs);
				transition: box-shadow 0.15s, border-color 0.15s, background 0.15s;
			}
			.atlas-task-card:hover {
				box-shadow: var(--shadow-sm);
				border-color: var(--text-light);
			}
			.atlas-task-card.selected {
				border-color: var(--blue-500);
				background: var(--blue-100);
			}
			.atlas-task-card .task-checkbox { margin: 0; flex-shrink: 0; }
			.atlas-task-main { flex: 1; min-width: 0; }
			.atlas-task-subject {
				font-size: var(--text-sm);
				font-weight: 500;
				color: var(--text-color);
				margin-bottom: 4px;
			}
			.atlas-task-badges {
				display: flex;
				align-items: center;
				gap: 6px;
				flex-wrap: wrap;
			}
			.atlas-task-meta {
				font-size: var(--text-xs);
				color: var(--text-muted);
			}
			.atlas-task-avatars {
				display: flex;
				align-items: center;
				gap: 4px;
				flex-shrink: 0;
			}
			.atlas-task-avatar {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 24px;
				height: 24px;
				border-radius: 50%;
				color: #fff;
				font-size: 9px;
				font-weight: 700;
				flex-shrink: 0;
				box-shadow: 0 0 0 2px var(--card-bg);
			}
			.atlas-task-card .task-form-link {
				visibility: hidden;
				opacity: 0;
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 26px;
				height: 26px;
				border-radius: var(--border-radius-sm);
				border: 1px solid var(--border-color);
				background: var(--card-bg);
				color: var(--text-light);
				cursor: pointer;
				transition: opacity 0.15s, background 0.15s, color 0.15s;
				flex-shrink: 0;
			}
			.atlas-task-card:hover .task-form-link { visibility: visible; opacity: 1; }
			.atlas-task-card .task-form-link:hover { color: var(--text-color); background: var(--control-bg-on-gray); }
			.atlas-cycle-card { margin-bottom: 8px; }
			.atlas-cycle-card .atlas-section-header { background: var(--card-bg); }
			.atlas-cycle-card.is-active .atlas-section-header { background: linear-gradient(to right, var(--green-100), var(--card-bg)); }
			.atlas-progress {
				width: 64px;
				height: 6px;
				background: var(--control-bg-on-gray);
				border-radius: 3px;
				overflow: hidden;
				flex-shrink: 0;
			}
			.atlas-progress > div {
				height: 100%;
				border-radius: 3px;
			}
			.atlas-actions-bar {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 12px;
				flex-wrap: wrap;
				background: var(--blue-100);
				border: 1px solid var(--blue-200);
				border-radius: var(--border-radius-md);
				padding: 12px 16px;
				box-shadow: var(--shadow-sm);
			}
			.atlas-actions-bar .atlas-actions-info { min-width: 0; }
			.atlas-actions-bar .atlas-actions-info strong { color: var(--blue-700); }
			.atlas-actions-bar .atlas-actions-info div { font-size: var(--text-xs); color: var(--blue-700); }
			.atlas-loading,
			.atlas-error {
				background: var(--card-bg);
				border: 1px solid var(--border-color);
				border-radius: var(--border-radius-md);
				padding: 32px 16px;
				text-align: center;
				color: var(--text-muted);
				font-size: var(--text-sm);
			}
			.atlas-creator {
				display: flex;
				gap: 8px;
				align-items: center;
				padding: 0 10px 6px;
			}
			.atlas-creator .new-task-input { flex: 1; }
			.atlas-new-sprint-strip {
				text-align: center;
				padding: 18px;
				background: var(--card-bg);
				border: 1px dashed var(--border-color);
				border-radius: var(--border-radius-sm);
				color: var(--text-muted);
				font-size: var(--text-xs);
			}
			.sortable-ghost {
				opacity: 0.45;
				background: var(--control-bg-on-gray);
				border: 1.5px dashed var(--text-light);
				box-shadow: none;
			}
			.sortable-drag {
				opacity: 1;
				background: var(--card-bg);
				box-shadow: var(--shadow-md);
				transform: rotate(2deg);
				z-index: 1000;
			}
			.atlas-search {
				position: relative;
				display: inline-flex;
				align-items: center;
			}
			.atlas-search > .icon {
				position: absolute;
				left: 8px;
				top: 50%;
				transform: translateY(-50%);
				color: var(--text-muted);
				pointer-events: none;
			}
			.atlas-search-input {
				padding-left: 28px;
				padding-right: 26px;
				min-width: 200px;
			}
			.atlas-search-clear {
				position: absolute;
				right: 4px;
				top: 50%;
				transform: translateY(-50%);
				border: none;
				background: transparent;
				color: var(--text-muted);
				padding: 2px;
				cursor: pointer;
				display: inline-flex;
				align-items: center;
				justify-content: center;
				border-radius: var(--border-radius-sm);
			}
			.atlas-search-clear:hover {
				color: var(--text-color);
				background: var(--control-bg-on-gray);
			}
			.atlas-stats {
				display: flex;
				align-items: center;
				gap: 6px;
				flex-wrap: wrap;
			}
			.atlas-stat {
				display: inline-flex;
				align-items: center;
				gap: 5px;
				font-size: var(--text-xs);
				color: var(--text-muted);
				background: var(--control-bg);
				border: 1px solid var(--border-color);
				border-radius: var(--border-radius-full);
				padding: 3px 10px;
			}
			.atlas-stat .icon { color: var(--text-muted); }
			.atlas-stat b { color: var(--text-color); font-weight: 600; }
			.atlas-spinner {
				width: 16px;
				height: 16px;
				border: 2px solid var(--border-color);
				border-top-color: var(--text-light);
				border-radius: 50%;
				display: inline-block;
				vertical-align: middle;
				animation: atlas-spin 0.8s linear infinite;
			}
			@keyframes atlas-spin {
				to { transform: rotate(360deg); }
			}
			.atlas-loading,
			.atlas-error { padding: 24px 16px; }
		`;
		document.head.appendChild(style);
	}

	ensure_sortable(callback) {
		if (window.Sortable) {
			if (callback) callback();
			return;
		}
		if (this._sortable_loading) {
			if (callback) (this._sortable_callbacks = this._sortable_callbacks || []).push(callback);
			return;
		}
		this._sortable_loading = true;
		const script = document.createElement("script");
		script.src = ATLAS_SORTABLE_CDN;
		script.onload = () => {
			this._sortable_loading = false;
			const callbacks = this._sortable_callbacks || [];
			this._sortable_callbacks = [];
			callbacks.forEach((cb) => cb());
			if (callback) callback();
		};
		script.onerror = () => {
			this._sortable_loading = false;
			frappe.show_alert({
				message: __("Drag & drop is unavailable (SortableJS could not be loaded)"),
				indicator: "orange",
			});
		};
		document.head.appendChild(script);
	}

	set_project(project_name) {
		if (this.project_name === project_name && this.data.backlog) return;
		this.project_name = project_name;
		this.selected_tasks.clear();
		this.expanded_cycles.clear();
		this.destroy_sortables();
		this.render_empty();
		if (project_name) {
			this.fetch_data();
		}
	}

	render_empty() {
		this.$toolbar.empty();
		this.$actions.addClass("hidden").empty();
		this.$body.empty();
		if (!this.project_name) {
			this.$body.html(`
				<div class="atlas-error">
					<h4 style="font-size: var(--text-md); font-weight: 500; color: var(--text-color); margin-bottom: 8px;">${__("No Project Selected")}</h4>
					<p>${__("Open a project and click Backlog View from the Project form.")}</p>
				</div>
			`);
		}
	}

	fetch_data() {
		this.$body.html(`
			<div class="atlas-loading">
				<span class="atlas-spinner"></span>
				<div style="margin-top: 8px;">${__("Loading backlog...")}</div>
			</div>
		`);
		frappe.call({
			method: "infintrix_atlas.api.tasks.backlog",
			args: { project: this.project_name },
			callback: (r) => {
				if (r.message && !r.message.error) {
					this.data = r.message;
					this.is_scrum = this.data.is_scrum;
					this.active_cycle_name = this.data.active_cycle_name;
					if (this.active_cycle_name && this.data.cycles) {
						const active = this.data.cycles.find((c) => c.name === this.active_cycle_name);
						if (active) this.expanded_cycles.add(active.name);
					}
					this.render();
					if (this.opts.on_loaded) this.opts.on_loaded(this);
				} else {
					this.$body.html(`
						<div class="atlas-error">
							${frappe.utils.icon("circle-alert", "sm")}
							<div>${__("Failed to load backlog.")}</div>
							<button class="btn btn-default btn-xs atlas-retry" style="margin-top: 10px;">${frappe.utils.icon("refresh-cw", "xs")} ${__("Retry")}</button>
						</div>
					`);
					this.$body.find(".atlas-retry").on("click", () => this.fetch_data());
				}
			},
		});
	}

	render_stats() {
		const all = this.data.all_tasks || [];
		const total = all.length;
		const in_progress = all.filter((t) => ["Working", "In Progress"].includes(t.status)).length;
		const completed = all.filter((t) => ["Completed", "Done"].includes(t.status)).length;
		const backlog_count = (this.data.backlog || []).length;

		this.$body.append(`
			<div class="atlas-stats">
				<span class="atlas-stat">${frappe.utils.icon("list", "xs")} <b>${total}</b> ${__("total")}</span>
				<span class="atlas-stat">${frappe.utils.icon("inbox", "xs")} <b>${backlog_count}</b> ${__("backlog")}</span>
				<span class="atlas-stat">${frappe.utils.icon("activity", "xs")} <b>${in_progress}</b> ${__("in progress")}</span>
				<span class="atlas-stat">${frappe.utils.icon("check", "xs")} <b>${completed}</b> ${__("completed")}</span>
			</div>
		`);
	}

	render() {
		this.$toolbar.empty();
		this.$actions.addClass("hidden").empty();
		this.$body.empty();
		this.destroy_sortables();

		this.render_toolbar();
		this.render_stats();
		this.render_actions();
		if (this.is_scrum) {
			this.render_cycles();
		}
		this.render_backlog();
		this.apply_search();
		this.ensure_sortable(() => this.init_sortables());
	}

	render_toolbar() {
		const mode_badge = this.is_scrum
			? `<span class="indicator-pill blue">${__("Scrum")}</span>`
			: `<span class="indicator-pill green">${__("Kanban")}</span>`;

		const active_badge = this.active_cycle_name
			? `<span class="indicator-pill orange">${__("Active")}: ${frappe.utils.escape_html(this.data.active_cycle_name)}</span>`
			: "";

		if (this.embedded) {
			this.$toolbar.html(`
				<div class="atlas-toolbar-card">
					<div class="atlas-toolbar-badges">${mode_badge}${active_badge}</div>
					<div class="atlas-toolbar-right">${this._search_html()}</div>
				</div>
			`);
			this._bind_search();
			return;
		}

		const sprint_btn = this.is_scrum
			? `<button class="btn btn-primary btn-xs new-sprint-btn">${frappe.utils.icon("plus", "xs")} ${__("New Sprint")}</button>`
			: "";

		this.$toolbar.html(`
			<div class="atlas-toolbar-card">
				<div class="atlas-toolbar-left">
					<div class="atlas-toolbar-avatar">${frappe.utils.escape_html(this.project_name.slice(0, 2).toUpperCase())}</div>
					<div class="atlas-toolbar-title">
						<h1 class="ellipsis">${frappe.utils.escape_html(this.project_name)}</h1>
						<div class="atlas-toolbar-badges">${mode_badge}${active_badge}</div>
					</div>
				</div>
				<div class="atlas-toolbar-right">
					${this._search_html()}
					${sprint_btn}
					<button class="btn btn-default btn-xs refresh-backlog-btn">${frappe.utils.icon("refresh-cw", "xs")} ${__("Refresh")}</button>
				</div>
			</div>
		`);

		this._bind_search();
		this.$toolbar.find(".refresh-backlog-btn").on("click", () => this.fetch_data());
		this.$toolbar.find(".new-sprint-btn").on("click", () => this.show_new_cycle_dialog());
	}

	_search_html() {
		return `
			<div class="atlas-search" title="${__("Search tasks (press /)")}">
				${frappe.utils.icon("search", "xs")}
				<input type="text" class="form-control atlas-search-input" placeholder="${__("Search tasks...")}" value="${frappe.utils.escape_html(this.search_query)}">
				<button class="atlas-search-clear ${this.search_query ? '' : 'hide'}" title="${__("Clear")}">${frappe.utils.icon("x", "xs")}</button>
			</div>
		`;
	}

	_bind_search() {
		const me = this;
		this.$toolbar.find(".atlas-search-input").off("input").on("input", function () {
			me.search_query = this.value.trim();
			me.$toolbar.find(".atlas-search-clear").toggleClass("hide", !me.search_query);
			me.apply_search();
		});
		this.$toolbar.find(".atlas-search-clear").off("click").on("click", () => {
			me.search_query = "";
			me.$toolbar.find(".atlas-search-input").val("").trigger("focus");
			me.$toolbar.find(".atlas-search-clear").addClass("hide");
			me.apply_search();
		});
		this.$toolbar.find(".atlas-search-input").off("keydown").on("keydown", function (e) {
			if (e.key === "Escape") {
				me.search_query = "";
				$(this).val("");
				me.$toolbar.find(".atlas-search-clear").addClass("hide");
				me.apply_search();
			}
		});
	}

	apply_search() {
		const q = this.search_query.toLowerCase();
		this.$body.find(".atlas-task-card").each(function () {
			const subject = ($(this).attr("data-subject") || "").toLowerCase();
			$(this).toggle(q === "" || subject.indexOf(q) !== -1);
		});
	}

	show_new_cycle_dialog() {
		const d = new frappe.ui.Dialog({
			title: __("New Sprint / Cycle"),
			fields: [
				{ fieldname: "cycle_name", label: __("Name"), fieldtype: "Data", reqd: 1, default: `Sprint ${(this.data.cycles || []).length + 1}` },
				{ fieldname: "start_date", label: __("Start Date"), fieldtype: "Date", default: frappe.datetime.now_date() },
				{ fieldname: "end_date", label: __("End Date"), fieldtype: "Date" },
			],
			primary_action_label: __("Create"),
			primary_action: (values) => {
				frappe.call({
					method: "frappe.client.insert",
					args: {
						doc: {
							doctype: "Cycle",
							project: this.project_name,
							cycle_name: values.cycle_name,
							start_date: values.start_date,
							end_date: values.end_date,
							status: "Planned",
						},
					},
					callback: (r) => {
						if (r.message) {
							frappe.show_alert({ message: __("Cycle created"), indicator: "green" });
							this.fetch_data();
							d.hide();
						}
					},
					error: () => {
						frappe.show_alert({ message: __("Failed to create cycle"), indicator: "red" });
					},
				});
			},
		});
		d.show();
	}

	show_edit_cycle_dialog(cycle) {
		const d = new frappe.ui.Dialog({
			title: __("Edit Cycle"),
			fields: [
				{ fieldname: "cycle_name", label: __("Name"), fieldtype: "Data", reqd: 1, default: cycle.cycle_name },
				{ fieldname: "start_date", label: __("Start Date"), fieldtype: "Date", default: cycle.start_date },
				{ fieldname: "end_date", label: __("End Date"), fieldtype: "Date", default: cycle.end_date },
				{ fieldname: "status", label: __("Status"), fieldtype: "Select", options: ["Planned", "Active", "Completed", "Archived"].join("\n"), default: cycle.status, read_only: cycle.status === "Completed" },
			],
			primary_action_label: __("Save"),
			primary_action: (values) => {
				// Flow-wise: setting Active without dates asks for them instead of throwing.
				if (values.status === "Active" && (!values.start_date || !values.end_date)) {
					frappe.show_alert({ message: __("Set start and end dates before activating a sprint."), indicator: "orange" });
					return;
				}
				frappe.call({
					method: "frappe.client.set_value",
					args: {
						doctype: "Cycle",
						name: cycle.name,
						fieldname: {
							cycle_name: values.cycle_name,
							start_date: values.start_date,
							end_date: values.end_date,
							status: values.status,
						},
					},
					callback: (r) => {
						if (r.message) {
							frappe.show_alert({ message: __("Cycle updated"), indicator: "green" });
							this.fetch_data();
							d.hide();
						}
					},
					error: (r) => {
						frappe.show_alert({ message: r.message || __("Could not update cycle"), indicator: "orange" });
					},
				});
			},
		});
		d.show();
	}

	render_actions() {
		const count = this.selected_tasks.size;
		if (!count) {
			this.$actions.addClass("hidden");
			return;
		}
		const task_names = Array.from(this.selected_tasks).slice(0, 3).join(", ");
		const more = count > 3 ? ` +${count - 3} more` : "";
		this.$actions.removeClass("hidden").html(`
			<div class="atlas-actions-bar">
				<div class="atlas-actions-info">
					<strong>${count} ${__("task(s) selected")}</strong>
					<div class="ellipsis">${frappe.utils.escape_html(task_names)}${more}</div>
				</div>
				<div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
					<button class="btn btn-primary btn-xs detail-selected">${frappe.utils.icon("layout", "xs")} ${__("Detail View")}</button>
					<button class="btn btn-default btn-xs clear-selection">${frappe.utils.icon("x", "xs")} ${__("Clear")}</button>
					<button class="btn btn-danger btn-xs delete-selected">${frappe.utils.icon("trash", "xs")} ${__("Delete")}</button>
				</div>
			</div>
		`);
		this.$actions.find(".clear-selection").on("click", () => {
			this.selected_tasks.clear();
			this.$body.find(".task-checkbox").prop("checked", false);
			this.$body.find(".task-card").removeClass("selected");
			this.render_actions();
		});
		this.$actions.find(".detail-selected").on("click", () => {
			const first = Array.from(this.selected_tasks)[0];
			if (first) frappe.set_route("task_detail", first);
		});
		this.$actions.find(".delete-selected").on("click", () => this.bulk_delete());
	}

	render_cycles() {
		if (!this.is_scrum) return;
		const cycles = this.data.cycles || [];
		if (!cycles.length) {
			this.$body.append(`
				<div class="atlas-new-sprint-strip">${__("No sprints yet. Click New Sprint to start planning.")}</div>
			`);
			return;
		}

		cycles.forEach((cycle) => {
			const is_active = cycle.name === this.active_cycle_name;
			const is_expanded = this.expanded_cycles.has(cycle.name);
			const is_completed = cycle.status === "Completed";
			const tasks = cycle.tasks || [];
			const completed_count = tasks.filter((t) => t.status === "Completed").length;
			const progress = tasks.length ? Math.round((completed_count / tasks.length) * 100) : 0;
			const progress_color = is_active ? "var(--green-500)" : is_completed ? "var(--gray-500)" : "var(--blue-500)";

			const cycle_indicator = {
				Active: "green",
				Planned: "blue",
				Completed: "gray",
				Archived: "gray",
			};
			const status_badge = `<span class="indicator-pill ${cycle_indicator[cycle.status] || "gray"}">${frappe.utils.escape_html(cycle.status)}</span>`;

			const $cycle = $(`
				<div class="atlas-section-card atlas-cycle-card ${is_active ? 'is-active' : ''}" data-cycle-id="${cycle.name}">
					<div class="atlas-section-header">
						<div class="atlas-section-header-left">
							<span class="atlas-section-chevron ${is_expanded ? 'expanded' : ''}">${frappe.utils.icon("chevron-right", "sm")}</span>
							<div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
								<h3 class="ellipsis" style="margin: 0;">${frappe.utils.escape_html(cycle.cycle_name)}</h3>
								${status_badge}
							</div>
							<span class="atlas-task-meta" style="flex-shrink: 0;">(${completed_count}/${tasks.length})</span>
							<div class="atlas-progress">
								<div style="background: ${progress_color}; width: ${progress}%;"></div>
							</div>
						</div>
						<div class="atlas-section-header-right">
							<span class="atlas-task-meta">${cycle.start_date || "TBD"} - ${cycle.end_date || "TBD"}</span>
							<button class="btn btn-default btn-xs cycle-menu-btn" style="padding: 4px;">
								<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="4" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="12" r="1.5"/></svg>
							</button>
						</div>
					</div>
					<div class="atlas-dropzone cycle-dropzone ${is_expanded ? '' : 'collapsed'}" data-cycle-id="${cycle.name}"></div>
				</div>
			`);

			$cycle.find(".atlas-section-header").on("click", (e) => {
				if ($(e.target).closest(".cycle-menu-btn").length) return;
				if (is_expanded) this.expanded_cycles.delete(cycle.name);
				else this.expanded_cycles.add(cycle.name);
				this.render();
			});

			$cycle.find(".cycle-menu-btn").on("click", (e) => {
				e.stopPropagation();
				this.show_cycle_menu(cycle, $(e.currentTarget));
			});

			const $dropzone = $cycle.find(".cycle-dropzone");
			if (tasks.length) {
				tasks.forEach((task) => {
					const $card = this.task_card_html(task);
					if (!is_expanded) $card.css("display", "none");
					$dropzone.append($card);
				});
			} else if (is_expanded) {
				$dropzone.append(`<div class="atlas-empty">${__("No tasks. Drag tasks here from the backlog.")}</div>`);
			}
			if (!is_expanded) {
				$dropzone.append(`<div class="atlas-drop-hint">${frappe.utils.icon("chevron-down", "xs")} ${__("Drop tasks here or click to expand")}</div>`);
			}

			this.$body.append($cycle);
		});
	}

	show_cycle_menu(cycle, $btn) {
		const items = [];
		if (cycle.status === "Planned" && !this.active_cycle_name) {
			items.push({ label: __("Start Sprint"), action: () => this.start_cycle(cycle), color: "var(--green-500)" });
		}
		if (cycle.status === "Active") {
			items.push({ label: __("Complete Sprint"), action: () => this.complete_cycle(cycle), color: "var(--blue-500)" });
		}
		items.push({ label: __("Edit"), action: () => this.show_edit_cycle_dialog(cycle), color: "var(--text-color)" });
		if (cycle.status !== "Active") {
			items.push({ label: __("Delete"), action: () => this.delete_cycle(cycle.name), color: "var(--red-500)" });
		}
		items.push({ label: __("Open in Form"), action: () => frappe.set_route("Form", "Cycle", cycle.name), color: "var(--text-color)" });

		const offset = $btn.offset();
		const left = Math.max(8, Math.min(offset.left - 140, $(window).width() - 180));
		const $menu = $(`
			<div class="atlas-cycle-menu"
				style="position: fixed; z-index: 9999; display: block; min-width: 160px; padding: 4px 0; top: ${offset.top + $btn.outerHeight()}px; left: ${left}px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); box-shadow: var(--shadow-lg);">
				${items.map((i) => `<a href="#" class="dropdown-item" style="display: block; padding: 8px 12px; font-size: var(--text-sm); color: ${i.color}; text-decoration: none;">${i.label}</a>`).join("")}
			</div>
		`);

		$("body").append($menu);

		const close_menu = () => $menu.remove();

		$menu.find("a").on("click", (e) => {
			e.preventDefault();
			const label = $(e.target).text();
			const item = items.find((i) => i.label === label);
			if (item) item.action();
			close_menu();
		});

		setTimeout(() => {
			$(document).one("click", close_menu);
		}, 0);
	}

	start_cycle(cycle) {
		const do_start = (values) => {
			frappe.call({
				method: "infintrix_atlas.api.cycles.start_cycle",
				args: {
					name: cycle.name,
					cycle_name: cycle.cycle_name,
					duration: cycle.duration,
					start_date: values.start_date || cycle.start_date,
					end_date: values.end_date || cycle.end_date,
				},
				callback: (r) => {
					const msg = r.message || {};
					if (msg.success) {
						frappe.show_alert({ message: msg.message || __("Sprint started"), indicator: "green" });
						this.fetch_data();
					} else if (msg.code === "another_active") {
						this.handle_active_cycle_conflict(msg);
					} else {
						frappe.show_alert({ message: msg.message || __("Could not start sprint"), indicator: "orange" });
					}
				},
			});
		};

		// Already has dates? Start directly. Otherwise ask for dates in a modal.
		if (cycle.start_date && cycle.end_date) {
			do_start({});
			return;
		}

		const d = new frappe.ui.Dialog({
			title: __("Start Sprint"),
			fields: [
				{ fieldname: "start_date", label: __("Start Date"), fieldtype: "Date", reqd: 1, default: cycle.start_date || frappe.datetime.now_date() },
				{ fieldname: "end_date", label: __("End Date"), fieldtype: "Date", reqd: 1, default: cycle.end_date || frappe.datetime.add_days(frappe.datetime.now_date(), 7) },
			],
			primary_action_label: __("Start"),
			primary_action: (values) => {
				d.hide();
				do_start(values);
			},
		});
		d.show();
	}

	handle_active_cycle_conflict(msg) {
		const d = new frappe.ui.Dialog({
			title: __("Another Sprint is Active"),
			fields: [
				{
					fieldname: "message",
					fieldtype: "HTML",
					options: `<p class="mb-0">${frappe.utils.escape_html(msg.message || __("Another sprint is already active."))}</p>`,
				},
			],
			primary_action_label: __("Open Active Sprint"),
			primary_action: () => {
				d.hide();
				if (msg.active_cycle) frappe.set_route("Form", "Cycle", msg.active_cycle);
			},
		});
		d.show();
	}

	complete_cycle(cycle) {
		const open_tasks = (cycle.tasks || []).filter((t) => t.status !== "Completed");
		const completed_count = (cycle.tasks || []).filter((t) => t.status === "Completed").length;

		const do_complete = (move_tasks_to) => {
			frappe.call({
				method: "infintrix_atlas.api.cycles.complete_cycle",
				args: { name: cycle.name, move_tasks_to },
				callback: (r) => {
					const msg = r.message || {};
					if (msg.success) {
						frappe.show_alert({ message: msg.message || __("Sprint completed"), indicator: "green" });
						this.fetch_data();
					} else {
						frappe.show_alert({ message: msg.message || __("Could not complete sprint"), indicator: "orange" });
					}
				},
			});
		};

		// No open tasks — just confirm and complete.
		if (!open_tasks.length) {
			frappe.confirm(
				__("Complete this sprint? All tasks in it are completed."),
				() => do_complete(),
				() => {}
			);
			return;
		}

		// Open tasks exist — ask where to move them instead of blocking.
		const planned_cycles = (this.data.cycles || []).filter((c) => c.status === "Planned" && c.name !== cycle.name);
		const options = planned_cycles.map((c) => ({ label: c.cycle_name, value: c.name }));
		options.push({ label: __("Backlog (no sprint)"), value: "" });

		const d = new frappe.ui.Dialog({
			title: __("Complete Sprint"),
			fields: [
				{
					fieldname: "info",
					fieldtype: "HTML",
					options: `<p class="mb-0">${__("This sprint has {0} completed and {1} open work items. Where should the open items go?", [completed_count, open_tasks.length])}</p>`,
				},
				{ fieldname: "move_tasks_to", label: __("Move open work items to"), fieldtype: "Select", options, reqd: 1 },
			],
			primary_action_label: __("Complete Sprint"),
			primary_action: (values) => {
				d.hide();
				do_complete(values.move_tasks_to);
			},
		});
		d.show();
	}

	delete_cycle(cycle_name) {
		frappe.confirm(
			__("Delete this sprint? Tasks will be moved back to backlog."),
			() => {
				frappe.call({
					method: "frappe.client.delete",
					args: { doctype: "Cycle", name: cycle_name },
					callback: () => {
						frappe.show_alert({ message: __("Sprint deleted"), indicator: "green" });
						this.fetch_data();
					},
					error: (r) => {
						frappe.show_alert({ message: r.message || __("Cannot delete sprint"), indicator: "red" });
					},
				});
			}
		);
	}

	render_backlog() {
		const tasks = this.data.backlog || [];
		const is_expanded = this._backlog_expanded !== false;

		const $backlog = $(`
			<div class="atlas-section-card">
				<div class="atlas-section-header">
					<div class="atlas-section-header-left">
						${frappe.utils.icon("folder-open", "sm")}
						<div class="atlas-section-title">
							<h3>${__("Backlog")}</h3>
							<p class="atlas-section-subtitle">${tasks.length} ${__("work items")}</p>
						</div>
					</div>
					<div class="atlas-section-header-right">
						<span class="atlas-section-chevron ${is_expanded ? 'expanded' : ''}">${frappe.utils.icon("chevron-down", "sm")}</span>
					</div>
				</div>
				<div class="atlas-creator" style="${is_expanded ? '' : 'display: none;'}">
					<input type="text" class="new-task-input form-control" placeholder="${__("Add a task to backlog...")}">
					<button class="btn btn-primary btn-xs add-task-btn">${frappe.utils.icon("plus", "xs")} ${__("Add")}</button>
				</div>
				<div class="atlas-dropzone backlog-dropzone ${is_expanded ? '' : 'collapsed'}" data-backlog="true"></div>
			</div>
		`);

		$backlog.find(".atlas-section-header").on("click", () => {
			this._backlog_expanded = !is_expanded;
			this.render();
		});

		const $input = $backlog.find(".new-task-input");
		const do_create = () => {
			const subject = $input.val().trim();
			if (subject) this.create_task(subject, $input);
		};
		$backlog.find(".add-task-btn").on("click", do_create);
		$input.on("keydown", (e) => { if (e.key === "Enter") do_create(); });

		const $dropzone = $backlog.find(".backlog-dropzone");
		if (tasks.length) {
			tasks.forEach((task) => {
				const $card = this.task_card_html(task);
				if (!is_expanded) $card.css("display", "none");
				$dropzone.append($card);
			});
		} else if (is_expanded) {
			$dropzone.append(`<div class="atlas-empty">${__("No backlog items. Add a task above.")}</div>`);
		}
		if (!is_expanded) {
			$dropzone.append(`<div class="atlas-drop-hint">${frappe.utils.icon("chevron-down", "xs")} ${__("Drop tasks here or click to expand")}</div>`);
		}

		this.$body.append($backlog);
		this.bind_task_events();
	}

	init_sortables() {
		this.destroy_sortables();
		if (!window.Sortable) return;

		const me = this;

		this.$body.find(".cycle-dropzone").each(function () {
			const cycle_id = $(this).data("cycle-id");
			const sortable = Sortable.create(this, {
				group: { name: "atlas-tasks", pull: true, put: true },
				draggable: ".atlas-task-card",
				animation: 150,
				forceFallback: true,
				ghostClass: "sortable-ghost",
				dragClass: "sortable-drag",
				onStart: () => { me._dragging = true; },
				onEnd: () => { setTimeout(() => { me._dragging = false; }, 50); },
				onAdd: function (evt) {
					const task_id = evt.item.getAttribute("data-task");
					const from_cycle = $(evt.from).data("cycle-id");
					const to_cycle = cycle_id;

					if (to_cycle === me.active_cycle_name) {
						frappe.show_alert({ message: __("Cannot move task into active sprint. Complete the active sprint first."), indicator: "orange" });
						me.fetch_data();
						return;
					}
					if (from_cycle === to_cycle) return;

					if (!me.expanded_cycles.has(to_cycle)) {
						me.expanded_cycles.add(to_cycle);
					}
					me.move_task(task_id, "cycle", to_cycle);
				},
			});
			me.sortables.push(sortable);
		});

		const $backlog_dropzone = this.$body.find(".backlog-dropzone");
		if ($backlog_dropzone.length) {
			const backlog_sortable = Sortable.create($backlog_dropzone[0], {
				group: { name: "atlas-tasks", pull: true, put: true },
				draggable: ".atlas-task-card",
				animation: 150,
				forceFallback: true,
				ghostClass: "sortable-ghost",
				dragClass: "sortable-drag",
				onStart: () => { me._dragging = true; },
				onEnd: () => { setTimeout(() => { me._dragging = false; }, 50); },
				onAdd: function (evt) {
					const task_id = evt.item.getAttribute("data-task");
					const from_cycle = $(evt.from).data("cycle-id");
					if (!from_cycle) return; // same list
					me.move_task(task_id, "backlog", "Open");
				},
			});
			me.sortables.push(backlog_sortable);
		}
	}

	destroy_sortables() {
		this.sortables.forEach((s) => s.destroy());
		this.sortables = [];
	}

	task_card_html(task) {
		const status_indicator = {
			"Open": "gray",
			"Todo": "blue",
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
		const priority_indicator = {
			"Low": "gray",
			"Medium": "yellow",
			"High": "orange",
			"Urgent": "red",
		};
		const s = status_indicator[task.status] || "gray";
		const p = priority_indicator[task.priority] || "gray";
		const is_selected = this.selected_tasks.has(task.id);
		const assignees = task.assignee ? task.assignee.split(",").map((a) => a.trim()).filter(Boolean) : [];

		return $(`
			<div class="atlas-task-card task-card ${is_selected ? 'selected' : ''}" data-task="${task.id}" data-subject="${frappe.utils.escape_html(task.subject)}">
				<input type="checkbox" class="task-checkbox" data-task="${task.id}" ${is_selected ? 'checked' : ''}>
				<div class="atlas-task-main">
					<div class="atlas-task-subject ellipsis">${frappe.utils.escape_html(task.subject)}</div>
					<div class="atlas-task-badges">
						<span class="indicator-pill ${s}">${frappe.utils.escape_html(task.status)}</span>
						<span class="indicator-pill ${p}">${frappe.utils.escape_html(task.priority || "Low")}</span>
						${task.type ? `<span class="indicator-pill light-blue">${frappe.utils.escape_html(task.type)}</span>` : ""}
						<span class="atlas-task-meta">${frappe.datetime.prettyDate(task.modified)}</span>
					</div>
				</div>
				<div class="atlas-task-avatars">
					${assignees.map((a) => this._avatar_html(a)).join("")}
					<button class="task-form-link" title="${__("Open in Task form")}">${frappe.utils.icon("pencil", "sm")}</button>
				</div>
			</div>
		`);
	}

	_avatar_html(user_id) {
		const name = user_id.split("@")[0];
		const parts = name.split(/[._-]/);
		const initials = parts.map((s) => s[0]).join("").toUpperCase().slice(0, 2);
		const colors = ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#14b8a6", "#06b6d4", "#84cc16"];
		const color = colors[name.length % colors.length];
		return `<span class="atlas-task-avatar" title="${frappe.utils.escape_html(user_id)}" style="background: ${color};">${initials}</span>`;
	}

	bind_task_events() {
		const me = this;

		this.$body.find(".task-checkbox").off("change").on("change", function () {
			const task_id = $(this).data("task");
			if (this.checked) me.selected_tasks.add(task_id);
			else me.selected_tasks.delete(task_id);
			$(this).closest(".task-card").toggleClass("selected", this.checked);
			me.render_actions();
		});

		this.$body.find(".task-card").off("click").on("click", function (e) {
			if (me._dragging) return;
			if ($(e.target).is(".task-checkbox, input, button")) return;
			const task_id = $(this).data("task");
			frappe.set_route("task_detail", task_id);
		});

		this.$body.find(".task-form-link").off("click").on("click", function (e) {
			e.stopPropagation();
			const task_id = $(this).closest(".task-card").data("task");
			frappe.set_route("Form", "Task", task_id);
		});
	}

	create_task(subject, $input) {
		$input.prop("disabled", true);
		frappe.call({
			method: "frappe.client.insert",
			args: {
				doc: {
					doctype: "Task",
					subject: subject,
					project: this.project_name,
					status: "Open",
					priority: "Medium",
				},
			},
			callback: (r) => {
				$input.prop("disabled", false).val("");
				if (r.message) {
					frappe.show_alert({ message: __("Task created"), indicator: "green" });
					this.fetch_data();
				}
			},
			error: () => {
				$input.prop("disabled", false);
				frappe.show_alert({ message: __("Failed to create task"), indicator: "red" });
			},
		});
	}

	move_task(task_id, type, target_id) {
		if (type === "cycle" && target_id === this.active_cycle_name) {
			frappe.show_alert({ message: __("Cannot move task into active sprint. Complete the active sprint first."), indicator: "orange" });
			this.fetch_data();
			return;
		}

		frappe.call({
			method: "infintrix_atlas.api.tasks.set_backlog_position",
			args: {
				type,
				task_name: task_id,
				target_id: target_id === "Open" ? null : target_id,
			},
			callback: (r) => {
				const msg = r.message || {};
				if (msg.success) {
					frappe.show_alert({ message: msg.message || __("Moved"), indicator: "green" });
				} else {
					frappe.show_alert({ message: msg.message || __("Move failed"), indicator: "red" });
				}
				this.fetch_data();
			},
		});
	}

	bulk_delete() {
		const task_names = Array.from(this.selected_tasks);
		if (!task_names.length) return;
		frappe.confirm(
			__(`Delete ${task_names.length} selected task(s)? This cannot be undone.`),
			() => {
				frappe.call({
					method: "infintrix_atlas.api.tasks.bulk_delete_tasks",
					args: { task_names: JSON.stringify(task_names) },
					callback: (r) => {
						const msg = r.message || {};
						if (msg.success) {
							frappe.show_alert({ message: msg.message, indicator: "green" });
							this.selected_tasks.clear();
							this.fetch_data();
						} else {
							frappe.show_alert({ message: msg.message || __("Delete failed"), indicator: "red" });
						}
					},
				});
			}
		);
	}
}

window.backlog_drop_handler = function (event, type, target_id) {
	event.preventDefault();
	const task_id = event.dataTransfer.getData("text/plain");
	if (!task_id) return;
	const page = frappe.pages["project_backlog"];
	if (page && page.backlog) {
		page.backlog.move_task(task_id, type, target_id);
	}
};
