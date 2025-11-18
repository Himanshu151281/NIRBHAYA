# 🤖 AI-Powered Incident Image Verification

## Overview

NIRBHAYA now includes AI-powered image verification to ensure that only valid incident reports are submitted. This feature uses **Google Gemini 1.5 Flash** to analyze uploaded images and determine if they represent actual safety incidents.

## How It Works

### 1. **Image Submission Flow**

```
User uploads image → AI analyzes image → Valid ✅ → Save to MongoDB + Blockchain
                                       → Invalid ❌ → Reject with reason
```

### 2. **Validation Criteria**

The AI validates images against these criteria:

**✅ Valid Incidents:**
- Harassment or assault situations
- Unsafe areas (dark alleys, broken streetlights, deserted places)
- Suspicious activities or individuals
- Accidents or emergency situations
- Infrastructure hazards (broken roads, unsafe buildings)
- Any situation that poses a threat to women's safety

**❌ Invalid Submissions:**
- Random selfies or personal photos
- Food, pets, nature photos
- Screenshots of text or social media
- Memes or jokes
- Unrelated content

### 3. **AI Analysis Process**

The AI receives:
- **Image**: The uploaded photo
- **Context**: Title, description, and severity level from the incident report
- **Instructions**: Strict validation rules for women's safety incidents

The AI responds with:
```json
{
  "is_valid": true/false,
  "reason": "Brief explanation (max 100 chars)",
  "confidence": "high/medium/low"
}
```

## Setup Instructions

### 1. **Get Gemini API Key**

1. Visit: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated key

### 2. **Configure Backend**

Add to `backend/.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. **Install Dependencies**

```bash
cd backend
pip install google-generativeai Pillow
```

### 4. **Restart Backend**

```bash
uvicorn main:app --reload --port 8000
```

## User Experience

### Success Flow ✅

1. User captures/uploads incident photo (e.g., dark alley, broken streetlight)
2. AI validates: "This appears to be a valid safety concern showing poor lighting conditions"
3. Report is submitted successfully
4. User sees: "Report submitted successfully! 🎉"

### Rejection Flow ❌

1. User uploads invalid photo (e.g., selfie, food photo)
2. AI rejects: "This appears to be a personal photo, not a safety incident"
3. Submission is blocked with HTTP 400 error
4. User sees detailed alert:

```
❌ Doesn't look like a valid incident

🤖 AI Analysis: This appears to be a personal photo, not a safety incident
📊 Confidence: high

Please upload a photo that shows an actual incident like:
• Harassment or unsafe behavior
• Dark or poorly lit areas
• Suspicious activity
• Accidents or emergencies
• Infrastructure hazards

Avoid uploading selfies, food photos, memes, or unrelated images.
```

## Technical Implementation

### Backend (`backend/routes/incident_blockchain.py`)

```python
async def verify_incident_with_ai(image_bytes: bytes, title: str, description: str, severity: str) -> dict:
    """
    Verify if the uploaded image is a valid incident using Gemini AI
    Returns: {"is_valid": bool, "reason": str, "confidence": str}
    """
    # Convert bytes to PIL Image
    image = Image.open(io.BytesIO(image_bytes))
    
    # Create verification prompt with context
    prompt = f"""You are an AI safety inspector for NIRBHAYA...
    
    Incident Details:
    - Title: {title}
    - Description: {description}
    - Severity Level: {severity}
    
    [Validation rules and response format]
    """
    
    # Generate AI response
    response = gemini_model.generate_content([prompt, image])
    result = json.loads(response.text)
    
    return result
```

### Submit Endpoint (`/api/incidents/submit`)

```python
# Step 2: AI VERIFICATION
if first_image_bytes:
    ai_result = await verify_incident_with_ai(
        first_image_bytes, 
        title, 
        description, 
        severity
    )
    
    # Reject submission if AI determines it's invalid
    if not ai_result.get("is_valid", False):
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_INCIDENT",
                "message": "Doesn't look like a valid incident",
                "reason": ai_result.get("reason"),
                "confidence": ai_result.get("confidence")
            }
        )
