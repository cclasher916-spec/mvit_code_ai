# A curated bank of coding problems for the autonomous intervention agent.
# Categorized by ELO levels to provide right-sized tasks.

import random

LEARNING_PATHS = {
    "Array & Two-Pointer Mastery": [
        {"step": 1, "topic": "Arrays Foundation", "difficulty": "Easy", "title": "Two Sum", "url": "https://leetcode.com/problems/two-sum/"},
        {"step": 2, "topic": "Sliding Window", "difficulty": "Medium", "title": "Longest Substring Without Repeating Characters", "url": "https://leetcode.com/problems/longest-substring-without-repeating-characters/"},
        {"step": 3, "topic": "Two Pointers", "difficulty": "Medium", "title": "3Sum", "url": "https://leetcode.com/problems/3sum/"}
    ],
    "Dynamic Programming Foundations": [
        {"step": 1, "topic": "1D DP", "difficulty": "Easy", "title": "Climbing Stairs", "url": "https://leetcode.com/problems/climbing-stairs/"},
        {"step": 2, "topic": "Knapsack Variation", "difficulty": "Medium", "title": "Coin Change", "url": "https://leetcode.com/problems/coin-change/"},
        {"step": 3, "topic": "2D DP", "difficulty": "Medium", "title": "Unique Paths", "url": "https://leetcode.com/problems/unique-paths/"}
    ],
    "Graph Traversal & Search": [
        {"step": 1, "topic": "BFS Foundation", "difficulty": "Easy", "title": "Flood Fill", "url": "https://leetcode.com/problems/flood-fill/"},
        {"step": 2, "topic": "DFS Recursion", "difficulty": "Medium", "title": "Number of Islands", "url": "https://leetcode.com/problems/number-of-islands/"},
        {"step": 3, "topic": "Topological Sort", "difficulty": "Medium", "title": "Course Schedule", "url": "https://leetcode.com/problems/course-schedule/"}
    ]
}

def get_difficulty_from_score(score: float) -> str:
    """Returns the expected difficulty based on the performance score (0-100)."""
    if score < 40:
        return "Easy"
    elif score < 70:
        return "Medium"
    else:
        return random.choice(["Medium", "Hard"])

def select_learning_path(score: float, flags: list = None) -> dict:
    """Selects a full learning path dynamically instead of a singular unrelated pattern."""
    flags = flags or []
    
    # Pick a random learning path mapping
    path_name = random.choice(list(LEARNING_PATHS.keys()))
    path_nodes = LEARNING_PATHS[path_name]
    
    # Adaptive Smart Assignment Rules
    if "drop_pattern" in flags:
        reason = f"AI Mentor: I noticed you've been inactive. Let's restart your progress logically with this {path_name} progression!"
    elif "trial_and_error" in flags:
        reason = f"AI Mentor: Your high submission rate suggests trial-and-error. Let's structure your approach with this step-by-step {path_name} masterclass."
    else:
        reason = f"AI Mentor: Great tracking! Here is a new {path_name} learning progression matching your trajectory."

    # Format the single string task description specifically for the Multi-step UI
    description_lines = [f"{reason}", f"Learning Path: {path_name}\n"]
    for node in path_nodes:
        description_lines.append(f"[ ] Step {node['step']}: {node['topic']} - {node['title']} ({node['url']})")
        
    # Set the overall difficulty of the path to its peak or median node
    path_difficulty = max([n['difficulty'] for n in path_nodes], key=lambda x: {"Easy":1, "Medium":2, "Hard":3}.get(x, 0))
    
    return {
        "expected_difficulty": path_difficulty,
        "reason": reason,
        "path_name": path_name,
        "nodes": path_nodes,
        "formatted_description": "\n".join(description_lines)
    }

def select_problem(score: float, flags: list = None) -> dict:
    """Shim for older calls expecting a single randomly pulled tuple."""
    node = random.choice(random.choice(list(LEARNING_PATHS.values())))
    return {
        "expected_difficulty": node["difficulty"],
        "reason": "AI Mentor Baseline Selection",
        "title": node["title"],
        "url": node["url"],
        "platform": "leetcode"
    }

