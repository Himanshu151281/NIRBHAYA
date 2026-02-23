"""
Incident Reporting with MongoDB Storage & Blockchain Integration
Stores images and metadata in MongoDB, submits hash to blockchain
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import hashlib
import base64
from datetime import datetime
from web3 import Web3
from eth_account import Account
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
import io

load_dotenv()

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-2.5-flash')
else:
    print("Warning: GEMINI_API_KEY not set - AI verification disabled")
    gemini_model = None

router = APIRouter(prefix="/api/incidents", tags=["Incidents & Blockchain"])

# Environment variables
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "nirbhaya_db")
BLOCKCHAIN_RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:7545")
RELAYER_PRIVATE_KEY = os.getenv("RELAYER_PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("INCIDENT_REGISTRY_CONTRACT_ADDRESS")

# MongoDB setup
mongo_client = AsyncIOMotorClient(MONGODB_URL)
db = mongo_client[MONGODB_DB]
incidents_collection = db["incidents"]

# Web3 setup
w3 = Web3(Web3.HTTPProvider(BLOCKCHAIN_RPC_URL))
relayer_account = Account.from_key(RELAYER_PRIVATE_KEY) if RELAYER_PRIVATE_KEY else None

# Contract ABI
CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "_imageCID", "type": "string"},
            {"internalType": "string", "name": "_metadataCID", "type": "string"},
            {"internalType": "bytes32", "name": "_combinedHash", "type": "bytes32"},
            {"internalType": "address", "name": "_reporter", "type": "address"}
        ],
        "name": "submitIncident",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_incidentId", "type": "uint256"}],
        "name": "getIncident",
        "outputs": [
            {"internalType": "string", "name": "imageCID", "type": "string"},
            {"internalType": "string", "name": "metadataCID", "type": "string"},
            {"internalType": "bytes32", "name": "combinedHash", "type": "bytes32"},
            {"internalType": "address", "name": "reporter", "type": "address"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "bool", "name": "verified", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "incidentCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI) if CONTRACT_ADDRESS else None


# Helper Functions
async def verify_incident_with_ai(image_bytes: bytes, title: str, description: str, severity: str) -> dict:
    """
    Verify if the uploaded image matches the reported incident context using Gemini AI.
    Returns: {
        "is_valid": bool,
        "context_matches": bool,
        "reason": str,
        "confidence": str,
        "suggested_title": str (if mismatch),
        "suggested_description": str (if mismatch),
        "suggested_severity": str (if mismatch),
        "detected_incident_type": str
    }
    """
    if not gemini_model:
        # AI verification disabled - allow all submissions
        return {
            "is_valid": True,
            "context_matches": True,
            "reason": "AI verification disabled (GEMINI_API_KEY not set)",
            "confidence": "N/A"
        }
    
    try:
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Create verification prompt with context matching
        prompt = f"""You are an AI safety inspector for a women's safety app called NIRBHAYA.

TASK 1: Analyze this image and identify what type of incident/situation it shows.
TASK 2: Compare your analysis with the user's provided context to check if they match.

USER'S PROVIDED CONTEXT:
- Title: {title}
- Description: {description}
- Severity Level: {severity}

