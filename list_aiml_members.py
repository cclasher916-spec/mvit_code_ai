import os
import firebase_admin
from firebase_admin import credentials, firestore

def list_aiml_members():
    print("--- Listing ALL Members in AIML ---")
    cred_file = 'coding-team-profiles-2b0b4df65b4a.json'
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_file)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    aiml_ref = db.collection('departments').document('AIML')
    
    def walk(ref, path="AIML"):
        for sub in ref.collections():
            if sub.id == 'members':
                print(f"  Found 'members' at {path}/{sub.id}:")
                for doc in sub.stream():
                    print(f"    - '{doc.to_dict().get('name')}' (ID: {doc.id})")
            else:
                for doc in sub.stream():
                    walk(doc.reference, f"{path}/{sub.id}/{doc.id}")

    walk(aiml_ref)

if __name__ == "__main__":
    list_aiml_members()
