# MongoDB + Blockchain Setup Guide

## Overview
NIRBHAYA now uses **MongoDB** for data storage instead of IPFS/Web3.Storage:
- **Images**: Stored as base64 in MongoDB
- **Metadata**: Stored in MongoDB documents
- **Blockchain**: Stores combined SHA-256 hash for immutability

## Architecture
```
Frontend (testify page) 
    ↓
POST /api/incidents/submit
    ↓
1. Store images + metadata in MongoDB
2. Compute SHA-256 hash (images + metadata)
3. Submit hash to Ganache blockchain
4. Return MongoDB ID + blockchain TX hash
```

## Prerequisites

### 1. MongoDB Installation (Windows)
```powershell
# Option A: MongoDB Community Server (Local)
# Download from: https://www.mongodb.com/try/download/community
# Install MongoDB with default settings (port 27017)

# Option B: MongoDB Atlas (Cloud - Free Tier)
# 1. Go to https://www.mongodb.com/cloud/atlas/register
# 2. Create free cluster
# 3. Get connection string
```

### 2. Verify MongoDB is Running
```powershell
# Check if MongoDB service is active
Get-Service MongoDB

# Or test connection
Test-NetConnection -ComputerName 127.0.0.1 -Port 27017
```

### 3. Install Python Dependencies
```powershell
cd D:\Projects\NIRBHAYA\backend
pip install -r requirements.txt
```

**New packages added:**
- `motor` - Async MongoDB driver for FastAPI
- `pymongo` - MongoDB Python driver
- `web3` - Blockchain interaction
- `eth-account` - Ethereum account handling

## Environment Configuration

Edit `backend/.env`:
```env
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=nirbhaya_db

# Blockchain Configuration (Ganache)
BLOCKCHAIN_RPC_URL=http://127.0.0.1:7545
RELAYER_PRIVATE_KEY=0x90621a9fb4d91aa27d86e3e8cd0cdee22f31d5fcc3b40e4dfb0d26128e0a85db
INCIDENT_REGISTRY_CONTRACT_ADDRESS=<paste_after_deployment>
```

**For MongoDB Atlas (cloud):**
```env
MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## Database Structure

### Collection: `incidents`
```json
{
  "_id": ObjectId("..."),
  "images": [
    {
      "filename": "evidence1.jpg",
      "content_type": "image/jpeg",
      "data": "base64_encoded_string..."
    }
  ],
  "metadata": {
    "title": "Street Harassment Report",
    "description": "Incident description",
    "location": {
      "lat": 28.6139,
      "lng": 77.2090,
      "address": "Connaught Place, New Delhi"
    },
    "severity": "High",
    "reporter_address": "0x21Bdb...",
    "timestamp": "2025-01-15T10:30:00Z"
  },
  "combined_hash": "abc123...",
  "blockchain_tx": "0xabc123...",
  "created_at": ISODate("2025-01-15T10:30:00Z")
}
```

## Smart Contract Update

The `IncidentRegistry.sol` contract stores:
- `imageCID` → MongoDB document ID
- `metadataCID` → MongoDB document ID (same)
- `combinedHash` → SHA-256 hash (bytes32)

### Deploy to Ganache
```powershell
cd D:\Projects\NIRBHAYA
npm run deploy:local
```

**Copy the contract address** and paste into `.env`:
```env
INCIDENT_REGISTRY_CONTRACT_ADDRESS=0xYourContractAddress
```

## API Endpoints

### 1. Submit Incident
**POST** `/api/incidents/submit`

**Form Data:**
- `images`: File[] - Multiple images
- `title`: string
- `description`: string
- `location`: JSON string - `{"lat": 28.61, "lng": 77.20, "address": "..."}`
- `severity`: string - "Low" | "Medium" | "High"
- `reporter_address`: string - Ethereum address

**Response:**
```json
{
  "success": true,
  "incident_id": "67a3b2c1d4e5f6789012345",
  "mongodb_id": "67a3b2c1d4e5f6789012345",
  "combined_hash": "abc123...",
  "blockchain_tx": "0xabc123...",
  "blockchain_submitted": true,
  "message": "Incident stored in MongoDB and blockchain"
}
```

### 2. List Incidents
**GET** `/api/incidents/list?limit=50&skip=0`

Returns all incidents (without image data for performance).

### 3. Get Single Incident
**GET** `/api/incidents/{incident_id}`

Returns incident with base64 images:
```json
{
  "success": true,
  "id": "67a3b2c1d4e5f6789012345",
  "metadata": {...},
  "images": [
    {
      "filename": "evidence1.jpg",
      "content_type": "image/jpeg",
      "data_url": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    }
  ],
  "combined_hash": "abc123...",
  "blockchain_tx": "0xabc123..."
}
```

### 4. Verify Integrity
**POST** `/api/incidents/verify/{incident_id}`

Recomputes hash and compares with stored value:
```json
{
  "valid": true,
  "computed_hash": "abc123...",
  "stored_hash": "abc123...",
  "message": "Data integrity verified ✅"
}
```

### 5. Health Check
**GET** `/api/incidents/health/check`

```json
{
  "status": "healthy",
  "mongodb_connected": true,
  "mongodb_url": "mongodb://localhost:27017",
  "blockchain_connected": true,
  "contract_configured": true
}
```

## Testing

### 1. Start MongoDB
```powershell
# If installed as service, it auto-starts
# Manual start:
mongod --dbpath C:\data\db
```

### 2. Start Ganache
- Open Ganache GUI
- Verify RPC server: `HTTP://127.0.0.1:7545`

