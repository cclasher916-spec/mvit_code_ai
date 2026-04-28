import os
import re
import time
import smtplib
import requests
from random import uniform
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import firebase_admin
from firebase_admin import credentials, firestore

# Deferred heavy imports to keep module loading light
# from read_google_sheet import read_google_sheet
# from agent_backend.supabase_bridge import SupabaseBridge

# ===================== ENV & SECRETS =====================
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")  # optional for higher GitHub rate limits
BREVO_SMTP_LOGIN = os.getenv("BREVO_SMTP_LOGIN", "")
BREVO_SMTP_KEY = os.getenv("BREVO_SMTP_KEY", "")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "")
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "coding-team-profiles-2b0b4df65b4a.json")

if not GROQ_API_KEY and not GOOGLE_API_KEY:
    print("⚠ No AI API keys set; AI motivation will use fallbacks.")

# --- Lazy Loader Helpers ---
_db_instance = None
_sb_instance = None

def _get_db():
    global _db_instance
    if _db_instance is not None:
        return _db_instance
    try:
        firebase_admin.get_app()
    except ValueError:
        if os.path.exists(FIREBASE_CREDENTIALS_PATH):
            cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
        else:
            # Fallback to env vars like in firebase_tool.py
            project_id = os.getenv("FIREBASE_PROJECT_ID")
            if project_id:
                # Minimal init for scraper
                firebase_admin.initialize_app()
            else:
                print(f"⚠ Firebase credentials not found.")
                return None
    _db_instance = firestore.client()
    return _db_instance

def _get_supabase():
    global _sb_instance
    if _sb_instance is not None:
        return _sb_instance
    try:
        try:
            from agent_backend.supabase_bridge import SupabaseBridge
        except ImportError:
            from supabase_bridge import SupabaseBridge
        _sb_instance = SupabaseBridge()
    except Exception as e:
        print(f"⚠ [SupabaseBridge] Connection error: {e}")
        _sb_instance = None
    return _sb_instance

HEADERS = {"User-Agent": "Mozilla/5.0"}


# ===================== AI HELPERS =====================
def get_personalized_motivation(name, daily_data):
    """Generate AI-powered motivational message."""
    total_solved_today = (
        daily_data.get('leetcode_daily_increase', 0) +
        daily_data.get('skillrack_daily_increase', 0) +
        daily_data.get('codechef_daily_increase', 0) +
        daily_data.get('hackerrank_daily_increase', 0) +
        daily_data.get('github_daily_increase', 0)
    )
    if not (GROQ_API_KEY or GOOGLE_API_KEY):
        return _fallback_motivation(name, total_solved_today)
        
    prompt = (
        f"Generate a short, personalized motivational message (<=50 words) for {name}, "
        f"who solved {total_solved_today} problems today.\n"
        f"LeetCode:+{daily_data.get('leetcode_daily_increase', 0)}, "
        f"SkillRack:+{daily_data.get('skillrack_daily_increase', 0)}, "
        f"CodeChef:+{daily_data.get('codechef_daily_increase', 0)}, "
        f"HackerRank:+{daily_data.get('hackerrank_daily_increase', 0)}, "
        f"GitHub:+{daily_data.get('github_daily_increase', 0)}.\n"
        f"Be specific, encouraging, and authentic with emojis. If 0, nudge gently."
    )

    # --- Try Gemini First ---
    if GOOGLE_API_KEY:
        try:
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={GOOGLE_API_KEY}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"maxOutputTokens": 60, "temperature": 0.7}
            }
            resp = requests.post(gemini_url, json=payload, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            reply = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if reply.strip():
                return reply.strip()
        except Exception as e:
            print(f"⚠ Gemini API error in Scraper: {e}")

    # --- Fallback to Groq ---
    if GROQ_API_KEY:
        try:
            payload = {
                "model": "llama3-8b-8192",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 60,
                "temperature": 0.7
            }
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            resp = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=10)
            resp.raise_for_status()
            reply = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "")
            if reply.strip():
                return reply.strip()
        except Exception as e:
            print(f"⚠ Groq API error in Scraper: {e}")

    return _fallback_motivation(name, total_solved_today)

