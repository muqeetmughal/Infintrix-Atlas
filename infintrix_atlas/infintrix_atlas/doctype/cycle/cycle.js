// Copyright (c) 2026, Muqeet Mughal and contributors
// For license information, please see license.txt
frappe.ui.form.on("Cycle", {
    refresh(frm) {
        toggle_date_fields(frm);
    },

    duration(frm) {
        apply_duration_logic(frm);
    },

    status(frm) {
        // Flow-wise: activating without dates asks for them in a dialog
        // instead of blocking on save.
        if (frm.doc.status === "Active" && !frm.doc.start_date && !frm.doc.end_date) {
            ask_for_dates(frm);
        }
    }
});

function ask_for_dates(frm) {
    const d = new frappe.ui.Dialog({
        title: __("Start Sprint"),
        fields: [
            { fieldname: "start_date", label: __("Start Date"), fieldtype: "Datetime", reqd: 1, default: frappe.datetime.now_datetime() },
            { fieldname: "end_date", label: __("End Date"), fieldtype: "Datetime", reqd: 1, default: frappe.datetime.add_days(frappe.datetime.now_datetime(), 7) },
        ],
        primary_action_label: __("Start"),
        primary_action: (values) => {
            frm.set_value("start_date", values.start_date);
            frm.set_value("end_date", values.end_date);
            frm.save();
            d.hide();
        },
    });
    d.show();
}

function apply_duration_logic(frm) {
    const duration = frm.doc.duration;

    if (!duration || duration === "Custom") {
        // Custom = user control
        frm.set_df_property("start_date", "read_only", 0);
        frm.set_df_property("end_date", "read_only", 0);
        return;
    }

    // Lock fields
    frm.set_df_property("start_date", "read_only", 1);
    frm.set_df_property("end_date", "read_only", 1);

    let days = 0;

    if (duration === "1 Week") days = 7;
    else if (duration === "2 Week") days = 14;
    else if (duration === "3 Week") days = 21;
    else return; // safety net

    // Start datetime (NOW, exact)
    const start = frappe.datetime.now_datetime();

    // Split date + time explicitly
    const start_date_only = frappe.datetime.get_datetime_as_string(start).split(" ")[0];
    const start_time_only = frappe.datetime.get_datetime_as_string(start).split(" ")[1];

    // Add days to date part only
    const end_date_only = frappe.datetime.add_days(start_date_only, days);

    // Recombine date + SAME time
    const end = `${end_date_only} ${start_time_only}`;

    frm.set_value("start_date", start);
    frm.set_value("end_date", end);
}

function toggle_date_fields(frm) {
    const is_custom = frm.doc.duration === "Custom";

    frm.set_df_property("start_date", "read_only", !is_custom);
    frm.set_df_property("end_date", "read_only", !is_custom);
}
