import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Load .env
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=dotenv_path)

def debug_firebase():
    print("--- Firebase Diagnostic ---")
    
    # Check for credentials file
    cred_paths = [
        os.path.join(os.path.dirname(__file__), 'coding-team-profiles-2b0b4df65b4a.json'),
        os.path.join(os.path.dirname(__file__), 'agent_backend/coding-team-profiles-2b0b4df65b4a.json'),
    ]
    
    cred_file = None
    for p in cred_paths:
        if os.path.exists(p):
            print(f"Found credentials at: {p}")
            cred_file = p
            break
    
    if not cred_file:
        print("CRITICAL: Credentials file NOT FOUND.")
        return

    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_file)
            firebase_admin.initialize_app(cred)
            print("Firebase initialized successfully.")
        else:
            print("Firebase already initialized.")
            
        db = firestore.client()
        print("Firestore client created.")
        
        # Test collection group query
        print("Searching for 'Agilesh' in collection group 'members'...")
        members_ref = db.collection_group('members').where('name', '==', 'Agilesh').stream()
        
        found = False
        for doc in members_ref:
            print(f"MATCH FOUND: {doc.id} => {doc.to_dict().get('name')}")
            found = True
            
        if not found:
            print("No exact match for 'Agilesh'. Trying case-insensitive scan...")
            all_members = db.collection_group('members').stream()
            for doc in all_members:
                name = doc.to_dict().get('name', '')
                if 'agilesh' in name.lower():
                    print(f"POTENTIAL MATCH: {name} (ID: {doc.id})")
                    found = True
        
        if not found:
            print("No members found at all.")

    except Exception as e:
        print(f"Firebase ERROR: {e}")

if __name__ == "__main__":
    debug_firebase()
