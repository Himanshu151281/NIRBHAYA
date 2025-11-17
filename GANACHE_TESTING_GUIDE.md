# 🚀 Quick Ganache Setup for Testing

## Step 1: Install Ganache (2 minutes)

### Option A: Ganache GUI (Recommended - Easier)

1. **Download Ganache:**
   - Go to: https://trufflesuite.com/ganache/
   - Click "Download" for Windows
   - Install the application

2. **Launch Ganache:**
   - Open Ganache application
   - Click **"Quickstart Ethereum"** button
   - You'll see 10 accounts, each with **100 ETH**

3. **Verify it's running:**
   - Check top of window shows: `RPC SERVER: HTTP://127.0.0.1:8545`
   - Port should be **8545**

---

### Option B: Ganache CLI (Command Line)

```bash
# Install globally
npm install -g ganache

# Start Ganache
ganache --port 8545 --chainId 1337
```

You'll see output like:
```
ganache v7.9.1 (@ganache/cli: 0.10.1, @ganache/core: 0.10.1)
Starting RPC server

Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (100 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (100 ETH)
...

Listening on 127.0.0.1:8545
```

---

## Step 2: Update Backend .env (1 minute)

**File:** `D:\Projects\NIRBHAYA\backend\.env`

Add these lines:

```env
# Ganache Local Blockchain
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
INCIDENT_REGISTRY_CONTRACT_ADDRESS=

# IPFS (you still need this - get from web3.storage)
WEB3_STORAGE_TOKEN=your_token_here
```

**Note:** Leave `CONTRACT_ADDRESS` empty for now, we'll fill it after deployment.

---

## Step 3: Install Contract Dependencies (2 minutes)

```bash
cd D:\Projects\NIRBHAYA\contracts
npm install
```

This installs Hardhat and all contract dependencies.

---

## Step 4: Deploy Contract to Ganache (1 minute)

```bash
# Make sure Ganache is running first!
npm run deploy:local
```

**You'll see output like:**

```
🚀 Deploying to LOCAL Ganache blockchain...

📝 Deployment Details:
   Deployer address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   Deployer balance: 100.0 ETH
   Relayer address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
   Network: localhost
   Chain ID: 1337

📦 Deploying IncidentRegistry contract...
✅ IncidentRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

======================================================================
📋 COPY THIS TO YOUR backend/.env FILE:
======================================================================
# Local Ganache Configuration (Development)
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
INCIDENT_REGISTRY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
======================================================================
```

**Copy the contract address!**

---

## Step 5: Update .env with Contract Address

**File:** `D:\Projects\NIRBHAYA\backend\.env`

```env
# Update this line with your deployed contract address
INCIDENT_REGISTRY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Your complete `.env` should now look like:

```env
# Existing
GEMINI_API_KEY=your_gemini_key_here

# IPFS
WEB3_STORAGE_TOKEN=your_web3_storage_token_here

# Ganache Blockchain
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
INCIDENT_REGISTRY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

---

## Step 6: Start Backend (30 seconds)

```bash
cd D:\Projects\NIRBHAYA\backend
uvicorn main:app --reload --port 8000
```

**Check it works:**
- Open: http://localhost:8000/docs
- You should see IPFS endpoints listed

---

## Step 7: Test the Setup (1 minute)

```bash
cd D:\Projects\NIRBHAYA\backend
python test_ipfs_endpoints.py
```

**Expected output:**

```
✅ Backend is running
✅ Image uploaded successfully!
   CID: bafybeiabc123...
   Gateway URL: https://w3s.link/ipfs/bafybeiabc123...
✅ Metadata uploaded successfully!
   CID: bafybeiabc456...
⛓️ Blockchain submission successful!
   Transaction Hash: 0x1234567890abcdef...
   Block Number: 3
   Gas Used: 123456
   Incident ID: 1
```

---

## 🎉 Verify in Ganache GUI

If using Ganache GUI, you'll see:

1. **Blocks Tab:**
   - New blocks created
   - Block #1, #2, #3...

2. **Transactions Tab:**
   - Contract deployment transaction
   - Contract interaction transactions
   - Gas used for each

3. **Contracts Tab:**
   - Your IncidentRegistry contract
   - Address: 0x5FbDB2...

4. **Logs Tab:**
   - Event logs from contract
   - "IncidentSubmitted" events

---

## 🔄 Reset Ganache (If Needed)

### GUI:
- Click trash icon (top right)
- Click "Restart" or "Quickstart"
- **Important:** You'll need to redeploy the contract!

### CLI:
- Press `Ctrl+C` to stop
- Run `ganache --port 8545 --chainId 1337` again
- **Important:** Redeploy contract after reset

---

## 🐛 Troubleshooting

### "Cannot connect to blockchain at http://127.0.0.1:8545"

**Check if Ganache is running:**
```bash
Test-NetConnection -ComputerName 127.0.0.1 -Port 8545 -InformationLevel Quiet
```

Should return `True`. If `False`:
- Ganache is not running
- Start Ganache GUI or CLI

---

### "Error: could not detect network"

**Solutions:**
1. Make sure Ganache is running
2. Check port is 8545
3. Restart Ganache
4. Try deploying again

---

### "Nonce too high" error

**Solution:**
- Ganache was restarted but backend still thinks it has old state
- Restart your backend: `Ctrl+C` then start again
- Or reset Ganache and redeploy

---

### Contract deployment fails

**Check:**
1. Ganache is running on port 8545
2. Run: `cd contracts && npm install`
3. Try: `npx hardhat compile` first
4. Then: `npm run deploy:local`

---

## 📊 What You Get with Ganache

✅ **10 accounts** with 100 ETH each  
✅ **Instant mining** (0ms block time)  
✅ **Unlimited transactions** (no faucet needed)  
✅ **Full blockchain explorer** (in GUI)  
✅ **Transaction history** (see all contract calls)  
✅ **Event logs** (debug easily)  
✅ **Free reset** (restart anytime)  

---

## 🎯 Quick Commands Cheat Sheet

```bash
# Start Ganache (choose one)
# GUI: Click "Quickstart"
# CLI:
ganache --port 8545 --chainId 1337

# Deploy contract
cd D:\Projects\NIRBHAYA\contracts
npm run deploy:local

# Start backend
cd D:\Projects\NIRBHAYA\backend
uvicorn main:app --reload --port 8000

# Test endpoints
cd D:\Projects\NIRBHAYA\backend
python test_ipfs_endpoints.py

# Start frontend
cd D:\Projects\NIRBHAYA\self\app
npm run dev
```

---

## ✨ You're Ready!

Once all steps are complete:
- ✅ Ganache blockchain running locally
- ✅ Smart contract deployed
- ✅ Backend connected to Ganache
- ✅ Unlimited free transactions
- ✅ Instant testing

**Now you can test the full IPFS + Blockchain flow without any faucet limits!** 🚀

---

## Next: Frontend Integration

After backend is working, update the frontend to call these endpoints:
- `POST /api/ipfs/submit-incident-complete` - Submit full incident
- `GET /api/ipfs/incident/{id}` - Retrieve from blockchain

See `frontend_integration_snippet.tsx` for code!
