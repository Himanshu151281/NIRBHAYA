# 🏠 Local Development with Ganache

## Why Use Ganache?

✅ **UNLIMITED transactions** (no faucet limits!)  
✅ **Instant mining** (0ms block time)  
✅ **FREE** (no testnet ETH needed)  
✅ **Fast development** (no network delays)  
✅ **Easy debugging** (full blockchain control)  

---

## Quick Start (5 Minutes)

### Option 1: Ganache GUI (Easiest)

1. **Download Ganache**
   - Windows: https://trufflesuite.com/ganache/
   - Install and launch

2. **Start Quickstart Workspace**
   - Click "Quickstart" (Ethereum)
   - Default: `http://127.0.0.1:8545`
   - You get 10 accounts with 100 ETH each!

3. **Deploy Contract**
   ```bash
   cd D:\Projects\NIRBHAYA\contracts
   npm install
   npx hardhat run scripts/deploy_local.js --network localhost
   ```

4. **Copy Output to Backend**
   ```env
   # Copy this to backend/.env
   BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
   RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   INCIDENT_REGISTRY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```

5. **Start Backend & Test**
   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   python test_ipfs_endpoints.py
   ```

---

### Option 2: Ganache CLI (Command Line)

```bash
# Install globally
npm install -g ganache

# Start Ganache
ganache --port 8545 --chainId 1337

# Deploy contract (in another terminal)
cd D:\Projects\NIRBHAYA\contracts
npx hardhat run scripts/deploy_local.js --network localhost
```

---

## Configuration Files

### ✅ Already Updated for You:

1. **`contracts/hardhat.config.js`**
   - Added `localhost` network (Ganache)
   - Port: 8545, Chain ID: 1337

2. **`backend/.env.example`**
   - Added Ganache configuration (Option 1)
   - Sepolia configuration (Option 2)

3. **`backend/routes/ipfs_blockchain.py`**
   - Uses `BLOCKCHAIN_RPC_URL` (works with both)
   - Defaults to Ganache if not set

---

## Default Ganache Accounts

Ganache provides 10 accounts with 100 ETH each:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (Used as Relayer)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

The deployment script automatically uses **Account #1 as the relayer**.

---

## Deployment Output Example

When you run `npx hardhat run scripts/deploy_local.js --network localhost`:

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

📊 Contract State:
   Relayer address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
   Incident count: 0

======================================================================
📋 COPY THIS TO YOUR backend/.env FILE:
======================================================================
# Local Ganache Configuration (Development)
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
INCIDENT_REGISTRY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
======================================================================
```

---

## Testing Workflow

### 1. Start Ganache
```bash
# GUI: Click "Quickstart"
# OR CLI:
ganache --port 8545
```

### 2. Deploy Contract
```bash
cd D:\Projects\NIRBHAYA\contracts
npx hardhat run scripts/deploy_local.js --network localhost
```

### 3. Update Backend .env
```bash
cd D:\Projects\NIRBHAYA\backend
# Edit .env with the deployment output
```

### 4. Start Backend
```bash
uvicorn main:app --reload --port 8000
```

### 5. Run Tests
```bash
python test_ipfs_endpoints.py
```

Expected output:
```
✅ Backend is running
✅ Image uploaded to IPFS: bafybei...
✅ Metadata uploaded to IPFS: bafybei...
⛓️ Blockchain submission successful!
   Transaction: 0x1234...
   Block number: 3
   Gas used: 123456
```

### 6. Check Ganache GUI
- See transaction in "Transactions" tab
- View contract in "Contracts" tab
- Check logs in "Logs" tab

---

## Switching Between Ganache ↔ Sepolia

### For Development (Ganache):
```env
# backend/.env
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
INCIDENT_REGISTRY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### For Production Testing (Sepolia):
```env
# backend/.env
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
RELAYER_PRIVATE_KEY=0xyour_real_private_key_here
INCIDENT_REGISTRY_CONTRACT_ADDRESS=0xYourSepoliaContractAddress
```

**That's it!** No code changes needed. Just update `.env` and restart backend.

---

## Troubleshooting

### "Cannot connect to blockchain at http://127.0.0.1:8545"

**Solution:**
1. Check Ganache is running
2. Verify port is 8545
3. Try `curl http://127.0.0.1:8545` (should return JSON)

### "Error: could not detect network"

**Solution:**
```bash
# Kill any process on port 8545
netstat -ano | findstr :8545
taskkill /PID <PID> /F

# Restart Ganache
ganache --port 8545 --chainId 1337
```

### "Nonce too high"

**Solution:**
- Restart Ganache (resets blockchain)
- Redeploy contract

### Contract address mismatch

**Solution:**
1. Stop Ganache
2. Delete workspace (GUI) or restart CLI
3. Redeploy contract
4. Update `.env` with new address

---

## Ganache vs Sepolia Comparison

| Feature | Ganache (Local) | Sepolia (Testnet) |
|---------|----------------|-------------------|
| **Speed** | ⚡ Instant | 🐌 12 sec blocks |
| **Cost** | 💚 FREE | 💛 Faucet limited |
| **Transactions** | ♾️ Unlimited | 🔢 ~100/day from faucet |
| **Reset** | ✅ Easy | ❌ Can't reset |
| **Debugging** | ✅ Full control | ⚠️ Limited |
| **Internet** | ❌ Not needed | ✅ Required |
| **Public Access** | ❌ Local only | ✅ Public blockchain |
| **Best For** | Development | Testing before mainnet |

---

## Development Workflow Recommendation

1. **Day-to-day development**: Use **Ganache**
   - Fast iteration
   - No faucet hassle
   - Debug easily

2. **Before deployment**: Test on **Sepolia**
   - Verify real network behavior
   - Test with actual block times
   - Final integration test

3. **Production**: Deploy to **Mainnet**
   - Real users
   - Real ETH costs

---

## Advanced: Custom Ganache Config

```bash
# More realistic settings
ganache \
  --port 8545 \
  --chainId 1337 \
  --blockTime 3 \          # 3 second blocks (like real Ethereum)
  --gasLimit 30000000 \    # Higher gas limit
  --accounts 20 \          # More accounts
  --defaultBalanceEther 1000  # More ETH per account
```

---

## 🎉 Benefits Summary

With Ganache, you get:
- ✅ **No faucet limits** - unlimited testing!
- ✅ **Instant feedback** - see results immediately
- ✅ **Free development** - no testnet ETH needed
- ✅ **Easy reset** - restart Ganache to clear state
- ✅ **Offline development** - no internet required

**Perfect for development!** Switch to Sepolia only when you're ready for final testing.

---

## Next Steps

1. ✅ Install Ganache (GUI or CLI)
2. ✅ Start Ganache on port 8545
3. ✅ Deploy contract: `npx hardhat run scripts/deploy_local.js --network localhost`
4. ✅ Update `backend/.env` with deployment output
5. ✅ Test: `python test_ipfs_endpoints.py`
6. ✅ Build your app with unlimited transactions! 🚀

**Happy coding!** 🎊
