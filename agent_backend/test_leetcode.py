import re

description = "Solve '3Sum' (leetcode). ELO: 1200 → Difficulty: Medium. URL: https://leetcode.com/problems/3sum/"

# Try extracting problem title
match = re.search(r"Solve '([^']+)'", description)
if match:
    problem_title = match.group(1)
else:
    problem_title = description.split(' on ')[0].replace('Solve ', '')

print(f"Extracted problem_title: {problem_title}")

def normalize_title(title):
    return title.lower().strip()

print(f"Normalized: {normalize_title(problem_title)}")
