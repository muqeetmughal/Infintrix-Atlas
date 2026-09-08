class TaskAssignmentHistory {
	constructor(opts = {}) {
		this.$container = opts.container || $(`<div></div>`);
		this.task = opts.task || "";
	}

	set_task(task) {
		this.task = task;
		this.fetch();
	}

	async fetch() {
		if (!this.task) {
			this.$container.empty();
			return;
		}

		this.$container.html(
			`<div class="text-muted" style="padding:8px 0;font-size:13px;">${__("Loading assignment history...")}</div>`
		);

		const records = await frappe.db.get_list("ToDo", {
			filters: { reference_type: "Task", reference_name: this.task },
			fields: [
				"name",
				"allocated_to",
				"assigned_by",
				"assigned_by_full_name",
				"status",
				"priority",
				"date",
				"creation",
			],
			order_by: "creation desc",
			limit: 100,
		});

		if (!records || !records.length) {
			this.$container.html(
				`<div class="text-muted" style="padding:8px 0;font-size:13px;">${__("No assignment history for this task.")}</div>`
			);
			return;
		}

		const user_map = await this._fetch_user_details(this._collect_users(records));
		this.render(records, user_map);
	}

	_collect_users(records) {
		const users = new Set();
		records.forEach((r) => {
			if (r.allocated_to) users.add(r.allocated_to);
			if (r.assigned_by) users.add(r.assigned_by);
		});
		return [...users];
	}

	async _fetch_user_details(users) {
		const map = {};
		if (!users.length) return map;

		const rows = await frappe.db.get_list("User", {
			filters: { name: ["in", users] },
			fields: ["name", "full_name", "user_image"],
			limit: 100,
		});

		(rows || []).forEach((u) => {
			map[u.name] = u;
			if (u.user_image) {
				frappe.atlas_user_images = frappe.atlas_user_images || {};
				frappe.atlas_user_images[u.name] = u.user_image;
			}
		});

		return map;
	}

	render(records, user_map) {
		let html = `<div class="table-responsive">
			<table class="table table-bordered" style="margin:0;font-size:13px;">
				<thead>
					<tr>
						<th>${__("Assigned To")}</th>
						<th>${__("Assigned By")}</th>
						<th>${__("Status")}</th>
						<th>${__("Priority")}</th>
						<th>${__("Due Date")}</th>
						<th>${__("Created")}</th>
					</tr>
				</thead>
				<tbody>`;

		records.forEach((r) => {
			html += `<tr>
				<td>${this._user_cell(r.allocated_to, user_map)}</td>
				<td>${this._user_cell(r.assigned_by, user_map)}</td>
				<td>${this._status_badge(r.status)}</td>
				<td>${frappe.utils.escape_html(r.priority || "")}</td>
				<td>${r.date ? frappe.datetime.global_date_format(r.date) : ""}</td>
				<td>${frappe.datetime.comment_when(r.creation)}</td>
			</tr>`;
		});

		html += `</tbody></table></div>`;
		this.$container.html(html);
	}

	_user_cell(user, user_map) {
		if (!user) return `<span class="text-muted">${__("—")}</span>`;

		const info = user_map[user] || {};
		const full_name = info.full_name || user;
		const image = info.user_image || frappe.atlas_user_images[user];
		const avatar_html = image
			? `<span class="avatar avatar-xs"><span class="avatar-frame" style="background-image:url(&quot;${image}&quot;)"></span></span>`
			: frappe.avatar(user, "avatar-xs");

		return `${avatar_html} <span class="ml-1">${frappe.utils.escape_html(full_name)}</span>`;
	}

	_status_badge(status) {
		const colors = { Open: "orange", Closed: "green", Cancelled: "red" };
		const color = colors[status] || "gray";
		return `<span class="indicator-pill ${color}">${frappe.utils.escape_html(status)}</span>`;
	}
}

frappe.ui.form.on("Task", {
	refresh(frm) {
		const field = frm.fields_dict.custom_assignment_history;
		if (!field || !field.$wrapper || !field.$wrapper.length) return;

		if (!frm._atlas_assignment_history) {
			frm._atlas_assignment_history = new TaskAssignmentHistory({ container: field.$wrapper });
		}
		frm._atlas_assignment_history.set_task(frm.doc.name);
	},
});
