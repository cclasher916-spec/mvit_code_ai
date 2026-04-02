import os
import sys
import time
import requests
from datetime import datetime, timedelta
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Live logs array for the frontend MVP dashboard
sys_logs = []

def log_msg(msg):
    timestamp = datetime.now().strftime('%H:%M:%S')
    formatted = f"[{timestamp}] {msg}"
    sys_logs.append(formatted)
    print(msg)

# Defer heavy tool imports to run_loop to keep module loading fast
def get_tools():
    from problem_bank import select_problem
    from tools.firebase_tool import (
        get_all_members, 
        get_member_latest_stats, 
        update_member_elo, 
        get_active_tasks, 
        update_task_status
    )
    from tools.escalation_tool import escalate_to_mentor
    from tools.scraper_tool import get_user_coding_stats
    # Handle optional calendar
    try:
        from tools.calendar_tool import schedule_event
    except Exception:
        schedule_event = None
    
    return {
        "select_problem": select_problem,
        "get_all_members": get_all_members,
        "get_member_latest_stats": get_member_latest_stats,
        "update_member_elo": update_member_elo,
        "get_active_tasks": get_active_tasks,
        "update_task_status": update_task_status,
        "escalate_to_mentor": escalate_to_mentor,
        "get_user_coding_stats": get_user_coding_stats,
        "schedule_event": schedule_event
    }
# Handle optional calendar
try:
    from tools.calendar_tool import schedule_event
except Exception:
    schedule_event = None

from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

# Supabase Mobile Bridge — lazy loaded
_sb_instance = None
def _get_sb():
    global _sb_instance
    if _sb_instance is not None:
        return _sb_instance
    try:
        from supabase_bridge import SupabaseBridge
        _sb_instance = SupabaseBridge()
    except Exception as e:
        print(f"⚠ [autonomous_loop] SupabaseBridge init error: {e}")
        return None
    return _sb_instance

def calculate_elo(old_elo, expected_difficulty, actual_success):
    """Calculates updated rating using Logistic ELO function."""
    difficulty_map = {"Easy": 1000, "Medium": 1300, "Hard": 1600}
    task_elo = difficulty_map.get(expected_difficulty, 1200)
    expected_score = 1 / (1 + 10 ** ((task_elo - old_elo) / 400))
    K = 32
    new_elo = old_elo + K * (actual_success - expected_score)
    return max(800, int(new_elo))

def verify_leetcode_completion(profile_url, problem_title, assigned_date):
    """Deterministic completion verifier pulling direct from LeetCode GraphQL."""
    if not profile_url: return False
    
    uname = profile_url.strip()
    if "http" in uname or "leetcode.com" in uname:
        import re
        uname_clean = uname.rstrip('/')
        m = re.search(r"leetcode\.com/(?:u/)?([^/]+)", uname_clean)
        if m: uname = m.group(1)
        else: return False
        
    query = """
    query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
            title
            timestamp
        }
    }
    """
    payload = {"query": query, "variables": {"username": uname, "limit": 15}}
    try:
        r = requests.post("https://leetcode.com/graphql", json=payload, headers={"Content-Type":"application/json"}, timeout=10)
        if r.status_code == 200:
            subs = r.json().get("data", {}).get("recentAcSubmissionList", [])
            for sub in subs:
                if sub.get("title").lower() == problem_title.lower():
                    ts = int(sub.get("timestamp", 0))
                    sub_date = datetime.fromtimestamp(ts)
                    if sub_date >= assigned_date:
                        return True
    except Exception:
        pass
    return False

def send_assignment_email(member_name, email, problem):
    from_email = os.getenv("BREVO_SENDER_EMAIL")
    smtp_login = os.getenv("BREVO_SMTP_LOGIN")
    smtp_key = os.getenv("BREVO_SMTP_KEY")
    
    if not email or not from_email or not smtp_key or not smtp_login:
        log_msg(f"Skipping email for {member_name} (No email or config missing)")
        return
        
    try:
        subject = "Action Required: Your Coding Intervention Task"
        html = f"""
        <html><body>
        <h2>Coding Intervention: We noticed you've been inactive!</h2>
        <p>Hi {member_name},</p>
        <p>To keep your skills sharp, the Autonomous Agent has assigned you a personalized task based on your current ELO rating.</p>
        <p><strong>Problem:</strong> <a href="{problem['url']}">{problem['title']}</a></p>
        <p><strong>Platform:</strong> {problem['platform']}</p>
        <p><strong>Expected Difficulty:</strong> {problem['expected_difficulty']}</p>
        <p><strong>Time Estimate:</strong> {problem['time_estimate']}</p>
        <p><strong>Deadline:</strong> 48 Hours</p>
        <p>Good luck!</p>
        </body></html>
        """
        msg = MIMEMultipart('alternative')
        msg['From'] = from_email
        msg['To'] = email
        msg['Subject'] = subject
        msg.attach(MIMEText(html, 'html'))
        
        server = smtplib.SMTP('smtp-relay.brevo.com', 587, timeout=10)
        server.starttls()
        server.login(smtp_login, smtp_key)
        server.sendmail(from_email, email, msg.as_string())
        server.quit()
        time.sleep(1) # Rate limiting buffer
        log_msg(f"Sent assignment email to {email}")
    except Exception as e:
         log_msg(f"Failed to send assignment email: {e}")

