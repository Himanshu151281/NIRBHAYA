# 🔍 NIRBHAYA Project - Current Status & Missing Items

**Last Updated:** November 17, 2025

---

## ✅ COMPLETED

### Backend
- [x] FastAPI application structure (`backend/main.py`)
- [x] IPFS + Blockchain endpoints (`backend/routes/ipfs_blockchain.py`)
- [x] Smart contract code (`contracts/IncidentRegistry.sol`)
- [x] Deployment scripts (Ganache & Sepolia)
- [x] IPFS/Web3 packages installed (`web3`, `httpx`, `eth_account`)
- [x] Core dependencies installed (`fastapi`, `uvicorn`)

### Frontend
- [x] Next.js application structure
- [x] Testify page exists (`self/app/app/testify/page.tsx`)
- [x] Current implementation uses Pinata IPFS
- [x] MapLibre GL integration for maps

### Documentation
- [x] IPFS_BLOCKCHAIN_SETUP.md (full guide)
- [x] GANACHE_SETUP.md (local blockchain guide)
- [x] QUICKSTART.md (quick start guide)
- [x] frontend_integration_snippet.tsx (updated code)

---

## ❌ MISSING / TODO

### 1. Environment Configuration (.env files)

#### Backend `.env` File Missing:
**Location:** `D:\Projects\NIRBHAYA\backend\.env`

**Current Status:** Only has `OPENAI_API_KEY` (incomplete)

**Required Variables:**
```env
# Gemini API (existing - keep this)
GEMINI_API_KEY=your_gemini_api_key_here

# Web3.Storage IPFS Token (GET THIS!)
WEB3_STORAGE_TOKEN=eyJhbGc...your_token_here

# Blockchain Configuration (Choose Ganache OR Sepolia)

# OPTION 1: Ganache (Local - RECOMMENDED for development)
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
INCIDENT_REGISTRY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# OPTION 2: Sepolia (Testnet - for production testing)
# BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
# RELAYER_PRIVATE_KEY=0xyour_private_key_here
# INCIDENT_REGISTRY_CONTRACT_ADDRESS=0x...
```

**How to Get:**
- ✅ **Web3.Storage Token**: https://web3.storage → Sign up → Account → Create API Token
- ✅ **Ganache Setup**: See `GANACHE_SETUP.md` for full guide

---

#### Contracts `.env` File Missing:
**Location:** `D:\Projects\NIRBHAYA\contracts\.env`

**Status:** ❌ Not created yet

**Required for Sepolia Only (skip for Ganache):**
```env
DEPLOYER_PRIVATE_KEY=0xyour_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

**Note:** For Ganache local development, you DON'T need this file!

---

### 2. Smart Contract Deployment

**Status:** ❌ Not deployed yet

**Action Required:**

#### For Local Development (Ganache):
```bash
# 1. Install Ganache GUI from: https://trufflesuite.com/ganache/
# 2. Click "Quickstart" → Runs on http://127.0.0.1:8545

# 3. Install contract dependencies
cd D:\Projects\NIRBHAYA\contracts
npm install

# 4. Deploy to Ganache
npm run deploy:local

# 5. Copy the output contract address to backend/.env
```

#### For Production Testing (Sepolia):
```bash
# 1. Create contracts/.env with DEPLOYER_PRIVATE_KEY and SEPOLIA_RPC_URL
# 2. Fund wallet with Sepolia ETH from https://sepoliafaucet.com
# 3. Deploy
cd D:\Projects\NIRBHAYA\contracts
npm install
npm run deploy:sepolia

