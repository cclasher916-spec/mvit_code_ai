import os
import firebase_admin
from firebase_admin import credentials, firestore

def probe_dept():
    print("--- Probing Departments ---")
    cred_file = 'coding-team-profiles-2b0b4df65b4a.json'
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_file)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    depts = db.collection('departments').limit(1).stream()
    for dept in depts:
        print(f"Department Doc: {dept.id}")
        # List subcollections
        subcolls = dept.reference.collections()
        for sub in subcolls:
            print(f"  Subcollection: {sub.id}")
            # Check for nested members or sections
            if sub.id == 'members':
                 print("    Found members subcollection!")
            elif sub.id == 'sections':
                 print("    Found sections subcollection!")

if __name__ == "__main__":
    probe_dept()
