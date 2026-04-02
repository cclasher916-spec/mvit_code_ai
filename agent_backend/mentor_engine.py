import os
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

# Load env variables safely
dotenv_path = os.path.join(os.path.dirname(__file__), '../.env')
load_dotenv(dotenv_path=dotenv_path)

try:
    mentor_llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0.3)
except Exception as e:
    mentor_llm = None
    print(f"Warning: Could not initialize mentor LLM - {e}")

MENTOR_SYSTEM_PROMPT = """
You are the AI Mentor for the MVIT Coding Team.
You will receive a student's performance metrics and behavior flags from the Behavior Analyzer.

You MUST structure your feedback EXACTLY in this format with these three prefixes:
Observation: (1 sentence noting what they are doing based on metrics)
Issue: (1 sentence pointing out the core problem based on the flags, or "None" if doing well)
Recommendation: (1 actionable advice sentence)

Example 1:
Observation: You are solving problems regularly, solving 40 problems so far.
Issue: Your high submission ratio indicates a trial-and-error approach.
Recommendation: Try planning your logic before coding and focus on pattern recognition.

Example 2:
Observation: You have been inactive for the last 5 days.
Issue: This drop pattern hurts your learning momentum.
Recommendation: Solve just 1 easy problem today to rebuild your coding habit.
"""

def generate_mentor_feedback(name: str, behavior_data: dict) -> str:
    """Generates strictly structured mentor feedback based on behavior flags."""
    if not mentor_llm:
        return "Observation: LLM unavailable.\nIssue: Configuration missing.\nRecommendation: Check API keys."
        
    stats_str = f"Student: {name}\nMetrics: {behavior_data.get('metrics', {})}\nFlags: {behavior_data.get('flags', [])}"
    
    try:
        response = mentor_llm.invoke([
            SystemMessage(content=MENTOR_SYSTEM_PROMPT),
            HumanMessage(content=stats_str)
        ])
        return response.content.strip()
    except Exception as e:
        return f"Observation: Could not generate feedback.\nIssue: Internal LLM Error.\nRecommendation: Keep practicing."
