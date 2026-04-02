from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
from dotenv import load_dotenv
import time
import os
import shutil
from agent import run_agent
from meta_planner import extract_goals
from orchestrator import run_flows
from tools.rag_tool import ingest_pdf
import autonomous_loop
from autonomous_loop import run_loop, sys_logs
from tools.firebase_tool import get_all_tasks
from behavior_analyzer import BehaviorAnalyzer
from mentor_engine import generate_mentor_feedback
import asyncio

# Load environment variables from the root .env file
load_dotenv(dotenv_path="../.env")

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Autonomous Campus Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Proactive actions log — populated by background agent
proactive_log = []

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

async def continuous_autonomous_loop():
    """Background loop that evaluates inactivity and verifies tasks every 12 hours automatically."""
    print("[SYSTEM] Background autonomous loop initialized. Will run every 12 hours.")
    while True:
        try:
            print("[SYSTEM] Automatically running scheduled autonomous loop...")
            # run_loop is synchronous, so we run it in a thread to not block FastAPI
            await asyncio.to_thread(run_loop, proactive_log)
        except Exception as e:
            print(f"[ERROR] Auto-loop execution failed: {e}")
        # Sleep for 12 hours (43200 seconds)
        await asyncio.sleep(43200)

@app.on_event("startup")
async def startup_event():
    # Wait 10 seconds before starting the heavy background loop
    # to allow the server to fully bind to Render's port first.
    async def delayed_start():
        await asyncio.sleep(10)
        asyncio.create_task(continuous_autonomous_loop())
    
    asyncio.create_task(delayed_start())

@app.get("/")
def read_root():
    return {"status": "success", "message": "Autonomous Campus Agent API is running."}

@app.post("/chat")
def chat_with_agent(req: ChatRequest):
    try:
        # ── Step 1: Meta Planner extracts goals ──────────────────────────
        goals = extract_goals(req.message)

        # ── Step 2: Multi-goal → Orchestrator; else → LLM agent ─────────
        if goals:
            result = run_flows(goals)
            return {
                "reply": result.get("reply", ""),
                "trace": result.get("trace", []),
                "is_multi_goal": result.get("is_multi_goal", False),
                "mode": "orchestrator"
            }

        # ── Step 3: Fallback to conversational LLM agent ─────────────────
        result = run_agent(req.message, session_id=req.session_id)
        if isinstance(result, dict):
            return {
                "reply": result.get("reply", ""),
                "trace": result.get("trace", []),
                "is_multi_goal": False,
                "mode": "llm_agent"
            }
        return {"reply": str(result), "trace": [], "is_multi_goal": False, "mode": "llm_agent"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/proactive-status")
def get_proactive_status():
    """Returns what the background autonomous agent has done proactively."""
    return {"proactive_actions": proactive_log, "loop_logs": sys_logs[-20:]}

@app.post("/ingest")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    autonomous_loop.is_ingestion_running = True
    try:
        res = ingest_pdf(temp_path)
        os.remove(temp_path)
        return {"status": "success", "message": res}
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        autonomous_loop.is_ingestion_running = False

@app.post("/trigger_loop")
def trigger_intervention_loop(background_tasks: BackgroundTasks):
    try:
        background_tasks.add_task(run_loop, proactive_log)
        return {"status": "success", "message": "Autonomous intervention loop initiated. Tracking proactive actions."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/logs")
def get_loop_logs():
    return {"logs": sys_logs}

@app.get("/student/{name}/analysis")
def get_student_analysis(name: str):
    try:
        from tools.firebase_tool import _find_member_by_name
        from firebase_admin import firestore
        
        member_doc = _find_member_by_name(name)
        if not member_doc:
            raise HTTPException(status_code=404, detail="Student not found.")
        
        try:
            docs = list(member_doc.reference.collection('daily_totals').order_by('date', direction=firestore.Query.DESCENDING).limit(30).stream())
            daily_stats = [doc.to_dict() for doc in docs]
        except Exception as e:
            print(f"[SYSTEM FALLBACK] Rate limit on daily_totals: {e}. Graceful degradation applied.")
            daily_stats = []
        # 1. Analyze Behavior using Phase 3 capabilities
        from tools.firebase_tool import get_all_tasks
        assigned_tasks = [t for t in get_all_tasks() if str(t.get('member_name', '')).lower() == name.lower()]
        
        analyzer = BehaviorAnalyzer(daily_stats, assigned_tasks)
        analysis_result = analyzer.analyze()
        
        mem_data = member_doc.to_dict()
        latest_score = analysis_result['performance_score']
        
        # 2. Get AI Mentor Feedback (with Caching)
        cache = mem_data.get('mentor_cache', {})
        current_time = time.time()
        
        current_level = analysis_result['benchmark_level']
        cached_level = cache.get('level')

        # Level up notification check
        level_change_msg = None
        if cached_level and cached_level != current_level:
            level_map = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}
            if level_map.get(current_level, 0) > level_map.get(cached_level, 0):
                level_change_msg = f"Level Up: {cached_level} → {current_level}!"
        
        # Regenerate if: no cache, score changed by > 5 points, or >24h elapsed
        if (not cache or 
            abs(cache.get('score', 0) - latest_score) > 5 or 
            (current_time - cache.get('timestamp', 0)) > 86400):
            
            feedback = generate_mentor_feedback(name, analysis_result)
            member_doc.reference.update({
                'mentor_cache': {
                    'feedback': feedback,
                    'score': latest_score,
                    'level': current_level,
                    'timestamp': current_time
                }
            })
        else:
            feedback = cache['feedback']
            
        analysis_result['mentor_feedback'] = feedback
        analysis_result['level_change_msg'] = level_change_msg
        
        analysis_result['name'] = mem_data.get('name', name)
        analysis_result['elo_rating'] = mem_data.get('elo_rating', 1200)
        
        return {"status": "success", "data": analysis_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/student/{name}/start_test")
def start_test_session(name: str):
    try:
        from problem_bank import select_problem
        # Fetch 2 random problems
        p1 = select_problem(50) # Force medium
        p2 = select_problem(40) # Force easy
        return {
            "status": "success", 
            "data": {
                "duration_minutes": 30,
                "problems": [p1, p2]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/all_tasks")
def get_dashboard_tasks():
    try:
        tasks = get_all_tasks()
        return {"status": "success", "tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
