# 🧪 Test URLs & Access Information

## Admin Access (Beta Restricted)

The application is currently in **BETA MODE** - only the following admin emails have access:

### Admin Emails:
1. **davidv111111@gmail.com**
2. **santiagov.t068@gmail.com**

## Test URLs

### Production App
```
https://[your-lovable-domain].lovableproject.com/
```
- Full application access for admins
- Mastering backend connected
- All features enabled

### Backend Health Check
```
https://mastering-backend-857351913435.us-central1.run.app/health
```
Expected response:
```json
{
  "status": "OK",
  "service": "AI Mastering Backend"
}
```

### Master Audio API
```
POST https://mastering-backend-857351913435.us-central1.run.app/api/master-audio
```

## Testing the Mastering Feature

### Steps to Test:
1. **Login** with one of the admin emails
2. Navigate to the **AI Mastering** tab
3. Upload a **target audio file** (your song)
4. Upload a **reference audio file** (professional track)
5. Click **"Master with AI"**
6. Wait for processing (30-90 seconds)
7. Download the mastered result
8. Check the **History tab** to see your mastering history

### What to Verify:
- ✅ Progress bar shows real-time updates (0% → 100%)
- ✅ Processing takes 30-90 seconds (real Matchering, not mock)
- ✅ Output file sounds different from input
- ✅ Error handling shows clear messages if something fails
- ✅ History tracks all mastering attempts
- ✅ Non-admin users are blocked with beta message

## Error Handling Tests

### Test Scenarios:
1. **Network Error**: Disconnect internet → Should show "Backend unavailable"
2. **Large File**: Upload 100MB+ file → Should show size limit error
3. **Cancel**: Click cancel during processing → Should abort cleanly
4. **Invalid File**: Upload non-audio file → Should reject with error

## Environment Variables

Verify these are set in Lovable:

```bash
VITE_BACKEND_URL=https://mastering-backend-857351913435.us-central1.run.app
VITE_SUPABASE_URL=[your-supabase-url]
VITE_SUPABASE_PUBLISHABLE_KEY=[your-supabase-key]
```

## Disabling Beta Mode (For Launch)

To open the app to all users:

1. Open `src/config/beta.ts`
2. Change `BETA_MODE_ENABLED: true` to `BETA_MODE_ENABLED: false`
3. Deploy the changes

## Security Notes

- ✅ All routes except `/auth` and `/terms` are protected by `BetaGate`
- ✅ Only admin emails can access the app
- ✅ Backend validates all requests
- ✅ File size limits enforced (100MB max)
- ✅ Proper error messages without exposing sensitive data

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify backend health endpoint
3. Confirm admin email is correct
4. Check network tab for failed requests
5. Review mastering history for error details
