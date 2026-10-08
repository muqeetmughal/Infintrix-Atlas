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
			add_icon_button(frm, "pencil", __("Edit Description"), function () {
				edit_description(frm);
			});

			frappe.call("infintrix_atlas.api.watchers.current_user_is_watching", {
				doctype: "Task",
				docname: frm.doc.name
			}).then((r) => {
				add_icon_button(
					frm,
					r.message ? "eye-off" : "eye",
					r.message ? __("Stop Watching") : __("Start Watching"),
					() => toggle_self_watch(frm)
				);
			});
		}
	},
});

// Frappe 16.50+ HTML-escapes custom button labels, so icons can't be inlined in the label.
function add_icon_button(frm, icon, label, action) {
	const $btn = frm.add_custom_button(label, action);
	if ($btn && frappe.ui.button && frappe.ui.button.dress) {
		frappe.ui.button.dress($btn, { icon, label });
	}
	return $btn;
}

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
		// the endpoint returns {success, message}, not a plain string
		const res = r.message || {};
		frappe.show_alert({
			message: res.message || __("Updated"),
			indicator: res.success === false ? "red" : "green"
		});
		if (res.success !== false) {
			frm.reload_doc();
		}
	});
}
