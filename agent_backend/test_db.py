from tools.firebase_tool import get_all_members

members = get_all_members()
for m in members:
    name = m.get('name', '')
    if 'Agilesh' in name:
        print(f"Name: {name}")
        print(f"URL: {m.get('profiles', {}).get('leetcode_url', '')}")
