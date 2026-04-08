import frappe
import requests
from datetime import datetime

FATHOM_BASE_URL = "https://api.fathom.ai/external/v1"
MEETINGS_URL = f"{FATHOM_BASE_URL}/meetings"


def get_fathom_headers(account="Muqeet"):
    fathom_account = frappe.get_doc("Fathom Account", account)
    api_key = fathom_account.get_password("api_key")
    return {"X-Api-Key": api_key}


def request_fathom(url, headers, params=None):
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()


def list_meetings(account="Muqeet", pages=2, limit=100):
    results = []
    cursor = None
    headers = get_fathom_headers(account)
    base_query_params = {
        "calendar_invitees_domains_type": "all",
        "include_action_items": True,
        "include_summary": True,
        "include_transcript": True,
        "limit": limit,
    }

    for page in range(pages):
        print(f"Fetching meetings page {page + 1} with cursor: {cursor}")
        query_params = dict(base_query_params)
        if cursor:
            query_params["cursor"] = cursor

        data = request_fathom(MEETINGS_URL, headers, params=query_params)
        results.extend(data.get("items", []))
        cursor = data.get("next_cursor")

        if not cursor:
            break

    return results


def get_meeting_summary(recording_id, account="Muqeet"):
    headers = get_fathom_headers(account)
    url = f"{FATHOM_BASE_URL}/recordings/{recording_id}/summary"
    data = request_fathom(url, headers)
    summary = data.get("summary")
    if isinstance(summary, dict):
        return summary.get("markdown_formatted") or summary.get("text") or summary.get("summary")
    return summary


def get_meeting_transcript(recording_id, account="Muqeet"):
    headers = get_fathom_headers(account)
    url = f"{FATHOM_BASE_URL}/recordings/{recording_id}/transcript"
    data = request_fathom(url, headers)
    return data.get("transcript") or []


def normalize_summary(summary):
    if summary is None:
        return None
    if isinstance(summary, dict):
        return summary.get("markdown_formatted") or summary.get("text") or summary.get("summary")
    return summary


def normalize_person(person):
    if person is None:
        return None
    if isinstance(person, str):
        return person
    if isinstance(person, dict):
        return person.get("display_name") or person.get("name") or person.get("email")
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
        except ValueError:
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
        "name1": invitee.get("display_name") or invitee.get("name") or invitee.get("email"),
        "email": invitee.get("email") or invitee.get("matched_calendar_invitee_email"),
    }


def _transcript_payload(row, recording_id):
    speaker = row.get("speaker") or {}
    return {
        "recording_id": str(recording_id),
        "speaker_name": speaker.get("display_name") or speaker.get("name"),
        "speaker_calender_email": speaker.get("matched_calendar_invitee_email") or speaker.get("email"),
        "timestamp": row.get("timestamp"),
        "text": row.get("text"),
    }


def sync_meeting(meeting, account="Muqeet"):
    recording_id = meeting.get("recording_id")
    if recording_id is None:
        return None

    existing = frappe.db.exists("Fathom Meeting", {"recording_id": recording_id, "account": account})
    if existing:
        meeting_doc = frappe.get_doc("Fathom Meeting", existing)
    else:
        meeting_doc = frappe.new_doc("Fathom Meeting")

    meeting_doc.account = account
    meeting_doc.meeting_title = meeting.get("meeting_title") or meeting.get("title")
    meeting_doc.recording_id = str(recording_id)
    meeting_doc.recorded_by = normalize_person(
        meeting.get("recorded_by") or meeting.get("created_by") or meeting.get("owner")
    )
    meeting_doc.recording_start_date = to_date(meeting.get("recording_start_time"))
    meeting_doc.recording_end_date = to_date(meeting.get("recording_end_time"))
    meeting_doc.meeting_url = meeting.get("url") or meeting.get("meeting_url")
    meeting_doc.scheduled_start_time = normalize_datetime(meeting.get("scheduled_start_time"))
    meeting_doc.scheduled_end_time = normalize_datetime(meeting.get("scheduled_end_time"))
    meeting_doc.share_url = meeting.get("share_url") or meeting.get("url")
    meeting_doc.summary = normalize_summary(
        meeting.get("summary") or meeting.get("default_summary")
    )

    if not meeting_doc.summary:
        meeting_doc.summary = get_meeting_summary(recording_id, account=account)

    meeting_doc.set("invitees", [])
    all_invitees = (meeting.get("invitees", []) or []) + (meeting.get("calendar_invitees", []) or [])
    for invitee in all_invitees:
        meeting_doc.append("invitees", _invitee_payload(invitee))

    transcript_rows = meeting.get("transcript")
    if transcript_rows is None:
        transcript_rows = get_meeting_transcript(recording_id, account=account)

    meeting_doc.set("transcript", [])
    for row in transcript_rows or []:
        meeting_doc.append("transcript", _transcript_payload(row, recording_id))

    meeting_doc.flags.ignore_permissions = True
    if meeting_doc.get("name"):
        meeting_doc.save(ignore_permissions=True)
    else:
        meeting_doc.insert(ignore_permissions=True)

    return meeting_doc.name


def sync_meetings(account="Muqeet", pages=2, limit=100):
    synced = []
    meetings = list_meetings(account=account, pages=pages, limit=limit)
    if not meetings:
        print(f"No meetings found for account {account}")
        return synced

    for meeting in meetings:
        name = sync_meeting(meeting, account=account)
        if name:
            synced.append(name)
            print(f"Synced Fathom Meeting: {name}")

    return synced


def sync_accounts(pages=2, limit=100):
    accounts = frappe.get_all("Fathom Account", fields=["name"])
    synced = []
    for account in accounts:
        synced += sync_meetings(account=account.name, pages=pages, limit=limit)
    return synced


