# 🔑 Required API Keys & Credentials

## 📝 Summary

You need **ONLY 1 API key** for the IPFS + Blockchain system to work:

### ✅ Required (Must Have):
1. **Web3.Storage Token** - For IPFS file storage

### ⚠️ Optional (Only if using Sepolia testnet instead of Ganache):
2. Sepolia RPC URL (from Infura/Alchemy)
3. Relayer wallet private key
4. Etherscan API key (for contract verification)

---

## 1️⃣ Web3.Storage Token (REQUIRED)

**Purpose:** Upload images and metadata to decentralized IPFS storage

**Cost:** 🆓 **FREE** (5GB free storage, no credit card needed)

**How to Get:**

1. Go to https://web3.storage
2. Click "Sign Up" (use GitHub or email)
3. After login, click your profile → "Account"
4. Click "Create API Token"
5. Give it a name (e.g., "NIRBHAYA")
6. Click "Create"
7. **Copy the token** (starts with `eyJhbGc...`)

**Token looks like:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEU...
```

**Add to `.env`:**
```env
WEB3_STORAGE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_token_here
```

---

## 2️⃣ Blockchain Configuration (Choose ONE)

### Option A: Ganache (Local) - RECOMMENDED ✅

**Purpose:** Local blockchain for development

**Cost:** 🆓 **100% FREE** - unlimited transactions!

**No API keys needed!** Ganache provides everything:

**Credentials (Auto-provided by Ganache):**
```env
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
INCIDENT_REGISTRY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Setup:**
1. Download Ganache: https://trufflesuite.com/ganache/
2. Click "Quickstart"
3. Deploy contract: `npm run deploy:local`
4. Copy contract address to `.env`

**That's it!** No API keys, no faucets, no limits!

---

### Option B: Sepolia (Testnet) - For Production Testing

**Purpose:** Real Ethereum testnet before mainnet deployment

**Cost:** 🆓 Free but **limited by faucets** (~0.5 ETH/day)

**Required:**

#### 2a. Sepolia RPC URL

**What:** Connection endpoint to Ethereum Sepolia network

**Get from Infura (FREE):**
1. Go to https://infura.io
2. Sign up (free account)
3. Create new project → Give it a name
4. Click on project → "Settings"
5. Copy "Sepolia" endpoint URL

**Looks like:**
```
https://sepolia.infura.io/v3/a1b2c3d4e5f6...
```

**OR Get from Alchemy:**
1. https://alchemy.com
2. Create account → Create app
3. Select "Ethereum" + "Sepolia"
4. Copy HTTPS endpoint

**Add to `.env`:**
```env
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

---

#### 2b. Relayer Private Key (Wallet)

**What:** Server wallet that pays gas fees for users

**How to Create:**

```bash
# Run this in PowerShell
python -c "from eth_account import Account; acc = Account.create(); print(f'Address: {acc.address}\nPrivate Key: {acc.key.hex()}')"
```

**Output:**
```
Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Private Key: 0x4c0883a69102937d6231471b5dbb6204fe512961708279ef5d38f...
```

**Important:**
- Copy the **Private Key** (with 0x prefix)
- Fund this address with Sepolia ETH from faucet

**Add to `.env`:**
```env
RELAYER_PRIVATE_KEY=0x4c0883a69102937d6231471b5dbb6204fe512961708279ef5d38f...
```

**Get Sepolia ETH (Free):**
- https://sepoliafaucet.com (0.5 ETH/day)
- https://sepolia-faucet.pk910.de (mine your own)
- https://faucet.quicknode.com/ethereum/sepolia

---

#### 2c. Etherscan API Key (Optional)

**What:** For contract verification on Etherscan

**Only needed if:** You want to verify your contract code publicly

**How to Get:**
1. Go to https://etherscan.io
2. Sign up
3. Profile → API Keys → Create new API key
4. Copy the key

**Add to contracts/.env:**
```env
ETHERSCAN_API_KEY=ABC123DEF456GHI789...
```

**Note:** Not required for development!

---

## 3️⃣ Contract Address

**What:** Address where IncidentRegistry contract is deployed

**Get by:** Deploying the contract

**For Ganache:**
```bash
cd D:\Projects\NIRBHAYA\contracts
npm run deploy:local
```

**Output will show:**
```
✅ IncidentRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**For Sepolia:**
```bash
npm run deploy:sepolia
```

