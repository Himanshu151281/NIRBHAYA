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
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
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
    }
]

contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI) if CONTRACT_ADDRESS else None


# Helper Functions
async def verify_incident_with_ai(image_bytes: bytes, title: str, description: str, severity: str) -> dict:
    """
    Verify if the uploaded image is a valid incident using Gemini AI
    Returns: {"is_valid": bool, "reason": str, "confidence": str}
    """
    if not gemini_model:
        # AI verification disabled - allow all submissions
        return {
            "is_valid": True,
            "reason": "AI verification disabled (GEMINI_API_KEY not set)",
            "confidence": "N/A"
        }
    
    try:
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Create verification prompt with context
        prompt = f"""You are an AI safety inspector for a women's safety app called NIRBHAYA.

Analyze this image to determine if it shows a valid safety incident/hazard.

Incident Details:
- Title: {title}
- Description: {description}
- Severity Level: {severity}

Valid incidents include:
- Harassment or assault situations
- Unsafe areas (dark alleys, broken streetlights, deserted places)
- Suspicious activities or individuals
- Accidents or emergency situations
- Infrastructure hazards (broken roads, unsafe buildings)
- Any situation that poses a threat to women's safety

Invalid submissions include:
- Random selfies or personal photos
- Food, pets, nature photos
- Screenshots of text or social media
- Memes or jokes
- Unrelated content

Respond in JSON format:
{{
  "is_valid": true/false,
  "reason": "Brief explanation (max 100 chars)",
  "confidence": "high/medium/low"
}}

Be strict but fair. Consider the context provided in title and description."""
        
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
        print(f"   Valid: {result.get('is_valid', False)}")
        print(f"   Reason: {result.get('reason', 'No reason provided')}")
        print(f"   Confidence: {result.get('confidence', 'unknown')}\n")
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"⚠️ AI response parsing error: {e}")
        print(f"   Raw response: {response_text[:200]}...")
        # If AI fails to parse, default to allowing submission with warning
        return {
            "is_valid": True,
            "reason": "AI verification inconclusive - manual review recommended",
            "confidence": "low"
        }
    except Exception as e:
        print(f"❌ AI verification error: {str(e)}")
        # On error, default to allowing submission
        return {
            "is_valid": True,
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
        
        # Step 2: AI VERIFICATION - Validate incident authenticity
        print(f"\n🔍 STEP 2: AI VERIFICATION")
        print(f"   Title: {title}")
        print(f"   Description: {description}")
        print(f"   Severity: {severity}")
        
        if first_image_bytes:
            ai_result = await verify_incident_with_ai(
                first_image_bytes, 
                title, 
                description, 
                severity
            )
            
            # Reject submission if AI determines it's invalid
            if not ai_result.get("is_valid", False):
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "INVALID_INCIDENT",
                        "message": "Doesn't look like a valid incident",
                        "reason": ai_result.get("reason", "Image doesn't match incident criteria"),
                        "confidence": ai_result.get("confidence", "unknown")
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
            "ai_confidence": ai_result.get("confidence", "N/A") if first_image_bytes else "N/A"
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
                # The submitIncident function returns the incident ID
                try:
                    # Get the transaction receipt and decode the return value
                    tx_receipt = w3.eth.get_transaction_receipt(tx_hash)
                    # For Solidity functions that return values, we need to decode logs
                    # The incident ID is the return value, typically in logs or we can call the contract
                    # Get the latest incident count from the contract (incident IDs are sequential starting from 0)
                    # We'll use the logs to get the exact incident ID
                    if tx_receipt['logs']:
                        # The return value is typically the first log topic or data
                        # For now, we'll use block number and transaction index as a unique identifier
                        blockchain_incident_id = int(receipt['blockNumber']) * 10000 + int(receipt['transactionIndex'])
                    else:
                        blockchain_incident_id = None
                except Exception as id_error:
                    print(f"⚠️  Could not extract incident ID: {id_error}")
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
