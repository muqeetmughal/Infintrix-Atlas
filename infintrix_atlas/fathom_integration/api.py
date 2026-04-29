import frappe
import requests
from datetime import datetime

FATHOM_BASE_URL = "https://api.fathom.ai/external/v1"


# ================================
# AUTH + REQUEST
# ================================

def get_fathom_headers(account):
    doc = frappe.get_doc("Fathom Account", account)
    api_key = doc.get_password("api_key")
    return {"X-Api-Key": api_key}


def request_fathom(url, headers, params=None):
    try:
        res = requests.get(url, headers=headers, params=params, timeout=30)
        res.raise_for_status()
        return res.json()
    except requests.exceptions.RequestException as e:
        frappe.log_error(frappe.get_traceback(), f"Fathom API Error: {str(e)}")
        return {}


# ================================
# ENTRY POINT (CRON / MANUAL)
# ================================

def enqueue_sync_all_accounts():
    accounts = frappe.get_all("Fathom Account", fields=["name"])

    for acc in accounts:
        print(f"Enqueuing sync for account: {acc.name}")
        # sync_account_meetings(acc.name)
        frappe.enqueue(
            method="infintrix_atlas.fathom_integration.api.sync_account_meetings",
            queue="long",
            timeout=1500,
            account=acc.name,
            
        )


# ================================
# PAGINATED SYNC (STREAMING)
# ================================

def sync_account_meetings(account):
    headers = get_fathom_headers(account)
    url = f"{FATHOM_BASE_URL}/meetings"

    cursor = None

    base_params = {
        "limit": 50,
        "calendar_invitees_domains_type": "all",
        "include_summary": True,
        "include_transcript": True,
    }

    # Incremental sync
    # last_sync = frappe.db.get_value("Fathom Account", account, "last_sync")
    # if last_sync:
    #     base_params["created_after"] = last_sync

    while True:
        params = dict(base_params)

        if cursor:
            params["cursor"] = cursor

        data = request_fathom(url, headers, params=params)
        items = data.get("items", [])

        if not items:
            break

        for meeting in items:
            # process_meeting(meeting, account)
            frappe.enqueue(
                method="infintrix_atlas.fathom_integration.api.process_meeting",
                queue="short",
                timeout=300,
                meeting=meeting,
                account=account,
                is_async=False
            )

        cursor = data.get("next_cursor")
        
        if not cursor:
            break

    # Update sync checkpoint AFTER success
    # frappe.db.set_value("Fathom Account", account,
    #                     "last_sync", frappe.utils.now())

def normalize_summary(summary):
    if summary is None:
        return None
    if isinstance(summary, dict):
        return summary.get("markdown_formatted") or summary.get("text") or summary.get("summary")
    return summary


def get_meeting_summary(recording_id, account="Muqeet"):
    headers = get_fathom_headers(account)
    url = f"{FATHOM_BASE_URL}/recordings/{recording_id}/summary"
    data = request_fathom(url, headers)
    summary = data.get("summary")
    if isinstance(summary, dict):
        return summary.get("markdown_formatted") or summary.get("text") or summary.get("summary")
    return summary


def get_meeting_transcript(recording_id, account):
    headers = get_fathom_headers(account)
    url = f"{FATHOM_BASE_URL}/recordings/{recording_id}/transcript"
    data = request_fathom(url, headers)
    return data.get("transcript") or []


def _transcript_payload(row, recording_id):
    speaker = row.get("speaker") or {}
    return {
        "recording_id": str(recording_id),
        "speaker_name": speaker.get("display_name") or speaker.get("name"),
        "speaker_calender_email": speaker.get("matched_calendar_invitee_email") or speaker.get("email"),
        "timestamp": row.get("timestamp"),
        "text": row.get("text"),
    }
# ================================
# MEETING PROCESSOR (WORKER UNIT)
# ================================

def process_meeting(meeting, account):
    try:
        recording_id = meeting.get("recording_id")
        if not recording_id:
            return

        existing = frappe.db.exists(
            "Fathom Meeting",
            {"recording_id": str(recording_id), "account": account}
        )

        if existing:
            doc = frappe.get_doc("Fathom Meeting", existing)
        else:
            doc = frappe.new_doc("Fathom Meeting")

        # Core fields
        doc.account = account
        doc.recording_id = str(recording_id)
        doc.meeting_title = meeting.get(
            "meeting_title") or meeting.get("title")

        doc.meeting_url = meeting.get("url")
        doc.share_url = meeting.get("share_url")

        doc.scheduled_start_time = normalize_datetime(
            meeting.get("scheduled_start_time"))
        doc.scheduled_end_time = normalize_datetime(
            meeting.get("scheduled_end_time"))

        doc.recording_start_date = to_date(meeting.get("recording_start_time"))
        doc.recording_end_date = to_date(meeting.get("recording_end_time"))

        doc.recorded_by = normalize_person(meeting.get("recorded_by"))
        doc.data = frappe.as_json(meeting)
        
        
        doc.summary = normalize_summary(
            meeting.get("summary") or meeting.get("default_summary")
        )

        if not doc.summary:
            doc.summary = get_meeting_summary(recording_id, account=account)

        # Only insert invitees ONCE (avoid heavy rewrites)
        if not existing:
            for invitee in meeting.get("calendar_invitees", []) or []:
                doc.append("invitees", _invitee_payload(invitee))
                
        transcript_rows = meeting.get("transcript")
        if transcript_rows is None:
            transcript_rows = get_meeting_transcript(recording_id, account=account)
            
            
        doc.set("transcript", [])
        for row in transcript_rows or []:
            doc.append("transcript", _transcript_payload(row, recording_id))
                

        doc.flags.ignore_permissions = True

        if existing:
            doc.save(ignore_permissions=True)
        else:
            doc.insert(ignore_permissions=True)

    except Exception:
        frappe.log_error(frappe.get_traceback(), "Fathom Meeting Sync Failed")


# ================================
# HELPERS
# ================================

def normalize_person(person):
    if not person:
        return None

    if isinstance(person, str):
        return person

    if isinstance(person, dict):
        return (
            person.get("display_name")
            or person.get("name")
            or person.get("email")
        )

    return str(person)


def normalize_datetime(value):
    if not value:
        return None

    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")

    if isinstance(value, str):
        if value.endswith("Z"):
            value = value[:-1] + "+00:00"

        try:
            dt = datetime.fromisoformat(value)
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            return value

    return value


def to_date(value):
    if not value:
        return None

    if isinstance(value, str) and "T" in value:
        return value.split("T")[0]

    return value


def _invitee_payload(invitee):
    return {
        "name1": invitee.get("display_name")
        or invitee.get("name")
        or invitee.get("email"),
        "email": invitee.get("email")
        or invitee.get("matched_calendar_invitee_email"),
    }