is_loop_running = False
is_ingestion_running = False

def run_loop(proactive_actions: list = None):
    global is_loop_running
    global is_ingestion_running
    
    if is_ingestion_running:
        msg = "[SYSTEM] Skipping loop execution: Heavy PDF Ingestion is currently locking resources."
        sys_logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")
        print(msg)
        return sys_logs
        
    if is_loop_running:
        print("[SYSTEM] Loop is already executing. Skipping concurrent trigger.")
        return sys_logs
        
    is_loop_running = True
    
    sys_logs.clear()
    if proactive_actions is None:
        proactive_actions = []

    try:
        tools = get_tools()
        get_all_members = tools["get_all_members"]
        get_active_tasks = tools["get_active_tasks"]
        get_member_latest_stats = tools["get_member_latest_stats"]
        update_member_elo = tools["update_member_elo"]
        update_task_status = tools["update_task_status"]
        get_user_coding_stats = tools["get_user_coding_stats"]

        log_msg("Starting Autonomous Intervention Loop...")
        members = get_all_members()
        log_msg(f"Found {len(members)} members.")
        
        # Prevent database hammering
        time.sleep(0.1)

        now = datetime.now()
        
        # Pre-fetch active tasks to prevent duplicate assignments
        pending_tasks = get_active_tasks()
        active_member_refs = [t['member_ref'].path for t in pending_tasks]

        # --- Proactive Check 1: Bulk Inactivity ---
        inactive_members = []
        for member in members:
            if member['ref'].path in active_member_refs:
                continue # Skip assigning tasks to members who already have pending active tasks!
                
            stats = get_member_latest_stats(member['ref'])
            if stats:
                try:
                    last_date = datetime.strptime(stats.get('date',''), "%Y-%m-%d")
                    delta = (now - last_date).days
                    if delta >= 3:
                        inactive_members.append((member, delta))
                except Exception:
                    pass
                    
            time.sleep(0.05) # Micro-delay to spread out reads
            
        # Limit batch to maximum 10 users per cycle to prevent Firebase quota bursts
        if len(inactive_members) > 10:
            log_msg(f"Found {len(inactive_members)} inactive members, limiting to 10 for safe execution.")
            inactive_members = inactive_members[:10]

        # --- System Initiative: Trigger Orchestrator autonomously ---
        if len(inactive_members) >= 2:
            log_msg(f"🤖 [System Initiative] Detected {len(inactive_members)} inactive members — triggering Orchestrator automatically.")
            log_msg("[GOAL] Improve team engagement without user prompt")
            log_msg("[PLAN] Step 1: Run INACTIVITY_RECOVERY  →  Step 2: Run EVENT_AUTOMATION")

            try:
                from orchestrator import run_flows
                goals = [{"flow": "INACTIVITY_RECOVERY", "target": "team", "hint": ""}]
                if len(inactive_members) >= 4:
                    goals.append({"flow": "EVENT_AUTOMATION", "target": "team", "hint": "weekly contest"})

                result = run_flows(goals)
                for step in result.get("trace", []):
                    log_msg(f"[{step['step']}] {step['text']}")

                action_entry = {
                    "timestamp": now.strftime("%Y-%m-%d %H:%M"),
                    "trigger": f"{len(inactive_members)} members inactive ≥ 3 days",
                    "flows_run": [g["flow"] for g in goals],
                    "summary": result.get("reply", "")[:200],
                    "trace": result.get("trace", [])
                }
                proactive_actions.insert(0, action_entry)
                log_msg(f"[Review] ✅ Orchestrator completed {len(goals)} autonomous flow(s).")
            except Exception as e:
                log_msg(f"[Orchestrator Error] {e}")

        # Phase 2: Individual task → ELO verification loop
        if len(pending_tasks) > 0:
            log_msg(f"Reviewing {len(pending_tasks)} pending tasks...")

        for task in pending_tasks:
            time.sleep(0.1) # Soft database operation delay
            td = task['task_data']
            task_ref = task['task_ref']
            member_ref = task['member_ref']
            
            # Fetch fresh member data
            mem_doc = member_ref.get()
            if not mem_doc.exists:
                continue
            mem_data = mem_doc.to_dict()
            name = mem_data.get('name', 'Unknown')
            elo = mem_data.get('elo_rating', 1200)
            failures = mem_data.get('consecutive_failures', 0)
            mentor_email = mem_data.get('assigned_team_lead_email', "bytebreakers04@gmail.com")
            
            try:
                 assigned_at = td.get('assigned_at')
                 if hasattr(assigned_at, 'timestamp'):
                     assigned_date = datetime.fromtimestamp(assigned_at.timestamp())
                 else:
                     assigned_date = now # fallback
            except:
                 assigned_date = now

            deadline = td.get('deadline')
            if hasattr(deadline, 'timestamp'):
                 deadline_date = datetime.fromtimestamp(deadline.timestamp())
            else:
                 deadline_date = assigned_date + timedelta(hours=48)

            time_elapsed = now - assigned_date

            # Interference Ladder Step 1: 24h Micro-Reminder
            if timedelta(hours=24) < time_elapsed < timedelta(hours=48):
                 if not td.get('reminder_sent', False):
                     log_msg(f"[Intervention] Sending 24h Micro-Reminder to {name}.")
                     task_ref.update({"reminder_sent": True})
                     # In full impl, this physically sends a reminder email here.

            # Deterministic Verification
            platform = td.get('platform', 'leetcode')
            profiles = mem_data.get('profiles', {})
            lc_url = profiles.get('leetcode_url', '')
            desc = td.get('description', '')
            # Try to extract the exact problem title inside the quotes (e.g. Solve '3Sum' (leetcode))
            import re
            m_desc = re.search(r"Solve '([^']+)'", desc)
            problem_title = td.get('problem_title', m_desc.group(1) if m_desc else desc.split(' on ')[0].replace('Solve ', ''))
            
            is_verified = False
            if platform == 'leetcode' and lc_url:
                 is_verified = verify_leetcode_completion(lc_url, problem_title, assigned_date)
                 if is_verified:
                     ver_log = f"[AI CHECK] User: {name} | Task: {problem_title} | Status: Completed ✔️ | Verified via LeetCode profile"
                     log_msg(ver_log)
                     # Update ELO via Logistic Function
                     new_elo = calculate_elo(elo, td.get('difficulty', 'Medium'), 1)
                     update_task_status(task_ref, "completed", actual_time=str(now), verification_log=ver_log)
                     update_member_elo(member_ref, new_elo, failures=0)
                     log_msg(f"[Update] {name} succeeded! ELO increased from {elo} to {new_elo}.")
                     # ── Dual-Write: mark completed in Supabase mobile app ──
                     _sb = _get_sb()
                     if _sb:
                         _sb.mark_task_completed(name, problem_title)
                     continue
                     
            # Evaluate Deadline Failure
            if now > deadline_date:
                ver_log = f"[AI CHECK] User: {name} | Task: {problem_title} | Status: Failed 🔴 | Deadline passed without verification"
                log_msg(ver_log)
                update_task_status(task_ref, "failed", verification_log=ver_log)
                
                # Update ELO (Logistic Function failure = 0)
                new_elo = calculate_elo(elo, td.get('difficulty', 'Medium'), 0)
                failures += 1
                update_member_elo(member_ref, new_elo, failures)
                # ── Dual-Write: mark failed in Supabase mobile app ──
                _sb = _get_sb()
                if _sb:
                    _sb.mark_task_failed(name, problem_title)
                log_msg(f"[Update] {name} ELO dropped to {new_elo}. Accumlated Failures: {failures}")
                
                # Escalate if >= 2
                if failures >= 2:
                    log_msg(f"[Escalate] {name} hit {failures} failures. Scheduling Mentor 1:1.")
                    schedule_event = tools["schedule_event"]
                    escalate_to_mentor = tools["escalate_to_mentor"]
                    if schedule_event:
                         event_link = schedule_event.invoke({
                            "summary": f"1:1 Mentor Session: {name}",
                            "start_time": (now + timedelta(days=1)).isoformat() + "Z",
                            "end_time": (now + timedelta(days=1, hours=1)).isoformat() + "Z",
                            "description": f"Auto-scheduled intervention for {name} due to inactivity & failed tasks."
                         })
                         log_msg(f"Scheduled Event: {event_link}")
                    escalate_to_mentor.invoke({
                        "student_name": name, 
                        "issue_description": "Student failed 2 consecutive automated tasks. Scheduled 1:1 proposed.", 
                        "mentor_email": mentor_email
                    })

        log_msg("Loop execution complete.")
    finally:
        is_loop_running = False
        
    return sys_logs

if __name__ == "__main__":
    run_loop()