def _fallback_motivation(name, total):
    if total >= 15:
        return f"🏆 {name}, legendary grind today with {total}! Keep leading the pack! 🚀"
    if total >= 10:
        return f"🔥 {name}, awesome streak at {total}! Your momentum is elite! 💪"
    if total >= 5:
        return f"⭐ Great job, {name}! {total} solved—consistency wins. Keep pushing! 💻"
    if total > 0:
        return f"✨ Nice steps today, {name}! {total} done—tomorrow, go one more. 🚀"
    return f"💡 Fresh start awaits, {name}. One problem tomorrow—small steps, big gains! 🌟"

def get_achievement_badge(total_solved_today):
    if total_solved_today >= 15: return "🏆 CODING LEGEND"
    if total_solved_today >= 10: return "🔥 ON FIRE"
    if total_solved_today >= 5:  return "⭐ STRONG PERFORMER"
    if total_solved_today > 0:   return "✅ MAKING PROGRESS"
    return "💤 REST DAY"

def create_stat_row(platform, total, daily, color, unit="Total"):
    arrow = "📈" if daily > 0 else "➖"
    return f"""
    <tr>
      <td style="padding-bottom: 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f9fafb;border-radius:8px;padding:16px;">
          <tr>
            <td style="width:40%;"><p style="color:#374151;margin:0;font-size:16px;font-weight:600;">{platform}</p></td>
            <td style="width:30%;text-align:right;"><p style="color:#6b7280;margin:0;font-size:14px;">{total} {unit}</p></td>
            <td style="width:30%;text-align:right;"><span style="background-color:{color}20;color:{color};padding:4px 12px;border-radius:12px;font-size:14px;font-weight:600;">{arrow} +{daily}</span></td>
          </tr>
        </table>
      </td>
    </tr>
    """

def get_color(value):
    if value >= 5: return "#10b981"
    if value > 0:  return "#3b82f6"
    return "#6b7280"

