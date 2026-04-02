import os
# Python 3.14 + Groq on Windows: platform.uname() calls WMI which hangs.
# Monkey-patch to avoid the freeze before importing groq.
import platform as _platform
_orig_uname = _platform.uname
def _safe_uname():
    try:
        return _orig_uname()
    except Exception:
        return _platform.uname_result('Windows', '', '', '', '', '')
_platform.uname = _safe_uname

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from langchain_community.chat_message_histories import ChatMessageHistory
from dotenv import load_dotenv
import os
import json

# Load environment variables from the root .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '../.env')
load_dotenv(dotenv_path=dotenv_path)

# Memory storage (in-memory for now, could be persisted to Redis/DB later)
memory_store = {}

def get_llm():
    """Lazily initialize LLM to keep startup fast."""
    return ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0)

def get_session_history(session_id: str) -> ChatMessageHistory:
    if session_id not in memory_store:
        memory_store[session_id] = ChatMessageHistory()
    return memory_store[session_id]

SYS_MSG = (
    "You are the Autonomous Campus AI Agent for MVIT Coding Team. "
    "Your primary goal is to provide accurate, data-driven insights about students and the campus. "
    "\n\nSTRICT RULES:\n"
    "1. You are NOT a general chatbot. Focus on MVIT Coding Team data.\n"
    "2. ALWAYS use 'get_member_progress' when asked about a specific student.\n"
    "3. ALWAYS use 'get_most_inactive_members' for inactive/struggling/least active queries.\n"
    "4. ALWAYS use 'get_team_leaderboard' for leaderboard/rankings/overall standings queries.\n"
    "5. NEVER suggest adding, editing, or deleting database records. You are strictly READ-ONLY.\n"
    "6. Give structured, professional answers with bold text and bullet points.\n"
    "7. If a tool returns an error or no data, explain it gracefully. NEVER offer to change the database.\n"
    "8. Maintain context: remember who the user was just talking about."
)

# --- Import tools ---
from tools import (
    get_member_progress, 
    assign_personalized_task, 
    get_top_performers,
    get_most_inactive_members,
    get_team_leaderboard,
    get_team_overview_analytics,
    escalate_to_mentor,
    send_performance_report_email
)

# Calendar is optional - wrap import
try:
    from tools.calendar_tool import schedule_event
    tool_list = [get_member_progress, get_top_performers, get_most_inactive_members, get_team_leaderboard, get_team_overview_analytics, assign_personalized_task, schedule_event, escalate_to_mentor, send_performance_report_email]
except Exception:
    tool_list = [get_member_progress, get_top_performers, get_most_inactive_members, get_team_leaderboard, get_team_overview_analytics, assign_personalized_task, escalate_to_mentor, send_performance_report_email]

# Map tool names to callable functions
tool_map = {t.name: t for t in tool_list}

# --- Tool name → human label map for trace ---
TOOL_GOALS = {
    "get_member_progress":       ("Fetch student performance", "Querying student database"),
    "get_top_performers":        ("Get top performers", "Ranking all members by total score"),
    "get_most_inactive_members": ("Identify inactive members", "Scanning last activity dates for all members"),
    "get_team_leaderboard":      ("Retrieve team leaderboard", "Sorting all members by total points"),
    "assign_personalized_task":  ("Assign coding task", "Writing task to student record in database"),
    "query_knowledge_base":      ("Search knowledge base", "Running semantic search over campus documents"),
    "escalate_to_mentor":        ("Escalate to mentor", "Sending alert email to assigned team lead"),
    "send_performance_report_email": ("Send performance email", "Composing and sending SMTP email via Brevo"),
    "schedule_event":            ("Schedule calendar event", "Creating Google Calendar event"),
}

def run_agent(user_input: str, session_id: str = "default") -> dict:
    history = get_session_history(session_id)
    messages = [SystemMessage(content=SYS_MSG)] + history.messages + [HumanMessage(content=user_input)]

    # --- Reasoning trace ---
    trace = []

    try:
        # Step 1: Initialize LLM with tools lazily
        llm = get_llm()
        llm_with_tools = llm.bind_tools(tool_list)

        # Step 2: LLM decides what to do (PLAN)
        response = llm_with_tools.invoke(messages)
        messages.append(response)

        if hasattr(response, "tool_calls") and response.tool_calls:
            tool_results = []

            for tool_call in response.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                tool_id   = tool_call["id"]

                # Derive human-readable goal + plan from TOOL_GOALS map
                goal_label, plan_label = TOOL_GOALS.get(tool_name, (tool_name, f"Executing {tool_name}"))
                
                # Format the args for display
                args_display = ", ".join(f'"{v}"' for v in tool_args.values() if v) if tool_args else ""

                trace.append({"step": "GOAL",   "text": goal_label})
                trace.append({"step": "PLAN",   "text": plan_label})
                trace.append({"step": "ACTION", "text": f"{tool_name}({args_display})"})

                # Execute the tool
                if tool_name in tool_map:
                    try:
                        result = tool_map[tool_name].invoke(tool_args)
                    except Exception as e:
                        result = f"Tool error: {e}"
                else:
                    result = f"Unknown tool: {tool_name}"

                result_str = str(result)
                tool_results.append(result_str)
                messages.append(ToolMessage(content=result_str, tool_call_id=tool_id))

                # RESULT + REVIEW
                is_error = "error" in result_str.lower() or "not found" in result_str.lower() or "couldn't find" in result_str.lower()
                trace.append({"step": "RESULT", "text": result_str[:120] + ("..." if len(result_str) > 120 else "")})
                trace.append({"step": "REVIEW", "text": "⚠️ Data missing or error — will respond gracefully." if is_error else "✅ Data retrieved successfully."})

            # Step 3: Get final response from LLM
            final = llm_with_tools.invoke(messages)
            final_content = final.content if final.content else None

            if not final_content:
                final_content = tool_results[0] if tool_results else "I retrieved the data but couldn't format a response."

            history.add_user_message(user_input)
            history.add_ai_message(final_content)
            return {"reply": final_content, "trace": trace}

        # No tools called — simple conversational response
        content = response.content or "I don't have enough context. Ask me about a specific student or campus topic."
        history.add_user_message(user_input)
        history.add_ai_message(content)
        return {"reply": content, "trace": []}

    except Exception as e:
        return {"reply": f"Agent error: {e}", "trace": [{"step": "ERROR", "text": str(e)}]}
