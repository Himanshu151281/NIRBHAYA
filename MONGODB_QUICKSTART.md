# 🚀 NIRBHAYA - MongoDB + Blockchain Quick Start

## ✅ What Changed

**Old System:**
- IPFS (Web3.Storage) for image storage
- Returns CID (Content Identifier)

**New System:**
- MongoDB for image storage
- Returns MongoDB document ID
- **Still maintains blockchain hash for integrity**

## 📋 Prerequisites Checklist

- [x] Python 3.13.9 installed
- [x] Dependencies installed (`motor`, `pymongo`, `web3`)
- [ ] MongoDB installed/running (see below)
- [ ] Ganache running on port 7545
- [ ] Smart contract deployed to Ganache

## 1️⃣ Install MongoDB (Windows)

### Option A: Local MongoDB (Recommended for development)

```powershell
# Download MongoDB Community Server (free)
# https://www.mongodb.com/try/download/community
# Version: 8.0 or higher
# Choose: Windows x64 MSI

# Install with default settings (includes MongoDB Compass GUI)
# Default port: 27017
```

**Verify Installation:**
```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# Expected output:
# Status   Name        DisplayName
# ------   ----        -----------
# Running  MongoDB     MongoDB Server
```

### Option B: MongoDB Atlas (Cloud - Free Tier)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free cluster (512MB storage)
3. Get connection string
4. Update `.env`:
```env
MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## 2️⃣ Start MongoDB (Local)

```powershell
# MongoDB should auto-start as a Windows service
# If not, start it manually:
Start-Service MongoDB

# Test connection
Test-NetConnection -ComputerName 127.0.0.1 -Port 27017
```

**Expected output:**
```
ComputerName     : 127.0.0.1
RemoteAddress    : 127.0.0.1
RemotePort       : 27017
InterfaceAlias   : Loopback Pseudo-Interface 1
SourceAddress    : 127.0.0.1
TcpTestSucceeded : True
```

## 3️⃣ Start Ganache

- Open Ganache GUI
- Click "Quickstart" or open existing workspace
- **Verify RPC Server:** `HTTP://127.0.0.1:7545`

## 4️⃣ Deploy Smart Contract

```powershell
cd D:\Projects\NIRBHAYA
npm run deploy:local
```

**Copy the contract address** from output (looks like `0xABC123...`)

Edit `backend\.env` and paste:
```env
INCIDENT_REGISTRY_CONTRACT_ADDRESS=0xYourContractAddressHere
```

## 5️⃣ Start Backend

```powershell
cd D:\Projects\NIRBHAYA\backend
uvicorn main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     ✅ MongoDB & Blockchain router loaded
```

## 6️⃣ Test Health Endpoint

```powershell
curl http://localhost:8000/api/incidents/health/check
```

**Expected response:**
```json
{
  "status": "healthy",
  "mongodb_connected": true,
  "mongodb_url": "mongodb://localhost:27017",
  "mongodb_db": "nirbhaya_db",
  "blockchain_connected": true,
  "blockchain_rpc": "http://127.0.0.1:7545",
  "contract_configured": true,
  "relayer_configured": true,
  "relayer_address": "0x21Bdb9E006d5b0529b321F9da7979ab8D8F341bf"
}
```

## 7️⃣ Test Incident Submission

Create a test file: `test-incident.ps1`

```powershell
# Test incident submission
$imagePath = "C:\path\to\test-image.jpg"  # Change this

$form = @{
    images = Get-Item $imagePath
    title = "Test Street Harassment"
    description = "Testing MongoDB storage system"
    location = '{"lat":28.6139,"lng":77.2090,"address":"Connaught Place, New Delhi"}'
    severity = "High"
    reporter_address = "0x21Bdb9E006d5b0529b321F9da7979ab8D8F341bf"
}

$response = Invoke-RestMethod -Uri http://localhost:8000/api/incidents/submit -Method Post -Form $form

# Show results
$response | ConvertTo-Json -Depth 5
```

**Run:**
```powershell
.\test-incident.ps1
```

**Expected response:**
```json
{
  "success": true,
  "incident_id": "67a3b2c1d4e5f6789012345",
  "mongodb_id": "67a3b2c1d4e5f6789012345",
  "combined_hash": "abc123def456...",
  "blockchain_tx": "0x789abc...",
  "blockchain_submitted": true,
  "message": "Incident stored in MongoDB and blockchain"
}
```

## 8️⃣ View in MongoDB Compass (Optional)

1. Open MongoDB Compass (installed with MongoDB)
2. Connect to: `mongodb://localhost:27017`
3. Select database: `nirbhaya_db`
4. View collection: `incidents`

You should see your incident with images stored as base64.

## 🔍 Troubleshooting

### MongoDB connection failed

```powershell
# Check service status
Get-Service MongoDB

# If stopped, start it
Start-Service MongoDB

# Check port
Test-NetConnection -ComputerName 127.0.0.1 -Port 27017
```

### Blockchain submission failed

```powershell
# Verify Ganache is running
Test-NetConnection -ComputerName 127.0.0.1 -Port 7545

# Check contract address in .env
cd D:\Projects\NIRBHAYA\backend
cat .env | Select-String "INCIDENT_REGISTRY"
```

### Contract not deployed

```powershell
cd D:\Projects\NIRBHAYA
npm run deploy:local

# Copy output address to .env
```

## 📊 System Architecture

```
Frontend (Next.js)
    ↓
POST /api/incidents/submit
    ↓
Backend (FastAPI)
    ↓
├─ MongoDB → Store images (base64) + metadata → Returns ObjectID
│
└─ Blockchain → Store SHA-256(images + metadata) → Returns TX hash
```

---

**MongoDB storage is now ready! 🎉**
