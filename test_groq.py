import os
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

try:
    llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0)
    res = llm.invoke("Hello, are you working?")
    print(f"Groq Response: {res.content}")
except Exception as e:
    print(f"Groq Error: {e}")
