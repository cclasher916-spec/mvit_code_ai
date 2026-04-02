from tools.firebase_tool import get_all_members

members = get_all_members()
for m in members:
    data = m.get('data', {})
    name = data.get('name', '')
    if 'Agilesh' in name:
        print(f"Name: {name}")
        print(f"LC URL: {data.get('profiles', {}).get('leetcode_url', '')}")
