# 🧪 Testing Guide - Nirbhaya App

## Quick Test Checklist

### ✅ Before Testing
1. **Backend running**: Check http://localhost:8000/health 
2. **Frontend running**: Check http://localhost:3001
3. **Wallet installed**: MetaMask or similar
4. **Test tokens**: Get CELO from [Alfajores Faucet](https://faucet.celo.org/alfajores)

---

## 🔍 Feature Testing

### 1. Connect Wallet
**URL**: http://localhost:3001/connect

**Steps**:
1. Click "Connect Wallet"
2. Approve connection in MetaMask
3. Switch to Celo Alfajores testnet if prompted
4. Should see your address displayed

**Expected**: ✅ Wallet connected, auto-whitelisted (dev mode)

---

### 2. Report Incident (Main Feature)
**URL**: http://localhost:3001/testify

**Prerequisites**:
- ✅ Wallet connected
- ✅ Location permission granted
- ✅ Camera permission granted (or upload photos)
- ✅ Some CELO test tokens for gas

**Steps**:
1. **Allow camera access** when prompted (or skip to upload)
2. **Capture photo** OR **Upload from device**
3. **Add description**: "Harassment incident near metro station"
4. **Check location** is detected (console logs)
5. Click **Submit Incident**

**What happens**:
```
📤 Step 1: Uploading images to IPFS (via Pinata)
   → Should see IPFS hashes in console

🤖 Step 2: AI processing (via Gemini)
   → Backend analyzes description
   → Generates title, severity, location name

📝 Step 3: Blockchain submission (via Celo)
   → MetaMask popup appears
   → Click "Confirm" transaction
   → Wait for confirmation (~5 seconds)

✅ Step 4: Success!
   → "Report submitted successfully! 🎉"
   → Redirects to /reports after 2 seconds
```

**Check Console Logs**:
```
✓ Location found: {lat: X, lng: Y}
📤 Starting image upload to IPFS...
✅ Uploaded image IPFS hashes: [...]
🤖 Calling AI backend for analysis...
✅ AI analysis received
📤 Submitting to blockchain...
✅ Report submitted successfully!
```

**Common Issues**:

❌ **"Location not available"**
- Enable location in browser settings
- Refresh page and allow permission

❌ **"Insufficient funds for gas fees"**
- Get test CELO: https://faucet.celo.org/alfajores
- Need ~0.01 CELO

❌ **"Transaction was rejected"**
- You clicked "Reject" in MetaMask
- Try again and click "Confirm"

❌ **"Failed to upload images"**
- Check internet connection
- Verify Pinata JWT in .env.local

❌ **"Failed to process report with AI"**
- Check backend is running (http://localhost:8000/health)
- Verify Gemini API key in backend/.env

---

### 3. View Reports
**URL**: http://localhost:3001/reports

**Steps**:
1. Navigate to /reports
2. Should see list of all submitted incidents
3. Click on a report to view details

**Expected**: List of reports from blockchain

---

### 4. Route Safety Checker
**URL**: http://localhost:3001/search-location

**Steps**:
1. Page loads with your current location
2. **Search for destination**: Type "India Gate, Delhi"
3. Select from dropdown
4. **View route** with safety indicators
5. **Check incident markers** on map

**Console Logs**:
```
✓ Location found: {lat: X, lng: Y}
Accuracy: X meters
```

**Features**:
- 🗺️ Mapbox map with your location
- 📍 Place search (India-focused)
- 🛣️ Route directions
- ⚠️ Incident markers
- 📊 Safety statistics

---

## 🐛 Debugging

### Backend Issues
```bash
# Check if backend is running
curl http://localhost:8000/health

# Should return: {"status":"ok","ai":"gemini"}

# If not running:
cd backend
source venv/Scripts/activate  # Windows Git Bash
uvicorn main:app --reload --port 8000
```

### Frontend Issues
```bash
# Check if frontend is running
# Open: http://localhost:3001

# If not running:
cd self/app
npm run dev
```

### Blockchain Issues

**Check wallet connection**:
```javascript
// In browser console (F12)
window.ethereum.selectedAddress
// Should show your wallet address
```

**Check network**:
- Open MetaMask
- Should show "Celo Alfajores Testnet"
- If not, add network: https://docs.celo.org/network

**Check balance**:
- Need test CELO for gas
- Faucet: https://faucet.celo.org/alfajores

---

## 🎯 Success Criteria

✅ **Report Incident Working** if:
1. Can capture/upload photos
2. Images upload to IPFS (see hashes in console)
3. AI generates title/severity (see in console)
4. Transaction appears in MetaMask
5. Transaction confirms on blockchain
6. Report appears in /reports page

✅ **Location Working** if:
1. Console shows: "✓ Location found"
2. Map centers on your location
3. Blue marker shows your position
4. Accuracy is under 1000 meters

✅ **AI Working** if:
1. Backend health check shows: `"ai":"gemini"`
2. Console shows: "✅ AI analysis received"
3. Parsed report has title, severity, location

---

## 📊 Test Data Examples

### Good Test Descriptions:
```
"Group of men harassing women outside metro station"
"Unsafe area with poor lighting and suspicious activity"
"Witnessed eve teasing incident near college campus"
```

### Expected AI Output:
```json
{
  "title": "Eve teasing near metro station",
  "severity": "High",
  "location": "Rajiv Chowk, New Delhi",
  "pincode": "110001"
}
```

---

## 🚨 Emergency Troubleshooting

### Nothing works?
1. **Restart everything**:
   ```bash
   # Kill both servers (Ctrl+C)
   # Backend
   cd backend && source venv/Scripts/activate && uvicorn main:app --reload --port 8000
   
   # Frontend (new terminal)
   cd self/app && npm run dev
   ```

2. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)

3. **Check all API keys**: 
   - backend/.env → GEMINI_API_KEY
   - self/app/.env.local → NEXT_PUBLIC_PINATA_JWT, NEXT_PUBLIC_MAPBOX_TOKEN

4. **Check wallet**: Connected to Celo Alfajores, has test CELO

---

## 📞 Need Help?

**Console Logs Are Your Friend!**
- Open browser DevTools (F12)
- Check Console tab for errors
- Look for ✅ success or ❌ error emojis

**Common Success Logs**:
```
✓ Location found
✅ Uploaded image IPFS hashes
✅ AI analysis received
✅ Report submitted successfully!
```

**Backend Logs**:
```
INFO:     127.0.0.1 - "POST /query HTTP/1.1" 200 OK
```

Happy Testing! 🚀
