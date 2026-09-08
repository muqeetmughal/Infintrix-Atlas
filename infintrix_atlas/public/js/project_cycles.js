frappe.ui.form.on("Project", {
	refresh(frm) {
		if (frm.is_new()) return;
		render_project_cycles(frm);
	},
});

function render_project_cycles(frm) {
	const field = frm.fields_dict.custom_cycles_html;
	if (!field || !field.$wrapper || !field.$wrapper.length) return;

	inject_project_cycles_styles();

	const $wrapper = field.$wrapper.empty();
	const $root = $(`<div class="atlas-cycles-widget"></div>`).appendTo($wrapper);
	$root.html(`<div class="atlas-cycles-loading">${__("Loading sprints...")}</div>`);

	frappe.call({
		method: "infintrix_atlas.api.cycles.list_project_cycles",
		args: { project: frm.doc.name },
		callback: (r) => {
			render_cycles_list($root, frm, r.message || []);
		},
		error: () => {
			$root.html(`<div class="atlas-cycles-empty">${__("Failed to load sprints.")}</div>`);
		},
	});
}

function render_cycles_list($root, frm, cycles) {
	if (!cycles.length) {
		$root.html(`<div class="atlas-cycles-empty">${__("No sprints yet for this project.")}</div>`);
		return;
	}

	const status_indicator = {
		Active: "green",
		Planned: "blue",
		Completed: "gray",
		Archived: "gray",
	};
	const fmt_date = (d) => (d ? frappe.datetime.str_to_user(d) : __("TBD"));

	$root.empty();
	cycles.forEach((cycle) => {
		const total = cycle.total_tasks || 0;
		const completed = cycle.completed_tasks || 0;
		const progress = total ? Math.round((completed / total) * 100) : 0;
		const progress_color = cycle.status === "Active" ? "var(--green-500)" : cycle.status === "Completed" ? "var(--gray-500)" : "var(--blue-500)";

		const $row = $(`
			<div class="atlas-cycles-row" data-cycle="${cycle.name}">
				<div class="atlas-cycles-row-main">
					<span class="ellipsis atlas-cycles-name">${frappe.utils.escape_html(cycle.cycle_name || cycle.name)}</span>
					<span class="indicator-pill ${status_indicator[cycle.status] || "gray"}">${frappe.utils.escape_html(cycle.status)}</span>
				</div>
				<div class="atlas-cycles-row-meta">
					<span>${fmt_date(cycle.start_date)} &rarr; ${fmt_date(cycle.end_date)}</span>
					<span>${completed}/${total} ${__("tasks")}</span>
				</div>
				<div class="atlas-cycles-progress">
					<div style="background: ${progress_color}; width: ${progress}%;"></div>
				</div>
			</div>
		`);
		$row.on("click", () => frappe.set_route("Form", "Cycle", cycle.name));
		$root.append($row);
	});
}

function inject_project_cycles_styles() {
	if (document.getElementById("atlas-cycles-widget-styles")) return;
	const style = document.createElement("style");
	style.id = "atlas-cycles-widget-styles";
	style.textContent = `
		.atlas-cycles-widget {
			display: flex;
			flex-direction: column;
			gap: 6px;
		}
		.atlas-cycles-loading,
		.atlas-cycles-empty {
			padding: 14px 4px;
			color: var(--text-muted);
			font-size: var(--text-sm);
		}
		.atlas-cycles-row {
			border: 1px solid var(--border-color);
			border-radius: var(--border-radius-sm);
			padding: 8px 10px;
			cursor: pointer;
			transition: box-shadow 0.15s, border-color 0.15s;
		}
		.atlas-cycles-row:hover {
			box-shadow: var(--shadow-sm);
			border-color: var(--text-light);
		}
		.atlas-cycles-row-main {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
		}
		.atlas-cycles-name {
			font-size: var(--text-sm);
			font-weight: 500;
			color: var(--text-color);
			min-width: 0;
		}
		.atlas-cycles-row-meta {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
			margin-top: 4px;
			font-size: var(--text-xs);
			color: var(--text-muted);
		}
		.atlas-cycles-progress {
			width: 100%;
			height: 5px;
			background: var(--control-bg-on-gray);
			border-radius: 3px;
			overflow: hidden;
			margin-top: 6px;
		}
		.atlas-cycles-progress > div {
			height: 100%;
			border-radius: 3px;
		}
	`;
	document.head.appendChild(style);
}
