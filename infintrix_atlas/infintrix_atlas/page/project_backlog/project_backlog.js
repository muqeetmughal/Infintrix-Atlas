frappe.pages["project_backlog"].on_page_load = function (wrapper) {
	if (!window.Sortable) {
		const script = document.createElement("script");
		script.src = "https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js";
		script.onload = () => {
			const page = wrapper.page;
			if (page.backlog) page.backlog.init_sortables();
		};
		document.head.appendChild(script);
	}

	if (!document.getElementById("backlog-page-styles")) {
		const style = document.createElement("style");
		style.id = "backlog-page-styles";
		style.textContent = `
			.sortable-ghost { opacity: 0.4; background: #f4f5f6; border: 1px dashed #8d99a6; }
			.sortable-drag { opacity: 1; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transform: rotate(2deg); }
		`;
		document.head.appendChild(style);
	}

	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Backlog View"),
		single_column: true,
	});
	page.backlog = new BacklogPage(wrapper, page);
};

frappe.pages["project_backlog"].on_page_show = function (wrapper) {
	const route = frappe.get_route();
	const project_name = route[1] || "";
	const page = wrapper.page;
	if (page.backlog) {
		page.backlog.set_project(project_name);
	}
};

class BacklogPage {
	constructor(wrapper, page) {
		this.wrapper = wrapper;
		this.page = page;
		this.project_name = "";
		this.data = {};
		this.selected_tasks = new Set();
		this.is_scrum = false;
		this.active_cycle_name = null;
		this.expanded_cycles = new Set();
		this._backlog_expanded = true;
		this.sortables = [];

		this.$container = $(this.wrapper).find(".layout-main-section");
		this.$container.empty();
		this.$container.css("background", "#f4f5f6");

		this.$content = $(`
			<div class="backlog-page" style="min-height: calc(100vh - 120px);">
				<div class="backlog-toolbar" style="margin-bottom: 16px;"></div>
				<div class="backlog-actions hidden" style="margin-bottom: 12px;"></div>
				<div class="backlog-body" style="display: flex; flex-direction: column; gap: 12px; padding-bottom: 24px;"></div>
			</div>
		`).appendTo(this.$container);

		this.$toolbar = this.$content.find(".backlog-toolbar");
		this.$actions = this.$content.find(".backlog-actions");
		this.$body = this.$content.find(".backlog-body");
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
				<div style="color: #8d99a6; text-align: center; padding: 64px;">
					<h4 style="font-size: 16px; font-weight: 500; color: #5f6a72; margin-bottom: 8px;">${__("No Project Selected")}</h4>
					<p style="font-size: 13px;">${__("Open a project and click Backlog View from the Project form.")}</p>
				</div>
			`);
		}
	}

	fetch_data() {
		this.$body.html(`<div style="color: #8d99a6; text-align: center; padding: 40px; font-size: 13px;">${__("Loading backlog...")}</div>`);
		frappe.call({
			method: "infintrix_atlas.api.v1.backlog",
			args: { project: this.project_name },
			callback: (r) => {
				if (r.message && !r.message.error) {
					this.data = r.message;
					this.is_scrum = this.data.is_scrum;
					this.active_cycle_name = this.data.active_cycle_name;
					if (this.active_cycle_name && this.data.cycles) {
						const active = this.data.cycles.find(c => c.name === this.active_cycle_name);
						if (active) this.expanded_cycles.add(active.name);
					}
					this.render();
					if (window.Sortable) this.init_sortables();
				} else {
					this.$body.html(`<div style="color: #c0392b; text-align: center; padding: 40px; font-size: 13px;">${__("Failed to load backlog.")}</div>`);
				}
			},
		});
	}

	render() {
		this.$toolbar.empty();
		this.$actions.addClass("hidden").empty();
		this.$body.empty();
		this.selected_tasks.clear();
		this.destroy_sortables();

		this.render_toolbar();
		this.render_actions();
		if (this.is_scrum) {
			this.render_cycles();
		}
		this.render_backlog();
		if (window.Sortable) this.init_sortables();
	}

	render_toolbar() {
		const mode_badge = this.is_scrum
			? `<span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: #ebf5fb; color: #3498db; border: 1px solid #aed6f1;">${__("Scrum")}</span>`
			: `<span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: #eafaf1; color: #27ae60; border: 1px solid #abebc6;">${__("Kanban")}</span>`;

		const active_badge = this.active_cycle_name
			? `<span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: #fef5e7; color: #e67e22; border: 1px solid #f5cba7; margin-left: 8px;">${__("Active")}: ${frappe.utils.escape_html(this.data.active_cycle_name)}</span>`
			: "";

		let sprint_btn = "";
		if (this.is_scrum) {
			sprint_btn = `<button id="new-sprint-btn" class="btn btn-primary btn-xs" style="margin-right: 8px;">${__("+ New Sprint")}</button>`;
		}

		this.$toolbar.html(`
			<div style="display: flex; align-items: center; justify-content: space-between; background: #fff; border-radius: 8px; border: 1px solid #d1d8dd; padding: 12px 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
				<div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
					<div style="width: 32px; height: 32px; border-radius: 6px; background: linear-gradient(135deg, #5e64ff, #8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; flex-shrink: 0;">
						${this.project_name.slice(0, 2).toUpperCase()}
					</div>
					<div style="min-width: 0;">
						<h1 class="ellipsis" style="font-size: 13px; font-weight: 600; color: #36414c; margin: 0;">${frappe.utils.escape_html(this.project_name)}</h1>
						<div style="display: flex; align-items: center; gap: 8px; margin-top: 2px;">${mode_badge}${active_badge}</div>
					</div>
				</div>
				<div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
					${sprint_btn}
					<button id="refresh-backlog-btn" class="btn btn-default btn-xs">${__("Refresh")}</button>
				</div>
			</div>
		`);

		this.$toolbar.find("#refresh-backlog-btn").on("click", () => this.fetch_data());
		this.$toolbar.find("#new-sprint-btn").on("click", () => this.show_new_cycle_dialog());
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
			<div style="display: flex; align-items: center; justify-content: space-between; background: #fdedec; border: 1px solid #f5b7b1; border-radius: 8px; padding: 12px 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
				<div style="min-width: 0;">
					<span style="font-size: 13px; font-weight: 600; color: #c0392b;">${count} ${__("task(s) selected")}</span>
					<div class="ellipsis" style="font-size: 12px; color: #e74c3c; margin-top: 2px;">${task_names}${more}</div>
				</div>
				<div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
					<button class="clear-selection btn btn-default btn-xs">${__("Clear")}</button>
					<button class="delete-selected btn btn-danger btn-xs">${__("Delete")}</button>
				</div>
			</div>
		`);
		this.$actions.find(".clear-selection").on("click", () => {
			this.selected_tasks.clear();
			this.$body.find(".task-checkbox").prop("checked", false);
			this.$body.find(".task-card").removeClass("selected").css({ background: "#fff", borderColor: "#d1d8dd" });
			this.render_actions();
		});
		this.$actions.find(".delete-selected").on("click", () => this.bulk_delete());
	}

	render_cycles() {
		if (!this.is_scrum) return;
		const cycles = this.data.cycles || [];
		if (!cycles.length) {
			this.$body.append(`
				<div style="text-align: center; padding: 32px; background: #fff; border-radius: 8px; border: 1px dashed #d1d8dd;">
					<p style="color: #8d99a6; font-size: 13px;">${__("No sprints yet. Click + New Sprint to start planning.")}</p>
				</div>
			`);
			return;
		}

		cycles.forEach(cycle => {
			const is_active = cycle.name === this.active_cycle_name;
			const is_expanded = this.expanded_cycles.has(cycle.name);
			const is_completed = cycle.status === "Completed";
			const tasks = cycle.tasks || [];
			const completed_count = tasks.filter(t => t.status === "Completed").length;
			const progress = tasks.length ? Math.round((completed_count / tasks.length) * 100) : 0;

			let status_badge = "";
			if (is_active) {
				status_badge = `<span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; background: #d5f5e3; color: #27ae60; border: 1px solid #abebc6;">${__("ACTIVE")}</span>`;
			} else if (is_completed) {
				status_badge = `<span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; background: #f0f4f7; color: #8d99a6; border: 1px solid #d1d8dd;">${__("DONE")}</span>`;
			} else if (cycle.status === "Planned") {
				status_badge = `<span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; background: #ebf5fb; color: #3498db; border: 1px solid #aed6f1;">${__("PLANNED")}</span>`;
			} else {
				status_badge = `<span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; background: #f0f4f7; color: #8d99a6; border: 1px solid #d1d8dd;">${frappe.utils.escape_html(cycle.status)}</span>`;
			}

