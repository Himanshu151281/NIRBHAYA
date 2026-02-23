"""Test Gemini API Integration"""
from dotenv import load_dotenv
import os

load_dotenv()

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
print(f"✅ GEMINI_API_KEY loaded: {GEMINI_KEY[:20]}..." if GEMINI_KEY else "❌ GEMINI_API_KEY not found")

try:
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
    print("✅ Gemini model initialized: gemini-2.5-flash")
    
    response = model.generate_content("Reply with exactly one word: WORKING")
    print(f"✅ Gemini Response: {response.text.strip()}")
    print("\n🎉 GEMINI IS WORKING CORRECTLY!")
except Exception as e:
    print(f"❌ Error: {type(e).__name__}: {e}")
