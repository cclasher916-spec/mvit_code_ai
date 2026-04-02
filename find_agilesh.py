import os
import firebase_admin
from firebase_admin import credentials, firestore

def find_agilesh_specifically():
    print("--- Finding Agilesh Specifically ---")
    cred_file = 'coding-team-profiles-2b0b4df65b4a.json'
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_file)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    members_ref = db.collection('departments').document('AIML') \
                    .collection('sections').document('A') \
                    .collection('teams').document('Team 1') \
                    .collection('members').stream()
    
    print("Listing all members in AIML -> A -> Team 1:")
    for doc in members_ref:
        name = doc.to_dict().get('name', 'N/A')
        print(f"  - '{name}' (ID: {doc.id})")
        if 'agilesh' in name.lower():
            print(f"    FOUND MATCH: {name}")

if __name__ == "__main__":
    find_agilesh_specifically()
