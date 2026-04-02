"""
Orchestrator — runs multi-step flows based on extracted goals.
Handles adaptive planning, shared context (no double DB calls), and step-level retry.
"""

import os
import sys
from datetime import datetime, date

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from tools.firebase_tool import (
    _find_member_by_name,
    get_most_inactive_members,
    get_member_latest_stats,
    get_all_members_fast,
    assign_personalized_task,
)
from tools.escalation_tool import escalate_to_mentor
from tools.email_tool import send_performance_report_email
from problem_bank import select_problem, get_difficulty_from_score

# Try optional calendar
try:
    from tools.calendar_tool import schedule_event
    _has_calendar = True
except Exception:
    _has_calendar = False

# ─────────────────────────────────────────────
# Shared execution context — prevents double DB calls across flows
# ─────────────────────────────────────────────
class RunContext:
    def __init__(self):
        self._members: dict = {}   # name → (doc, data, stats)

    def get_member(self, name: str):
        key = name.lower().strip()
        if key not in self._members:
            doc = _find_member_by_name(name)
            if doc:
                data  = doc.to_dict()
                stats = get_member_latest_stats(doc.reference) or {}
                self._members[key] = (doc, data, stats)
            else:
                self._members[key] = None
        return self._members[key]


# ─────────────────────────────────────────────
# Step executor with single retry
# ─────────────────────────────────────────────
def _run_step(fn, args, trace, label, retry_fn=None, retry_args=None):
    trace.append({"step": "ACTION", "text": f"{label}"})
    try:
        result = fn.invoke(args) if hasattr(fn, 'invoke') else fn(**args)
        result_str = str(result)
        is_error = any(w in result_str.lower() for w in ["error", "failed", "not found", "couldn't"])
        trace.append({"step": "RESULT", "text": result_str[:150] + ("..." if len(result_str) > 150 else "")})
        if is_error and retry_fn:
            trace.append({"step": "REVIEW", "text": f"⚠️ Step failed — retrying with alternate strategy."})
            try:
                retry_result = retry_fn.invoke(retry_args) if hasattr(retry_fn, 'invoke') else retry_fn(**retry_args)
                trace.append({"step": "RESULT", "text": str(retry_result)[:150]})
                trace.append({"step": "REVIEW", "text": "✅ Retry succeeded."})
                return str(retry_result)
            except Exception as re:
                trace.append({"step": "REVIEW", "text": f"❌ Retry also failed: {re}. Continuing."})
                return result_str
        else:
            trace.append({"step": "REVIEW", "text": "✅ Step completed." if not is_error else "⚠️ Completed with issues."})
            return result_str
    except Exception as e:
        trace.append({"step": "RESULT", "text": f"Exception: {e}"})
        trace.append({"step": "REVIEW", "text": "❌ Step failed. Continuing to next step."})
        return f"Error: {e}"


# ─────────────────────────────────────────────
# FLOW 1: PERFORMANCE_INTEL
# Fetch → Rank vs team → Adaptive difficulty → Assign task
# ─────────────────────────────────────────────
def flow_performance_intel(target: str, hint: str, ctx: RunContext, trace: list) -> str:
    trace.append({"step": "GOAL", "text": f"Analyze & improve {target}'s coding performance"})
    trace.append({"step": "PLAN", "text": "1. Fetch student data  2. Rank vs team  3. Select adaptive problem  4. Assign task"})

    targets = []
    if target.lower() == "team":
        trace.append({"step": "ACTION", "text": "Team-wide request detected. Fetching all members..."})
        all_members = get_all_members_fast() # List of {"ref": ..., "data": ...}
        for m in all_members:
            # Stats are not in all_members, get them from context/DB
            m_doc = m["ref"].get()
            m_stats = get_member_latest_stats(m["ref"]) or {}
            targets.append((m_doc, m["data"], m_stats))
    else:
        member = ctx.get_member(target)
        if not member:
            trace.append({"step": "RESULT", "text": f"Student '{target}' not found."})
            return f"Student '{target}' not found."
        targets.append(member)

    trace.append({"step": "ACTION", "text": f"Processing {len(targets)} member(s)..."})
    
    assigned_count = 0
    results_summary = []

    for doc, data, stats in targets:
        name  = data.get('name', "Unknown")
        elo   = int(data.get('elo_rating', 1200))
        lc    = int(stats.get('leetcode_total', 0))
        total = int(lc) + int(stats.get('skillrack_total', 0)) + int(stats.get('codechef_total', 0)) + int(stats.get('hackerrank_total', 0))

        # Identify flags for smart assignment
        flags = []
        lc_subs = int(stats.get('leetcode_submissions', 0))
        if lc_subs > 0 and (lc / lc_subs) < 0.33:
            flags.append("trial_and_error")

        # Adaptive difficulty logic
        difficulty = get_difficulty_from_score(elo)
        if hint and "dp" in hint.lower():
            task_desc = f"Focus: Dynamic Programming. Solve 3 DP problems on LeetCode. ELO: {elo} → Difficulty: {difficulty}"
        elif lc == 0:
            difficulty = "Easy"
            task_desc = f"Get started! Solve 2 Easy LeetCode problems to build consistency. ELO: {elo}"
        else:
            problem = select_problem(elo, flags=flags)
            difficulty = problem["expected_difficulty"]
            task_desc = f"{problem.get('reason', '')} Solve '{problem['title']}' ({problem['platform']}). ELO: {elo} → Difficulty: {difficulty}. URL: {problem['url']}"

        # Assign task
        _run_step(
            assign_personalized_task,
            {"member_name": name, "task_description": task_desc, "difficulty": difficulty},
            trace,
            f"assign_task({name}, {difficulty})"
        )
        assigned_count += 1
        results_summary.append(f"{name} (ELO: {elo}) → {difficulty} task")
        
        if assigned_count >= 10 and target.lower() == "team": # Cap for demo speed
            trace.append({"step": "REVIEW", "text": "⚠️ Capped at 10 members for performance."})
            break

    if target.lower() == "team":
        return f"**Team-Wide Performance Boost Initiated**\nAssigned personalized tasks to {assigned_count} members. Check the AI Assigned Tasks section in their dashboards."
    else:
        return (f"**Performance Report — {name}**\n"
                f"ELO: {elo} | LeetCode: {lc} | Total Points: {total}\n"
                f"Platform Stats: LC: {lc}, SR: {stats.get('skillrack_total',0)}, CC: {stats.get('codechef_total',0)}, HR: {stats.get('hackerrank_total',0)}, GH: {stats.get('github_repos',0)}\n"
                f"Task Assigned: {task_desc}")


