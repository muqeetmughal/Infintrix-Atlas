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
