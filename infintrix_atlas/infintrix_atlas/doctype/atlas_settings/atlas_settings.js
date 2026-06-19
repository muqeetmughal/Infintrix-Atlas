frappe.ui.form.on("Atlas Settings", {
  refresh_models(frm) {
    _refreshModels(frm, true);
  },
});

function _refreshModels(frm, forceRefresh) {
  const method = forceRefresh
    ? "infintrix_atlas.infintrix_atlas.doctype.atlas_settings.atlas_settings.refresh_openrouter_models"
    : "infintrix_atlas.infintrix_atlas.doctype.atlas_settings.atlas_settings.get_openrouter_models";
  frappe.call({
    method,
    callback(r) {
      if (r.message && Array.isArray(r.message) && r.message.length) {
        const list = r.message.join(", ");
        frm.set_df_property("openai_model", "description", `Available models (${r.message.length}): ${list}`);
        frappe.msgprint({ title: "Models Loaded", message: `${r.message.length} models available from OpenRouter. Type any model ID above.` });
      } else {
        frappe.msgprint({ title: "No Models", message: "Could not fetch models from OpenRouter. Check your API key and base URL." });
      }
    },
  });
}
