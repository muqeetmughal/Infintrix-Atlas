frappe.pages["project_backlog"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Backlog View"),
		single_column: true,
	});
	page.backlog = new AtlasBacklog({
		container: $(wrapper).find(".layout-main-section"),
	});
};

frappe.pages["project_backlog"].on_page_show = function (wrapper) {
	const route = frappe.get_route();
	const project_name = route[1] || "";
	const page = wrapper.page;
	if (page.backlog) {
		page.backlog.set_project(project_name);
	}
};
