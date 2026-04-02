import os
import firebase_admin
from firebase_admin import credentials, firestore

def list_collections():
    print("--- Listing Collections ---")
    cred_file = 'coding-team-profiles-2b0b4df65b4a.json'
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_file)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    collections = db.collections()
    for coll in collections:
        print(f"Collection: {coll.id}")

if __name__ == "__main__":
    list_collections()
