import os
import firebase_admin
from firebase_admin import credentials, firestore

def probe_aiml():
    print("--- Probing AIML ---")
    cred_file = 'coding-team-profiles-2b0b4df65b4a.json'
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_file)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    aiml = db.collection('departments').document('AIML').get()
    if aiml.exists:
        print("AIML exists.")
        subcolls = aiml.reference.collections()
        for sub in subcolls:
            print(f"  Subcollection: {sub.id}")
            # List some docs in this subcollection
            docs = sub.limit(3).stream()
            for doc in docs:
                print(f"    Doc ID: {doc.id}")
                # And list their subcollections
                inner_subs = doc.reference.collections()
                for inner in inner_subs:
                    print(f"      Inner Subcollection: {inner.id}")
                    # If it's a team or section, check for members
                    inner_docs = inner.limit(3).stream()
                    for idoc in inner_docs:
                         print(f"        Inner Doc ID: {idoc.id}")
                         # And more?
                         further_subs = idoc.reference.collections()
                         for fs in further_subs:
                              print(f"          Further Sub: {fs.id}")

if __name__ == "__main__":
    probe_aiml()
