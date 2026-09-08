frappe.ui.form.on("Project", {
	refresh(frm) {
		if (frm.is_new()) return;
		hide_default_users_grid(frm);
		render_project_team(frm);
	},
});

function hide_default_users_grid(frm) {
	// The card widget below is the intended add/remove UI for `users` — hide the raw
	// grid so there's only one (clear) place to manage team membership.
	frm.set_df_property("users", "hidden", 1);
	frm.refresh_field("users");
}

function render_project_team(frm) {
	const field = frm.fields_dict.custom_team_html;
	if (!field || !field.$wrapper || !field.$wrapper.length) return;

	inject_project_team_styles();

	const $wrapper = field.$wrapper.empty();
	const $root = $(`<div class="atlas-team-widget"></div>`).appendTo($wrapper);
	$root.html(`<div class="atlas-team-loading">${__("Loading team...")}</div>`);

	frappe.call({
		method: "infintrix_atlas.api.projects.list_project_team",
		args: { project: frm.doc.name },
		callback: (r) => {
			render_team_cards($root, frm, r.message || []);
		},
		error: () => {
			$root.html(`<div class="atlas-team-empty">${__("Failed to load team.")}</div>`);
		},
	});
}

function render_team_cards($root, frm, members) {
	const $grid = $(`<div class="atlas-team-grid"></div>`);

	members.forEach((m) => {
		const open_tasks = m.open_tasks || 0;
		const total_tasks = m.total_tasks || 0;
		const workload_color = open_tasks === 0 ? "gray" : open_tasks <= 3 ? "blue" : "orange";

		const $card = $(`
			<div class="atlas-team-card">
				<button class="atlas-team-remove" title="${__("Remove from project")}">${frappe.utils.icon("x", "xs")}</button>
				<span class="atlas-team-avatar" style="${m.image ? `background-image: url(${frappe.utils.escape_html(m.image)})` : ""}">
					${!m.image ? _team_initials(m.full_name || m.user) : ""}
				</span>
				<div class="ellipsis atlas-team-name" title="${frappe.utils.escape_html(m.full_name || m.user)}">${frappe.utils.escape_html(m.full_name || m.user)}</div>
				<div class="ellipsis atlas-team-email" title="${frappe.utils.escape_html(m.email || m.user)}">${frappe.utils.escape_html(m.email || m.user)}</div>
				${m.project_status ? `<div class="ellipsis atlas-team-status">${frappe.utils.escape_html(m.project_status)}</div>` : ""}
				<div class="atlas-team-workload">
					<span class="indicator-pill ${workload_color}">${open_tasks} ${__("open")}</span>
					<span class="atlas-team-total">${total_tasks} ${__("total")}</span>
				</div>
			</div>
		`);
		$card.find(".atlas-team-remove").on("click", (e) => {
			e.stopPropagation();
			remove_team_member(frm, m);
		});
		$grid.append($card);
	});

	const $add_card = $(`
		<button class="atlas-team-add-card" title="${__("Add a team member")}">
			${frappe.utils.icon("plus", "md")}
			<span>${__("Add Member")}</span>
		</button>
	`);
	$add_card.on("click", () => show_add_team_member_dialog(frm, members));
	$grid.append($add_card);

	$root.empty().append($grid);

	if (!members.length) {
		$root.prepend(`<div class="atlas-team-empty">${__("No team members added yet — click Add Member to start.")}</div>`);
	}
}

function show_add_team_member_dialog(frm, members) {
	const existing = members.map((m) => m.user);
	const d = new frappe.ui.Dialog({
		title: __("Add Team Member"),
		fields: [
			{
				fieldname: "user",
				label: __("User"),
				fieldtype: "Link",
				options: "User",
				reqd: 1,
				get_query: () => ({
					filters: {
						enabled: 1,
						user_type: "System User",
						name: ["not in", existing.length ? existing : [""]],
					},
				}),
			},
		],
		primary_action_label: __("Add"),
		primary_action: (values) => {
			frappe.call({
				method: "infintrix_atlas.api.projects.add_team_member",
				args: { project: frm.doc.name, user: values.user },
				callback: (r) => {
					const msg = r.message || {};
					if (msg.success) {
						frappe.show_alert({ message: msg.message || __("Team member added"), indicator: "green" });
						d.hide();
						frm.reload_doc();
					} else {
						frappe.show_alert({ message: msg.message || __("Failed to add team member"), indicator: "orange" });
					}
				},
				error: () => {
					frappe.show_alert({ message: __("Failed to add team member"), indicator: "red" });
				},
			});
		},
	});
	d.show();
}

