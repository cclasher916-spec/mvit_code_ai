from datetime import datetime

class BehaviorAnalyzer:
    """
    Phase 1 MVP: Validation-First Intelligence
    Analyzes student coding metrics to output Performance Score (v1) and specific behavioral flags.
    """
    def __init__(self, daily_totals: list, assigned_tasks: list = None):
        """
        daily_totals: A list of dicts, representing daily stats from newest to oldest.
        assigned_tasks: A list of dicts representing previously issued platform tasks.
        """
        self.daily_totals = daily_totals or []
        self.assigned_tasks = assigned_tasks or []

    def analyze(self) -> dict:
        """Run analysis to generate the Performance Score (v1) and behavior flags."""
        if not self.daily_totals:
            return {
                "performance_score": 0.0,
                "flags": ["no_data"],
                "metrics": {
                    "success_ratio": 0.0,
                    "consistency": 0.0,
                    "problems_solved": 0,
                    "inactivity_streak": 0
                }
            }

        latest = self.daily_totals[0]
        
        # 1. Total Problems Solved
        problems_solved = (
            int(latest.get('leetcode_total', 0)) +
            int(latest.get('skillrack_total', 0)) +
            int(latest.get('codechef_total', 0)) +
            int(latest.get('hackerrank_total', 0))
        )

        # 2. Success Ratio
        # Using LeetCode as main accurate proxy since we extract total_submissions.
        lc_solved = int(latest.get('leetcode_total', 0))
        lc_subs = int(latest.get('leetcode_submissions', 0))
        
        success_ratio = 1.0 # Default perfect ratio if no data to prove otherwise
        if lc_solved >= 5 and lc_subs > 0:
            success_ratio = lc_solved / lc_subs

        # 3. Consistency & Inactivity Streak
        # We look back through recent active daily points up to 30 records
        active_days = 0
        inactivity_streak = 0
        streak_broken = False
        
        for record in self.daily_totals[:30]:
            daily_total_inc = (
                int(record.get('leetcode_daily_increase', 0)) +
                int(record.get('skillrack_daily_increase', 0)) +
                int(record.get('codechef_daily_increase', 0)) +
                int(record.get('hackerrank_daily_increase', 0)) + 
                int(record.get('github_daily_increase', 0))
            )
            # Check if actual problems were done today
            if daily_total_inc > 0:
                active_days += 1
                streak_broken = True
            elif not streak_broken:
                inactivity_streak += 1

        # Evaluate last active date compared to today just in case data wasn't synced recently
        last_date = latest.get("date", "")
        if last_date:
            try:
                days_since_last_sync = (datetime.now() - datetime.strptime(last_date, "%Y-%m-%d")).days
                inactivity_streak = max(inactivity_streak, days_since_last_sync)
            except Exception:
                pass

        # Normalize score bounds
        consistency_score = min(100, (active_days / 30) * 100 * 2) # Arbitrary 2x scale for easier high score if moderately active
        problem_points = min(problems_solved / 500.0, 1.0) * 100

        # PERFORMANCE SCORE (v1) FORMULA:
        # score = (problems_solved * 0.5) + (consistency_days * 0.3) + (success_ratio * 0.2)
        performance_score = (problem_points * 0.5) + (consistency_score * 0.3) + ((success_ratio * 100) * 0.2)

        # PHASE 3: Weekly Progress Tracking (Delta)
        weekly_delta_msg = "Insufficient weekly data"
        if len(self.daily_totals) >= 7:
            # Reconstruct the score from 7 days ago precisely
            hist_rec = self.daily_totals[6]
            h_probs_solved = sum(int(hist_rec.get(k, 0)) for k in ['leetcode_total', 'skillrack_total', 'codechef_total', 'hackerrank_total'])
            h_prob_pts = min(h_probs_solved / 500.0, 1.0) * 100
            
            # Simple historical lookback for assumed consistency (proxy for speed)
            h_active = sum(1 for r in self.daily_totals[6:36] if sum(int(r.get(k, 0)) for k in ['leetcode_daily_increase', 'skillrack_daily_increase', 'codechef_daily_increase', 'hackerrank_daily_increase', 'github_daily_increase']) > 0)
            h_cons = min(100, (h_active / 30) * 100 * 2)
            h_score = (h_prob_pts * 0.5) + (h_cons * 0.3) + (100 * 0.2)
            
            delta = round(performance_score - h_score, 1)
            sign = "+" if delta >= 0 else ""
            weekly_delta_msg = f"{sign}{delta} points this week"

        # PHASE 3: 7-Day Consistency Scaling & Labelling
        recent_7_days = self.daily_totals[:7]
        active_in_7 = sum(1 for r in recent_7_days if sum(int(r.get(k, 0)) for k in ['leetcode_daily_increase', 'skillrack_daily_increase', 'codechef_daily_increase', 'hackerrank_daily_increase', 'github_daily_increase']) > 0)
        if active_in_7 <= 2:
            consistency_label = f"Low ({active_in_7}/7 days active)"
        elif active_in_7 <= 5:
            consistency_label = f"Moderate ({active_in_7}/7 days active)"
        else:
            consistency_label = f"Strong ({active_in_7}/7 days active)"
            
        # PHASE 3: Task History Intelligence
        total_assigned = len(self.assigned_tasks)
        completed_tasks = sum(1 for t in self.assigned_tasks if t.get('status') == 'completed')
        task_completion_rate = round((completed_tasks / total_assigned * 100) if total_assigned > 0 else 0, 1)
        
        # PHASE 3: Skill Breakdown via Internal Task Mapping
        skill_map = {}
        # Parse the structured descriptions from task assignment
        for t in self.assigned_tasks:
            desc = t.get('description', '')
            if 'Array' in desc or 'Pointer' in desc: tag = 'Arrays & Pointers'
            elif 'BFS' in desc or 'DFS' in desc or 'Course' in desc: tag = 'Graph Search'
            elif 'Stairs' in desc or 'Coin' in desc or 'Path' in desc: tag = 'Dynamic Programming'
            else: tag = 'General Logic'
            
            cur = skill_map.get(tag, {'total': 0, 'completed': 0})
            cur['total'] += 1
            if t.get('status') == 'completed':
                cur['completed'] += 1
            skill_map[tag] = cur
            
        skill_labels = {}
        for tag, counts in skill_map.items():
            if counts['total'] < 3:
                skill_labels[tag] = "Emerging"
            else:
                rate = counts['completed'] / counts['total']
                if rate >= 0.8: skill_labels[tag] = "Strong"
                elif rate >= 0.4: skill_labels[tag] = "Moderate"
                else: skill_labels[tag] = "Weak"

        # Define behavior flags
        flags = []
        anomaly_weight = 0
        
        # Phase 3 Soft Integrity Engine (Scale base = 100, min = 60)
        if lc_subs > 0 and success_ratio < 0.33:
            flags.append("trial_and_error")
            anomaly_weight += 10
            
        if inactivity_streak > 3:
            flags.append("drop_pattern")
            
        integrity_score = max(60, 100 - anomaly_weight)

        # Benchmark Level Logic
        if performance_score < 40:
            benchmark_level = "Beginner"
        elif performance_score < 70:
            benchmark_level = "Intermediate"
        else:
            benchmark_level = "Advanced"

        return {
            "performance_score": round(performance_score, 1),
            "benchmark_level": benchmark_level,
            "weekly_delta_msg": weekly_delta_msg,
            "consistency_label": consistency_label,
            "integrity_score": integrity_score,
            "task_completion_rate": task_completion_rate,
            "task_analytics": f"Tasks Assigned: {total_assigned} | Completed: {completed_tasks} | Success Rate: {task_completion_rate}%",
            "skill_breakdown": skill_labels,
            "flags": flags,
            "metrics": {
                "success_ratio": round(success_ratio, 2),
                "consistency_score": round(consistency_score, 1),
                "problems_solved": problems_solved,
                "inactivity_streak": inactivity_streak
            }
        }
