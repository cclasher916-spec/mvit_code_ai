import requests
from datetime import datetime, timedelta

def verify_leetcode_completion_debug(profile_url, problem_title, assigned_date):
    if not profile_url: return False
    uname = profile_url.strip()
    if "http" in uname or "leetcode.com" in uname:
        import re
        uname_clean = uname.rstrip('/')
        m = re.search(r"leetcode\.com/(?:u/)?([^/]+)", uname_clean)
        if m: uname = m.group(1)
        else: return False
        
    print(f"Username extracted: {uname}")
    query = """
    query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
            title
            timestamp
        }
    }
    """
    payload = {"query": query, "variables": {"username": uname, "limit": 15}}
    
    r = requests.post("https://leetcode.com/graphql", json=payload, headers={"Content-Type":"application/json"}, timeout=10)
    print(f"Status Code: {r.status_code}")
    if r.status_code == 200:
        subs = r.json().get("data", {}).get("recentAcSubmissionList", [])
        print(f"Submissions: {subs}")
        for sub in subs:
            print(f"Checking {sub.get('title')} against {problem_title}")
            if sub.get("title").lower() == problem_title.lower():
                ts = int(sub.get("timestamp", 0))
                sub_date = datetime.fromtimestamp(ts)
                print(f"Match found! Date: {sub_date}, Assigned: {assigned_date}")
                if sub_date >= assigned_date:
                    return True
                else:
                    print("Date is before assignment date.")
    return False

assigned_date = datetime.now() - timedelta(days=2) # 2 days ago
res = verify_leetcode_completion_debug("https://leetcode.com/Agilesh_S/", "3Sum", assigned_date)
print(f"Verified: {res}")
