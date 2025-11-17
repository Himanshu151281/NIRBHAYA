# 🚀 Quick Start Guide - Nirbhaya Platform

Get the Nirbhaya platform running in **under 15 minutes**!

## ⚡ Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 20+ installed (`node --version`)
- ✅ Python 3.8+ installed (`python --version`)
- ✅ Git installed (`git --version`)
- ✅ MetaMask browser extension installed

## 🏃 Fast Setup (3 Steps)

### Step 1: Install Dependencies (5 min)

```bash
# Clone repository
git clone https://github.com/Himanshu151281/NIRBHAYA.git
cd NIRBHAYA

# Backend setup
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cd ..

# Frontend setup
cd self/app
npm install
cd ../..
```

### Step 2: Configure Environment (5 min)

#### Backend Configuration

Create `backend/.env`:
```env
OPENAI_API_KEY=sk-your-key-here
```

**Get OpenAI Key**: https://platform.openai.com/api-keys (Free tier available)

#### Frontend Configuration

Create `self/app/.env.local`:
```env
NEXT_PUBLIC_APP_RPC_URL=https://alfajores-forno.celo-testnet.org
NEXT_PUBLIC_APP_PRIVATE_KEY=0xyour_private_key_here
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Get API Keys**:
- **Pinata JWT**: https://app.pinata.cloud/ (Sign up → API Keys → New Key)
- **Google Maps**: See [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md) for detailed setup

#### MetaMask Setup

1. Add Celo Alfajores Testnet:
   - Network Name: `Celo Alfajores`
   - RPC URL: `https://alfajores-forno.celo-testnet.org`
   - Chain ID: `44787`
   - Currency: `CELO`

2. Get testnet tokens: https://faucet.celo.org/alfajores

### Step 3: Run the Application (2 min)

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd self/app
npm run dev
```

**Access Application:**
- Frontend: http://localhost:3000
- Backend API Docs: http://localhost:8000/docs

## 🎯 First Use

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Approve MetaMask connection
4. Switch to Celo Alfajores (if prompted)
5. Wait for automatic whitelisting
6. Start using the app!

## 📝 Testing the Platform

### Test Incident Reporting

1. Navigate to "Report Incident"
2. Allow camera/location permissions
3. Capture or upload a photo
4. Add description: "Test incident near central park"
5. Click "Submit Incident"
6. Wait for transaction confirmation
7. View your report in "Reports" section

### Test Backend API

Visit http://localhost:8000/docs and try:

1. **GET /** - Health check
2. **POST /query** - Test AI processing:
```json
{
  "query": "Generate incident report for harassment case",
  "context": "Safety incident reporting"
}
```

## 🔥 Common Issues & Fixes

### "Cannot connect to backend"
- Check if backend is running on port 8000
- Verify `http://localhost:8000/health` returns OK

### "Transaction failed"
- Ensure you have CELO testnet tokens
- Check MetaMask is on Celo Alfajores network
- Verify wallet is whitelisted

### "OpenAI API error"
- Check API key is valid
- Verify key has available credits
- Check `backend/.env` file exists

### "MetaMask not detected"
- Install MetaMask extension
- Refresh the page
- Try in incognito mode

### "Image upload failed"
- Verify Pinata JWT is correct
- Check file size < 10MB
- Ensure stable internet

## 📚 Next Steps

Now that your platform is running:

1. **Explore Features**:
   - Report multiple incidents
   - View reports list
   - Check individual report details
   - Test different severity levels

2. **Review Documentation**:
   - Full setup guide: `PROJECT_SETUP_GUIDE.md`
   - API documentation: http://localhost:8000/docs
   - Smart contract details: `contracts/Swaraksha.sol`

3. **Customize**:
   - Update contract address in `SwarProvider.tsx`
   - Modify severity levels
   - Add custom report fields
   - Enhance UI/UX

## 🆘 Need Help?

- Check `PROJECT_SETUP_GUIDE.md` for detailed documentation
- Review backend logs in terminal 1
- Check browser console for frontend errors
- Verify all environment variables are set

## 🎉 Success Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] MetaMask connected to Celo Alfajores
- [ ] Wallet has testnet CELO tokens
- [ ] Can submit incident report
- [ ] Can view reports list
- [ ] Transactions confirm on blockchain

**You're all set! Start building safer communities! 🛡️**

---

## 🔗 Useful Links

- **Celo Faucet**: https://faucet.celo.org/alfajores
- **Celoscan Explorer**: https://alfajores.celoscan.io
- **OpenAI Platform**: https://platform.openai.com
- **Pinata Cloud**: https://pinata.cloud
- **MetaMask Support**: https://metamask.io/support

## ⏱️ Estimated Times

- Fresh Installation: **12-15 minutes**
- With Existing Dependencies: **5-7 minutes**
- First Report Test: **2-3 minutes**
- Full Testing: **10-15 minutes**

---

**Last Updated**: November 2025
**Platform Version**: 1.0.0