# ===================== EMAIL =====================
def send_email_summary(to_email, subject, body, from_email, smtp_login, smtp_key, name, daily_data):
    if not (from_email and smtp_login and smtp_key and to_email):
        print("⚠ Email not sent—missing BREVO_* configuration or recipient.")
        return
    try:
        lc_total = daily_data.get('leetcode_total', 0)
        lc_diff  = daily_data.get('leetcode_daily_increase', 0)
        sr_total = daily_data.get('skillrack_total', 0)
        sr_diff  = daily_data.get('skillrack_daily_increase', 0)
        cc_total = daily_data.get('codechef_total', 0)
        cc_diff  = daily_data.get('codechef_daily_increase', 0)
        hr_total = daily_data.get('hackerrank_total', 0)
        hr_diff  = daily_data.get('hackerrank_daily_increase', 0)
        gh_repos = daily_data.get('github_repos', 0)
        gh_diff  = daily_data.get('github_daily_increase', 0)

        total_today = lc_diff + sr_diff + cc_diff + hr_diff + gh_diff
        ai_motivation = get_personalized_motivation(name, daily_data)
        achievement = get_achievement_badge(total_today)

        html = f"""<!DOCTYPE html><html><body style="background:#f3f4f6;margin:0;padding:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;">
        <table role="presentation" width="100%" style="padding:20px 0;">
          <tr><td align="center">
            <table role="presentation" width="600" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1);">
              <tr><td style="background:linear-gradient(135deg,#667eea,#764ba2);padding:40px 30px;text-align:center;">
                <h1 style="color:#fff;margin:0 0 10px;font-size:32px;font-weight:700;">🚀 Coding Report</h1>
                <p style="color:#e0e7ff;margin:0;font-size:16px;">{datetime.now().strftime('%B %d, %Y')}</p>
                <div style="margin-top:15px;padding:8px 16px;background:rgba(255,255,255,.2);border-radius:20px;display:inline-block;">
                  <span style="color:#fff;font-weight:600;font-size:14px;">{achievement}</span>
                </div>
              </td></tr>
              <tr><td style="padding:30px;">
                <h2 style="color:#1f2937;margin:0 0 10px;font-size:24px;">Hey {name}! 👋</h2>
                <p style="color:#6b7280;margin:0 0 20px;font-size:16px;line-height:1.6;">Here's your daily progress snapshot. Let's celebrate your wins!</p>
                <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border-left:4px solid #f59e0b;padding:20px;border-radius:12px;margin-bottom:20px;">
                  <p style="margin:0;color:#92400e;font-size:16px;line-height:1.6;"><strong>💬 AI Coach Says:</strong><br>{ai_motivation}</p>
                </div>
                <div style="background:linear-gradient(135deg,#10b981,#059669);padding:20px;border-radius:12px;text-align:center;color:#fff;margin-bottom:20px;">
                  <p style="margin:0 0 5px;font-size:14px;opacity:.9;">Today's Total</p>
                  <p style="margin:0;font-size:36px;font-weight:700;">{total_today}</p>
                  <p style="margin:5px 0 0;font-size:14px;opacity:.9;">Problems Solved 🎯</p>
                </div>
                <table role="presentation" width="100%">{create_stat_row("🧠 LeetCode", lc_total, lc_diff, get_color(lc_diff))}
                {create_stat_row("🎯 SkillRack", sr_total, sr_diff, get_color(sr_diff))}
                {create_stat_row("🥇 CodeChef", cc_total, cc_diff, get_color(cc_diff))}
                {create_stat_row("🏅 HackerRank", hr_total, hr_diff, get_color(hr_diff))}
                {create_stat_row("💻 GitHub", gh_repos, gh_diff, get_color(gh_diff), "Repos")}</table>
              </td></tr>
              <tr><td style="background:#f9fafb;padding:30px;text-align:center;border-top:1px solid #e5e7eb;">
                <p style="color:#6b7280;margin:0 0 10px;font-size:14px;">\"Success is the sum of small efforts repeated day in and day out.\"</p>
                <p style="color:#9ca3af;margin:0;font-size:12px;">Happy coding! ✨</p>
                <p style="color:#9ca3af;margin:10px 0 0;font-size:12px;">— Your Byte Breakers Team 🚀</p>
              </td></tr>
            </table>
          </td></tr>
        </table></body></html>"""

        text = f"""Hi {name} 👋,

{achievement}

{ai_motivation}

📊 Today's Coding Report for {datetime.now().strftime('%B %d, %Y')}:

🎯 TODAY'S TOTAL: {total_today} problems solved!

🧠 LeetCode: {lc_total} total (+{lc_diff} today)
🎯 SkillRack: {sr_total} total (+{sr_diff} today)
🥇 CodeChef: {cc_total} total (+{cc_diff} today)
🏅 HackerRank: {hr_total} total (+{hr_diff} today)
💻 GitHub: {gh_repos} repos (+{gh_diff} today)

\"Success is the sum of small efforts repeated day in and day out.\"

Keep coding! ✨
— Your Byte Breakers Team 🚀
"""

        msg = MIMEMultipart('alternative')
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(text, 'plain'))
        msg.attach(MIMEText(html, 'html'))

        server = smtplib.SMTP('smtp-relay.brevo.com', 587)
        server.starttls()
        server.login(smtp_login, smtp_key)
        server.sendmail(from_email, to_email, msg.as_string())
        server.quit()
        print(f"✅ Email sent to {to_email}")
    except Exception as e:
        print(f"⚠ Failed to send email to {to_email}: {e}")

