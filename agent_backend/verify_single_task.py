import os
import sys
import argparse
from datetime import datetime, timezone
from supabase import create_client, Client

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from autonomous_loop import verify_leetcode_completion, calculate_elo
from tools.firebase_tool import _find_member_by_name, update_task_status, update_member_elo

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--task-id', required=True)
    parser.add_argument('--student-id', required=True)
    parser.add_argument('--platform', required=True)
    args = parser.parse_args()

    task_id = args.task_id
    student_id = args.student_id
    platform = args.platform

    print(f"Starting verification for Task ID: {task_id} | Student ID: {student_id} | Platform: {platform}")

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        print("Missing SUPABASE_URL or SUPABASE_KEY environment variables.")
        sys.exit(1)

    sb: Client = create_client(supabase_url, supabase_key)

    # 1. Fetch Task Details
    res = sb.table("agent_tasks").select("*").eq("id", task_id).execute()
    if not res.data:
        print(f"Task {task_id} not found in Supabase.")
        sys.exit(1)
    
    task_data = res.data[0]
    problem_title = task_data.get("title", "")
    difficulty = task_data.get("difficulty", "Medium")
    # Parse assigned_at as UTC timezone aware datetime
    try:
        assigned_at_str = task_data.get("assigned_at")
        if assigned_at_str:
             if assigned_at_str.endswith('Z'):
                 assigned_at_str = assigned_at_str[:-1] + '+00:00'
             assigned_date = datetime.fromisoformat(assigned_at_str)
        else:
             assigned_date = datetime.now(timezone.utc)
    except Exception as e:
        print(f"Error parsing date {task_data.get('assigned_at')}: {e}")
        assigned_date = datetime.now(timezone.utc)
    
    # 2. Fetch Student Details
    res = sb.table("students").select("name").eq("id", student_id).execute()
    if not res.data:
        print(f"Student {student_id} not found in Supabase.")
        sys.exit(1)
    
    student_name = res.data[0].get("name")

    # 3. Fetch Platform Username
    res = sb.table("platform_accounts").select("username").eq("student_id", student_id).eq("platform", platform).execute()
    if not res.data:
        print(f"No {platform} account found for student {student_id}.")
        revert_to_pending(sb, task_id)
        sys.exit(1)
    
    username = res.data[0].get("username")
    profile_url = f"https://leetcode.com/u/{username}"

    print(f"Verifying '{problem_title}' for {student_name} ({username}) assigned at {assigned_date}")

    # 4. Verify Completion
    is_verified = False
    if platform.lower() == 'leetcode':
        is_verified = verify_leetcode_completion(profile_url, problem_title, assigned_date)
    else:
        print(f"Verification for platform {platform} is not fully supported yet.")
        revert_to_pending(sb, task_id)
        sys.exit(0)

    # 5. Process Result
    now = datetime.now(timezone.utc)
    if is_verified:
        print("Verification SUCCESS! 🎉")
        
        # A. Update Supabase
        sb.table("agent_tasks").update({
            "status": "completed",
            "completed_at": now.isoformat(),
            "description": f"{task_data.get('description', '')}\n\n🎉 Verified via Serverless Action!".strip()
        }).eq("id", task_id).execute()

        # B. Update Firebase
        member_doc = _find_member_by_name(student_name)
        if member_doc:
            mem_data = member_doc.to_dict()
            elo = mem_data.get("elo_rating", 1200)
            new_elo = calculate_elo(elo, difficulty, 1)
            
            # Find the corresponding task in Firebase to update
            tasks_ref = member_doc.reference.collection('agent_tasks').where('status', '==', 'pending').stream()
            for t in tasks_ref:
                tdata = t.to_dict()
                if problem_title.lower() in tdata.get("description", "").lower() or problem_title.lower() == tdata.get("title", "").lower():
                    ver_log = f"[SERVERLESS CHECK] User: {student_name} | Task: {problem_title} | Status: Completed ✔️"
                    update_task_status(t.reference, "completed", actual_time=str(now), verification_log=ver_log)
                    break
            
            # Update Elo
            update_member_elo(member_doc.reference, new_elo, failures=0)
            print(f"Updated {student_name}'s ELO from {elo} to {new_elo}")
        else:
            print(f"Warning: Member {student_name} not found in Firebase to update ELO.")

    else:
        print("Verification FAILED. Not found in recent submissions since assignment.")
        revert_to_pending(sb, task_id)

def revert_to_pending(sb: Client, task_id: str):
    """Reverts task to pending if verification fails or account missing."""
    sb.table("agent_tasks").update({
        "status": "pending"
    }).eq("id", task_id).execute()
    print(f"Reverted task {task_id} back to 'pending'.")

if __name__ == "__main__":
    main()
