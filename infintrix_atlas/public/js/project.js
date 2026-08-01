frappe.ui.form.on("Project", {
	refresh(frm) {
		if (!frm.is_new()) {
			frm.add_custom_button(
				__("Backlog View"),
				function () {
					frappe.set_route("project_backlog", frm.doc.name);
				},
				__("View")
			);
		}
	},
});