# ─────────────────────────────────────────────
# FLOW 2: INACTIVITY_RECOVERY
# Detect inactive → Decision: days>7 → escalate, else assign task
# ─────────────────────────────────────────────
def flow_inactivity_recovery(target: str, hint: str, ctx: RunContext, trace: list) -> str:
    trace.append({"step": "GOAL", "text": "Identify inactive members and trigger recovery actions"})
    trace.append({"step": "PLAN", "text": "1. Get last activity dates  2. Days>7 → escalate  3. Days 3-7 → assign task  4. Days<3 → note only"})

    today = date.today()
    results = []

    if target.lower() != "team":
        # Single student check
        member = ctx.get_member(target)
        if not member:
            trace.append({"step": "RESULT", "text": f"Student '{target}' not found."})
            trace.append({"step": "REVIEW", "text": "⚠️ Cannot process — student missing."})
            return f"Student '{target}' not found."
        doc, data, stats = member
        targets = [(doc, data, stats)]
    else:
        # Full team scan
        all_members = get_all_members_fast()
        targets = []
        for m in all_members:
            stats = get_member_latest_stats(m["ref"]) or {}
            targets.append((None, m["data"], stats))

    trace.append({"step": "ACTION", "text": f"Scanning {len(targets)} member(s) for inactivity..."})

    actioned = 0
    for _, data, stats in targets:
        name = data.get("name", "Unknown")
        last_date_str = stats.get("date", "")
        try:
            last = datetime.strptime(last_date_str, "%Y-%m-%d").date()
            days_inactive = (today - last).days
        except Exception:
            days_inactive = 999

        if days_inactive < 3:
            if target.lower() != "team":
                trace.append({"step": "REVIEW", "text": f"✅ {name} is currently active ({days_inactive} days since last sync)."})
                results.append(f"{name} is already active ({days_inactive}d). No recovery needed.")
            continue  # Active — skip

        trace.append({"step": "RESULT", "text": f"{name}: {days_inactive} days inactive"})

        if days_inactive > 7:
            # Decision: escalate + assign task
            trace.append({"step": "REVIEW", "text": f"🔴 {name} > 7 days inactive → ESCALATE + assign task"})
            _run_step(
                escalate_to_mentor,
                {"student_name": name, "issue_description": f"{name} has been inactive for {days_inactive} days. Immediate intervention required."},
                trace, f"escalate_to_mentor({name})"
            )
        else:
            trace.append({"step": "REVIEW", "text": f"🟡 {name} {days_inactive} days inactive → assign task"})

        # Assign a recovery path
        from behavior_analyzer import BehaviorAnalyzer
        from problem_bank import select_learning_path
        score = BehaviorAnalyzer([stats]).analyze().get("performance_score", 0.0)
        path = select_learning_path(score, flags=["drop_pattern"])
        _run_step(
            assign_personalized_task,
            {"member_name": name, "task_description": path['formatted_description'], "difficulty": path['expected_difficulty']},
            trace, f"assign_task({name})",
            retry_fn=assign_personalized_task,
            retry_args={"member_name": name, "task_description": "Solve 1 Easy LeetCode problem to restart activity.", "difficulty": "Easy"}
        )
        results.append(f"{name} ({days_inactive}d inactive) → task assigned")
        actioned += 1

        if actioned >= 5:  # Cap at 5 to keep demo fast
            break

    if not results:
        trace.append({"step": "REVIEW", "text": "✅ No members with critical inactivity found."})
        return "No members with >3 days of inactivity. Team is active! ✅"

    trace.append({"step": "REVIEW", "text": f"✅ Recovery complete: {actioned} member(s) actioned."})
    return f"**Inactivity Recovery Complete**\n" + "\n".join(f"• {r}" for r in results)


