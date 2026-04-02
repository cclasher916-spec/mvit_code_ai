"""
supabase_bridge.py
==================
Cross-database synchronization bridge from the Firebase-based
MVIT Executive Dashboard → Supabase-based Student Mobile App.

Handles two data streams:
  1. Daily Scraping Data  → daily_activity table (per-student problem counts)
  2. AI Agent Tasks       → agent_tasks table    (assigned / completed tasks)

Usage (import anywhere):
    from supabase_bridge import SupabaseBridge
    bridge = SupabaseBridge()
    bridge.upsert_daily_activity("Agilesh S", lc=39, sr=694, cc=82, hr=11)
    bridge.assign_task("Agilesh S", "Two Sum", "https://leetcode.com/...", "Easy")
    bridge.mark_task_completed("Agilesh S", "Two Sum")
"""

import os
import json
import re
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────
# Try to import the Supabase client
# ─────────────────────────────────────────────
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠  [SupabaseBridge] supabase-py not installed → run: pip install supabase")


class SupabaseBridge:
    """
    Thin wrapper around supabase-py that provides safe, idempotent
    UPSERT helpers for every write the scraper / agent needs to do.
    """

    def __init__(self):
        self.client: "Client | None" = None
        self._init_client()

    # ─────────────────────────────────────────
    # Initialisation
    # ─────────────────────────────────────────
    def _init_client(self):
        if not SUPABASE_AVAILABLE:
            return

        url = os.getenv("SUPABASE_URL", "")
        # Use the Service Role Key so we can bypass RLS and write on behalf of any student
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

        if not url or not key:
            print("⚠  [SupabaseBridge] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env → bridge disabled")
            return

        try:
            self.client = create_client(url, key)
            print("✅ [SupabaseBridge] Connected to Supabase successfully")
        except Exception as e:
            print(f"❌ [SupabaseBridge] Failed to connect: {e}")

    def is_active(self) -> bool:
        return self.client is not None

    # ─────────────────────────────────────────
    # Internal: Resolve name → student UUID
    # ─────────────────────────────────────────
    def _get_student_id(self, member_name: str) -> str | None:
        """
        Fuzzy search: tries exact match first, then ILIKE.
        Returns the UUID str or None if not found.
        """
        if not self.is_active():
            return None
        try:
            # Exact match first (fastest)
            res = (
                self.client.table("students")
                .select("id")
                .eq("name", member_name)
                .limit(1)
                .execute()
            )
            if res.data:
                return res.data[0]["id"]

            # Fuzzy partial match (handles "Agilesh S" → "Agilesh S K")
            # Supabase REST supports ilike with %
            first_name = member_name.split()[0]
            res = (
                self.client.table("students")
                .select("id, name")
                .ilike("name", f"%{first_name}%")
                .limit(5)
                .execute()
            )
            if res.data:
                # Pick the closest match by length distance
                candidates = res.data
                best = min(
                    candidates,
                    key=lambda r: abs(len(r["name"]) - len(member_name))
                )
                return best["id"]

        except Exception as e:
            print(f"⚠  [SupabaseBridge] _get_student_id({member_name}) error: {e}")
        return None

    # ─────────────────────────────────────────
    # 1. Upsert daily scraping data
    # ─────────────────────────────────────────
    def upsert_daily_activity(
        self,
        member_name: str,
        leetcode_solved: int = 0,
        skillrack_solved: int = 0,
        codechef_solved: int = 0,
        hackerrank_solved: int = 0,
        github_repos: int = 0,
        lc_daily: int = 0,
        sr_daily: int = 0,
        cc_daily: int = 0,
        hr_daily: int = 0,
        gh_daily: int = 0,
    ):
        """
        Push today's scraping result to Supabase daily_activity table.
        The UNIQUE constraint on (student_id, activity_date) means this is
        a safe UPSERT — re-running the scraper won't create duplicate rows.
        """
        if not self.is_active():
            return

        student_id = self._get_student_id(member_name)
        if not student_id:
            print(f"⚠  [SupabaseBridge] Student not found in Supabase: '{member_name}' — skipping daily_activity upsert")
            return

        today = datetime.now(timezone.utc).date().isoformat()
        total_solved = leetcode_solved + skillrack_solved + codechef_solved + hackerrank_solved + github_repos
        total_daily  = lc_daily + sr_daily + cc_daily + hr_daily + gh_daily

        payload = {
            "student_id":          student_id,
            "activity_date":       today,
            # ── Cumulative totals (only platforms we actually scrape) ──
            "leetcode_solved":     leetcode_solved,
            "skillrack_solved":    skillrack_solved,
            "codechef_solved":     codechef_solved,
            # NOTE: codeforces_solved is intentionally OMITTED —
            #       nobody has linked a Codeforces account yet.
            #       We must never write to a column we don't scrape.
            "hackerrank_solved":   hackerrank_solved,
            "github_solved":       github_repos,
            "total_solved":        total_solved,
            # ── Daily deltas (change since yesterday) ──────────────────
            "leetcode_delta":      lc_daily,
            "skillrack_delta":     sr_daily,
            "codechef_delta":      cc_daily,
            "hackerrank_delta":    hr_daily,
            "github_delta":        gh_daily,
            "daily_delta":         total_daily,
            # ── Flags ──────────────────────────────────────────────────
            "is_active":           total_daily > 0,
            "updated_at":          datetime.now(timezone.utc).isoformat(),
        }

        try:
            self.client.table("daily_activity").upsert(
                payload,
                on_conflict="student_id,activity_date"
            ).execute()
            print(f"   📱 [Supabase] daily_activity synced → {member_name} | total={total_solved} | active={total_daily > 0}")
        except Exception as e:
            print(f"❌ [SupabaseBridge] upsert_daily_activity({member_name}) failed: {e}")

    # ─────────────────────────────────────────
    # 2. Upsert leaderboard cache
    # ─────────────────────────────────────────
    def upsert_leaderboard(
        self,
        member_name: str,
        rank: int,
        total_solved: int,
        streak: int = 0,
        rank_type: str = "college",
        period: str = "overall"   # matches the live DB constraint
    ):
        """
        Keep the leaderboard_cache table fresh so the mobile app leaderboard
        stays in sync with the web dashboard rankings.
        """
        if not self.is_active():
            return

        student_id = self._get_student_id(member_name)
        if not student_id:
            return

        payload = {
            "student_id":   student_id,
            "rank_type":    rank_type,
            "period":       period,
            "rank":         rank,
            "total_solved": total_solved,
            "streak":       streak,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }

        try:
            self.client.table("leaderboard_cache").upsert(
                payload,
                on_conflict="student_id,rank_type,period"
            ).execute()
            
            # Also update the user's primary streak in the students table for the Dashboard
            self.client.table("students").update({"current_streak": streak}).eq("id", student_id).execute()
            
            print(f"   🏆 [Supabase] leaderboard_cache & streak synced → {member_name} rank={rank}")
        except Exception as e:
            print(f"❌ [SupabaseBridge] upsert_leaderboard({member_name}) failed: {e}")

    # ─────────────────────────────────────────
    # 3. Assign an AI task to a student
    # ─────────────────────────────────────────
    def assign_task(
        self,
        member_name: str,
        title: str,
        problem_url: str = "",
        difficulty: str = "Medium",
        platform: str = "leetcode",
        description: str = "",
        deadline_hours: int = 48,
    ):
        """
        Insert a new agent_tasks row.  The mobile app reads this table to
        show the student their AI-assigned challenge.
        """
        if not self.is_active():
            return

        student_id = self._get_student_id(member_name)
        if not student_id:
            print(f"⚠  [SupabaseBridge] assign_task: student not found → '{member_name}'")
            return

        now = datetime.now(timezone.utc)
        from datetime import timedelta
        deadline = (now + timedelta(hours=deadline_hours)).isoformat()

        payload = {
            "student_id":   student_id,
            "title":        title,
            "description":  description or f"AI-assigned {difficulty} problem on {platform.capitalize()}",
            "platform":     platform.lower(),
            "problem_url":  problem_url,
            "difficulty":   difficulty,
            "status":       "pending",
            "assigned_at":  now.isoformat(),
            "deadline_at":  deadline,
        }

        try:
            self.client.table("agent_tasks").insert(payload).execute()
            print(f"   🤖 [Supabase] agent_tasks inserted → {member_name} | '{title}'")
        except Exception as e:
            print(f"❌ [SupabaseBridge] assign_task({member_name}) failed: {e}")

    # ─────────────────────────────────────────
    # 4. Mark a task as completed
    # ─────────────────────────────────────────
    def mark_task_completed(self, member_name: str, title: str):
        """
        Called by the autonomous verification loop when LeetCode confirms
        the student solved the assigned problem.
        """
        if not self.is_active():
            return

        student_id = self._get_student_id(member_name)
        if not student_id:
            return

        now = datetime.now(timezone.utc).isoformat()
        try:
            # Update the most recent pending task matching title
            self.client.table("agent_tasks").update(
                {"status": "completed", "completed_at": now}
            ).eq("student_id", student_id).eq("title", title).eq("status", "pending").execute()
            print(f"   ✅ [Supabase] agent_tasks completed → {member_name} | '{title}'")
        except Exception as e:
            print(f"❌ [SupabaseBridge] mark_task_completed({member_name}) failed: {e}")

    # ─────────────────────────────────────────
    # 5. Mark a task as failed / expired
    # ─────────────────────────────────────────
    def mark_task_failed(self, member_name: str, title: str):
        if not self.is_active():
            return
        student_id = self._get_student_id(member_name)
        if not student_id:
            return
        try:
            self.client.table("agent_tasks").update(
                {"status": "failed"}
            ).eq("student_id", student_id).eq("title", title).eq("status", "pending").execute()
            print(f"   ❌ [Supabase] agent_tasks marked failed → {member_name} | '{title}'")
        except Exception as e:
            print(f"❌ [SupabaseBridge] mark_task_failed({member_name}) failed: {e}")
