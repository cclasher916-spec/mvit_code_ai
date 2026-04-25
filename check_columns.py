import os
import requests
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("SUPABASE_URL", "")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}
response = requests.get(f"{url}/rest/v1/", headers=headers)
if response.status_code == 200:
    data = response.json()
    daily_activity = data.get("definitions", {}).get("daily_activity", {})
    if "properties" in daily_activity:
        print("daily_activity columns:", list(daily_activity["properties"].keys()))
    else:
        print("daily_activity properties not found")
else:
    print("Failed to fetch OpenAPI spec:", response.status_code, response.text)
