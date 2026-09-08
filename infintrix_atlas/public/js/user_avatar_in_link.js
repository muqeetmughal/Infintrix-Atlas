const __atlas_original_setup_awesomeplete = frappe.ui.form.ControlLink.prototype.setup_awesomeplete;

frappe.ui.form.ControlLink.prototype.setup_awesomeplete = function () {
	__atlas_original_setup_awesomeplete.call(this);

	const me = this;
	if (me.get_options() !== "User") return;

	const original_item = me.awesomplete.item;
	me.awesomplete.item = function (item) {
		const li = original_item.call(this, item);
		const d = this.get_item(item.value);
		if (!d || !d.value || String(d.value).includes("__link_option")) return li;
		me.render_user_avatar_in_link_item(li, d.value);
		return li;
	};

	me.$input.on("awesomplete-open", () => {
		me.fetch_user_avatars_for_open_dropdown();
	});
};

frappe.ui.form.ControlLink.prototype.render_user_avatar_in_link_item = function (li, user) {
	const p = li.querySelector("p");
	if (!p) return;

	const wrapper = document.createElement("div");
	wrapper.className = "atlas-link-user-avatar";
	wrapper.style.cssText = "display:flex;align-items:center;gap:8px;";
	wrapper.innerHTML = frappe.avatar(user, "avatar-medium-2");

	const avatarEl = wrapper.querySelector(".avatar");
	if (avatarEl) avatarEl.dataset.user = user;

	p.parentNode.replaceChild(wrapper, p);
	wrapper.appendChild(p);
};

frappe.ui.form.ControlLink.prototype.fetch_user_avatars_for_open_dropdown = async function () {
	const users = [
		...new Set(
			(this.awesomplete._list || [])
				.map((d) => d.value)
				.filter((v) => v && !String(v).includes("__link_option"))
		),
	];
	if (!users.length) return;

	const records = await frappe.db.get_list("User", {
		filters: { name: ["in", users] },
		fields: ["name", "user_image"],
		limit: 100,
	});

	const images = {};
	(records || []).forEach((u) => {
		if (u.user_image) images[u.name] = u.user_image;
	});

	$(this.awesomplete.ul)
		.find(".avatar[data-user]")
		.each((_, el) => {
			const url = images[el.dataset.user];
			if (!url) return;
			const frame = el.querySelector(".avatar-frame");
			if (!frame) return;
			frame.style.backgroundImage = `url("${url}")`;
			frame.classList.remove("standard-image");
			frame.textContent = "";
		});
};

const __atlas_original_set_input_value = frappe.ui.form.ControlLink.prototype.set_input_value;
frappe.ui.form.ControlLink.prototype.set_input_value = function (value) {
	__atlas_original_set_input_value.call(this, value);
	this.render_selected_user_avatar();
};

const __atlas_original_set_formatted_input = frappe.ui.form.ControlLink.prototype.set_formatted_input;
frappe.ui.form.ControlLink.prototype.set_formatted_input = function (value) {
	__atlas_original_set_formatted_input.call(this, value);
	this.render_selected_user_avatar();
};

const __atlas_original_refresh_input = frappe.ui.form.ControlLink.prototype.refresh_input;
frappe.ui.form.ControlLink.prototype.refresh_input = function () {
	__atlas_original_refresh_input.call(this);
	this.render_selected_user_avatar();
};

frappe.atlas_user_images = frappe.atlas_user_images || {};

frappe.ui.form.ControlLink.prototype.render_selected_user_avatar = function () {
	const me = this;
	if (me.get_options() !== "User" || !me.$input_area) return;

	const $field = me.$input_area.find(".link-field");
	$field.find(".atlas-selected-avatar").remove();

	const name = me.get_input_value() || me.value;
	if (!name || String(name).includes("__link_option")) {
		me.$input && me.$input.css("padding-left", "");
		return;
	}

	const $avatar = $(
		'<span class="atlas-selected-avatar" style="position:absolute;left:6px;top:50%;transform:translateY(-50%);z-index:1;pointer-events:none;"></span>'
	).prependTo($field);
	$avatar.html(frappe.avatar(name, "avatar-small"));

	const cached = frappe.atlas_user_images[name];
	if (cached) {
		set_atlas_avatar_image($avatar, cached);
	} else {
		me.fetch_user_avatar_image(name).then((url) => {
			if (!url) return;
			frappe.atlas_user_images[name] = url;
			set_atlas_avatar_image($avatar, url);
		});
	}

	me.$input && me.$input.css("padding-left", "40px");
};

function set_atlas_avatar_image($avatar, url) {
	const frame = $avatar.find(".avatar-frame").get(0);
	if (!frame) return;
	frame.style.backgroundImage = `url("${url}")`;
	frame.classList.remove("standard-image");
	frame.textContent = "";
}

frappe.ui.form.ControlLink.prototype.fetch_user_avatar_image = async function (name) {
	const res = await frappe.db.get_value("User", name, "user_image");
	return res && res.message && res.message.user_image;
};
