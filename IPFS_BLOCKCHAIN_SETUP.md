# IPFS + Blockchain Integration for NIRBHAYA

## 🎯 Overview

This system enables **decentralized, tamper-proof incident reporting** using:
- **IPFS (Web3.Storage)**: Decentralized storage for images and metadata
- **Ethereum Sepolia**: Blockchain for immutable CID references
- **Meta-transactions**: Server pays gas fees (users don't need ETH)

## 📋 Architecture

```
User uploads incident → FastAPI backend → IPFS (Web3.Storage) → Blockchain (Sepolia)
                                ↓                    ↓                 ↓
                         Image/Metadata CIDs    Stored on IPFS    CIDs on-chain
```

**Flow:**
1. User fills incident form (description, location, photos)
2. Backend uploads image to IPFS → gets `imageCID`
3. Backend uploads metadata JSON to IPFS → gets `metadataCID`
4. Backend submits transaction to Sepolia (server wallet pays gas)
5. Smart contract stores CIDs, reporter address, timestamp
6. User gets transaction hash + IPFS links

---

## 🚀 Quick Start

### Step 1: Install Dependencies

**Backend (Python):**
```bash
cd backend
pip install -r requirements.txt
pip install -r requirements_ipfs.txt
```

**Smart Contracts (Node.js):**
```bash
cd contracts
npm install
```

### Step 2: Get API Keys & Credentials

#### A. Web3.Storage (Free IPFS)
1. Go to https://web3.storage
2. Sign up (free account gives 5GB storage)
3. Click "Account" → "Create API Token"
4. Copy token

#### B. Sepolia RPC (Free)
**Option 1: Infura**
1. Go to https://infura.io
2. Sign up → Create Project
3. Copy Sepolia endpoint: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

**Option 2: Alchemy**
1. Go to https://alchemy.com
2. Create app → Select "Sepolia"
3. Copy HTTP endpoint

#### C. Create Relayer Wallet
```bash
python -c "from eth_account import Account; acc = Account.create(); print(f'Address: {acc.address}\nPrivate Key: {acc.key.hex()}')"
```

Save the **private key** (keep secret!) and **address**.

#### D. Fund Relayer Wallet with Sepolia ETH
1. Go to https://sepoliafaucet.com or https://sepolia-faucet.pk910.de
2. Paste your relayer address
3. Request testnet ETH (0.5 ETH is enough for ~1000 transactions)

### Step 3: Configure Environment

**Copy and edit `.env.example`:**
```bash
cd backend
cp .env.example .env
nano .env  # or use any text editor
```

**Fill in `.env`:**
```env
GEMINI_API_KEY=your_existing_gemini_key

WEB3_STORAGE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
RELAYER_PRIVATE_KEY=0xabcdef1234567890...
INCIDENT_REGISTRY_CONTRACT_ADDRESS=  # Leave empty for now
```

### Step 4: Deploy Smart Contract

```bash
cd contracts

# Add deployer private key to contracts/.env
echo "DEPLOYER_PRIVATE_KEY=0xyour_private_key" >> .env
echo "SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id" >> .env

# Compile contract
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy_incident_registry.js --network sepolia
```

**Output:**
```
✅ IncidentRegistry deployed to: 0x1234567890abcdef...
📋 Relayer address set to: 0xabcdef...
```

**Copy the contract address** and add to `backend/.env`:
```env
INCIDENT_REGISTRY_CONTRACT_ADDRESS=0x1234567890abcdef...
```

### Step 5: Verify Contract (Optional but Recommended)

Get Etherscan API key: https://etherscan.io/myapikey

```bash
echo "ETHERSCAN_API_KEY=your_etherscan_key" >> .env

npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <RELAYER_ADDRESS>
```

### Step 6: Start Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Visit: http://localhost:8000/docs

### Step 7: Test Endpoints

**Swagger UI:** http://localhost:8000/docs

**Test upload (cURL):**
```bash
# Upload image
curl -X POST http://localhost:8000/api/ipfs/upload-image \
  -F "image=@/path/to/test_image.jpg"

# Output: {"cid":"bafybei...","gateway_url":"https://w3s.link/ipfs/bafybei..."}
```

---

## 📡 API Endpoints

### 1. Upload Image to IPFS
```http
POST /api/ipfs/upload-image
Content-Type: multipart/form-data

File: image (jpg/png/webp, max 10MB)

Response:
{
  "cid": "bafybeiabc123...",
  "gateway_url": "https://w3s.link/ipfs/bafybeiabc123..."
}
```

### 2. Upload Metadata to IPFS
```http
POST /api/ipfs/upload-metadata
Content-Type: application/json

Body:
{
  "title": "Incident at MG Road",
  "description": "Harassment incident reported...",
  "location": {
    "lat": 28.6139,
    "lng": 77.2090,
    "address": "MG Road, New Delhi"
  },
  "images": ["bafybeiabc123..."],
  "severity": "High",
  "timestamp": 1700000000000,
  "date": "15 Nov 2025",
  "reporter_address": "0x1234..." (optional)
}

Response:
{
  "cid": "bafybeimeta456...",
  "gateway_url": "https://w3s.link/ipfs/bafybeimeta456..."
}
```

### 3. Submit to Blockchain (Meta-transaction)
```http
POST /api/ipfs/submit-to-blockchain
Content-Type: application/x-www-form-urlencoded

Body:
image_cid=bafybeiabc123...
metadata_cid=bafybeimeta456...
reporter_address=0x1234...

Response:
{
  "success": true,
  "incident_id": 0,
  "tx_hash": "0xabcdef...",
  "image_cid": "bafybeiabc123...",
  "metadata_cid": "bafybeimeta456...",
  "explorer_url": "https://sepolia.etherscan.io/tx/0xabcdef..."
}
```

### 4. Complete Workflow (All-in-One)
```http
POST /api/ipfs/submit-incident-complete
Content-Type: multipart/form-data

File: image
Field: metadata (JSON string)

Response:
{
  "success": true,
  "incident_id": 0,
  "image_cid": "bafybeiabc123...",
  "metadata_cid": "bafybeimeta456...",
  "tx_hash": "0xabcdef...",
  "image_url": "https://w3s.link/ipfs/bafybeiabc123...",
  "metadata_url": "https://w3s.link/ipfs/bafybeimeta456...",
  "explorer_url": "https://sepolia.etherscan.io/tx/0xabcdef...",
  "blockchain_submitted": true
}
```

### 5. Retrieve Incident from Blockchain
```http
GET /api/ipfs/incident/{incident_id}

Response:
{
  "incident_id": 0,
  "image_cid": "bafybeiabc123...",
  "metadata_cid": "bafybeimeta456...",
  "reporter": "0x1234...",
  "timestamp": 1700000000,
  "verified": false,
  "image_url": "https://w3s.link/ipfs/bafybeiabc123...",
  "metadata_url": "https://w3s.link/ipfs/bafybeimeta456..."
}
```

---

## 🔧 Frontend Integration

Update `app/testify/page.tsx` to use new backend:

```typescript
const handleSubmit = async () => {
  // ... existing validation ...

  try {
    setIsLoading(true);

    // Prepare metadata
    const metadata = {
      title: description.substring(0, 50),
      description: description,
      location: {
        lat: location.lat,
        lng: location.lng,
        address: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
      },
      images: [],
      severity: "Medium",
      timestamp: Date.now(),
      date: new Date().toLocaleDateString(),
      reporter_address: "0x0000000000000000000000000000000000000000" // Or from wallet
    };

    // Upload first photo using complete workflow
    const formData = new FormData();
    formData.append('image', photos[0]);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await fetch('http://localhost:8000/api/ipfs/submit-incident-complete', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      alert(`✅ Incident submitted!
      
📸 Image: ${data.image_url}
📋 Metadata: ${data.metadata_url}
⛓️ Transaction: ${data.explorer_url}
      `);
      
      // Save to local storage with blockchain data
      const reportData = {
        ...metadata,
        id: data.incident_id,
        tx_hash: data.tx_hash,
        image_cid: data.image_cid,
        metadata_cid: data.metadata_cid
      };
      
      const existingReports = JSON.parse(localStorage.getItem("incident_reports") || "[]");
      existingReports.unshift(reportData);
      localStorage.setItem("incident_reports", JSON.stringify(existingReports));
      
      router.push("/");
    }

  } catch (err) {
    console.error("❌ Error:", err);
    alert("Failed to submit incident");
  } finally {
    setIsLoading(false);
  }
};
```

---

## 💰 Cost Analysis

### IPFS Storage (Web3.Storage)
- **Free tier**: 5GB storage, unlimited bandwidth
- **Paid**: $0/month for open-source projects
- **Cost per incident**: $0 (free tier covers ~5000 images @ 1MB each)

### Blockchain (Sepolia Testnet)
- **Gas cost per transaction**: ~100,000 gas
- **Sepolia gas price**: 1-2 gwei
- **Cost per incident**: FREE (testnet ETH)
- **Mainnet estimate**: ~$0.30 per incident @ 20 gwei

### Server Costs
- **Relayer wallet funding**: One-time 0.5 ETH (testnet) = FREE
- **Backend hosting**: $5-10/month (DigitalOcean, Render.com)

**Total cost for 1000 incidents on testnet**: **$0** ✅

---

## 🔒 Security Considerations

### 1. Relayer Private Key
- ✅ Store in `.env` (never commit to git)
- ✅ Use environment variables in production
- ✅ Rotate keys periodically
- ✅ Monitor wallet balance

### 2. Rate Limiting
Add rate limiting to prevent abuse:
```python
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/submit-incident-complete")
@limiter.limit("10/minute")  # Max 10 uploads per minute
async def submit_incident_complete(request: Request, ...):
    ...
```

### 3. File Validation
- ✅ Check file size (max 10MB implemented)
- ✅ Validate MIME types (jpg/png/webp)
- ⚠️ Add virus scanning for production
- ⚠️ Check image dimensions (prevent huge files)

### 4. Sensitive Data
- ❌ Don't store personal info (names, phone numbers) on-chain
- ✅ Encrypt sensitive metadata before IPFS upload
- ✅ Use hashed/anonymized reporter addresses

---

## 📊 Monitoring & Analytics

### Track Gas Usage
```python
# In backend code
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
gas_used = receipt['gasUsed']
gas_price = tx['gasPrice']
cost_wei = gas_used * gas_price
cost_eth = w3.from_wei(cost_wei, 'ether')

print(f"⛽ Gas used: {gas_used}, Cost: {cost_eth} ETH")
```

### Monitor IPFS Pinning
Check Web3.Storage dashboard: https://web3.storage/account

### Blockchain Explorer
View all transactions: https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS

---

## 🛠️ Troubleshooting

### "Module not found: web3"
```bash
pip install web3 eth-account httpx
```

### "Insufficient funds for gas"
Fund relayer wallet: https://sepoliafaucet.com

### "Invalid CID format"
Ensure CID starts with `bafybei` or `Qm` (valid IPFS CID)

### "Transaction failed"
Check:
1. Relayer has enough ETH
2. Contract address is correct
3. RPC endpoint is working
4. Gas limit is sufficient

### "Web3.Storage upload failed"
Check:
1. Token is valid
2. File size < 10MB
3. Network connection
4. Web3.Storage service status

---

## 🚀 Production Deployment

### 1. Use Mainnet
Update `.env`:
```env
SEPOLIA_RPC_URL=https://mainnet.infura.io/v3/your_project_id
# Fund relayer with real ETH
```

### 2. Add Gas Price Optimization
```python
# Use EIP-1559 for lower fees
tx = contract.functions.submitIncident(...).build_transaction({
    "from": relayer_account.address,
    "nonce": nonce,
    "maxFeePerGas": w3.eth.gas_price,
    "maxPriorityFeePerGas": w3.to_wei(1, 'gwei'),
})
```

### 3. Use Database for Incident Tracking
Replace local storage with PostgreSQL/MongoDB to track:
- Incident IDs
- Transaction hashes
- IPFS CIDs
- Upload timestamps

### 4. Add Caching
Cache frequently accessed data:
```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_incident_cached(incident_id: int):
    return contract.functions.getIncident(incident_id).call()
```

---

## 📚 Resources

- **Web3.Storage Docs**: https://web3.storage/docs
- **Sepolia Faucet**: https://sepoliafaucet.com
- **Hardhat Docs**: https://hardhat.org/docs
- **Web3.py Docs**: https://web3py.readthedocs.io
- **IPFS Docs**: https://docs.ipfs.tech

---

## ✅ Checklist

- [ ] Web3.Storage account created
- [ ] API token obtained
- [ ] Sepolia RPC endpoint configured
- [ ] Relayer wallet created & funded
- [ ] Smart contract deployed & verified
- [ ] Backend `.env` configured
- [ ] Dependencies installed
- [ ] API endpoints tested
- [ ] Frontend integrated
- [ ] Documentation reviewed

---

**Need help?** Check API docs at http://localhost:8000/docs or review contract on Sepolia Etherscan.

🎉 **You're all set for decentralized incident reporting!**
