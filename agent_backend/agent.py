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

try:
    from langchain_core.caches import InMemoryCache
    import langchain
    langchain.llm_cache = InMemoryCache()
except ImportError:
    pass

# Load environment variables from the root .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '../.env')
load_dotenv(dotenv_path=dotenv_path)

# Memory storage (in-memory for now, could be persisted to Redis/DB later)
memory_store = {}
rnn_states = {} # Stores the hidden state string for each session

def get_llm():
    """Lazily initialize LLM to keep startup fast."""
    # TurboQuant optimization: using cache
    return ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0)

def get_session_history(session_id: str) -> ChatMessageHistory:
    """Returns typical chat history, used for recent tool calls but managed by RNN."""
    if session_id not in memory_store:
        memory_store[session_id] = ChatMessageHistory()
    return memory_store[session_id]

def update_rnn_state(session_id: str, user_input: str, ai_response: str):
    """
    Simulates an RNN cell: extracts the emotional and contextual state.
    Hidden_State(t) = Neural_Function(Hidden_State(t-1) + User_Input(t) + AI_Response(t))
    """
    prev_state = rnn_states.get(session_id, "Neutral, newly initialized conversation. You are a friendly helping agent.")
    prompt = (
        f"Update the short hidden state summarizing the user's mood, goals, and context "
        f"given the prior state, user input, and your response:\n"
        f"- Prior State: {prev_state}\n"
        f"- User Input: {user_input}\n"
        f"- AI Response: {ai_response}\n\n"
        f"Return ONLY a 1-2 sentence descriptive state summary directing the agent's tone."
    )
    llm = get_llm()
    try:
        new_state = llm.invoke([HumanMessage(content=prompt)]).content
        rnn_states[session_id] = new_state
    except Exception:
        # Fallback if network fails
        rnn_states[session_id] = prev_state

import threading
def update_rnn_state_async(session_id: str, user_input: str, ai_response: str):
    threading.Thread(target=update_rnn_state, args=(session_id, user_input, ai_response), daemon=True).start()

SYS_MSG = (
    "You are the Autonomous Campus AI Agent for MVIT Coding Team. "
    "Your goal is to provide high-quality, data-driven insights about students and the campus in a friendly, professional, ChatGPT-like manner."
    "\n\nSTYLE RULES:\n"
    "1. Use Markdown for all formatting. Use **bold** for emphasis.\n"
    "2. If listing 3 or more students/items, ALWAYS use a Markdown TABLE for clarity.\n"
    "3. Keep responses concise but comprehensive. Use bullet points for steps.\n"
    "4. If asked about a student, provide their ELO, Dept, and performance highlights.\n"
    "\n\nSTRICT RULES:\n"
    "1. Focus strictly on MVIT Coding Team data. Do not hallucinate external facts.\n"
    "2. ALWAYS use 'get_member_progress' for specific student queries.\n"
    "3. ALWAYS use 'get_most_inactive_members' for inactivity/struggling student scans.\n"
    "4. ALWAYS use 'get_team_leaderboard' for rankings/leaderboards.\n"
    "5. Maintain absolute privacy: do not share student contact details or internal IDs.\n"
    "6. Maintain context: remember who the user was just talking about.\n"
    "7. CRITICAL: If a tool returns a markdown table or structured list, YOU MUST output the ENTIRE table or list verbatim in your response. DO NOT summarize it or replace it with 'Here it is'."
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
    
    # Inject the RNN Hidden State to behaviorally prompt the agent to be friendly and contextual
    current_rnn_state = rnn_states.get(session_id, "Neutral. Be a highly empathetic and friendly helping agent.")
    dynamic_sys_msg = SYS_MSG + f"\n\nCURRENT USER STATE (RNN MEMORY): {current_rnn_state}"
    
    messages = [SystemMessage(content=dynamic_sys_msg)] + history.messages + [HumanMessage(content=user_input)]

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
            final_content = final.content if final.content else ""

            # Groq Llama-3 often says "Here is the data" but omits pasting the actual data.
            # We enforce visibility by appending tool output if it isn't deeply embedded.
            if tool_results:
                for res in tool_results:
                    if len(res) > 30 and ("🏆" in res or "🔴" in res or "📊" in res or "—" in res):
                        if "🏆" not in final_content and "🔴" not in final_content and "📊" not in final_content:
                            final_content += f"\n\n{res}"

            if not final_content.strip():
                final_content = tool_results[0] if tool_results else "I retrieved the data but couldn't format a response."

            history.add_user_message(user_input)
            history.add_ai_message(final_content)
            
            # Update RNN Hidden State (simulating recurrent memory update)
            update_rnn_state_async(session_id, user_input, final_content)
            
            # Truncate history to prevent context explosion and rely on RNN Memory
            if len(history.messages) > 10:
                history.messages = history.messages[-10:]
            
            # Dynamic suggestions based on tools used
            suggestions = ["Get team analysis", "Send report", "Next steps?"]
            
            return {"reply": final_content, "trace": trace, "suggestions": suggestions}

        # No tools called — simple conversational response
        content = response.content or "I don't have enough context. Ask me about a specific student or campus topic."
        history.add_user_message(user_input)
        history.add_ai_message(content)
        
        # Update RNN Hidden State (simulating recurrent memory update)
        update_rnn_state_async(session_id, user_input, content)
        if len(history.messages) > 10:
            history.messages = history.messages[-10:]
        
        # Add basic suggestions for the user
        suggestions = ["Who is the top performer?", "Show me inactive members", "Team leaderboard"]
        
        return {"reply": content, "trace": [], "suggestions": suggestions}

    except Exception as e:
        return {"reply": f"Agent error: {e}", "trace": [{"step": "ERROR", "text": str(e)}], "suggestions": []}
