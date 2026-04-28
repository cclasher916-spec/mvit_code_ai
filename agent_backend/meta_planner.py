"""
Meta Planner — extracts multiple goals from user input in a single LLM call.
Returns a list of goals: [{"flow": "...", "target": "...", "hint": "..."}]
Falls back to [] for general queries (handled by run_agent).
"""

import os
import json
import re
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), '../.env')
load_dotenv(dotenv_path=dotenv_path)

def _get_planner_llm():
    groq_llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0)
    google_key = os.getenv("GOOGLE_API_KEY")
    if google_key:
        try:
            gemini_llm = ChatGoogleGenerativeAI(
                model="gemini-3-flash-preview",
                google_api_key=google_key,
                temperature=0,
                convert_system_message_to_human=True
            )
            return gemini_llm.with_fallbacks([groq_llm])
        except Exception:
            pass
    return groq_llm

_planner_llm = _get_planner_llm()

PLANNER_SYSTEM = """You are a goal extraction engine for an autonomous campus AI agent.
Given the user's message, extract ALL actionable goals and return ONLY valid JSON.

Available flows:
- PERFORMANCE_INTEL: Analyze and improve a specific student's coding performance
- INACTIVITY_RECOVERY: Find and fix inactive students (assign tasks, escalate if needed)
- EVENT_AUTOMATION: Schedule a coding contest/event for the team

Output format (JSON array only, no explanation):
[
  {"flow": "FLOW_NAME", "target": "student_name_or_team", "hint": "any extra detail"}
]

Rules:
- If the message is a general question (not an action request), return: []
- If multiple students or multiple goals are mentioned, include all of them
- "target" is "team" for team-wide flows
- "hint" captures extras like "weak in DP", "tomorrow", "contest"
- When in doubt, return []

Examples:
User: "summarize agilesh performance" → [{"flow": "PERFORMANCE_INTEL", "target": "Agilesh", "hint": ""}]
User: "assign a task to agilesh" → [{"flow": "PERFORMANCE_INTEL", "target": "Agilesh", "hint": "assign task"}]
User: "assign tasks to the whole team" → [{"flow": "PERFORMANCE_INTEL", "target": "team", "hint": "assign task"}]
User: "help everyone improve" → [{"flow": "PERFORMANCE_INTEL", "target": "team", "hint": "improve performance"}]
User: "who is inactive" → [{"flow": "INACTIVITY_RECOVERY", "target": "team", "hint": ""}]
User: "agilesh is weak in DP and inactive, also schedule a contest tomorrow" → [
  {"flow": "PERFORMANCE_INTEL", "target": "Agilesh", "hint": "weak in DP"},
  {"flow": "INACTIVITY_RECOVERY", "target": "Agilesh", "hint": ""},
  {"flow": "EVENT_AUTOMATION", "target": "team", "hint": "tomorrow"}
]
User: "what is leetcode" → []
"""

def extract_goals(user_input: str) -> list:
    """
    Uses LLM to extract multiple goals from user input.
    Returns a list of goal dicts, or [] if no actionable goals found.
    """
    try:
        response = _planner_llm.invoke([
            SystemMessage(content=PLANNER_SYSTEM),
            HumanMessage(content=user_input)
        ])
        raw = response.content.strip()
        # Extract JSON array from response
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if match:
            goals = json.loads(match.group(0))
            if isinstance(goals, list):
                return goals
        return []
    except Exception as e:
        print(f"[Meta Planner] Error extracting goals: {e}")
        return []