**Add to `.env`:**
```env
INCIDENT_REGISTRY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

---

## 📋 Complete `.env` File Examples

### For Ganache (Development) - RECOMMENDED

**File:** `D:\Projects\NIRBHAYA\backend\.env`

```env
# Existing (keep this)
GEMINI_API_KEY=your_gemini_key_here

# ONLY 1 NEW API KEY NEEDED! ↓
WEB3_STORAGE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_token_here

# Ganache Configuration (No API keys needed!)
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
INCIDENT_REGISTRY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**That's all you need!** Just 1 API key (Web3.Storage)

---

### For Sepolia (Production Testing)

**File:** `D:\Projects\NIRBHAYA\backend\.env`

```env
# Existing
GEMINI_API_KEY=your_gemini_key_here

# IPFS (REQUIRED)
WEB3_STORAGE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_token_here

# Sepolia Testnet
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/your_infura_project_id
RELAYER_PRIVATE_KEY=0xyour_created_private_key_here
INCIDENT_REGISTRY_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

**File:** `D:\Projects\NIRBHAYA\contracts\.env`

```env
DEPLOYER_PRIVATE_KEY=0xyour_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_project_id
ETHERSCAN_API_KEY=ABC123...your_etherscan_key
```

---

## ⚡ Quick Start Checklist

### Minimal Setup (Ganache):

- [ ] Get Web3.Storage token (5 min)
- [ ] Install Ganache GUI (5 min)
- [ ] Update `backend/.env` with Web3.Storage token
- [ ] Deploy contract: `npm run deploy:local`
- [ ] Copy contract address to `.env`

**Total API keys needed: 1** (Web3.Storage)

---

### Full Setup (Sepolia):

- [ ] Get Web3.Storage token
- [ ] Get Infura/Alchemy Sepolia RPC URL
- [ ] Create wallet + get private key
- [ ] Fund wallet with Sepolia ETH
- [ ] (Optional) Get Etherscan API key
- [ ] Update `backend/.env` and `contracts/.env`
- [ ] Deploy contract: `npm run deploy:sepolia`

**Total API keys needed: 2-3** (Web3.Storage + Infura + optionally Etherscan)

---

## 🎯 RECOMMENDED: Start with Ganache

**Why?**
- ✅ Only 1 API key needed (Web3.Storage)
- ✅ No faucet hassles
- ✅ Unlimited transactions
- ✅ Instant testing
- ✅ Can switch to Sepolia anytime

**Switch to Sepolia only when:**
- Ready for production testing
- Need public blockchain verification
- Want to test with real network delays

---

## 🔒 Security Notes

### ✅ Safe to Share:
- Web3.Storage token (can regenerate)
- Sepolia RPC URL (public endpoint)
- Contract addresses (public on blockchain)

### ❌ NEVER Share:
- Private keys (RELAYER_PRIVATE_KEY, DEPLOYER_PRIVATE_KEY)
- Never commit `.env` files to git
- Keep `.env` in `.gitignore`

---

## 🆘 Where to Get Help

1. **Web3.Storage Issues:** https://web3.storage/docs
2. **Infura Issues:** https://docs.infura.io
3. **Ganache Issues:** https://trufflesuite.com/docs/ganache
4. **Sepolia Faucets:** Multiple options listed above

---

## 📊 Cost Comparison

| Item | Ganache | Sepolia |
|------|---------|---------|
| Web3.Storage | Free | Free |
| RPC Endpoint | Free (local) | Free (Infura/Alchemy) |
| Gas Fees | Free | Faucet (~0.5 ETH/day) |
| Transactions | Unlimited | Limited |
| API Keys Needed | 1 | 2-3 |

**Winner for Development: Ganache** 🏆

---

## ✨ Next Steps

1. **Get Web3.Storage token** → https://web3.storage
2. **Choose: Ganache (easy) or Sepolia (production)**
3. **Update `.env` file**
4. **Deploy contract**
5. **Start testing!**

See `QUICKSTART.md` or `GANACHE_SETUP.md` for detailed setup! 🚀
