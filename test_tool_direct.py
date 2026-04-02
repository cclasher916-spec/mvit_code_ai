import os
from agent_backend.tools import get_member_progress
from dotenv import load_dotenv

# Load .env
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=dotenv_path)

def test_direct_tool():
    print("--- Testing get_member_progress directly ---")
    res = get_member_progress.invoke({"member_name": "Agilesh"})
    print(f"Result:\n{res}")

if __name__ == "__main__":
    test_direct_tool()
