import os
import sys
from dotenv import load_dotenv

# Add current dir to path to find supabase_bridge
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from supabase_bridge import SupabaseBridge

def test_supabase_connection():
    load_dotenv(dotenv_path="../.env")
    
    print("--- Testing Supabase Connection ---")
    bridge = SupabaseBridge()
    
    if not bridge.is_active():
        print("❌ Supabase Bridge is not active. Check your .env file and ensure supabase-py is installed.")
        return

    print("✅ Supabase Bridge is active.")

    # Test student lookup
    test_name = "Agilesh S"
    print(f"\n--- Testing Student Lookup for '{test_name}' ---")
    student_id = bridge._get_student_id(test_name)
    if student_id:
        print(f"✅ Found student ID: {student_id}")
    else:
        print(f"❌ Could not find student '{test_name}'. Ensure the student exists in the Supabase 'students' table.")
        return

    # Test daily activity upsert
    print(f"\n--- Testing Daily Activity Upsert ---")
    bridge.upsert_daily_activity(
        member_name=test_name,
        leetcode_solved=826,
        skillrack_solved=694,
        codechef_solved=82,
        hackerrank_solved=11,
        lc_daily=0,
        sr_daily=0,
        cc_daily=0,
        hr_daily=0
    )
    print("✅ Upsert call completed.")

    # Test task assignment
    print(f"\n--- Testing Task Assignment ---")
    bridge.assign_task(
        member_name=test_name,
        title="Test Bridge Task",
        problem_url="https://leetcode.com/problems/two-sum/",
        difficulty="Easy",
        platform="leetcode",
        description="Verify the bridge is working correctly."
    )
    print("✅ Task assignment call completed.")

if __name__ == "__main__":
    test_supabase_connection()
