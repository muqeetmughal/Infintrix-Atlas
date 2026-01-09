frappe.pages["atlas"].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: __("atlas"),
		single_column: true,
	});
};

frappe.pages["atlas"].on_page_show = function (wrapper) {
	load_desk_page(wrapper);
};

function load_desk_page(wrapper) {
	let $parent = $(wrapper).find(".layout-main-section");
	$parent.empty();

	frappe.require("atlas.bundle.jsx").then(() => {
		frappe.atlas = new frappe.ui.Atlas({
			wrapper: $parent,
			page: wrapper.page,
		});
	});
}