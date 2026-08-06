frappe.ui.form.on("Project", {
	refresh(frm) {
		if (frm.is_new()) return;
		add_mode_action_item(frm);
		add_kanban_button(frm);
		add_backlog_buttons(frm);
		embed_backlog(frm);
	},
	after_save(frm) {
		add_mode_action_item(frm);
		if (!frm._atlas_backlog) return;
		const mode = frm.doc.custom_execution_mode;
		if (mode && mode !== frm._atlas_backlog_mode) {
			frm._atlas_backlog_mode = mode;
			frm._atlas_backlog.fetch_data();
		}
	},
});

function add_mode_action_item(frm) {
	const mode = frm.doc.custom_execution_mode || "Kanban";
	const label = __("Execution Mode: {0}", [mode]);

	if (!frm._atlas_mode_item) {
		frm._atlas_mode_item = frm.page.add_action_item(label, () => switch_execution_mode(frm));
	} else {
		frm._atlas_mode_item.find(".menu-item-label").text(label);
	}
}

function switch_execution_mode(frm) {
	const current = frm.doc.custom_execution_mode || "Kanban";
	const next = current === "Scrum" ? "Kanban" : "Scrum";
	frappe.confirm(
		__("Switch this project to {0} mode?", [next]),
		() => {
			frappe.call({
				method: "infintrix_atlas.api.v1.set_project_mode",
				args: { project: frm.doc.name, mode: next },
				callback: (r) => {
					const msg = r.message || {};
					if (msg.success) {
						frappe.show_alert({ message: msg.message || __("Execution mode updated"), indicator: "green" });
						frm.reload();
					} else {
						frappe.show_alert({ message: msg.message || __("Failed to update execution mode"), indicator: "red" });
					}
				},
			});
		}
	);
}

function add_kanban_button(frm) {
	if (frm._atlas_kanban_btn_added) return;
	frm._atlas_kanban_btn_added = true;

	frm.add_custom_button(__("View Kanban"), () => {
		frappe.call({
			method: "infintrix_atlas.api.v1.get_project_kanban",
			args: { project: frm.doc.name },
			callback: (r) => {
				if (r.message) {
					frappe.set_route("List", "Task", "Kanban", r.message);
				}
			},
		});
	});
}

function add_backlog_buttons(frm) {
	if (frm._atlas_buttons_added) return;
	frm._atlas_buttons_added = true;

	frm.add_custom_button(__("Refresh"), () => {
		if (frm._atlas_backlog) frm._atlas_backlog.fetch_data();
	});

	const $new_sprint_btn = frm.add_custom_button(__("New Sprint"), () => {
		if (!frm._atlas_backlog) return;
		if (!frm._atlas_backlog.is_scrum) {
			frappe.show_alert({
				message: __("This project is in Kanban mode. Switch to Scrum to create sprints."),
				indicator: "orange",
			});
			return;
		}
		frm._atlas_backlog.show_new_cycle_dialog();
	});
	$new_sprint_btn.removeClass("btn-default").addClass("btn-primary").addClass("hidden");
	frm._atlas_new_sprint_btn = $new_sprint_btn;

	// `.custom-actions` is hidden below the lg breakpoint by default — force it visible
	// so the backlog form buttons always show.
	$(frm.page.wrapper).find(".custom-actions").removeClass("hidden-xs hidden-md");
}

function sync_scrum_button(frm, backlog) {
	const $btn = frm._atlas_new_sprint_btn;
	if (!$btn) return;
	if (backlog.is_scrum) $btn.removeClass("hidden");
	else $btn.addClass("hidden");
}

function embed_backlog(frm) {
	const field = frm.fields_dict.custom_backlog;
	if (!field || !field.$wrapper || !field.$wrapper.length) return;

	if (!frm._atlas_backlog_embedded) {
		const $container = $('<div class="atlas-backlog-embedded"></div>');
		field.$wrapper.empty().append($container);
		frm._atlas_backlog = new AtlasBacklog({
			container: $container,
			project_name: frm.doc.name,
			embedded: true,
			on_loaded: (backlog) => sync_scrum_button(frm, backlog),
		});
		frm._atlas_backlog_embedded = true;
		frm._atlas_backlog_mode = frm.doc.custom_execution_mode;
	}

	if (!frm._atlas_backlog.$container.closest(document).length) {
		field.$wrapper.empty().append(frm._atlas_backlog.$container);
	}

	frm._atlas_backlog.set_project(frm.doc.name);
}
