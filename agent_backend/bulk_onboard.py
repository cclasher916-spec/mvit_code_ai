import pandas as pd
import requests
import re
import time
import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(dotenv_path="../.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: Missing Supabase Admin credentials in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Firebase initialization from existing tool
from tools.firebase_tool import get_db
db = get_db()

def check_leetcode_username(username: str) -> bool:
    """Verifies if the leetcode username exists (Status 200)"""
    try:
        response = requests.get(f"https://leetcode.com/{username}/", timeout=10)
        time.sleep(0.5) # Prevent rate limits
        return response.status_code == 200
    except requests.exceptions.RequestException:
        time.sleep(0.5)
        return False

def get_existing_data():
    """Fetches existing emails and roll numbers to ensure uniqueness globally"""
    res = supabase.table("students").select("roll_no").execute()
    roll_nos = set([r['roll_no'] for r in res.data]) if res.data else set()
    return roll_nos

def get_or_create_department(dept_name: str) -> str:
    res = supabase.table("departments").select("id").eq("name", dept_name).execute()
    if res.data and len(res.data) > 0:
        return res.data[0]['id']
    else:
        new_res = supabase.table("departments").insert({"name": dept_name, "code": dept_name[:3].upper()}).execute()
        return new_res.data[0]['id']

def get_or_create_section(sec_name: str, dept_id: str, batch: str) -> str:
    res = supabase.table("sections").select("id").eq("name", sec_name).eq("department_id", dept_id).eq("batch", batch).execute()
    if res.data and len(res.data) > 0:
        return res.data[0]['id']
    else:
        new_res = supabase.table("sections").insert({"name": sec_name, "department_id": dept_id, "batch": batch}).execute()
        return new_res.data[0]['id']

def run_onboarding(file_path_or_url: str):
    print(f"🚀 Initializing Onboarding Pipeline for: {file_path_or_url}")
    
    try:
        if file_path_or_url.startswith("http"):
            df = pd.read_csv(file_path_or_url)
        elif file_path_or_url.endswith('.csv'):
            if not os.path.exists(file_path_or_url):
                print(f"❌ ERROR: File '{file_path_or_url}' not found.")
                return
            df = pd.read_csv(file_path_or_url)
        else:
            if not os.path.exists(file_path_or_url):
                print(f"❌ ERROR: File '{file_path_or_url}' not found.")
                return
            df = pd.read_excel(file_path_or_url)
    except Exception as e:
        print(f"❌ ERROR loading file/URL: {e}")
        return

    # Normalize columns to lower case for easier matching
    df.columns = [str(c).strip().lower() for c in df.columns]

    # Required fields mapping based on the Google Form design
    required_cols = ['full name', 'roll number', 'student email address', 'batch', 'department', 'section', 'leetcode username']
    
    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        print(f"❌ ERROR: Data source missing required column headers: {missing_cols}")
        print(f"   Found columns: {df.columns.tolist()}")
        return

    existing_rolls = get_existing_data()
    errors = []
    valid_rows = []

    print("🔍 Layer 1: Running Validations...")
    for idx, row in df.iterrows():
        row_num = idx + 2 # Approx row number
        row_issues = []
        
        # 1. Missing Check
        for col in required_cols:
            if pd.isna(row[col]) or str(row[col]).strip() == "":
                row_issues.append(f"Missing '{col}'")

        if row_issues:
            errors.append({"row_number": row_num, "name": row.get('full name',''), "issue": ", ".join(row_issues)})
            continue

        full_name = str(row['full name']).strip()
        roll_no = str(row['roll number']).strip().upper()
        email = str(row['student email address']).strip().lower()
        batch = str(row['batch']).strip()
        department = str(row['department']).strip().upper()
        section = str(row['section']).strip().upper()
        leetcode = str(row['leetcode username']).strip()
        
        # Optional Fields
        mobile_col = 'mobile number' if 'mobile number' in df.columns else 'mobile'
        mobile = str(row[mobile_col]).strip() if mobile_col in df.columns and pd.notna(row[mobile_col]) else ""
        
        team_name_col = 'team name (optional)' if 'team name (optional)' in df.columns else 'team name'
        team_name = str(row[team_name_col]).strip() if team_name_col in df.columns and pd.notna(row[team_name_col]) and str(row[team_name_col]).strip() != "" else "Unassigned"
        
        team_role_col = 'team role (optional)' if 'team role (optional)' in df.columns else 'team role'
        team_role = str(row[team_role_col]).strip().lower() if team_role_col in df.columns and pd.notna(row[team_role_col]) else "member"

        skillrack = str(row['skillrack username (optional)']).strip() if 'skillrack username (optional)' in df.columns and pd.notna(row['skillrack username (optional)']) else (str(row['skillrack username']).strip() if 'skillrack username' in df.columns and pd.notna(row['skillrack username']) else None)
        codechef = str(row['codechef username (optional)']).strip() if 'codechef username (optional)' in df.columns and pd.notna(row['codechef username (optional)']) else (str(row['codechef username']).strip() if 'codechef username' in df.columns and pd.notna(row['codechef username']) else None)
        codeforces = str(row['codeforces username (optional)']).strip() if 'codeforces username (optional)' in df.columns and pd.notna(row['codeforces username (optional)']) else (str(row['codeforces username']).strip() if 'codeforces username' in df.columns and pd.notna(row['codeforces username']) else None)
        hackerrank = str(row['hackerrank username (optional)']).strip() if 'hackerrank username (optional)' in df.columns and pd.notna(row['hackerrank username (optional)']) else (str(row['hackerrank username']).strip() if 'hackerrank username' in df.columns and pd.notna(row['hackerrank username']) else None)
        github = str(row['github username (optional)']).strip() if 'github username (optional)' in df.columns and pd.notna(row['github username (optional)']) else (str(row['github username']).strip() if 'github username' in df.columns and pd.notna(row['github username']) else None)

        # 2. Format Checks
        if "@" not in email:
            row_issues.append("Invalid email format")
            
        mob_digits = re.sub(r'\D', '', mobile) if mobile else ""
        if mobile and len(mob_digits) != 10:
            row_issues.append("Mobile number must be exactly 10 digits")
            
        if not re.match(r'^\d{4}-\d{4}$', batch):
            row_issues.append("Batch must be strictly YYYY-YYYY format (e.g. 2023-2027)")
            
        # 3. Uniqueness Check
        if roll_no in existing_rolls:
            row_issues.append(f"Duplicate roll_no '{roll_no}' (already in DB)")
            
        # 4. LeetCode Legitimacy
        if not row_issues:
            print(f"   -> Verifying LeetCode URL for {full_name} ({leetcode})...")
            if not check_leetcode_username(leetcode):
                row_issues.append(f"Invalid LeetCode username '{leetcode}' (Not Found / 404)")

        if row_issues:
            errors.append({"row_number": row_num, "name": full_name, "issue": ", ".join(row_issues)})
        else:
            valid_rows.append({
                "excel_row": row_num,
                "full_name": full_name,
                "roll_no": roll_no,
                "email": email,
                "mobile": mob_digits,
                "batch": batch,
                "department": department,
                "section": section,
                "leetcode": leetcode,
                "skillrack": skillrack,
                "codechef": codechef,
                "codeforces": codeforces,
                "hackerrank": hackerrank,
                "github": github,
                "team_name": team_name,
                "team_role": team_role
            })

    if errors:
        err_df = pd.DataFrame(errors)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        err_file = f"onboarding_errors_{timestamp}.csv"
        err_df.to_csv(err_file, index=False)
        print(f"\n⚠️ Layer 2 Alert: Discovered {len(errors)} invalid rows. Escaped to '{err_file}'. They will be skipped.")

    if not valid_rows:
        print("❌ No valid rows left to process. Aborting.")
        return

    print(f"\n✅ Layer 3: Proceeding with DB Dual-Injection for {len(valid_rows)} completely verified students...")
    
    success_count = 0
    for v in valid_rows:
        try:
            default_pwd = f"{v['roll_no']}@123"
            dummy_email = f"{v['roll_no'].lower()}@mvit.student"
            print(f"   -> Enrolling {v['full_name']}...")
            
            # --- SUPABASE INJECTION ---
            try:
                auth_res = supabase.auth.admin.create_user({
                    "email": dummy_email,
                    "password": default_pwd,
                    "email_confirm": True,
                    "user_metadata": {
                        "name": v['full_name'],
                        "real_email": v['email'],
                        "password_needs_reset": True
                    }
                })
                auth_id = auth_res.user.id
            except Exception as e:
                print(f"      [!] Auth Error on {v['roll_no']}: {e}")
                continue
                
            supabase.table("users").insert({
                "id": auth_id,
                "email": dummy_email,
                "role": "student"
            }).execute()
            
            dept_id = get_or_create_department(v['department'])
            sec_id = get_or_create_section(v['section'], dept_id, v['batch'])
            
            student_res = supabase.table("students").insert({
                "user_id": auth_id,
                "roll_no": v['roll_no'],
                "name": v['full_name'],
                "department_id": dept_id,
                "section_id": sec_id,
                "batch": v['batch'],
                "mobile": v['mobile'],
                "is_team_leader": (v['team_role'] == 'leader')
            }).execute()
            
            student_id = student_res.data[0]['id']
            
            platforms = []
            if v['leetcode']: platforms.append({"student_id": student_id, "platform": "leetcode", "username": v['leetcode']})
            if v['codechef']: platforms.append({"student_id": student_id, "platform": "codechef", "username": v['codechef']})
            if v['codeforces']: platforms.append({"student_id": student_id, "platform": "codeforces", "username": v['codeforces']})
            if v['hackerrank']: platforms.append({"student_id": student_id, "platform": "hackerrank", "username": v['hackerrank']})
            if v['github']: platforms.append({"student_id": student_id, "platform": "github", "username": v['github']})
            if v['skillrack']: platforms.append({"student_id": student_id, "platform": "skillrack", "username": v['skillrack']})
            
            if platforms:
                supabase.table("platform_accounts").insert(platforms).execute()
                
            team_title = v['team_name'] if v['team_name'] else "Unassigned"
            try:
                res = supabase.table("teams").select("id").eq("name", team_title).eq("section_id", sec_id).execute()
                team_id = res.data[0]['id'] if (res.data and len(res.data)>0) else None
                if not team_id:
                    team_res = supabase.table("teams").insert({
                        "name": team_title,
                        "section_id": sec_id,
                        "team_leader_id": student_id
                    }).execute()
                    team_id = team_res.data[0]['id']
                
                supabase.table("team_members").insert({"team_id": team_id, "student_id": student_id}).execute()
            except Exception as e:
                print(f"      [!] Non-fatal error while configuring team: {e}")

            # --- FIREBASE INJECTION ---
            if db:
                try:
                    fb_ref = db.collection('departments').document(v['department']).collection('sections').document(v['section']).collection('members').document(v['roll_no'])
                    fb_data = {
                        "name": v['full_name'],
                        "roll_no": v['roll_no'],
                        "email": v['email'],
                        "mobile": v['mobile'],
                        "batch": v['batch'],
                        "department": v['department'],
                        "section": v['section'],
                        "profiles": {
                            "leetcode_url": f"https://leetcode.com/{v['leetcode']}/" if v['leetcode'] else "",
                            "github_url": f"https://github.com/{v['github']}" if v['github'] else "",
                            "codechef_url": f"https://www.codechef.com/users/{v['codechef']}" if v['codechef'] else "",
                            "codeforces_url": f"https://codeforces.com/profile/{v['codeforces']}" if v['codeforces'] else "",
                            "hackerrank_url": f"https://www.hackerrank.com/profile/{v['hackerrank']}" if v['hackerrank'] else "",
                            "skillrack_url": v['skillrack'] if v['skillrack'] else ""
                        },
                        "elo_rating": 1200,
                        "team_name": team_title,
                        "is_team_leader": (v['team_role'] == 'leader'),
                        "created_at": datetime.now()
                    }
                    fb_ref.set(fb_data)
                except Exception as e:
                    print(f"      [!] Firebase Dual-Write Error for {v['roll_no']}: {e}")

            # Initial Task
            try:
                supabase.table("agent_tasks").insert({
                    "student_id": student_id,
                    "title": "Initial AI Welcome Scraper",
                    "description": "Onboarding Complete. The AI Agent will automatically parse your algorithmic history shortly.",
                    "platform": "leetcode",
                    "status": "pending"
                }).execute()
            except:
                pass
                
            success_count += 1
            existing_rolls.add(v['roll_no'])

        except Exception as e:
            print(f"      [!] Fatal DB Entry Error for {v['full_name']}: {e}")

    print(f"\n🎉 Onboarding Complete! Successfully injected {success_count}/{len(valid_rows)} students into the Skill Intelligence System.")

if __name__ == "__main__":
    file_target = input("Enter path to CSV/Excel or Google Sheets CSV URL: ")
    run_onboarding(file_target)
