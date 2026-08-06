frappe.ui.form.on("Task", {
	setup(frm) {
		frm.set_query("custom_cycle", () => {
			const filters = {};
			if (frm.doc.project) filters.project = frm.doc.project;
			return { filters };
		});

		frm.set_query("custom_requirement", () => {
			const filters = {};
			if (frm.doc.project) filters.project = frm.doc.project;
			return { filters };
		});
	},
	refresh(frm) {
		if (!frm.is_new()) {
			frm.add_custom_button(
				__("Detail View"),
				function () {
					frappe.set_route("task_detail", frm.doc.name);
				},
				__("View")
			);

			frm.add_custom_button(__("Edit Description"), function () {
				edit_description(frm);
			});

			frappe.call("infintrix_atlas.api.watchers.current_user_is_watching", {
				doctype: "Task",
				docname: frm.doc.name
			}).then((r) => {
				frm.add_custom_button(
					r.message ? "Stop Watching" : "Start Watching",
					() => toggle_self_watch(frm)
				);
			});
		}
	},
});

function edit_description(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Edit Description"),
		fields: [
			{
				fieldname: "description",
				label: __("Task Description"),
				fieldtype: "Text Editor",
			},
		],
		primary_action_label: __("Save"),
		primary_action(values) {
			frm.set_value("description", values.description);
			d.hide();
			frm.save();
		},
	});

	d.show();
	d.set_value("description", frm.doc.description || "");

	const $modal_dialog = d.$wrapper.find(".modal-dialog");
	$modal_dialog.css({ width: "1024px", maxWidth: "90vw" });
	d.$wrapper.find(".ql-editor").css("min-height", "550px");
}

function toggle_self_watch(frm) {
	frappe.call("infintrix_atlas.api.watchers.toggle_self_watch", {
		doctype: "Task",
		docname: frm.doc.name
	}).then((r) => {
		frappe.show_alert({
			message: r.message || "Updated",
			indicator: "green"
		});
		frm.reload_doc();
	});
}
