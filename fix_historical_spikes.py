import firebase_admin
from firebase_admin import credentials, firestore

def fix_glitches():
    # 1. Initialize Firebase
    cred = credentials.Certificate("coding-team-profiles-2b0b4df65b4a.json")
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred)

    db = firestore.client()
    print("Starting Firestore Glitch Fixer...")

    # 2. Iterate through all members
    departments = db.collection('departments').stream()
    fixed_count = 0

    for dept_doc in departments:
        sections = dept_doc.reference.collection('sections').stream()
        for section_doc in sections:
            teams = section_doc.reference.collection('teams').stream()
            for team_doc in teams:
                members = team_doc.reference.collection('members').stream()
                for member_doc in members:
                    member_id = member_doc.id
                    name = member_doc.to_dict().get("name", member_id)
                    
                    # 3. Get all daily totals for this member, sorted oldest to newest
                    daily_totals_ref = member_doc.reference.collection("daily_totals")
                    docs = list(daily_totals_ref.order_by("date").stream())
                    
                    if not docs:
                        continue

                    # 4. Compare each day with the PREVIOUS day in the loop
                    prev_data = None
                    
                    for doc in docs:
                        doc_id = doc.id
                        data = doc.to_dict()
                        needs_update = False
                        updates = {}
                        
                        # Platforms to check
                        platforms = ["leetcode", "skillrack", "codechef", "hackerrank", "github"]
                        
                        for p in platforms:
                            total_key = f"{p}_total" if p != "github" else "github_repos"
                            diff_key = f"{p}_daily_increase"
                            
                            current_total = data.get(total_key, 0)
                            current_diff = data.get(diff_key, 0)
                            
                            # If the diff is exactly the total, it's a glitch!
                            if current_total > 0 and current_diff == current_total:
                                
                                # What SHOULD it be?
                                if prev_data:
                                    prev_total = prev_data.get(total_key, 0)
                                    correct_diff = max(0, current_total - prev_total)
                                else:
                                    # If it's the very first record ever, diff should be 0
                                    correct_diff = 0
                                    
                                if current_diff != correct_diff:
                                    updates[diff_key] = correct_diff
                                    needs_update = True
                                    print(f"   ↳ {name} ({doc_id}): {p} {current_diff} ❌ -> {correct_diff} ✅")

                        # If we found issues, update Firestore for this single date
                        if needs_update:
                            doc.reference.update(updates)
                            fixed_count += 1
                            
                        # Set current as previous for next loop iteration
                        prev_data = data

    print(f"\nDone! Fixed {fixed_count} anomalous daily records.")

if __name__ == "__main__":
    fix_glitches()
