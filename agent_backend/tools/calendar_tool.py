from langchain.tools import tool
import os.path
from datetime import datetime
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]

def get_calendar_service():
    try:
        creds = None
        token_path = os.path.join(os.path.dirname(__file__), '../token.json')
        cred_path = os.path.join(os.path.dirname(__file__), '../credentials.json')
        
        if os.path.exists(token_path):
            creds = Credentials.from_authorized_user_file(token_path, SCOPES)
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(cred_path):
                    return None
                flow = InstalledAppFlow.from_client_secrets_file(cred_path, SCOPES)
                creds = flow.run_local_server(port=0)
            with open(token_path, "w") as token:
                token.write(creds.to_json())
        return build("calendar", "v3", credentials=creds)
    except Exception as e:
        print(f"⚠️ Calendar init skipped: {e}")
        return None

@tool
def schedule_event(summary: str, start_time: str, end_time: str, description: str = "") -> str:
    """
    Schedules an event on Google Calendar. 
    Args:
        summary: Title of the event.
        start_time: ISO format string (e.g., '2026-03-25T15:00:00-07:00').
        end_time: ISO format string (e.g., '2026-03-25T16:00:00-07:00').
        description: Details or Meet links.
    Returns:
        The URL of the created event or an error message.
    """
    service = get_calendar_service()
    if not service:
        return "Google Calendar credentials.json not found. Cannot schedule event."
        
    event = {
        'summary': summary,
        'description': description,
        'start': {
            'dateTime': start_time,
            'timeZone': 'UTC',
        },
        'end': {
            'dateTime': end_time,
            'timeZone': 'UTC',
        },
    }
    
    try:
        event = service.events().insert(calendarId='primary', body=event).execute()
        return f"Event created successfully: {event.get('htmlLink')}"
    except Exception as e:
        return f"Failed to create event: {e}"