# ===================== SCRAPING HELPERS =====================
def get_codechef_solved(username):
    if not username: return 0
    try:
        if 'codechef.com' in username:
            username = username.rstrip('/').split('/')[-1]
        r = requests.get(f"https://www.codechef.com/users/{username}", headers=HEADERS, timeout=10)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        section = soup.find("section", class_="rating-data-section problems-solved")
        if section:
            for tag in section.find_all("h3"):
                m = re.search(r"Total\s+Problems\s+Solved:\s*(\d+)", tag.get_text(strip=True), re.IGNORECASE)
                if m:
                    return int(m.group(1))
            # fallback: first number in parentheses
            text = section.get_text()
            nums = re.findall(r'\((\d+)\)', text)
            if nums: return int(nums[0])
    except Exception as e:
        print(f"⚠ Error scraping CodeChef ({username}): {e}")
    return 0

def get_hackerrank_solved(username):
    if not username: return 0
    try:
        if 'hackerrank.com' in username or 'hakerrank.com' in username:
            username = username.rstrip('/').split('/')[-1]
        r = requests.get("https://www.hackerrank.com/rest/hackers/{}/badges".format(username),
                         headers=HEADERS, params={'limit':'1000','filter':'categories:problem_solving'}, timeout=10)
        r.raise_for_status()
        data = r.json()
        solved = 0
        for badge in data.get('models', []):
            if 'solved' in badge and badge['solved']:
                solved += badge['solved']
        return solved
    except Exception as e:
        print(f"⚠ Error scraping HackerRank ({username}): {e}")
    return 0

def get_github_repo_count(username):
    if not username: return 0
    try:
        if 'github.com' in username:
            username = username.rstrip('/').split('/')[-1]
        headers = HEADERS.copy()
        if GITHUB_TOKEN:
            headers['Authorization'] = f'Bearer {GITHUB_TOKEN}'
        r = requests.get(f"https://api.github.com/users/{username}/repos", headers=headers, timeout=10)
        if r.status_code == 200:
            return len(r.json())
    except Exception as e:
        print(f"⚠ Error scraping GitHub ({username}): {e}")
    return 0

def extract_leetcode_username(url):
    if not url: return None
    url = url.strip()
    if not url.startswith("http"): return url
    m = re.search(r"/u/([^/]+)/?", url)
    return m.group(1) if m else None

def get_leetcode_total(profile_url):
    uname = extract_leetcode_username(profile_url)
    if not uname: return 0, 0

    query = """
    query userStats($username: String!) {
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum { difficulty count }
          totalSubmissionNum { difficulty count }
        }
      }
    }
    """
    payload = {"query": query, "variables": {"username": uname}}
    ac_total = 0
    sub_total = 0
    try:
        r = requests.post("https://leetcode.com/graphql", json=payload,
                          headers={"Content-Type": "application/json"}, timeout=10)
        r.raise_for_status()
        stats = r.json().get("data", {}).get("matchedUser", {}).get("submitStats", {})
        
        arr = stats.get("acSubmissionNum", [])
        for entry in arr:
            if entry.get("difficulty", "").lower() == "all":
                ac_total = entry.get("count", 0)
        
        tot_arr = stats.get("totalSubmissionNum", [])
        for entry in tot_arr:
            if entry.get("difficulty", "").lower() == "all":
                sub_total = entry.get("count", 0)
                
        if sub_total < ac_total: sub_total = ac_total # Fail-safe
        return ac_total, sub_total
    except Exception:
        pass

    # fallback scrape
    try:
        r2 = requests.get(f"https://leetcode.com/u/{uname}/", headers=HEADERS, timeout=10)
        r2.raise_for_status()
        m = re.search(r'"totalSolved":\s*(\d+)', r2.text)
        if m: return int(m.group(1)), int(m.group(1))
    except Exception:
        pass
    return 0, 0

def get_skillrack_total(url, retries=2, delay=2):
    if not url:
        return 0
    for _ in range(retries+1):
        try:
            time.sleep(delay)
            r = requests.get(url, headers=HEADERS, timeout=10)
            if r.status_code == 200:
                soup = BeautifulSoup(r.text, "html.parser")
                for stat in soup.select("div.ui.six.small.statistics > div.statistic"):
                    lbl = stat.find("div", class_="label")
                    if lbl and lbl.get_text(strip=True) == "PROGRAMS SOLVED":
                        val = stat.find("div", class_="value")
                        nums = re.findall(r"\d+", val.get_text()) if val else []
                        return int(nums[0]) if nums else 0
        except Exception:
            pass
    return 0

