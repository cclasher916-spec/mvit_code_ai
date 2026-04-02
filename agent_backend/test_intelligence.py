import sys
import os
from pprint import pprint

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from behavior_analyzer import BehaviorAnalyzer
from problem_bank import select_problem

def build_daily_totals(lc_total, lc_subs, days_inactive=0, active_days=10):
    totals = []
    
    for i in range(days_inactive):
        totals.append({
            "leetcode_total": lc_total,
            "leetcode_submissions": lc_subs,
            "leetcode_daily_increase": 0
        })
        
    for i in range(active_days):
        totals.append({
            "leetcode_total": lc_total,
            "leetcode_submissions": lc_subs,
            "leetcode_daily_increase": 1
        })
        
    return totals

print("--- RUNNING EDGE CASE TESTS ---")

print("\n[Case 1] Trial & Error Detection")
t1 = build_daily_totals(10, 50, days_inactive=0, active_days=10)
res1 = BehaviorAnalyzer(t1).analyze()
print("Ratio:", res1["metrics"]["success_ratio"])
print("Flags:", res1["flags"])
assert "trial_and_error" in res1["flags"], "Failed to detect trial_and_error"

print("\n[Case 2] Drop Pattern")
t2 = build_daily_totals(100, 150, days_inactive=5, active_days=10)
res2 = BehaviorAnalyzer(t2).analyze()
print("Inactivity:", res2["metrics"]["inactivity_streak"])
print("Flags:", res2["flags"])
assert "drop_pattern" in res2["flags"], "Failed to detect drop_pattern"

print("\n[Case 3] High Performer")
t3 = build_daily_totals(400, 450, days_inactive=0, active_days=30)
res3 = BehaviorAnalyzer(t3).analyze()
score3 = res3["performance_score"]
print("Score:", score3)
task3 = select_problem(score3, res3["flags"])
print("Task Difficulty assigned:", task3["expected_difficulty"])
assert task3["expected_difficulty"] in ["Medium", "Hard"], "High performer did not get Medium/Hard"

print("\n[Case 4] Solved < 5 Ignore Ratio Edge Case")
t4 = build_daily_totals(3, 30, days_inactive=0, active_days=3)
res4 = BehaviorAnalyzer(t4).analyze()
print("Ratio:", res4["metrics"]["success_ratio"])
print("Flags:", res4["flags"])
assert res4["metrics"]["success_ratio"] == 1.0, "Ratio was not safely ignored"
assert "trial_and_error" not in res4["flags"], "False positive trial_and_error triggered"

print("\n[Case 5] Mixed Case (High Performer + Inactivity)")
t5 = build_daily_totals(450, 500, days_inactive=5, active_days=30)
res5 = BehaviorAnalyzer(t5).analyze()
score5 = res5["performance_score"]
print("Score:", score5)
print("Flags:", res5["flags"])
task5 = select_problem(score5, res5["flags"])
print("Difficulty assigned:", task5["expected_difficulty"])
print("AI Reason:", task5["reason"])
assert "drop_pattern" in res5["flags"], "Failed to detect drop pattern"
assert task5["expected_difficulty"] in ["Medium", "Hard"], f"Difficulty incorrectly downgraded: {task5['expected_difficulty']}"
assert "momentum" in task5["reason"].lower() or "inactive" in task5["reason"].lower(), "AI mentor fail to explain drop pattern assigned reason"

print("\n✅ ALL TESTS PASSED SUCCESSFULLY.")
