"""
IPFS & Blockchain Integration for Incident Reporting
Endpoints for uploading images/metadata to Web3.Storage and storing CIDs on Sepolia
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import httpx
from web3 import Web3
from eth_account import Account
import time
import hashlib
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/ipfs", tags=["IPFS & Blockchain"])

# Environment variables
WEB3_STORAGE_TOKEN = os.getenv("WEB3_STORAGE_TOKEN")
BLOCKCHAIN_RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")  # Default to Ganache
RELAYER_PRIVATE_KEY = os.getenv("RELAYER_PRIVATE_KEY")  # Server wallet that pays gas
CONTRACT_ADDRESS = os.getenv("INCIDENT_REGISTRY_CONTRACT_ADDRESS")

# Web3 setup
w3 = Web3(Web3.HTTPProvider(BLOCKCHAIN_RPC_URL))
relayer_account = Account.from_key(RELAYER_PRIVATE_KEY) if RELAYER_PRIVATE_KEY else None

# Contract ABI (minimal for submitIncident function)
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
def compute_combined_hash(image_bytes: bytes, metadata_dict: dict) -> str:
    """
    Compute SHA-256 hash of combined image binary data + metadata JSON.
    This creates a unique, immutable fingerprint of the entire content.
    
    Args:
        image_bytes: Binary image data
        metadata_dict: Metadata dictionary
    
    Returns:
        Hex string of SHA-256 hash
    """
    # Serialize metadata to JSON string (deterministic order)
    metadata_str = json.dumps(metadata_dict, sort_keys=True)
    metadata_bytes = metadata_str.encode('utf-8')
    
    # Concatenate metadata + image binary
    combined_buffer = metadata_bytes + image_bytes
    
    # Compute SHA-256 hash
    hash_obj = hashlib.sha256()
    hash_obj.update(combined_buffer)
    
    return hash_obj.hexdigest()


# Pydantic Models


class IncidentMetadata(BaseModel):
    """Metadata structure for incident reports"""
    title: str
    description: str
    location: dict  # {lat, lng, address}
    images: List[str]  # Array of IPFS CIDs
    severity: str  # High, Medium, Low
    timestamp: int
    date: str
    reporter_address: Optional[str] = None  # User's wallet address (optional)


class IPFSUploadResponse(BaseModel):
    cid: str
    gateway_url: str


class BlockchainSubmitResponse(BaseModel):
    success: bool
    incident_id: int
    tx_hash: str
    image_cid: str
    metadata_cid: str
    explorer_url: str


async def upload_to_web3storage(file_bytes: bytes, filename: str) -> str:
    """
    Upload file to Web3.Storage and return CID
    """
    if not WEB3_STORAGE_TOKEN:
        raise HTTPException(status_code=500, detail="Web3.Storage token not configured")
    
    async with httpx.AsyncClient() as client:
        files = {"file": (filename, file_bytes)}
        headers = {"Authorization": f"Bearer {WEB3_STORAGE_TOKEN}"}
        
        response = await client.post(
            "https://api.web3.storage/upload",
            files=files,
            headers=headers,
            timeout=60.0
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Web3.Storage upload failed: {response.text}"
            )
        
        data = response.json()
        return data["cid"]


@router.post("/upload-image", response_model=IPFSUploadResponse)
async def upload_image_to_ipfs(
    image: UploadFile = File(..., description="Image file (jpg/png/webp, max 10MB)")
):
    """
    Upload a single image to IPFS via Web3.Storage
    Returns: CID and gateway URL
    """
    # Validate file size (10MB limit)
    MAX_SIZE = 10 * 1024 * 1024
    contents = await image.read()
    
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    try:
        cid = await upload_to_web3storage(contents, image.filename or "incident_image.jpg")
        
        return IPFSUploadResponse(
            cid=cid,
            gateway_url=f"https://w3s.link/ipfs/{cid}"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"IPFS upload failed: {str(e)}")


@router.post("/upload-metadata", response_model=IPFSUploadResponse)
async def upload_metadata_to_ipfs(metadata: IncidentMetadata):
    """
    Upload incident metadata JSON to IPFS
    Returns: CID and gateway URL
    """
    try:
        # Convert metadata to JSON bytes
        metadata_json = metadata.model_dump_json(indent=2)
        metadata_bytes = metadata_json.encode("utf-8")
        
        cid = await upload_to_web3storage(metadata_bytes, "metadata.json")
        
        return IPFSUploadResponse(
            cid=cid,
            gateway_url=f"https://w3s.link/ipfs/{cid}"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metadata upload failed: {str(e)}")


@router.post("/submit-to-blockchain", response_model=BlockchainSubmitResponse)
async def submit_incident_to_blockchain(
    image_cid: str = Form(..., description="IPFS CID of the image"),
    metadata_cid: str = Form(..., description="IPFS CID of the metadata JSON"),
    reporter_address: str = Form(..., description="User's Ethereum address (0x...)")
):
    """
    Submit incident CIDs to blockchain using server-signed meta-transaction
    The backend wallet pays gas fees on behalf of the user
    """
    if not relayer_account:
        raise HTTPException(status_code=500, detail="Relayer wallet not configured")
    
    if not contract:
        raise HTTPException(status_code=500, detail="Smart contract not configured")
    
    # Validate Ethereum address
    if not Web3.is_address(reporter_address):
        raise HTTPException(status_code=400, detail="Invalid Ethereum address")
    
    try:
        # Build transaction
        nonce = w3.eth.get_transaction_count(relayer_account.address)
        
        # Estimate gas
        gas_estimate = contract.functions.submitIncident(
            image_cid,
            metadata_cid,
            Web3.to_checksum_address(reporter_address)
        ).estimate_gas({"from": relayer_account.address})
        
        # Build transaction
        tx = contract.functions.submitIncident(
            image_cid,
            metadata_cid,
            Web3.to_checksum_address(reporter_address)
        ).build_transaction({
            "from": relayer_account.address,
            "nonce": nonce,
            "gas": int(gas_estimate * 1.2),  # 20% buffer
            "gasPrice": w3.eth.gas_price,
        })
        
        # Sign transaction
        signed_tx = w3.eth.account.sign_transaction(tx, relayer_account.key)
        
        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for receipt (with timeout)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        if receipt["status"] != 1:
            raise Exception("Transaction failed")
        
        # Parse logs to get incident ID
        logs = contract.events.IncidentSubmitted().process_receipt(receipt)
        incident_id = logs[0]["args"]["incidentId"] if logs else 0
        
        return BlockchainSubmitResponse(
            success=True,
            incident_id=incident_id,
            tx_hash=tx_hash.hex(),
            image_cid=image_cid,
            metadata_cid=metadata_cid,
            explorer_url=f"https://sepolia.etherscan.io/tx/{tx_hash.hex()}"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Blockchain submission failed: {str(e)}"
        )


@router.post("/submit-incident-complete")
async def submit_incident_complete(
    image: UploadFile = File(...),
    metadata: str = Form(..., description="JSON string of metadata")
):
    """
    Complete workflow: Upload image, upload metadata, submit to blockchain
    All in one endpoint for convenience
    """
    try:
        # Parse metadata
        metadata_obj = IncidentMetadata.model_validate_json(metadata)
        
        # Step 1: Upload image to IPFS
        image_bytes = await image.read()
        image_cid = await upload_to_web3storage(image_bytes, image.filename or "incident.jpg")
        
        # Step 2: Add image CID to metadata
        if image_cid not in metadata_obj.images:
            metadata_obj.images.append(image_cid)
        
        # Step 3: Compute combined hash of image + metadata
        metadata_dict = metadata_obj.model_dump()
        combined_hash = compute_combined_hash(image_bytes, metadata_dict)
        
        # Step 4: Upload metadata to IPFS
        metadata_json = metadata_obj.model_dump_json(indent=2)
        metadata_bytes = metadata_json.encode("utf-8")
        metadata_cid = await upload_to_web3storage(metadata_bytes, "metadata.json")
        
        # Step 5: Submit to blockchain
        reporter_addr = metadata_obj.reporter_address or "0x0000000000000000000000000000000000000000"
        
        if not relayer_account or not contract:
            # Return IPFS data only if blockchain not configured
            return {
                "success": True,
                "image_cid": image_cid,
                "metadata_cid": metadata_cid,
                "combined_hash": combined_hash,
                "image_url": f"https://w3s.link/ipfs/{image_cid}",
                "metadata_url": f"https://w3s.link/ipfs/{metadata_cid}",
                "blockchain_submitted": False,
                "message": "IPFS upload successful. Blockchain not configured. Combined hash computed for data integrity."
            }
        
        # Submit to blockchain
        nonce = w3.eth.get_transaction_count(relayer_account.address)
        
        # Convert hex hash to bytes32
        hash_bytes = bytes.fromhex(combined_hash)
        
        tx = contract.functions.submitIncident(
            image_cid,
            metadata_cid,
            hash_bytes,
            Web3.to_checksum_address(reporter_addr)
        ).build_transaction({
            "from": relayer_account.address,
            "nonce": nonce,
            "gas": 200000,
            "gasPrice": w3.eth.gas_price,
        })
        
        signed_tx = w3.eth.account.sign_transaction(tx, relayer_account.key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        logs = contract.events.IncidentSubmitted().process_receipt(receipt)
        incident_id = logs[0]["args"]["incidentId"] if logs else 0
        
        return {
            "success": True,
            "incident_id": incident_id,
            "image_cid": image_cid,
            "metadata_cid": metadata_cid,
            "combined_hash": combined_hash,
            "tx_hash": tx_hash.hex(),
            "image_url": f"https://w3s.link/ipfs/{image_cid}",
            "metadata_url": f"https://w3s.link/ipfs/{metadata_cid}",
            "explorer_url": f"https://sepolia.etherscan.io/tx/{tx_hash.hex()}",
            "blockchain_submitted": True,
            "message": "Incident submitted successfully. Combined hash ensures data integrity."
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Complete submission failed: {str(e)}")


@router.get("/incident/{incident_id}")
async def get_incident_from_blockchain(incident_id: int):
    """
    Retrieve incident data from blockchain by ID
    """
    if not contract:
        raise HTTPException(status_code=500, detail="Smart contract not configured")
    
    try:
        incident = contract.functions.getIncident(incident_id).call()
        
        # Convert bytes32 hash to hex string
        combined_hash_hex = incident[2].hex() if isinstance(incident[2], bytes) else str(incident[2])
        
        return {
            "incident_id": incident_id,
            "image_cid": incident[0],
            "metadata_cid": incident[1],
            "combined_hash": combined_hash_hex,
            "reporter": incident[3],
            "timestamp": incident[4],
            "verified": incident[5],
            "image_url": f"https://w3s.link/ipfs/{incident[0]}",
            "metadata_url": f"https://w3s.link/ipfs/{incident[1]}"
        }
    
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Incident not found: {str(e)}")


@router.post("/verify-integrity")
async def verify_data_integrity(
    image: UploadFile = File(...),
    metadata: str = Form(...),
    expected_hash: str = Form(...)
):
    """
    Verify the integrity of image + metadata by recomputing the combined hash.
    Returns True if data hasn't been tampered with.
    
    This allows anyone to verify that the data matches what was originally submitted.
    """
    try:
        # Read image
        image_bytes = await image.read()
        
        # Parse metadata
        metadata_dict = json.loads(metadata)
        
        # Recompute hash
        computed_hash = compute_combined_hash(image_bytes, metadata_dict)
        
        # Compare with expected hash
        is_valid = computed_hash == expected_hash
        
        return {
            "valid": is_valid,
            "computed_hash": computed_hash,
            "expected_hash": expected_hash,
            "message": "Data integrity verified ✅" if is_valid else "Data has been tampered with ⚠️"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")


@router.get("/health")
async def health_check():
    """
    Health check endpoint to verify backend configuration
    """
    return {
        "status": "healthy",
        "web3_storage_configured": bool(WEB3_STORAGE_TOKEN),
        "blockchain_connected": w3.is_connected() if w3 else False,
        "blockchain_rpc": BLOCKCHAIN_RPC_URL,
        "contract_configured": bool(CONTRACT_ADDRESS),
        "relayer_configured": bool(relayer_account),
        "relayer_address": relayer_account.address if relayer_account else None
    }