# ─────────────────────────────────────────────
# FLOW 3: EVENT_AUTOMATION
# Target bottom 30% → Assign contest problems → Schedule calendar event
# ─────────────────────────────────────────────
def flow_event_automation(target: str, hint: str, ctx: RunContext, trace: list) -> str:
    trace.append({"step": "GOAL", "text": "Organize a coding contest and prepare team"})
    trace.append({"step": "PLAN", "text": "1. Identify bottom performers  2. Assign contest problems  3. Schedule calendar event"})

    all_members = get_all_members_fast()
    scored = []
    for m in all_members:
        stats = get_member_latest_stats(m["ref"]) or {}
        total = sum(int(stats.get(k, 0)) for k in ["leetcode_total", "skillrack_total", "codechef_total", "hackerrank_total"])
        scored.append((m["data"], total))

    scored.sort(key=lambda x: x[1])
    bottom_30pct = scored[:max(1, len(scored) // 3)]

    trace.append({"step": "ACTION", "text": f"Targeting {len(bottom_30pct)} members (bottom 30%) for contest prep"})
    trace.append({"step": "RESULT", "text": ", ".join(d.get("name","?") for d, _ in bottom_30pct[:5]) + ("..." if len(bottom_30pct) > 5 else "")})

    assigned = 0
    for data, _ in bottom_30pct[:5]:
        name = data.get("name", "Unknown")
        elo  = int(data.get("elo_rating", 1200))
        problem = select_problem(elo)
        _run_step(
            assign_personalized_task,
            {"member_name": name, "task_description": f"Contest Prep: Solve '{problem['title']}' by contest date. URL: {problem['url']}", "difficulty": get_difficulty_from_score(elo)},
            trace, f"assign_contest_task({name})"
        )
        assigned += 1

    trace.append({"step": "REVIEW", "text": f"✅ Contest problems assigned to {assigned} members."})

    # Schedule calendar event
    event_hint = hint or "no specific time"
    if _has_calendar:
        from datetime import timedelta
        now = datetime.now()
        # Default: tomorrow at 3pm IST
        start_dt = (now + timedelta(days=1)).replace(hour=9, minute=30, second=0, microsecond=0)
        end_dt   = start_dt.replace(hour=11, minute=30)
        cal_result = _run_step(
            schedule_event,
            {"summary": "MVIT Coding Contest", "start_time": start_dt.isoformat(), "end_time": end_dt.isoformat(), "description": f"Auto-scheduled by Autonomous Agent. Hint: {event_hint}"},
            trace, "schedule_event(MVIT Coding Contest)"
        )
    else:
        trace.append({"step": "RESULT", "text": "Calendar credentials not configured — scheduling skipped."})
        trace.append({"step": "REVIEW", "text": "⚠️ Manual scheduling recommended. All contest tasks assigned successfully."})
        cal_result = "Calendar not configured."

    return (f"**Event Automation Complete**\n"
            f"• Contest problems assigned to {assigned} members (bottom 30%)\n"
            f"• Calendar: {cal_result}")


# ─────────────────────────────────────────────
# Main entry point
# ─────────────────────────────────────────────
FLOW_MAP = {
    "PERFORMANCE_INTEL":    flow_performance_intel,
    "INACTIVITY_RECOVERY":  flow_inactivity_recovery,
    "EVENT_AUTOMATION":     flow_event_automation,
}

def run_flows(goals: list) -> dict:
    """
    Executes all extracted goals in sequence, sharing a context to avoid double DB calls.
    Returns {"reply": str, "trace": list, "is_multi_goal": bool}
    """
    ctx = RunContext()
    trace = []
    replies = []

    num_flows = len(goals)

    if num_flows > 1:
        trace.append({"step": "GOAL", "text": f"Multi-goal request detected — executing {num_flows} flows"})
        trace.append({"step": "PLAN", "text": " → ".join(g.get("flow","?") for g in goals)})

    for goal in goals:
        flow_id = goal.get("flow", "")
        target  = goal.get("target", "team")
        hint    = goal.get("hint", "")
        fn      = FLOW_MAP.get(flow_id)

        if not fn:
            trace.append({"step": "REVIEW", "text": f"Unknown flow '{flow_id}' — skipping."})
            continue

        if num_flows > 1:
            trace.append({"step": "ACTION", "text": f"▶ Starting flow: {flow_id} (target: {target})"})

        result = fn(target, hint, ctx, trace)
        replies.append(result)

    final_reply = "\n\n---\n\n".join(replies) if replies else "No actionable goals found."
    return {"reply": final_reply, "trace": trace, "is_multi_goal": num_flows > 1}
