import requests
from datetime import datetime, timedelta

query = """
    query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
            title
            timestamp
        }
    }
    """
payload = {"query": query, "variables": {"username": "agilesh304", "limit": 100}}

r = requests.post("https://leetcode.com/graphql", json=payload, headers={"Content-Type":"application/json"}, timeout=10)
if r.status_code == 200:
    subs = r.json().get("data", {}).get("recentAcSubmissionList", [])
    titles = [s['title'] for s in subs]
    print(f"Total found: {len(titles)}")
    print(f"Titles: {titles}")
    if "3Sum" in titles:
        print("YES! 3Sum was found!")
    else:
        print("3Sum NOT FOUND even in top 100!")
