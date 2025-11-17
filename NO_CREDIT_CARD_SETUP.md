# 🚀 No Credit Card Setup Guide

**Good news!** You can run the entire Nirbhaya platform **without a credit card**. The only feature that won't work is the route safety mapping (which requires Google Maps API).

## ✅ What Works WITHOUT Credit Card

All core features work perfectly:

- ✅ **Report Incidents** - Submit safety reports with photos
- ✅ **View Reports** - See all incidents on blockchain
- ✅ **Photo Upload** - IPFS storage via Pinata (free tier)
- ✅ **Blockchain Storage** - Immutable records on Celo testnet
- ✅ **AI Processing** - OpenAI report analysis (with API key)
- ✅ **Wallet Connection** - MetaMask integration
- ✅ **Auto-Whitelist** - Dev mode bypass of Self Protocol

## ❌ What Doesn't Work WITHOUT Credit Card

- ❌ **Route Safety Feature** (`/search-location` page) - Requires Google Maps API which needs billing setup

## 🎯 Quick Setup (No Credit Card Needed)

### 1. Keep Current Configuration

Your `.env.local` file is already set up correctly:

```env
# Leave Google Maps as placeholder - it won't cause errors
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

The app automatically detects the placeholder and shows a friendly message instead of errors.

### 2. Get Free API Keys

#### OpenAI API Key (Free Trial)
1. Go to https://platform.openai.com/signup
2. Sign up (no credit card for initial $5 free credit)
3. Go to https://platform.openai.com/api-keys
4. Create new API key
5. Add to `backend/.env`:
   ```env
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
   ```

#### Pinata IPFS (Free Tier)
1. Go to https://app.pinata.cloud/register
2. Sign up with email (no credit card required)
3. Go to API Keys → New Key
4. Copy JWT token
5. Add to `self/app/.env.local`:
   ```env
   NEXT_PUBLIC_PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

#### Celo Testnet Tokens (Free)
1. Install MetaMask extension
2. Add Celo Alfajores network (see main README)
3. Get free testnet CELO: https://faucet.celo.org/alfajores
4. No credit card needed!

## 🚀 Running the App

Everything works the same:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/Scripts/activate  # Windows: venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd self/app
npm run dev
```

## 🧪 Test Core Features

### 1. Connect Wallet
- Go to http://localhost:3001/connect
- Connect MetaMask
- You'll be auto-whitelisted (dev mode)

### 2. Report Incident
- Go to http://localhost:3001/testify
- Capture/upload photo
- Add description
- Submit to blockchain

### 3. View Reports
- Go to http://localhost:3001/reports
- See all incidents
- Filter by severity
- View individual reports

### 4. Route Safety (Optional)
- Go to http://localhost:3001/search-location
- You'll see a friendly message explaining the feature is unavailable
- All other navigation works normally

## 💡 Alternative Free Services

### Instead of Google Maps:
- **OpenStreetMap** - Free, no API key needed
- **Mapbox** - Free tier (50,000 loads/month, no credit card for trial)
- **Leaflet.js** - Open source mapping library

*Note: Implementing these alternatives requires code changes. Current setup gracefully handles missing Google Maps.*

## 📊 Cost Breakdown

| Service | Cost | Credit Card? |
|---------|------|--------------|
| OpenAI API | First $5 free | ❌ No |
| Pinata IPFS | 1GB free | ❌ No |
| Celo Testnet | Free forever | ❌ No |
| MetaMask | Free | ❌ No |
| Node.js/Python | Free | ❌ No |
| Google Maps | N/A (Skipped) | ⚠️ Would need credit card |

**Total Cost: $0 💰**

## 🔄 If You Get Credit Card Later

To enable Google Maps later:

1. Follow [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)
2. Add API key to `.env.local`
3. Restart frontend server
4. Route safety feature will work automatically

## 🐛 Troubleshooting

### "Cannot load Google Maps correctly" Error
- ✅ **Ignore it!** The error is expected without API key
- ✅ Navigate away from `/search-location` page
- ✅ Use other features normally

### Route Safety Page Shows Error
- ✅ This is normal without Google Maps API
- ✅ Click "Go to Home" button
- ✅ All other features work

## ✅ What You Can Build

Even without Google Maps, you can:

1. **Complete Incident Reporting System**
   - Users report safety incidents
   - Photos stored on IPFS
   - Data immutably stored on blockchain
   
2. **Public Safety Dashboard**
   - View all reports
   - Filter by severity/location
   - Track incident patterns

3. **AI-Powered Analysis**
   - Automatic categorization
   - Severity assessment
   - Location-based insights

4. **Blockchain Verification**
   - Transparent record-keeping
   - Tamper-proof data
   - Decentralized storage

## 🎓 For Hackathon/Demo

### Presentation Tips:
- ✅ Show all working features (reporting, viewing, blockchain)
- ✅ Explain route safety is planned but requires Google Maps
- ✅ Mention it's optional - core platform works without it
- ✅ Focus on blockchain + AI + IPFS integration (unique!)

### Demo Flow:
1. Connect wallet → Auto-whitelisted
2. Report incident → Photo + description
3. Submit → Blockchain transaction
4. View reports → See all incidents
5. Filter → By severity/pincode
6. Individual report → Full details

**Duration: 5-7 minutes of solid features! 🎉**

## 🚀 Next Steps

1. ✅ Verify backend running (port 8000)
2. ✅ Verify frontend running (port 3001)
3. ✅ Add OpenAI API key to backend/.env
4. ✅ Add Pinata JWT to self/app/.env.local
5. ✅ Test incident reporting workflow
6. ✅ Prepare demo/presentation

## 📞 Still Need Help?

- Check main [README.md](./README.md) for full setup
- See [QUICK_START.md](./QUICK_START.md) for fast setup
- All features except mapping work perfectly!

---

**Remember: 95% of the platform works without Google Maps! Focus on the amazing blockchain + AI features you've built! 🎉**