# ===================== SYNC FROM GOOGLE SHEET =====================
def sync_members_from_sheet():
    """Sync members from Google Sheet to Firebase with Team Lead grouping ONLY and Batch tagging."""
    print("🔄 Syncing members from Google Sheet...")
    db = _get_db()
    if not db:
        print("❌ Firebase not initialized. Skipping sync.")
        return 0
    try:
        from read_google_sheet import read_google_sheet
        df = read_google_sheet("team_registration_responses")
        df.columns = df.columns.str.strip()
        synced_count = 0

        for idx, row in df.iterrows():
            try:
                full_name = (row.get('Full Name', row.get('Name', '')) or '').strip()
                email     = (row.get('Email Address', row.get('Email ID', '')) or '').strip()
                dept      = (row.get('Department', 'AIML') or 'AIML').strip()
                section   = (row.get('Section', 'A') or 'A').strip()
                team_name = (row.get('Team Name', 'ByteBreakers') or 'ByteBreakers').strip()
                team_lead = (row.get('Team Lead', '') or '').strip()
                batch     = (row.get('Batch', '') or '').strip()

                if not full_name:
                    continue
                if not team_lead:
                    print(f"⚠ Skipping {full_name} - no team lead assigned")
                    continue

                base_team_name   = team_name
                team_display_name= f"{team_name} - {team_lead}"
                team_id          = f"{team_name}_{team_lead}".replace(' ', '_')

                dept_id   = dept.upper()
                section_id= f"Section_{section.upper()}"
                member_id = full_name.replace(' ', '_')

                # Upsert hierarchy
                db = _get_db()
                dept_ref = db.collection('departments').document(dept_id)
                dept_ref.set({'name': f'{dept} Department', 'updated_at': datetime.now()}, merge=True)

                section_ref = dept_ref.collection('sections').document(section_id)
                section_ref.set({'name': f'Section {section}', 'updated_at': datetime.now()}, merge=True)

                # Upsert team with leader
                team_ref = section_ref.collection('teams').document(team_id)
                team_data = {
                    'name': team_display_name,
                    'base_team_name': base_team_name,
                    'team_lead_name': team_lead,
                    'updated_at': datetime.now()
                }
                team_ref.set(team_data, merge=True)

                is_actual_lead = (full_name.lower() == team_lead.lower())

                # Upsert member with batch
                member_ref = team_ref.collection('members').document(member_id)
                member_data = {
                    'name': full_name,
                    'email': email,
                    'assigned_team_lead': team_lead,
                    'is_team_lead': is_actual_lead,
                    'assigned_batch': batch or None,
                    'profiles': {
                        'leetcode_url': (row.get('LeetCode Profile URL', row.get('LeetCode ID (eg: Gfz6n0WdOg or https://leetcode.com/u/Gfz6n0WdOg/)', '')) or '').strip(),
                        'skillrack_url': (row.get('SkillRack Profile URL', row.get('Skillrack Profile URL', '')) or '').strip(),
                        'codechef_url': (row.get('CodeChef Profile URL', '') or '').strip(),
                        'hackerrank_url': (row.get('HackerRank Profile URL', row.get('Hackerrank Profile URL', '')) or '').strip(),
                        'github_url': (row.get('GitHub Profile URL', '') or '').strip()
                    },
                    'last_synced': datetime.now()
                }
                member_ref.set(member_data, merge=True)

                role_display = "LEADER" if is_actual_lead else f"under {team_lead}"
                batch_display = f" • Batch {batch}" if batch else ""
                print(f"✅ Synced: {full_name} → {dept}/{section}/{team_display_name} ({role_display}){batch_display}")
                synced_count += 1

            except Exception as e:
                print(f"❌ Error syncing row {idx+1}: {e}")

        print(f"\n📊 Synced {synced_count} members")
        return synced_count

    except Exception as e:
        print(f"❌ Error reading Google Sheet: {e}")
        return 0

