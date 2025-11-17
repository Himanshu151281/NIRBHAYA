"""Test MongoDB update directly"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from bson import ObjectId

load_dotenv()

async def test_update():
    MONGODB_URL = os.getenv("MONGODB_URL")
    MONGODB_DB = os.getenv("MONGODB_DB", "nirbhaya_db")
    
    print(f"MongoDB URL: {MONGODB_URL[:50]}...")
    print(f"Database name: {MONGODB_DB}")
    
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB]
    incidents_collection = db["incidents"]
    
    # Get latest incident
    latest = await incidents_collection.find_one({}, sort=[('created_at', -1)])
    
    if latest:
        incident_id = latest['_id']
        print(f"\nFound incident: {incident_id}")
        print(f"Current blockchain_tx: {latest.get('blockchain_tx')}")
        
        # Try to update it
        print(f"\nAttempting update...")
        update_result = await incidents_collection.update_one(
            {"_id": incident_id},
            {"$set": {
                "blockchain_tx": "0xTEST123456789",
                "blockchain_submitted": True
            }}
        )
        
        print(f"✅ Update result:")
        print(f"   matched_count: {update_result.matched_count}")
        print(f"   modified_count: {update_result.modified_count}")
        print(f"   acknowledged: {update_result.acknowledged}")
        
        # Verify update
        updated = await incidents_collection.find_one({"_id": incident_id})
        print(f"\n📄 After update:")
        print(f"   blockchain_tx: {updated.get('blockchain_tx')}")
        print(f"   blockchain_submitted: {updated.get('blockchain_submitted')}")
    else:
        print("No incidents found")
    
    client.close()

asyncio.run(test_update())