			const $cycle = $(`
				<div class="cycle-card" style="background: #fff; border-radius: 8px; border: 1px solid ${is_active ? '#abebc6' : '#d1d8dd'}; overflow: hidden; box-shadow: ${is_active ? '0 1px 3px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.04)'};" data-cycle="${cycle.name}" data-cycle-id="${cycle.name}">
					<div class="cycle-header" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; cursor: pointer; transition: background 0.2s; background: ${is_active ? 'linear-gradient(to right, #eafaf1, #fff)' : '#fff'}; border-bottom: ${is_expanded ? '1px solid #eef0f2' : 'none'};" onmouseover="this.style.background='${is_active ? 'linear-gradient(to right, #eafaf1, #fff)' : '#f4f5f6'}'" onmouseout="this.style.background='${is_active ? 'linear-gradient(to right, #eafaf1, #fff)' : '#fff'}'">
						<div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
							<span style="color: #8d99a6; font-size: 12px; transition: transform 0.2s; display: inline-block; transform: ${is_expanded ? 'rotate(90deg)' : 'none'};">&#9656;</span>
							<div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
								<h3 class="ellipsis" style="font-size: 13px; font-weight: 600; color: #36414c; margin: 0;">${frappe.utils.escape_html(cycle.cycle_name)}</h3>
								${status_badge}
							</div>
							<span style="font-size: 12px; color: #8d99a6; flex-shrink: 0;">(${completed_count}/${tasks.length})</span>
							<div style="width: 64px; height: 6px; background: #f0f4f7; border-radius: 3px; overflow: hidden; flex-shrink: 0;">
								<div style="height: 100%; border-radius: 3px; background: ${is_active ? '#2ecc71' : (is_completed ? '#8d99a6' : '#3498db')}; width: ${progress}%;"></div>
							</div>
						</div>
						<div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: 12px;">
							<span style="font-size: 11px; color: #8d99a6;">${cycle.start_date || "TBD"} - ${cycle.end_date || "TBD"}</span>
							<button class="cycle-menu-btn btn btn-default btn-xs" style="padding: 4px;" data-cycle="${cycle.name}">
								<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="4" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="12" r="1.5"/></svg>
							</button>
						</div>
					</div>
					<div class="cycle-dropzone" style="padding: 8px 12px; min-height: 40px; background: ${is_expanded ? '#fff' : '#f4f5f6'};" data-cycle-id="${cycle.name}"></div>
				</div>
			`);