VALID INCIDENT TYPES (for women's safety app):
1. Harassment/Assault - Any form of harassment, stalking, or assault
2. Unsafe Area - Dark alleys, broken streetlights, deserted places, poorly lit areas
3. Suspicious Activity - Suspicious individuals, unusual behavior, potential threats
4. Vehicle Accident - Car accidents, road incidents, traffic hazards
5. Infrastructure Hazard - Broken roads, unsafe buildings, construction dangers
6. Emergency Situation - Medical emergencies, fire, natural disasters
7. Crime Scene - Theft, vandalism, violence (but NOT graphic content)
8. Public Safety Issue - Overcrowding, protests, unsafe gatherings

INVALID SUBMISSIONS:
- Random selfies or personal photos
- Food, pets, nature scenery (unless showing a hazard)
- Screenshots of text or social media
- Memes, jokes, or unrelated content
- Graphic violent/explicit content

INSTRUCTIONS:
1. First, determine what the image ACTUALLY shows
2. Then check if the user's title/description MATCHES what you see
3. If there's a MISMATCH (e.g., user says "murder" but image shows "car accident"), provide corrections

Respond in JSON format:
{{
    "is_valid": true/false (is this a valid safety incident image?),
    "context_matches": true/false (does user's description match the image?),
    "detected_incident_type": "What the image actually shows",
    "reason": "Brief explanation of your decision",
    "confidence": "high/medium/low",
    "suggested_title": "Corrected title if mismatch, otherwise null",
    "suggested_description": "Corrected description if mismatch, otherwise null",
    "suggested_severity": "Corrected severity (Low/Medium/High/Critical) if needed, otherwise null"
}}

EXAMPLE MISMATCH:
- User says: "Murder scene" but image shows a car accident
- Response: is_valid=true, context_matches=false, suggested_title="Vehicle Accident", suggested_description="Car accident/collision incident"

Be helpful and suggest accurate corrections when the image doesn't match the description."""
        
        # Generate AI response
        response = gemini_model.generate_content([prompt, image])
        response_text = response.text.strip()
        
        # Parse JSON response
        # Remove markdown code blocks if present
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(response_text)
        
        print(f"\n🤖 AI Verification Result:")
        print(f"   Valid Image: {result.get('is_valid', False)}")
        print(f"   Context Matches: {result.get('context_matches', False)}")
        print(f"   Detected Type: {result.get('detected_incident_type', 'Unknown')}")
        print(f"   Reason: {result.get('reason', 'No reason provided')}")
        print(f"   Confidence: {result.get('confidence', 'unknown')}")
        if not result.get('context_matches', True):
            print(f"   📝 Suggested Title: {result.get('suggested_title', 'N/A')}")
            print(f"   📝 Suggested Description: {result.get('suggested_description', 'N/A')}")
            print(f"   📝 Suggested Severity: {result.get('suggested_severity', 'N/A')}")
        print()
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"⚠️ AI response parsing error: {e}")
        print(f"   Raw response: {response_text[:200]}...")
        # If AI fails to parse, default to allowing submission with warning
        return {
            "is_valid": True,
            "context_matches": True,
            "reason": "AI verification inconclusive - manual review recommended",
            "confidence": "low"
        }
    except Exception as e:
        print(f"❌ AI verification error: {str(e)}")
        # On error, default to allowing submission
        return {
            "is_valid": True,
            "context_matches": True,
            "reason": f"AI verification failed: {str(e)[:50]}",
            "confidence": "error"
        }

def compute_combined_hash(image_bytes: bytes, metadata_dict: dict) -> str:
    """Compute SHA-256 hash of image + metadata"""
    metadata_str = json.dumps(metadata_dict, sort_keys=True)
    metadata_bytes = metadata_str.encode('utf-8')
    combined_buffer = metadata_bytes + image_bytes
    hash_obj = hashlib.sha256()
    hash_obj.update(combined_buffer)
    return hash_obj.hexdigest()


# Pydantic Models
class IncidentMetadata(BaseModel):
    title: str
    description: str
    location: dict  # {lat, lng, address}
    severity: str = "Medium"
    reporter_address: Optional[str] = None


class IncidentResponse(BaseModel):
    success: bool
    incident_id: str
    mongodb_id: str
    combined_hash: str
    blockchain_tx: Optional[str] = None
    blockchain_submitted: bool
    message: str


@router.post("/submit", response_model=IncidentResponse)
async def submit_incident(
    images: List[UploadFile] = File(...),
    title: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),  # JSON string: {"lat": 12.34, "lng": 56.78, "address": "..."}
    severity: str = Form("Medium"),
    reporter_address: str = Form("0x0000000000000000000000000000000000000000")
):
    """
    Submit incident: AI verification + Store in MongoDB + Submit hash to blockchain
    """
    try:
        # Parse location
        location_dict = json.loads(location)
        
        # Step 1: Read and store images
        image_data_list = []
        all_images_bytes = b""
        first_image_bytes = None
        
        for idx, image in enumerate(images):
            image_bytes = await image.read()
            
            # Store first image for AI verification
            if idx == 0:
                first_image_bytes = image_bytes
            
            # Convert to base64 for MongoDB storage
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            image_data_list.append({
                "filename": image.filename,
                "data": image_base64,
                "content_type": image.content_type
            })
            all_images_bytes += image_bytes
        
        # Step 2: AI VERIFICATION - Validate incident authenticity and context match
        print(f"\n🔍 STEP 2: AI VERIFICATION")
        print(f"   Title: {title}")
        print(f"   Description: {description}")
        print(f"   Severity: {severity}")
        
        ai_result = {"is_valid": True, "context_matches": True, "confidence": "N/A"}
        
        if first_image_bytes:
            ai_result = await verify_incident_with_ai(
                first_image_bytes, 
                title, 
                description, 
                severity
            )
            
            # Reject submission if AI determines it's an invalid image (not a safety incident)
            if not ai_result.get("is_valid", False):
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "INVALID_INCIDENT",
                        "message": "This doesn't appear to be a valid safety incident",
                        "reason": ai_result.get("reason", "Image doesn't match incident criteria"),
                        "confidence": ai_result.get("confidence", "unknown"),
                        "detected_type": ai_result.get("detected_incident_type", "Unknown")
                    }
                )
            
            # Check if context matches - if not, return suggestions for user to edit
            if not ai_result.get("context_matches", True):
                raise HTTPException(
                    status_code=422,  # Unprocessable Entity - valid image but wrong context
                    detail={
                        "error": "CONTEXT_MISMATCH",
                        "message": "The image doesn't match your description. Please review and correct.",
                        "reason": ai_result.get("reason", "Description doesn't match image content"),
                        "detected_type": ai_result.get("detected_incident_type", "Unknown"),
                        "confidence": ai_result.get("confidence", "unknown"),
                        "suggestions": {
                            "title": ai_result.get("suggested_title"),
                            "description": ai_result.get("suggested_description"),
                            "severity": ai_result.get("suggested_severity")
                        }
                    }
                )
            
            print(f"✅ AI Verification PASSED")
            print(f"   Reason: {ai_result.get('reason')}")
            print(f"   Confidence: {ai_result.get('confidence')}")
        
        # Step 3: Create metadata
        metadata = {
            "title": title,
            "description": description,
            "location": location_dict,
            "severity": severity,
            "reporter_address": reporter_address,
            "timestamp": datetime.utcnow().isoformat(),
            "date": datetime.utcnow().strftime("%d %b %Y"),
            "ai_verified": True if first_image_bytes else False,
            "ai_confidence": ai_result.get("confidence", "N/A") if first_image_bytes else "N/A",
            "ai_detected_type": ai_result.get("detected_incident_type", "N/A")
        }
        
        # Step 4: Compute combined hash
        combined_hash = compute_combined_hash(all_images_bytes, metadata)
        
        # Step 5: Store in MongoDB
        incident_doc = {
            "images": image_data_list,
            "metadata": metadata,
            "combined_hash": combined_hash,
            "blockchain_tx": None,
            "blockchain_incident_id": None,
            "created_at": datetime.utcnow()
        }
        
        result = await incidents_collection.insert_one(incident_doc)
        mongodb_id = str(result.inserted_id)
        
        # Step 5: Submit to blockchain (if configured)
        blockchain_tx = None
        blockchain_submitted = False
        blockchain_incident_id = None
        
        print(f"\n🔍 BLOCKCHAIN SUBMISSION CHECK:")
        print(f"   Relayer account: {relayer_account.address if relayer_account else 'NOT SET'}")
        print(f"   Contract address: {CONTRACT_ADDRESS if CONTRACT_ADDRESS else 'NOT SET'}")
        print(f"   Will submit: {bool(relayer_account and contract)}\n")
        
        if relayer_account and contract:
            try:
                print(f"🚀 STARTING BLOCKCHAIN SUBMISSION...")
                # Convert hash to bytes32
                hash_bytes = bytes.fromhex(combined_hash)
                
                # Use MongoDB ID as imageCID and metadataCID (reference to DB)
                nonce = w3.eth.get_transaction_count(relayer_account.address)
                
                tx = contract.functions.submitIncident(
                    mongodb_id,  # Use MongoDB ID as reference
                    mongodb_id,  # Both point to same MongoDB record
                    hash_bytes,
                    Web3.to_checksum_address(reporter_address)
                ).build_transaction({
                    "from": relayer_account.address,
                    "nonce": nonce,
                    "gas": 200000,
                    "gasPrice": w3.eth.gas_price,
                })
                
                signed_tx = w3.eth.account.sign_transaction(tx, relayer_account.key)
                tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
                receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
                
                blockchain_tx = tx_hash.hex()
                blockchain_submitted = True
                
                # Extract incident ID from transaction logs
                # The IncidentSubmitted event has incidentId as first indexed parameter (topics[1])
                try:
                    if receipt['logs']:
                        for log in receipt['logs']:
                            # Check if this log is from our contract
                            if log['address'].lower() == CONTRACT_ADDRESS.lower():
                                # IncidentSubmitted event: topics[0] = event signature, topics[1] = incidentId (indexed)
                                if len(log['topics']) >= 2:
                                    # incidentId is uint256 indexed, stored in topics[1]
                                    blockchain_incident_id = int(log['topics'][1].hex(), 16)
                                    break
                        else:
                            # Fallback: get incidentCount - 1 from contract (just submitted)
                            blockchain_incident_id = contract.functions.incidentCount().call() - 1
                    else:
                        # Fallback: get incidentCount - 1 from contract
                        blockchain_incident_id = contract.functions.incidentCount().call() - 1
                except Exception as id_error:
                    print(f"⚠️  Could not extract incident ID: {id_error}")
                    # Final fallback
                    try:
                        blockchain_incident_id = contract.functions.incidentCount().call() - 1
                    except:
                        blockchain_incident_id = None
                
                print(f"\n{'='*60}")
                print(f"✅ BLOCKCHAIN TX SUCCESSFUL!")
                print(f"{'='*60}")
                print(f"   TX Hash: {blockchain_tx}")
                print(f"   Receipt Status: {receipt['status']}")
                print(f"   Block Number: {receipt['blockNumber']}")
                print(f"   Blockchain Incident ID: {blockchain_incident_id}")
                print(f"   MongoDB ID to update: {result.inserted_id}")
                print(f"{'='*60}\n")
                
                # Update MongoDB with blockchain info
                print(f"🔄 ATTEMPTING MONGODB UPDATE...")
                print(f"   Collection: incidents")
                print(f"   Document ID: {result.inserted_id}")
                print(f"   TX to save: {blockchain_tx}")
                print(f"   Incident ID to save: {blockchain_incident_id}")
                
                try:
                    update_result = await incidents_collection.update_one(
                        {"_id": result.inserted_id},
                        {"$set": {
                            "blockchain_tx": blockchain_tx,
                            "blockchain_submitted": True,
                            "blockchain_incident_id": blockchain_incident_id
                        }}
                    )
                    print(f"\n{'='*60}")
                    print(f"✅ MONGODB UPDATE COMPLETED!")
                    print(f"{'='*60}")
                    print(f"   Matched: {update_result.matched_count}")
                    print(f"   Modified: {update_result.modified_count}")
                    print(f"   Acknowledged: {update_result.acknowledged}")
                    print(f"{'='*60}\n")
                    
                    if update_result.modified_count == 0:
                        print(f"⚠️⚠️⚠️  WARNING: MongoDB document not updated!")
                        print(f"   Document ID: {result.inserted_id}")
                        print(f"   Matched count: {update_result.matched_count}")
                        
                except Exception as update_error:
                    print(f"\n{'='*60}")
                    print(f"❌ MONGODB UPDATE FAILED!")
                    print(f"{'='*60}")
                    print(f"   Error: {update_error}")
                    print(f"   Type: {type(update_error).__name__}")
                    print(f"{'='*60}\n")
                    import traceback
                    traceback.print_exc()
                
            except Exception as e:
                print(f"❌ Blockchain submission failed: {e}")
                print(f"   Error type: {type(e).__name__}")
                print(f"   Contract: {CONTRACT_ADDRESS}")
                print(f"   Relayer: {relayer_account.address if relayer_account else 'None'}")
                import traceback
                traceback.print_exc()
        
        # Log submission result
        print(f"\n📊 Incident Submission Result:")
        print(f"   MongoDB ID: {mongodb_id}")
        print(f"   Combined Hash: {combined_hash[:20]}...")
        print(f"   Blockchain TX: {blockchain_tx if blockchain_tx else 'NOT SUBMITTED'}")
        print(f"   Blockchain Submitted: {blockchain_submitted}")
        
        return IncidentResponse(
            success=True,
            incident_id=mongodb_id,
            mongodb_id=mongodb_id,
            combined_hash=combined_hash,
            blockchain_tx=blockchain_tx,
            blockchain_submitted=blockchain_submitted,
            message="Incident stored in MongoDB" + (" and blockchain" if blockchain_submitted else "")
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit incident: {str(e)}")


@router.get("/list")
async def list_incidents(limit: int = 50, skip: int = 0):
    """Get all incidents from MongoDB"""
    try:
        cursor = incidents_collection.find().sort("created_at", -1).skip(skip).limit(limit)
        incidents = []
        
        async for doc in cursor:
            # Convert images to data URLs for display
            images = []
            for img in doc.get("images", []):
                images.append(f"data:{img['content_type']};base64,{img['data']}")
            
            incident = {
                "id": str(doc["_id"]),
                "_id": str(doc["_id"]),
                "metadata": doc["metadata"],
                "images": images,  # Include images in list view
                "combined_hash": doc.get("combined_hash"),
                "blockchain_tx": doc.get("blockchain_tx"),
                "blockchain_submitted": doc.get("blockchain_submitted", False),
                "blockchain_incident_id": doc.get("blockchain_incident_id"),
                "created_at": doc["created_at"].isoformat() if "created_at" in doc else None,
                "timestamp": doc["created_at"].isoformat() if "created_at" in doc else None,
                "image_count": len(images),
                # Include metadata fields at top level for easier access
                "title": doc["metadata"].get("title"),
                "description": doc["metadata"].get("description"),
                "incident_type": doc["metadata"].get("incident_type"),
                "severity": doc["metadata"].get("severity"),
                "address": doc["metadata"].get("address"),
                "location": {
                    "coordinates": [
                        doc["metadata"].get("location", {}).get("lng", 0),
                        doc["metadata"].get("location", {}).get("lat", 0)
                    ],
                    "address": doc["metadata"].get("location", {}).get("address") or doc["metadata"].get("address")
                },
                # Include vote data
                "votes": {
                    "upvotes": doc.get("votes", {}).get("upvotes", 0),
                    "downvotes": doc.get("votes", {}).get("downvotes", 0),
                    "credibility_score": doc.get("votes", {}).get("credibility_score", 100),
                    "total_votes": doc.get("votes", {}).get("upvotes", 0) + doc.get("votes", {}).get("downvotes", 0)
                }
            }
            incidents.append(incident)
        
        return {
            "success": True,
            "count": len(incidents),
            "incidents": incidents
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch incidents: {str(e)}")


@router.get("/{incident_id}")
async def get_incident(incident_id: str):
    """Get single incident with images"""
    try:
        from bson import ObjectId
        
        doc = await incidents_collection.find_one({"_id": ObjectId(incident_id)})
        
        if not doc:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        # Convert images back to viewable format
        images = []
        for img in doc.get("images", []):
            images.append({
                "filename": img["filename"],
                "content_type": img["content_type"],
                "data_url": f"data:{img['content_type']};base64,{img['data']}"
            })
        
        return {
            "success": True,
            "id": str(doc["_id"]),
            "metadata": doc["metadata"],
            "images": images,
            "combined_hash": doc.get("combined_hash"),
            "blockchain_tx": doc.get("blockchain_tx"),
            "created_at": doc["created_at"].isoformat() if "created_at" in doc else None
        }
    
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Incident not found: {str(e)}")


@router.post("/verify/{incident_id}")
async def verify_incident_integrity(incident_id: str):
    """Verify data integrity by recomputing hash"""
    try:
        from bson import ObjectId
        
        doc = await incidents_collection.find_one({"_id": ObjectId(incident_id)})
        
        if not doc:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        # Reconstruct images
        all_images_bytes = b""
        for img in doc.get("images", []):
            image_bytes = base64.b64decode(img["data"])
            all_images_bytes += image_bytes
        
        # Recompute hash
        computed_hash = compute_combined_hash(all_images_bytes, doc["metadata"])
        stored_hash = doc.get("combined_hash")
        
        is_valid = computed_hash == stored_hash
        
        return {
            "valid": is_valid,
            "computed_hash": computed_hash,
            "stored_hash": stored_hash,
            "message": "Data integrity verified ✅" if is_valid else "Data has been tampered with ⚠️"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")


@router.post("/vote/{incident_id}")
async def vote_incident(
    incident_id: str,
    vote_type: str,  # "upvote" or "downvote"
    user_id: str,  # For now, a simple identifier from localStorage
    user_lat: float = None,  # User's latitude for proximity check
    user_lng: float = None,  # User's longitude for proximity check
    max_distance_km: float = 5.0  # Maximum distance allowed to vote
):
    """Vote on an incident's accuracy. Only users within range can vote."""
    from bson import ObjectId
    import math
    
    try:
        # Validate vote type
        if vote_type not in ["upvote", "downvote"]:
            raise HTTPException(status_code=400, detail="Invalid vote type. Use 'upvote' or 'downvote'")
        
        # Find the incident
        doc = await incidents_collection.find_one({"_id": ObjectId(incident_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        # Check proximity if location provided
        if user_lat is not None and user_lng is not None:
            incident_lat = doc["metadata"].get("location", {}).get("lat", 0)
            incident_lng = doc["metadata"].get("location", {}).get("lng", 0)
            
            # Calculate distance using Haversine formula
            R = 6371  # Earth's radius in km
            lat1, lat2 = math.radians(user_lat), math.radians(incident_lat)
            dlat = math.radians(incident_lat - user_lat)
            dlng = math.radians(incident_lng - user_lng)
            
            a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            distance_km = R * c
            
            if distance_km > max_distance_km:
                raise HTTPException(
                    status_code=403, 
                    detail=f"You must be within {max_distance_km}km of the incident to vote. You are {distance_km:.1f}km away."
                )
        
        # Get current votes
        votes = doc.get("votes", {"upvotes": 0, "downvotes": 0, "voters": []})
        voters = votes.get("voters", [])
        
        # Check if user already voted
        existing_vote = next((v for v in voters if v["user_id"] == user_id), None)
        
        if existing_vote:
            if existing_vote["vote_type"] == vote_type:
                raise HTTPException(status_code=400, detail="You have already voted this way")
            
            # Change vote
            if existing_vote["vote_type"] == "upvote":
                votes["upvotes"] = max(0, votes.get("upvotes", 0) - 1)
                votes["downvotes"] = votes.get("downvotes", 0) + 1
            else:
                votes["downvotes"] = max(0, votes.get("downvotes", 0) - 1)
                votes["upvotes"] = votes.get("upvotes", 0) + 1
            
            existing_vote["vote_type"] = vote_type
            existing_vote["voted_at"] = datetime.utcnow().isoformat()
        else:
            # New vote
            if vote_type == "upvote":
                votes["upvotes"] = votes.get("upvotes", 0) + 1
            else:
                votes["downvotes"] = votes.get("downvotes", 0) + 1
            
            voters.append({
                "user_id": user_id,
                "vote_type": vote_type,
                "voted_at": datetime.utcnow().isoformat()
            })
        
        votes["voters"] = voters
        
        # Calculate credibility score (percentage of upvotes)
        total_votes = votes["upvotes"] + votes["downvotes"]
        credibility_score = round((votes["upvotes"] / total_votes) * 100) if total_votes > 0 else 100
        votes["credibility_score"] = credibility_score
        
        # Update the incident
        await incidents_collection.update_one(
            {"_id": ObjectId(incident_id)},
            {"$set": {"votes": votes}}
        )
        
        return {
            "success": True,
            "message": f"{vote_type.capitalize()} recorded successfully",
            "votes": {
                "upvotes": votes["upvotes"],
                "downvotes": votes["downvotes"],
                "credibility_score": credibility_score,
                "total_votes": total_votes
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record vote: {str(e)}")


@router.get("/health/check")
async def health_check():
    """Health check endpoint"""
    try:
        # Test MongoDB connection
        await db.command("ping")
        mongo_status = True
    except:
        mongo_status = False
    
    return {
        "status": "healthy" if mongo_status else "degraded",
        "mongodb_connected": mongo_status,
        "mongodb_url": MONGODB_URL,
        "mongodb_db": MONGODB_DB,
        "blockchain_connected": w3.is_connected() if w3 else False,
        "blockchain_rpc": BLOCKCHAIN_RPC_URL,
        "contract_configured": bool(CONTRACT_ADDRESS),
        "relayer_configured": bool(relayer_account),
        "relayer_address": relayer_account.address if relayer_account else None
    }
