# 🤖 Gemini AI Integration Guide

The Nirbhaya platform now uses **Google Gemini AI** instead of OpenAI for intelligent report processing and route analysis.

## ✅ What Changed

### Before (OpenAI)
- Required OpenAI API key ($18/1M tokens)
- Used GPT-4 model
- Needed credit card for usage beyond free tier

### After (Gemini)
- **FREE** Google Gemini API
- Uses Gemini Pro model
- No credit card required!
- Better multilingual support

## 🚀 Quick Setup

### 1. Get Your Free Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Select "Create API key in new project" (or use existing project)
5. Copy your API key (format: `AIzaSy...`)

**No credit card needed! Completely free!**

### 2. Add to Environment File

Your key is already added in `backend/.env`:
```env
GEMINI_API_KEY=AIzaSyBH9xBI9wAZwSvWa0xmsOCSNeOeMZxjv40
```

### 3. Restart Backend (if running)

```bash
cd backend
source venv/Scripts/activate  # Windows: venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

## 🎯 Features Powered by Gemini

### 1. AI Report Analysis
- Automatic incident categorization
- Severity assessment (High/Medium/Low)
- Context understanding
- Smart text processing

### 2. Route Intelligence
- Pincode filtering along routes
- Geographic relevance detection
- Safe route recommendations
- Location-based clustering

### 3. Natural Language Processing
- Query understanding
- Context-aware responses
- Multi-language support
- Smart data extraction

## 📊 API Limits (Free Tier)

| Feature | Free Tier Limit |
|---------|----------------|
| Requests per minute | 60 RPM |
| Requests per day | 1,500 RPD |
| Tokens per minute | 32,000 TPM |
| **Cost** | **$0 (FREE)** |

**Perfect for development and demos!**

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Keep API key in `.env` file (never commit)
- ✅ Use environment variables
- ✅ Regenerate key if exposed
- ✅ Monitor usage in AI Studio dashboard

### ❌ DON'T:
- ❌ Commit API keys to GitHub
- ❌ Share keys publicly
- ❌ Hardcode keys in source files
- ❌ Use same key for dev and production

## 🧪 Testing Gemini Integration

### 1. Test Backend Health
```bash
curl http://localhost:8000/health
```
**Expected response:**
```json
{"status":"ok", "ai":"gemini"}
```

### 2. Test AI Query
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query":"What is women safety?","context":"Answer briefly"}'
```

### 3. View API Docs
Open http://localhost:8000/docs for interactive API documentation

## 🆚 Gemini vs OpenAI Comparison

| Feature | Gemini Pro | OpenAI GPT-4 |
|---------|-----------|--------------|
| **Cost** | FREE | $0.03 per 1K tokens |
| **Speed** | Fast | Medium |
| **Multilingual** | Excellent | Good |
| **Credit Card** | Not required | Required |
| **Free Tier** | 1,500 requests/day | $5 credit (expires) |
| **Best For** | Development, Demos | Production (if budget) |

**For this hackathon project: Gemini is perfect! 🎉**

## 📝 Code Changes Summary

### Files Modified:
1. `backend/main.py` - Replaced OpenAI with Gemini client
2. `backend/requirements.txt` - Changed `openai` to `google-generativeai`
3. `backend/.env` - Changed `OPENAI_API_KEY` to `GEMINI_API_KEY`
4. `backend/.env.example` - Updated template

### Files Backed Up:
- `backend/main_openai_backup.py` - Original OpenAI version (if needed)

## 🔄 Switch Back to OpenAI (Optional)

If you want to use OpenAI instead:

```bash
cd backend
mv main.py main_gemini.py
mv main_openai_backup.py main.py
pip uninstall google-generativeai
pip install openai
# Update .env with OPENAI_API_KEY
```

## 🚨 Troubleshooting

### Error: "Gemini client not configured"
**Solution**: Check `.env` file has `GEMINI_API_KEY` set

### Error: "google-generativeai not installed"
**Solution**: 
```bash
cd backend
source venv/Scripts/activate
pip install google-generativeai
```

### Error: "API key invalid"
**Solution**: 
1. Go to https://makersuite.google.com/app/apikey
2. Generate new API key
3. Update `backend/.env`

### Responses are slow
**Solution**: Gemini Pro is fast, but network latency may vary. This is normal.

### Rate limit exceeded
**Solution**: Free tier has 60 RPM limit. Wait a minute and try again.

## 💡 Advanced: Gemini Models

### Available Models:
- **gemini-pro** (Current) - Best for text
- **gemini-pro-vision** - For image analysis (future)
- **gemini-ultra** - Most capable (coming soon)

### Switch Models:
Edit `backend/main.py` line 35:
```python
gemini_client = genai.GenerativeModel('gemini-pro')  # Change model here
```

## 📚 Resources

- **Gemini API Docs**: https://ai.google.dev/docs
- **Get API Key**: https://makersuite.google.com/app/apikey
- **Pricing**: https://ai.google.dev/pricing
- **Community**: https://github.com/google/generative-ai-python

## ✅ Verification Checklist

- [x] Gemini API key obtained
- [x] Added to `backend/.env`
- [x] `google-generativeai` installed
- [x] Backend server restarted
- [x] Health endpoint returns `"ai":"gemini"`
- [x] Test query works successfully

## 🎉 Benefits for Your Project

1. **$0 Cost** - Completely free for development
2. **No Credit Card** - Easy setup
3. **Fast Responses** - Quick AI processing
4. **Reliable** - Google infrastructure
5. **Multilingual** - Better language support
6. **Perfect for Demos** - 1,500 requests/day is plenty

---

**Your Nirbhaya platform is now powered by free, fast, and smart Gemini AI! 🚀**