### 3. Start Backend
```powershell
cd D:\Projects\NIRBHAYA\backend
uvicorn main:app --reload --port 8000
```

### 4. Test Health Endpoint
```powershell
curl http://localhost:8000/api/incidents/health/check
```

### 5. Submit Test Incident (PowerShell)
```powershell
$form = @{
    images = Get-Item "C:\test-image.jpg"
    title = "Test Incident"
    description = "Testing MongoDB storage"
    location = '{"lat":28.61,"lng":77.20,"address":"Test Location"}'
    severity = "Medium"
    reporter_address = "0x21Bdb9E006d5b0529b321F9da7979ab8D8F341bf"
}

Invoke-RestMethod -Uri http://localhost:8000/api/incidents/submit -Method Post -Form $form
```

## Migration from IPFS

**Old System** (Web3.Storage IPFS):
- Images stored on IPFS → CID returned
- Metadata stored on IPFS → CID returned
- Blockchain stored both CIDs

**New System** (MongoDB):
- Images stored in MongoDB → ObjectID returned
- Metadata stored in MongoDB → same ObjectID
- Blockchain stores ObjectID + hash

**Preserved Features:**
✅ Combined SHA-256 hash (images + metadata)
✅ Blockchain immutability
✅ Data integrity verification
✅ Gas-free meta-transactions (relayer pays gas)

**Removed Dependencies:**
❌ Web3.Storage token (no longer needed)
❌ IPFS nodes
❌ CID references

## Advantages of MongoDB

1. **Performance**: Faster queries than IPFS HTTP gateways
2. **Simplicity**: No external services needed
3. **Cost**: Free (local) or cheap (Atlas free tier)
4. **Scalability**: GridFS for larger files if needed
5. **Blockchain Integration**: Still maintains immutability via hash storage

## Next Steps

1. ✅ Install MongoDB locally or create Atlas account
2. ✅ Install Python dependencies (`pip install -r requirements.txt`)
3. ✅ Update `.env` with MongoDB connection string
4. ✅ Deploy smart contract to Ganache
5. ✅ Update `.env` with contract address
6. ✅ Start backend server
7. ✅ Test health endpoint
8. ✅ Update frontend to call new endpoints
9. ✅ Submit test incident from testify page

## Troubleshooting

**MongoDB connection failed:**
```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# Start service if stopped
Start-Service MongoDB
```

**Blockchain submission failed:**
- Verify Ganache is running on port 7545
- Check contract address in `.env`
- Verify relayer private key has ETH balance

**Health check shows degraded:**
- Check MongoDB URL in `.env`
- Verify contract is deployed
- Test blockchain RPC: `curl http://127.0.0.1:7545`