```

### Frontend (`self/app/src/lib/api.ts`)

```typescript
async submitIncident(formData: FormData) {
  const response = await fetchNoCache(`${API_BASE_URL}/api/incidents/submit`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    // Parse error response for AI validation failures
    const errorData = await response.json().catch(() => null);
    
    // Check if it's an AI validation error
    if (response.status === 400 && errorData?.detail?.error === 'INVALID_INCIDENT') {
      const error = new Error(errorData.detail.message);
      (error as any).isAIRejection = true;
      (error as any).aiReason = errorData.detail.reason;
      (error as any).aiConfidence = errorData.detail.confidence;
      throw error;
    }
  }
  
  return response.json();
}
```

### Error Handling (`self/app/app/testify/page.tsx`)

```typescript
catch (err) {
  // Check if it's an AI validation rejection
  if (err instanceof Error && (err as any).isAIRejection) {
    const aiReason = (err as any).aiReason;
    const aiConfidence = (err as any).aiConfidence;
    
    alert(`❌ ${err.message}\n\n🤖 AI Analysis: ${aiReason}\n📊 Confidence: ${aiConfidence}\n\n[Helpful guidance]`);
  }
}
```

## Metadata Storage

When an incident is verified and submitted, the AI verification results are stored in MongoDB:

```json
{
  "metadata": {
    "title": "Dark alley near metro station",
    "description": "No streetlights, feels unsafe at night",
    "ai_verified": true,
    "ai_confidence": "high"
  }
}
```

## Fallback Behavior

If AI verification fails (API error, network issue, etc.):
- Submission is **ALLOWED** by default
- Reason logged: "AI verification failed - manual review recommended"
- Confidence marked as "error"

This ensures the system remains functional even if the AI service is temporarily unavailable.

## Error Handling

### Backend Errors
- **Missing API Key**: Prints warning, allows all submissions
- **JSON Parse Error**: Logs error, allows submission with low confidence
- **AI Service Error**: Logs error, allows submission with error flag

### Frontend Errors
- **HTTP 400 (AI Rejection)**: Shows detailed user-friendly message
- **Network Error**: Shows generic error with troubleshooting steps
- **Server Error**: Shows backend/database connection guidance

## Testing

### Test Valid Incident
1. Upload image of dark alley or broken streetlight
2. AI should approve: `"is_valid": true`
3. Submission succeeds

### Test Invalid Incident
1. Upload selfie or food photo
2. AI should reject: `"is_valid": false`
3. User sees rejection alert with explanation

## Benefits

✅ **Prevents Spam**: Blocks irrelevant submissions automatically
✅ **Maintains Quality**: Ensures reports are genuine safety incidents  
✅ **User Education**: Teaches users what constitutes a valid incident
✅ **Contextual Analysis**: Considers title, description, and severity
✅ **Graceful Degradation**: Works even if AI service fails

## Future Enhancements

- [ ] Multi-image analysis (currently validates first image only)
- [ ] Admin dashboard for flagged/rejected incidents
- [ ] User feedback loop to improve AI accuracy
- [ ] Severity level validation (auto-suggest severity based on image)
- [ ] Batch verification for faster processing

## Troubleshooting

### AI Verification Not Working

**Check:**
1. `GEMINI_API_KEY` is set in `backend/.env`
2. Backend console shows: `✅ AI Verification PASSED` or similar logs
3. Google Gemini API quota not exceeded
4. Internet connection available

**Debug:**
```bash
# Check if API key is loaded
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('GEMINI_API_KEY'))"
```

### False Rejections

If valid incidents are being rejected:
1. Check AI reason in error message
2. Improve title/description to provide more context
3. Ensure image clearly shows the incident
4. Consider adjusting AI prompt in `verify_incident_with_ai()`

### False Approvals

If invalid images are being approved:
1. Check AI confidence level (should be "high" for valid incidents)
2. Review AI prompt strictness
3. Add more specific validation criteria in prompt
4. Implement manual review for low-confidence approvals

## API Rate Limits

Google Gemini API has rate limits:
- **Free Tier**: 60 requests per minute
- **Paid Tier**: Higher limits based on plan

If you exceed limits, the AI verification will fail gracefully and allow submissions.

## Privacy & Security

- Images are analyzed by Google Gemini AI (cloud service)
- No images are stored by Google permanently (per Gemini terms)
- Only first image is analyzed for performance
- AI results are logged for debugging but not shared
- User data remains in MongoDB/Blockchain as before

## License

This feature is part of the NIRBHAYA project and follows the same license.
