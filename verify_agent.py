from agent_backend.agent import run_agent
import os
from dotenv import load_dotenv

load_dotenv()

def test_student_details():
    print("Test 1: Fetching student details...")
    response = run_agent("give the details of agilesh")
    print(f"Agent Response:\n{response}\n")

def test_memory():
    print("Test 2: Memory test...")
    run_agent("Who is Agilesh?", session_id="test_session")
    response = run_agent("What is his rank?", session_id="test_session")
    print(f"Agent Response:\n{response}\n")

def test_email_dry_run():
    print("Test 3: Email tool tool-recognition...")
    response = run_agent("Send a performance report to Agilesh")
    print(f"Agent Response:\n{response}\n")

if __name__ == "__main__":
    # Note: This requires the environment to be set up correctly
    try:
        test_student_details()
        test_memory()
        test_email_dry_run()
    except Exception as e:
        print(f"Test failed: {e}")