			// Toggle expand
			$cycle.find(".cycle-header").on("click", (e) => {
				if ($(e.target).closest(".cycle-menu-btn").length) return;
				if (is_expanded) {
					this.expanded_cycles.delete(cycle.name);
				} else {
					this.expanded_cycles.add(cycle.name);
				}
				this.render();
				if (window.Sortable) setTimeout(() => this.init_sortables(), 50);
				this.bind_task_events();
			});

			// Cycle menu
			$cycle.find(".cycle-menu-btn").on("click", (e) => {
				e.stopPropagation();
				this.show_cycle_menu(cycle, $(e.currentTarget));
			});

			const $dropzone = $cycle.find(".cycle-dropzone");
			if (tasks.length) {
				tasks.forEach(task => {
					const $card = this.task_card_html(task);
					if (!is_expanded) $card.css("display", "none");
					$dropzone.append($card);
				});
			} else if (is_expanded) {
				$dropzone.append(`<div class="empty-msg" style="color: #8d99a6; text-align: center; padding: 16px; font-size: 12px;">${__("No tasks. Drag tasks here from the backlog.")}</div>`);
			}
			if (!is_expanded) {
				$dropzone.append(`<div class="drop-hint" style="color: #8d99a6; text-align: center; padding: 4px; font-size: 10px;"><span style="display: inline-flex; align-items: center; gap: 4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg> ${__("Drop tasks here or click to expand")}</span></div>`);
			}

