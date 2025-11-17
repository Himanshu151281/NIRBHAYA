"""Check latest MongoDB document"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

async def check_latest():
    client = AsyncIOMotorClient(os.getenv('MONGODB_URL'))
    db = client['nirbhaya']
    
    # Get latest incident
    result = await db.incidents.find_one({}, sort=[('created_at', -1)])
    
    if result:
        print(f"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"📄 Latest Incident in MongoDB:")
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"MongoDB ID: {result['_id']}")
        print(f"Title: {result.get('metadata', {}).get('title', 'N/A')}")
        print(f"Created: {result.get('created_at', 'N/A')}")
        print(f"Combined Hash: {result.get('combined_hash', 'N/A')[:20]}...")
        print(f"\n🔗 Blockchain Status:")
        print(f"   blockchain_tx: {result.get('blockchain_tx', 'NULL')}")
        print(f"   blockchain_submitted: {result.get('blockchain_submitted', 'NULL')}")
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    else:
        print("No incidents found in MongoDB")
    
    client.close()

asyncio.run(check_latest())