# 4. Copy contract address to backend/.env
```

**Missing File:** `deployed-contracts-local.json` or `deployed-contracts.json`

---

### 3. Backend Dependencies

**Status:** ⚠️ Partially installed

**Check Required:**
```bash
cd D:\Projects\NIRBHAYA\backend
pip install -r requirements_ipfs.txt
```

**Required Packages:**
- ✅ `web3==6.11.3` (installed)
- ✅ `eth-account==0.10.0` (installed)
- ✅ `httpx==0.25.2` (installed)
- ❓ `python-dotenv==1.0.0` (check needed)

**Update `requirements.txt`:**
The main `requirements.txt` is missing IPFS/blockchain packages. Should merge with `requirements_ipfs.txt`

---

### 4. Frontend Integration

**Status:** ❌ Not updated yet

**Current Implementation:**
- Uses **Pinata IPFS** (old approach)
- Does NOT call backend IPFS/blockchain endpoints
- Does NOT show transaction hash or blockchain proof

**Action Required:**
Replace `handleSubmit` function in `self/app/app/testify/page.tsx` with code from:
`frontend_integration_snippet.tsx`

**Key Changes Needed:**
```tsx
// OLD (current):
const response = await pinata.upload.public.file(photo);

// NEW (blockchain-enabled):
const formData = new FormData();
formData.append('image', photo);
const response = await fetch('http://localhost:8000/api/ipfs/upload-image', {
  method: 'POST',
  body: formData
});
```

---

### 5. Hardhat Dependencies

**Status:** ❌ Not installed yet

**Location:** `D:\Projects\NIRBHAYA\contracts\node_modules`

**Action Required:**
```bash
cd D:\Projects\NIRBHAYA\contracts
npm install
```

**This installs:**
- Hardhat
- @nomicfoundation/hardhat-toolbox
- @openzeppelin/contracts
- ethers.js

---

### 6. Ganache Local Blockchain

**Status:** ⚠️ Process running but not configured

**Action Required:**
1. Download Ganache GUI: https://trufflesuite.com/ganache/
2. Launch and click "Quickstart"
3. Verify it's running on `http://127.0.0.1:8545`

**OR Use Ganache CLI:**
```bash
npm install -g ganache
ganache --port 8545 --chainId 1337
```

---

### 7. API Keys & Tokens

**Missing Credentials:**

| Service | Status | Get From |
|---------|--------|----------|
| Web3.Storage Token | ❌ Missing | https://web3.storage |
| Sepolia RPC URL | ⚠️ Optional | https://infura.io or https://alchemy.com |
| Relayer Private Key | ⚠️ Can use Ganache default | Auto-provided by Ganache |
| Contract Address | ❌ Not deployed | Deploy contract first |
| Gemini API Key | ✅ Exists | Already configured |

---

### 8. Backend Server Issues

**Last Command:** `uvicorn main:app --reload--port8000`

**Error:** Exit Code 1 (missing space)

**Correct Command:**
```bash
cd D:\Projects\NIRBHAYA\backend
uvicorn main:app --reload --port 8000
```

**Fix:** Add space between `--reload` and `--port`

---

### 9. Frontend Server Issues

**Last Command:** `n[pm run dev` (typo)

**Correct Command:**
```bash
cd D:\Projects\NIRBHAYA\self\app
npm run dev
```

---

## 🎯 PRIORITY ACTION PLAN

### Phase 1: Get Backend Working (15 min)

1. **Get Web3.Storage Token** (5 min)
   - Go to https://web3.storage
   - Sign up (free)
   - Account → Create API Token
   - Copy token

2. **Update Backend .env** (2 min)
   ```bash
   cd D:\Projects\NIRBHAYA\backend
   notepad .env
   ```
   Add:
   ```env
   WEB3_STORAGE_TOKEN=eyJhbGc...your_token_here
   BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
   RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   INCIDENT_REGISTRY_CONTRACT_ADDRESS=
   ```

3. **Install Dependencies** (5 min)
   ```bash
   pip install -r requirements_ipfs.txt
   ```

4. **Start Backend** (1 min)
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   Check: http://localhost:8000/docs

---

### Phase 2: Deploy Smart Contract (10 min)

1. **Install Ganache** (5 min)
   - Download: https://trufflesuite.com/ganache/
   - Launch → Click "Quickstart"

2. **Install Contract Dependencies** (3 min)
   ```bash
   cd D:\Projects\NIRBHAYA\contracts
   npm install
   ```

3. **Deploy Contract** (2 min)
   ```bash
   npm run deploy:local
   ```
   Copy the contract address output

4. **Update Backend .env**
   Add the contract address:
   ```env
   INCIDENT_REGISTRY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```

