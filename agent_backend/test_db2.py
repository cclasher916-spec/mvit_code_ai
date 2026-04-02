from tools.firebase_tool import get_all_members

members = get_all_members()
for m in members:
    name = m.get('name', 'Unknown')
    print(f"Name: {name}")
    print(f"LC: {m.get('profiles', {}).get('leetcode_url', '')}")
