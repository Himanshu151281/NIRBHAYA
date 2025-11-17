# 🗺️ Google Maps API Setup Guide

This guide will help you set up Google Maps API for the Nirbhaya platform's route safety feature.

## 📋 Prerequisites

- Google Account
- Credit card (for API activation - free tier available)
- 5-10 minutes

## 🚀 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a Project"** → **"New Project"**
3. Enter project name: `Nirbhaya` (or any name)
4. Click **"Create"**
5. Wait for project creation (30-60 seconds)

### Step 2: Enable Google Maps APIs

1. In the Cloud Console, ensure your new project is selected
2. Go to **"APIs & Services"** → **"Library"**
3. Enable the following APIs (search and click "Enable" for each):
   - ✅ **Maps JavaScript API**
   - ✅ **Places API** 
   - ✅ **Directions API**
   - ✅ **Geocoding API**

### Step 3: Create API Key

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"API Key"**
3. Your API key will be created (format: `AIzaSy...`)
4. **IMPORTANT**: Click **"Restrict Key"** immediately

### Step 4: Restrict Your API Key (Security)

#### Application Restrictions
1. Select **"HTTP referrers (websites)"**
2. Add these referrers:
   ```
   http://localhost:3000/*
   http://localhost:3001/*
   https://yourdomain.com/*
   ```

#### API Restrictions
1. Select **"Restrict key"**
2. Check only the APIs you enabled:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API
3. Click **"Save"**

### Step 5: Configure Billing (Required)

⚠️ **Note**: Google Maps requires a billing account, but offers **$200 free credit per month**.

1. Go to **"Billing"** → **"Link a Billing Account"**
2. Click **"Create Billing Account"**
3. Enter credit card details
4. **Free Tier Coverage**:
   - 28,500 map loads per month (free)
   - 40,000 directions requests per month (free)
   - Your usage will stay in free tier for development

### Step 6: Add API Key to Nirbhaya

1. Copy your API key from Google Cloud Console
2. Open `self/app/.env.local`
3. Add your key:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
   ```
4. Save the file

### Step 7: Restart Development Server

```bash
# Stop the frontend server (Ctrl+C)
# Then restart:
cd self/app
npm run dev
```

## ✅ Verification

1. Open http://localhost:3001/search-location
2. You should see the map load without errors
3. Test the autocomplete search
4. Test route calculation between two points

## 💰 Pricing & Free Tier

| Feature | Free Tier (Monthly) | Pricing After |
|---------|-------------------|---------------|
| Map Loads | 28,500 | $7 per 1,000 |
| Directions | 40,000 | $5 per 1,000 |
| Places Autocomplete | 17,000 | $17 per 1,000 |

**For Development**: You'll stay within free tier limits.

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Restrict API key to specific domains
- ✅ Restrict API key to only needed APIs
- ✅ Set up billing alerts at $10, $50, $100
- ✅ Monitor usage in Cloud Console
- ✅ Use different keys for dev/production

### ❌ DON'T:
- ❌ Commit API keys to GitHub (use `.env.local`)
- ❌ Use unrestricted API keys
- ❌ Share API keys publicly
- ❌ Use production keys in development

## 🚨 Troubleshooting

### Error: "This page can't load Google Maps correctly"

**Solution**: 
1. Verify API key is in `.env.local`
2. Restart dev server after adding key
3. Check browser console for specific error

### Error: "This API project is not authorized to use this API"

**Solution**: 
1. Enable required APIs in Cloud Console
2. Wait 5 minutes for changes to propagate
3. Clear browser cache and reload

### Error: "ApiNotActivatedMapError"

**Solution**: 
1. Enable "Maps JavaScript API" in Cloud Console
2. Enable billing for the project
3. Wait 5-10 minutes

### Error: "RefererNotAllowedMapError"

**Solution**: 
1. Go to Credentials in Cloud Console
2. Edit your API key
3. Add your domain to allowed referrers
4. Include `http://localhost:3000/*` for dev

### Maps load but autocomplete doesn't work

**Solution**: 
1. Enable "Places API" in Cloud Console
2. Wait 5 minutes
3. Restart dev server

## 📊 Monitor Usage

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **"APIs & Services"** → **"Dashboard"**
3. View traffic, errors, and quotas
4. Set up alerts in **"Billing"** → **"Budgets & alerts"**

## 🔄 Alternative: Use Without Google Maps (Temporary)

If you want to skip Google Maps setup temporarily, the app will still work but the route safety feature will be unavailable. Other features like incident reporting will work normally.

## 🆘 Getting Help

- **Google Maps Platform Support**: [Support Page](https://developers.google.com/maps/support)
- **Documentation**: [Get API Key Guide](https://developers.google.com/maps/documentation/javascript/get-api-key)
- **Pricing**: [Pricing Sheet](https://mapsplatform.google.com/pricing/)

## 📝 Quick Reference

```env
# Required in self/app/.env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Required APIs**:
- Maps JavaScript API
- Places API
- Directions API  
- Geocoding API

**Cost**: $0/month (within free tier limits)

---

**Next Steps**: After setup, test the route safety feature at `/search-location` to find safe routes avoiding reported incident areas.