			this.$body.append($cycle);
		});
	}

	show_cycle_menu(cycle, $btn) {
		const items = [];
		if (cycle.status === "Planned" && !this.active_cycle_name) {
			items.push({ label: __("Start Sprint"), action: () => this.update_cycle_status(cycle.name, "Active"), color: "#27ae60" });
		}
		if (cycle.status === "Active") {
			items.push({ label: __("Complete Sprint"), action: () => this.complete_cycle(cycle.name), color: "#3498db" });
		}
		items.push({ label: __("Edit"), action: () => this.show_edit_cycle_dialog(cycle), color: "#36414c" });
		if (cycle.status !== "Active") {
			items.push({ label: __("Delete"), action: () => this.delete_cycle(cycle.name), color: "#e74c3c" });
		}
		items.push({ label: __("Open in Form"), action: () => frappe.set_route("Form", "Cycle", cycle.name), color: "#36414c" });

		const offset = $btn.offset();
		const $menu = $(`
			<div class="atlas-cycle-menu"
				style="position: fixed; z-index: 9999; display: block; min-width: 160px; padding: 4px 0; top: ${offset.top + $btn.outerHeight()}px; left: ${offset.left - 140}px; background: #fff; border: 1px solid #d1d8dd; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
				${items.map(i => `<a href="#" class="dropdown-item" style="display: block; padding: 8px 12px; font-size: 12px; color: ${i.color}; text-decoration: none;" onmouseover="this.style.background='#f4f5f6'" onmouseout="this.style.background='#fff'">${i.label}</a>`).join("")}
			</div>
		`);

		$("body").append($menu);

		const close_menu = () => { $menu.remove(); };

		$menu.find("a").on("click", (e) => {
			e.preventDefault();
			const label = $(e.target).text();
			const item = items.find(i => i.label === label);
			if (item) item.action();
			close_menu();
		});

		setTimeout(() => {
			$(document).one("click", close_menu);
		}, 0);
	}

	update_cycle_status(cycle_name, status) {
		frappe.call({
			method: "frappe.client.set_value",
			args: {
				doctype: "Cycle",
				name: cycle_name,
				fieldname: { status },
			},
			callback: (r) => {
				if (r.message) {
					frappe.show_alert({ message: __(`Sprint ${status.toLowerCase()}`), indicator: "green" });
					this.fetch_data();
				}
			},
		});
	}

	complete_cycle(cycle_name) {
		frappe.confirm(
			__("Complete this sprint? Tasks will remain in the sprint but it will be marked as done."),
			() => {
				frappe.call({
					method: "frappe.client.set_value",
					args: {
						doctype: "Cycle",
						name: cycle_name,
						fieldname: { status: "Completed", actual_end_date: frappe.datetime.now_date() },
					},
					callback: (r) => {
						if (r.message) {
							frappe.show_alert({ message: __("Sprint completed"), indicator: "green" });
							this.fetch_data();
						}
					},
				});
			}
		);
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
			<div class="backlog-card" style="background: #fff; border-radius: 8px; border: 1px solid #d1d8dd; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
				<div class="backlog-header" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; cursor: pointer; border-bottom: ${is_expanded ? '1px solid #eef0f2' : 'none'};" onmouseover="this.style.background='#f4f5f6'" onmouseout="this.style.background='#fff'">
					<div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
						<span style="width: 28px; height: 28px; border-radius: 6px; background: #5e64ff; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; flex-shrink: 0;">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
						</span>
						<div style="min-width: 0;">
							<h3 style="font-size: 13px; font-weight: 600; color: #36414c; margin: 0;">${__("Backlog")}</h3>
							<p style="font-size: 12px; color: #8d99a6; margin: 0;">${tasks.length} ${__("work items")}</p>
						</div>
					</div>
					<div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
						<span style="color: #8d99a6; font-size: 12px; transition: transform 0.2s; display: inline-block; transform: ${is_expanded ? 'rotate(180deg)' : 'none'};">&#9662;</span>
					</div>
				</div>
				<div class="backlog-creator" style="padding: 12px 16px 0; ${is_expanded ? '' : 'display: none;'}"></div>
				<div class="backlog-dropzone" style="padding: 8px 12px; min-height: 40px; background: ${is_expanded ? '#fff' : '#f4f5f6'};" data-backlog="true"></div>
			</div>
		`);

		$backlog.find(".backlog-header").on("click", () => {
			this._backlog_expanded = !is_expanded;
			this.render();
			if (window.Sortable) setTimeout(() => this.init_sortables(), 50);
			this.bind_task_events();
		});

		if (is_expanded) {
			const $creator = $(`
				<div style="margin-bottom: 12px;">
					<div style="display: flex; gap: 8px; align-items: center;">
						<input type="text" class="new-task-input form-control" style="flex: 1;" placeholder="${__("Add a task to backlog...")}">
						<button class="add-task-btn btn btn-primary btn-xs">${__("Add")}</button>
					</div>
				</div>
			`);
			const $input = $creator.find(".new-task-input");
			const do_create = () => {
				const subject = $input.val().trim();
				if (subject) this.create_task(subject, $input);
			};
			$creator.find(".add-task-btn").on("click", do_create);
			$input.on("keydown", e => { if (e.key === "Enter") do_create(); });
			$backlog.find(".backlog-creator").append($creator);
		}

		const $dropzone = $backlog.find(".backlog-dropzone");
		if (tasks.length) {
			tasks.forEach(task => {
				const $card = this.task_card_html(task);
				if (!is_expanded) $card.css("display", "none");
				$dropzone.append($card);
			});
		} else if (is_expanded) {
			$dropzone.append(`<div class="empty-msg" style="color: #8d99a6; text-align: center; padding: 24px; font-size: 12px;">${__("No backlog items. Add a task above.")}</div>`);
		}
		if (!is_expanded) {
			$dropzone.append(`<div class="drop-hint" style="color: #8d99a6; text-align: center; padding: 4px; font-size: 10px;"><span style="display: inline-flex; align-items: center; gap: 4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg> ${__("Drop tasks here or click to expand")}</span></div>`);
		}

		this.$body.append($backlog);
		this.bind_task_events();
	}

	init_sortables() {
		this.destroy_sortables();
		if (!window.Sortable) return;

		const me = this;

		// Init Sortable on each cycle dropzone (always visible)
		this.$body.find(".cycle-dropzone").each(function () {
			const cycle_id = $(this).data("cycle-id");
			const sortable = Sortable.create(this, {
				group: { name: "tasks", pull: true, put: true },
				draggable: ".task-card",
				animation: 150,
				forceFallback: true,
				ghostClass: "sortable-ghost",
				dragClass: "sortable-drag",
				onAdd: function (evt) {
					const task_id = evt.item.getAttribute("data-task");
					const from_cycle = $(evt.from).data("cycle-id");
					const to_cycle = cycle_id;

					if (to_cycle === me.active_cycle_name) {
						me.fetch_data();
						frappe.show_alert({ message: __("Cannot move task into active sprint. Complete the active sprint first."), indicator: "orange" });
						return;
					}

					if (from_cycle === to_cycle) return; // same list reorder

					me.move_task(task_id, "cycle", to_cycle);
				},
			});
			me.sortables.push(sortable);
		});

		// Init Sortable on backlog dropzone (always visible)
		const $backlog_dropzone = this.$body.find(".backlog-dropzone");
		if ($backlog_dropzone.length) {
			const backlog_sortable = Sortable.create($backlog_dropzone[0], {
				group: { name: "tasks", pull: true, put: true },
				draggable: ".task-card",
				animation: 150,
				forceFallback: true,
				ghostClass: "sortable-ghost",
				dragClass: "sortable-drag",
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
		this.sortables.forEach(s => s.destroy());
		this.sortables = [];
	}

	task_card_html(task) {
		const status_colors = {
			"Open": { bg: "#f0f4f7", text: "#8d99a6", border: "#d1d8dd" },
			"Todo": { bg: "#ebf5fb", text: "#3498db", border: "#aed6f1" },
			"Working": { bg: "#fef5e7", text: "#e67e22", border: "#f5cba7" },
			"In Progress": { bg: "#fef5e7", text: "#e67e22", border: "#f5cba7" },
			"Done": { bg: "#eafaf1", text: "#27ae60", border: "#abebc6" },
			"Completed": { bg: "#eafaf1", text: "#27ae60", border: "#abebc6" },
			"Pending Review": { bg: "#fef9e7", text: "#d4ac0d", border: "#f9e79f" },
			"Cancelled": { bg: "#fdedec", text: "#e74c3c", border: "#f5b7b1" },
		};
		const priority_colors = {
			"Low": { bg: "#f0f4f7", text: "#5f6a72" },
			"Medium": { bg: "#fef9e7", text: "#9a7d0a" },
			"High": { bg: "#fef5e7", text: "#a04000" },
			"Urgent": { bg: "#fdedec", text: "#922b21" },
		};
		const s = status_colors[task.status] || status_colors["Open"];
		const p = priority_colors[task.priority] || priority_colors["Low"];
		const is_selected = this.selected_tasks.has(task.id);
		const assignees = task.assignee ? task.assignee.split(",").map(a => a.trim()).filter(Boolean) : [];

		return $(`
			<div class="task-card ${is_selected ? 'selected' : ''}" data-task="${task.id}"
				style="padding: 10px 12px; margin-bottom: 6px; border: 1.5px solid ${is_selected ? '#5e64ff' : s.border}; border-radius: 6px;
				background: ${is_selected ? '#eef2ff' : '#fff'}; cursor: grab; display: flex; align-items: center; gap: 10px;
				box-shadow: ${is_selected ? '0 1px 3px rgba(94,100,255,0.15)' : '0 1px 2px rgba(0,0,0,0.04)'};">
				<input type="checkbox" class="task-checkbox" data-task="${task.id}" ${is_selected ? 'checked' : ''} style="margin: 0; flex-shrink: 0;">
				<div style="flex: 1; min-width: 0;">
					<div class="ellipsis" style="font-size: 13px; font-weight: 500; color: #36414c; margin-bottom: 4px;">
						${frappe.utils.escape_html(task.subject)}
					</div>
					<div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
						<span style="display: inline-flex; align-items: center; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; border: 1px solid ${s.border}; background: ${s.bg}; color: ${s.text};">${task.status}</span>
						<span style="display: inline-flex; align-items: center; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; background: ${p.bg}; color: ${p.text};">${task.priority || "Low"}</span>
						${task.type ? `<span style="display: inline-flex; align-items: center; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; background: #f0f4f7; color: #8d99a6;">${task.type}</span>` : ""}
						<span style="font-size: 10px; color: #8d99a6;">${frappe.datetime.prettyDate(task.modified)}</span>
					</div>
				</div>
				<div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
					${assignees.map(a => this._avatar_html(a)).join("")}
				</div>
			</div>
		`);
	}

	_avatar_html(user_id) {
		const name = user_id.split("@")[0];
		const parts = name.split(/[._-]/);
		const initials = parts.map(s => s[0]).join("").toUpperCase().slice(0, 2);
		const colors = ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#14b8a6", "#06b6d4", "#84cc16"];
		const color = colors[name.length % colors.length];
		return `<span title="${frappe.utils.escape_html(user_id)}" style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; color: #fff; font-size: 9px; font-weight: 700; flex-shrink: 0; box-shadow: 0 0 0 2px #fff; background: ${color};">${initials}</span>`;
	}

	bind_task_events() {
		const me = this;

		this.$body.find(".task-checkbox").off("change").on("change", function () {
			const task_id = $(this).data("task");
			if (this.checked) me.selected_tasks.add(task_id);
			else me.selected_tasks.delete(task_id);
			const $card = $(this).closest(".task-card");
			$card.toggleClass("selected", this.checked);
			$card.css({
				background: this.checked ? "#eef2ff" : "#fff",
				borderColor: this.checked ? "#5e64ff" : "#d1d8dd",
				boxShadow: this.checked ? "0 1px 3px rgba(94,100,255,0.15)" : "0 1px 2px rgba(0,0,0,0.04)",
			});
			me.render_actions();
		});

		this.$body.find(".task-card").off("click").on("click", function (e) {
			if ($(e.target).is(".task-checkbox, input")) return;
			const task_id = $(this).data("task");
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
			method: "infintrix_atlas.api.v1.set_backlog_position",
			args: {
				type,
				task_name: task_id,
				target_id: target_id === "Open" ? null : target_id,
			},
			callback: (r) => {
				const msg = r.message || {};
				if (msg.success) {
					frappe.show_alert({ message: msg.message || __("Moved"), indicator: "green" });
					this.fetch_data();
				} else {
					frappe.show_alert({ message: msg.message || __("Move failed"), indicator: "red" });
					this.fetch_data();
				}
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
					method: "infintrix_atlas.api.v1.bulk_delete_tasks",
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

// Legacy drop handler (fallback if SortableJS not loaded)
window.backlog_drop_handler = function (event, type, target_id) {
	event.preventDefault();
	const task_id = event.dataTransfer.getData("text/plain");
	if (!task_id) return;
	const page = frappe.pages["project_backlog"];
	if (page && page.backlog) {
		page.backlog.move_task(task_id, type, target_id);
	}
};