function remove_team_member(frm, member) {
	frappe.confirm(
		__("Remove {0} from this project's team?", [frappe.utils.escape_html(member.full_name || member.user)]),
		() => {
			frappe.call({
				method: "infintrix_atlas.api.projects.remove_team_member",
				args: { project: frm.doc.name, user: member.user },
				callback: (r) => {
					const msg = r.message || {};
					if (msg.success) {
						frappe.show_alert({ message: msg.message || __("Team member removed"), indicator: "green" });
						frm.reload_doc();
					} else {
						frappe.show_alert({ message: msg.message || __("Failed to remove team member"), indicator: "orange" });
					}
				},
				error: () => {
					frappe.show_alert({ message: __("Failed to remove team member"), indicator: "red" });
				},
			});
		}
	);
}

function _team_initials(label) {
	const parts = String(label).split(/[\s._-]+/).filter(Boolean);
	return parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

function inject_project_team_styles() {
	if (document.getElementById("atlas-team-widget-styles")) return;
	const style = document.createElement("style");
	style.id = "atlas-team-widget-styles";
	style.textContent = `
		.atlas-team-empty {
			padding: 10px 2px 14px;
			color: var(--text-muted);
			font-size: var(--text-sm);
		}
		.atlas-team-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
			gap: 10px;
		}
		.atlas-team-card {
			position: relative;
			display: flex;
			flex-direction: column;
			align-items: center;
			text-align: center;
			border: 1px solid var(--border-color);
			border-radius: var(--border-radius-md);
			background: var(--card-bg);
			padding: 16px 10px 12px;
			transition: box-shadow 0.15s, border-color 0.15s;
		}
		.atlas-team-card:hover {
			box-shadow: var(--shadow-sm);
			border-color: var(--text-light);
		}
		.atlas-team-remove {
			position: absolute;
			top: 6px;
			right: 6px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 22px;
			height: 22px;
			border-radius: 50%;
			border: 1px solid var(--border-color);
			background: var(--card-bg);
			color: var(--text-light);
			cursor: pointer;
			visibility: hidden;
			opacity: 0;
			transition: opacity 0.15s, background 0.15s, color 0.15s;
		}
		.atlas-team-card:hover .atlas-team-remove { visibility: visible; opacity: 1; }
		.atlas-team-remove:hover { color: #fff; background: var(--red-500); border-color: var(--red-500); }
		.atlas-team-avatar {
			width: 72px;
			height: 72px;
			border-radius: 50%;
			background-color: var(--blue-500);
			background-size: cover;
			background-position: center;
			color: #fff;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 22px;
			font-weight: 700;
			flex-shrink: 0;
			box-shadow: 0 0 0 3px var(--control-bg-on-gray);
			margin-bottom: 10px;
		}
		.atlas-team-name {
			font-size: var(--text-sm);
			font-weight: 600;
			color: var(--text-color);
			max-width: 100%;
		}
		.atlas-team-email {
			font-size: var(--text-xs);
			color: var(--text-muted);
			max-width: 100%;
			margin-top: 2px;
		}
		.atlas-team-status {
			font-size: var(--text-xs);
			color: var(--text-muted);
			max-width: 100%;
			margin-top: 4px;
		}
		.atlas-team-workload {
			display: flex;
			align-items: center;
			gap: 6px;
			margin-top: 10px;
		}
		.atlas-team-total {
			font-size: var(--text-xs);
			color: var(--text-muted);
		}
		.atlas-team-add-card {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 6px;
			min-height: 168px;
			border: 1px dashed var(--border-color);
			border-radius: var(--border-radius-md);
			background: transparent;
			color: var(--text-muted);
			font-size: var(--text-sm);
			cursor: pointer;
			transition: border-color 0.15s, color 0.15s, background 0.15s;
		}
		.atlas-team-add-card:hover {
			border-color: var(--blue-500);
			color: var(--blue-500);
			background: var(--control-bg-on-gray);
		}
	`;
	document.head.appendChild(style);
}