# ===================== MAIN SCRAPING =====================
def scrape_all_teams(do_sync=True, do_email=True, do_firebase=True, do_supabase=True):
    print("\n" + "="*60)
    print("🚀 STARTING AUTOMATED SCRAPING")
    print("="*60 + "\n")

    # 1) Sync members
    if do_sync:
        sync_members_from_sheet()
    else:
        print("⏭️ Skipping Google Sheets Sync...")

    # 2) Email creds from env
    from_email = BREVO_SENDER_EMAIL
    smtp_login = BREVO_SMTP_LOGIN
    smtp_key = BREVO_SMTP_KEY

    # 3) Walk hierarchy and scrape
    db = _get_db()
    if not db:
        print("❌ Firebase not initialized. Aborting scrape.")
        return

    departments = list(db.collection('departments').stream(timeout=120))
    total_members_scraped = 0
    all_scores = []
    
    supabase_bridge = _get_supabase()

    for dept_doc in departments:
        dept_id = dept_doc.id
        print(f"\n📚 Department: {dept_id}")

        sections = list(dept_doc.reference.collection('sections').stream(timeout=120))
        for section_doc in sections:
            section_id = section_doc.id
            print(f"  📂 Section: {section_id}")

            teams = list(section_doc.reference.collection('teams').stream(timeout=120))
            for team_doc in teams:
                team_id = team_doc.id
                print(f"    👥 Team: {team_id}")

                members = list(team_doc.reference.collection('members').stream(timeout=120))
                for member_doc in members:
                    member_data = member_doc.to_dict()
                    member_id   = member_doc.id
                    name        = member_data.get('name', member_id)
                    email       = member_data.get('email', '')
                    profiles    = member_data.get('profiles', {})

                    print(f"      👤 Scraping {name}...")
                    
                    time.sleep(0.2)

                    lc_total, lc_submissions = get_leetcode_total(profiles.get('leetcode_url', ''));    time.sleep(uniform(1.0, 2.0))
                    sr_total = get_skillrack_total(profiles.get('skillrack_url', '')); time.sleep(uniform(1.0, 2.0))
                    cc_total = get_codechef_solved(profiles.get('codechef_url', ''));  time.sleep(uniform(1.0, 2.0))
                    hr_total = get_hackerrank_solved(profiles.get('hackerrank_url', '')); time.sleep(uniform(1.0, 2.0))
                    gh_repos = get_github_repo_count(profiles.get('github_url', ''))

                    print(f"         LC: {lc_total} | SR: {sr_total} | CC: {cc_total} | HR: {hr_total} | GH: {gh_repos}")

                    today = datetime.now().strftime("%Y-%m-%d")

                    lc_diff = sr_diff = cc_diff = hr_diff = gh_diff = 0
                    try:
                        docs = list(
                            member_doc.reference
                            .collection('daily_totals')
                            .order_by('date', direction=firestore.Query.DESCENDING)
                            .limit(1)
                            .stream(timeout=30)
                        )
                        
                        y_data = {}
                        for doc in docs:
                            data = doc.to_dict()
                            # If today already exists, skip it and fetch previous
                            if data.get("date") != today:
                                y_data = data
                                break

                        if y_data:
                            lc_diff = max(0, lc_total - y_data.get('leetcode_total', 0))
                            sr_diff = max(0, sr_total - y_data.get('skillrack_total', 0))
                            cc_diff = max(0, cc_total - y_data.get('codechef_total', 0))
                            hr_diff = max(0, hr_total - y_data.get('hackerrank_total', 0))
                            gh_diff = max(0, gh_repos - y_data.get('github_repos', 0))
                        else:
                            lc_diff = 0
                            sr_diff = 0
                            cc_diff = 0
                            hr_diff = 0
                            gh_diff = 0
                    except Exception:
                        pass

                    daily_data = {
                        'date': today,
                        'leetcode_total': lc_total,
                        'skillrack_total': sr_total,
                        'codechef_total': cc_total,
                        'hackerrank_total': hr_total,
                        'github_repos': gh_repos,
                        'leetcode_daily_increase': lc_diff,
                        'skillrack_daily_increase': sr_diff,
                        'codechef_daily_increase': cc_diff,
                        'hackerrank_daily_increase': hr_diff,
                        'github_daily_increase': gh_diff,
                        'leetcode_submissions': lc_submissions,
                        'scraped_at': datetime.now()
                    }

                    # Track for global leaderboard sync
                    all_scores.append({
                        'name': name,
                        'total': lc_total + sr_total + cc_total + hr_total + gh_repos,
                        'streak': 0
                    })

                    # ── Write → Firebase (Web Dashboard) ──────────────────
                    if do_firebase:
                        member_doc.reference.collection('daily_totals').document(today).set(daily_data)
                        print(f"         ✅ Saved to Firebase")

                    # ── Write → Supabase (Mobile App) ──────────────────────
                    if do_supabase and supabase_bridge:
                        supabase_bridge.upsert_daily_activity(
                            member_name       = name,
                            leetcode_solved   = lc_total,
                            skillrack_solved  = sr_total,
                            codechef_solved   = cc_total,
                            hackerrank_solved = hr_total,
                            github_repos      = gh_repos,
                            lc_daily          = lc_diff,
                            sr_daily          = sr_diff,
                            cc_daily          = cc_diff,
                            hr_daily          = hr_diff,
                            gh_daily          = gh_diff,
                        )
                    # ───────────────────────────────────────────────────────

                    if do_email and email and from_email and smtp_key and smtp_login:
                        subject = f"🚀 Your Daily Coding Report - {datetime.now().strftime('%b %d')}"
                        send_email_summary(email, subject, "", from_email, smtp_login, smtp_key, name, daily_data)

                    total_members_scraped += 1

    # 4) Global Leaderboard Sync → Supabase Cache
    if all_scores and do_supabase:
        print(f"\n🏆 Syncing Global Leaderboard ({len(all_scores)} members)...")
        all_scores.sort(key=lambda x: x['total'], reverse=True)
        if supabase_bridge:
            for rank, score_data in enumerate(all_scores, 1):
                supabase_bridge.upsert_leaderboard(
                    member_name=score_data['name'],
                    rank=rank,
                    total_solved=score_data['total'],
                    streak=score_data.get('streak', 0),
                    rank_type="college",
                    period="overall"
                )
        print("✅ Leaderboard sync complete.")

    print("\n" + "="*60)
    print(f"🎉 SCRAPING COMPLETE! Processed {total_members_scraped} members")
    print("="*60 + "\n")

if __name__ == "__main__":
    print("Welcome to the MVIT Coding Team Scraper!")
    sync_input = input("Do you want to sync members from the Google Sheet? (y/n) [default: y]: ").strip().lower()
    do_sync = sync_input != 'n'

    email_input = input("Do you want to send daily summary emails via Brevo? (y/n) [default: y]: ").strip().lower()
    do_email = email_input != 'n'

    print("\nWhere do you want to sync data?")
    print("  [1] Both  — Firebase (web) + Supabase (app)  [default]")
    print("  [2] App only  — Supabase only (mobile app)")
    print("  [3] Web only  — Firebase only (web dashboard)")
    target_input = input("Enter choice (1/2/3) [default: 1]: ").strip()

    if target_input == "2":
        do_firebase, do_supabase = False, True
        print("📱 Mode: App only (Supabase)")
    elif target_input == "3":
        do_firebase, do_supabase = True, False
        print("🌐 Mode: Web only (Firebase)")
    else:
        do_firebase, do_supabase = True, True
        print("🔄 Mode: Both (Firebase + Supabase)")

    scrape_all_teams(do_sync=do_sync, do_email=do_email, do_firebase=do_firebase, do_supabase=do_supabase)
