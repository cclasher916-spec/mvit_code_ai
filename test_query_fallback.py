import os
import firebase_admin
from firebase_admin import credentials, firestore

def test_unfiltered_query():
    print("--- Testing Unfiltered Collection Group Query ---")
    cred_file = 'coding-team-profiles-2b0b4df65b4a.json'
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_file)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    try:
        # Fetching ALL members and filtering in Python
        print("Streaming all 'members' documents...")
        members_ref = db.collection_group('members').stream()
        
        count = 0
        for doc in members_ref:
            count += 1
            if count > 5: break
            print(f"Found: {doc.to_dict().get('name')}")
            
        print(f"Success! Fetched {count} docs (limit 5 in log).")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_unfiltered_query()
