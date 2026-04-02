import re

urls = [
    "https://leetcode.com/Agilesh_S/",
    "https://leetcode.com/u/Agilesh_S",
    "leetcode.com/Agilesh_S"
]

for uname in urls:
    uname_clean = uname.rstrip('/')
    m = re.search(r"leetcode\.com/(?:u/)?([^/]+)", uname_clean)
    if m: 
        print(f"Extracted from {uname}: {m.group(1)}")
    else: 
        print(f"Failed for {uname}")
