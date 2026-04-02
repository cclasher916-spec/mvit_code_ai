import os
import firebase_admin
from firebase_admin import credentials, firestore

def list_all_members():
    print("--- Auditing All Members ---")
    cred_file = 'coding-team-profiles-2b0b4df65b4a.json'
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_file)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    depts = db.collection('departments').stream()
    for dept in depts:
        print(f"Dept: {dept.id}")
        members = dept.reference.collection('members').stream()
        for m in members:
            data = m.to_dict()
            name = data.get('name', 'N/A')
            print(f"  - {name}")

if __name__ == "__main__":
    list_all_members()
