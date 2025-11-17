# 🚀 Quick Start: IPFS + Blockchain Integration

## TL;DR - Get Started in 5 Minutes

### Prerequisites
- Python 3.9+
- Node.js 18+
- 0.5 Sepolia ETH (from faucet)
- Web3.Storage account (free)

---

## 🏠 RECOMMENDED: Use Ganache (Local Blockchain)

**Skip Sepolia faucet limits! Use local Ganache instead:**

1. Download Ganache: https://trufflesuite.com/ganache/
2. Click "Quickstart" → Runs on `http://127.0.0.1:8545`
3. Deploy locally:
   ```bash
   cd D:\Projects\NIRBHAYA\contracts
   npm install
   npm run deploy:local
   ```
4. Copy the output to `backend/.env`

**See `GANACHE_SETUP.md` for full guide!**

---

## Step-by-Step Setup

### 1. Install Backend Dependencies (2 min)

```bash
cd D:\Projects\NIRBHAYA\backend

# Install IPFS & Web3 packages
pip install web3==6.11.3 eth-account==0.10.0 httpx==0.25.2
```

### 2. Get Web3.Storage Token (2 min)

1. Go to https://web3.storage
2. Sign up (free)
3. Click "Account" → "Create API Token"
4. Copy the token (looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Configure Environment (1 min)

Edit `backend/.env`:

```env
# Add these lines to your existing .env file:
WEB3_STORAGE_TOKEN=eyJhbGc...your_token_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
RELAYER_PRIVATE_KEY=0x...your_private_key
INCIDENT_REGISTRY_CONTRACT_ADDRESS=
```

**Get Sepolia RPC:**
- Infura: https://infura.io → Create project → Copy Sepolia endpoint
- OR Alchemy: https://alchemy.com → Same process

**Create Relayer Wallet:**
```bash
python -c "from eth_account import Account; acc = Account.create(); print(f'Address: {acc.address}\nPrivate Key: {acc.key.hex()}')"
```

**Fund with Sepolia ETH:**
- https://sepoliafaucet.com
- Paste your relayer address
- Request 0.5 ETH

### 4. Deploy Smart Contract (Optional - 5 min)

```bash
cd D:\Projects\NIRBHAYA\contracts

# Install Hardhat
npm install

# Create contracts/.env
echo "DEPLOYER_PRIVATE_KEY=0x...your_key" >> .env
echo "SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/..." >> .env

# Compile & Deploy
npx hardhat compile
npx hardhat run scripts/deploy_incident_registry.js --network sepolia
```

Copy the deployed contract address to `backend/.env`:
```env
INCIDENT_REGISTRY_CONTRACT_ADDRESS=0x1234...
```

### 5. Start Backend

```bash
cd D:\Projects\NIRBHAYA\backend
uvicorn main:app --reload --port 8000
```

Visit: http://localhost:8000/docs

### 6. Test Endpoints

```bash
# Run test script
python test_ipfs_endpoints.py
```

Expected output:
```
✅ Backend is running
✅ Image uploaded successfully!
   CID: bafybeiXXX...
✅ Metadata uploaded successfully!
   CID: bafybeiYYY...
⛓️ Blockchain submission successful!
```

### 7. Update Frontend (Optional)

Replace `handleSubmit` function in `self/app/app/testify/page.tsx` with code from:
`frontend_integration_snippet.tsx`

---

## ✅ Verification Checklist

- [ ] Backend starts without errors
- [ ] Swagger UI accessible at http://localhost:8000/docs
- [ ] Test script shows "✅ Image uploaded successfully!"
- [ ] IPFS URLs open in browser (https://w3s.link/ipfs/...)
- [ ] (Optional) Transaction visible on Sepolia Etherscan

---

## 🎯 Test Without Blockchain (IPFS Only)

If you skip contract deployment, the system still works! It will:
- ✅ Upload images to IPFS
- ✅ Upload metadata to IPFS  
- ✅ Return CIDs and gateway URLs
- ⚠️ Skip blockchain anchoring

Perfect for testing IPFS integration first!

---

## 🔥 Quick Test with cURL

```bash
# Test image upload
curl -X POST http://localhost:8000/api/ipfs/upload-image \
  -F "image=@/path/to/your/image.jpg"

# Expected response:
{
  "cid": "bafybeiXXXXXXXXXXX",
  "gateway_url": "https://w3s.link/ipfs/bafybeiXXXXXXXXXXX"
}
```

Open the gateway URL in your browser to verify!

---

## 🆘 Troubleshooting

### "Module not found: web3"
```bash
pip install web3 eth-account httpx
```

### "Backend not accessible"
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### "Web3.Storage upload failed"
- Check token is correct in `.env`
- Verify account at https://web3.storage/account
- Check file size < 10MB

### "Insufficient funds for gas"
- Get Sepolia ETH: https://sepoliafaucet.com
- Check balance: https://sepolia.etherscan.io/address/YOUR_RELAYER_ADDRESS

---

## 📚 Full Documentation

See `IPFS_BLOCKCHAIN_SETUP.md` for:
- Complete architecture details
- API endpoint documentation
- Security best practices
- Production deployment guide
- Cost analysis

---

## 🎉 Success!

Your system is now:
- ✅ Storing images on decentralized IPFS
- ✅ Storing metadata immutably
- ✅ (Optional) Anchoring on Sepolia blockchain
- ✅ Ready for frontend integration!

**Next:** Integrate with frontend or deploy contract for full blockchain verification.

---

**Need help?** 
- API docs: http://localhost:8000/docs
- Full guide: `IPFS_BLOCKCHAIN_SETUP.md`
- Test script: `python test_ipfs_endpoints.py`