5. **Restart Backend**
   ```bash
   cd backend
   # Press Ctrl+C to stop
   uvicorn main:app --reload --port 8000
   ```

---

### Phase 3: Test IPFS + Blockchain (5 min)

```bash
cd D:\Projects\NIRBHAYA\backend
python test_ipfs_endpoints.py
```

**Expected Output:**
```
✅ Backend is running
✅ Image uploaded successfully!
   CID: bafybei...
✅ Metadata uploaded successfully!
   CID: bafybei...
⛓️ Blockchain submission successful!
   Transaction: 0x...
   Block: 3
```

---

### Phase 4: Update Frontend (10 min)

1. **Read Integration Code**
   ```bash
   notepad D:\Projects\NIRBHAYA\frontend_integration_snippet.tsx
   ```

2. **Update Testify Page**
   - Open `self/app/app/testify/page.tsx`
   - Find `handleSubmit` function (line 250)
   - Replace with code from `frontend_integration_snippet.tsx`

3. **Start Frontend**
   ```bash
   cd D:\Projects\NIRBHAYA\self\app
   npm run dev
   ```

4. **Test**
   - Go to http://localhost:3000/testify
   - Upload image + add description
   - Submit → Check for IPFS CID and transaction hash

---

## 📋 COMPLETE CHECKLIST

### Backend
- [ ] Web3.Storage token obtained
- [ ] Backend `.env` file updated with all variables
- [ ] `requirements_ipfs.txt` installed
- [ ] Backend starts without errors (port 8000)
- [ ] Swagger UI accessible at http://localhost:8000/docs

### Smart Contract
- [ ] Ganache installed and running
- [ ] Contract dependencies installed (`npm install`)
- [ ] Contract deployed (`npm run deploy:local`)
- [ ] Contract address copied to `.env`
- [ ] `deployed-contracts-local.json` file exists

### Frontend
- [ ] `handleSubmit` function updated in testify page
- [ ] Frontend starts without errors (port 3000)
- [ ] Can submit incidents and see IPFS CIDs
- [ ] Transaction hash displayed after submission

### Testing
- [ ] `test_ipfs_endpoints.py` passes all tests
- [ ] IPFS gateway URLs open in browser
- [ ] Ganache shows transactions in GUI
- [ ] Incidents stored on blockchain

---

## 🚀 MINIMAL SETUP (Just to See It Work)

**If you just want to test IPFS without blockchain:**

1. Get Web3.Storage token
2. Update `backend/.env`:
   ```env
   WEB3_STORAGE_TOKEN=your_token
   ```
3. Start backend:
   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   ```
4. Test image upload:
   ```bash
   curl -X POST http://localhost:8000/api/ipfs/upload-image -F "image=@/path/to/image.jpg"
   ```

**This works WITHOUT blockchain!** The IPFS endpoints work independently.

---

## 🆘 TROUBLESHOOTING

### "Cannot connect to blockchain at http://127.0.0.1:8545"
**Solution:** Start Ganache GUI or `ganache --port 8545`

### "WEB3_STORAGE_TOKEN is not set"
**Solution:** Get token from https://web3.storage and add to `.env`

### "Module 'web3' not found"
**Solution:** `pip install -r requirements_ipfs.txt`

### "Contract not deployed"
**Solution:** Run `npm run deploy:local` in contracts folder

### Backend exit code 1
**Solution:** Check command syntax: `uvicorn main:app --reload --port 8000` (note the space!)

---

## 📚 Documentation Files

- **QUICKSTART.md** - 5-minute setup guide
- **GANACHE_SETUP.md** - Complete Ganache local blockchain guide
- **IPFS_BLOCKCHAIN_SETUP.md** - Full system documentation (400+ lines)
- **frontend_integration_snippet.tsx** - Updated frontend code
- **.env.example** - Environment variable template
- **PROJECT_STATUS.md** - This file

---

## ✨ Next Step

**Start with Phase 1!** Get the Web3.Storage token and update `.env` file. That's the foundation for everything else.

See `QUICKSTART.md` for step-by-step instructions! 🎉
