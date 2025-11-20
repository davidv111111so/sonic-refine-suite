# Backend Mastering API Testing Guide

## Prerequisites

1. **Backend URL**: `https://mastering-backend-azkp62xtaq-uc.a.run.app`
2. **Environment Variables**:
   - `VITE_BACKEND_URL=https://mastering-backend-azkp62xtaq-uc.a.run.app`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=<your-key>`
   - `VITE_SUPABASE_URL=<your-supabase-url>`

## Backend Health Check

```bash
curl https://mastering-backend-azkp62xtaq-uc.a.run.app/health
```

**Expected Response**:
```json
{"status":"OK","service":"spectrum-backend"}
```

## API Endpoints Testing

### 1. Generate Upload URL

**Endpoint**: `POST /api/generate-upload-url`  
**Auth**: Required (Bearer token from Supabase session)

**Request**:
```bash
curl -X POST https://mastering-backend-azkp62xtaq-uc.a.run.app/api/generate-upload-url \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.wav",
    "fileType": "audio/wav",
    "fileSize": 1024000
  }'
```

**Expected Response**:
```json
{
  "signedUrl": "https://storage.googleapis.com/...",
  "gcsFileName": "uploads/<uuid>-test.wav"
}
```

### 2. Start Mastering Job

**Endpoint**: `POST /api/start-mastering-job`  
**Auth**: Required

**Request**:
```bash
curl -X POST https://mastering-backend-azkp62xtaq-uc.a.run.app/api/start-mastering-job \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetGcsPath": "uploads/<uuid>-target.wav",
    "referenceGcsPath": "uploads/<uuid>-reference.wav",
    "settings": {}
  }'
```

**Expected Response**:
```json
{
  "message": "Job accepted",
  "jobId": "<uuid>"
}
```

### 3. Get Job Status

**Endpoint**: `GET /api/get-job-status/{job_id}`  
**Auth**: Required

**Request**:
```bash
curl https://mastering-backend-azkp62xtaq-uc.a.run.app/api/get-job-status/<job_id> \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Responses**:

**Queued**:
```json
{
  "jobId": "<uuid>",
  "status": "queued",
  "createdAt": "...",
  "targetFile": "uploads/...",
  "referenceFile": "uploads/..."
}
```

**Processing**:
```json
{
  "jobId": "<uuid>",
  "status": "processing",
  "worker_started_at": "..."
}
```

**Completed**:
```json
{
  "jobId": "<uuid>",
  "status": "completed",
  "downloadUrl": "https://storage.googleapis.com/..."
}
```

**Failed**:
```json
{
  "jobId": "<uuid>",
  "status": "failed",
  "error": "The mastering process failed."
}
```

## Frontend Testing

### Test Flow

1. **Open App**: Navigate to `http://localhost:8080`
2. **Login**: Sign in with admin account
3. **Select AI Mastering Tab**: Should show genre presets or custom reference options
4. **Upload Target File**: Select audio file (WAV/MP3/FLAC)
5. **Select Reference**: Choose genre preset OR upload custom reference file
6. **Start Mastering**: Click "Master" button
7. **Monitor Progress**: Should show:
   - "Uploading target file..." (0-20%)
   - "Uploading reference file..." (20-40%)
   - "Starting mastering process..." (40%)
   - "Processing with Matchering AI..." (45-80%)
   - "Downloading mastered file..." (80-100%)
   - "Complete!" (100%)

### Expected Console Logs

```
🚀 Starting preset-based mastering...
📂 Target: filename.mp3
🎵 Preset: electronic
📂 Reference loaded: electronic_reference.wav
Progress: Uploading target file... - 0%
Progress: Uploading reference file... - 20%
Progress: Starting mastering process... - 40%
Progress: Processing with Matchering AI... - 45%
Progress: Mastering in progress... - 50%
...
Progress: Complete! - 100%
✅ Mastering complete!
```

### Error Scenarios

#### 1. Backend 404 Error
**Symptom**: `Failed to start mastering job: 404 Not Found`
**Cause**: Wrong backend URL or endpoint doesn't exist
**Fix**: Verify `VITE_BACKEND_URL` is set correctly

#### 2. GCS 403 Error
**Symptom**: `Failed to upload file: 403 Forbidden`
**Cause**: Service account lacks permissions or signed URL expired
**Fix**: 
- Check GCS permissions (see `GCS_PERMISSIONS_CHECK.md`)
- Ensure upload happens within 15 minutes of URL generation

#### 3. Authentication Error
**Symptom**: `401 Unauthorized` or `No authentication token available`
**Cause**: Not logged in or token expired
**Fix**: Sign in again

#### 4. Job Status Error
**Symptom**: `Failed to get job status: 404 Not Found`
**Cause**: Job ID invalid or job not created
**Fix**: Check that job was created successfully

## Troubleshooting

### Check Backend Logs

```bash
# Via gcloud (if you have access)
gcloud run services logs read mastering-backend \
  --region us-central1 \
  --project total-acumen-473702-j1 \
  --limit 50
```

### Check Frontend Console

Open browser DevTools (F12) and check:
- **Console**: For error messages and progress logs
- **Network**: For API call status codes and responses

### Verify Environment Variables

In browser console:
```javascript
console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL);
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'Set' : 'Missing');
```

## Success Criteria

✅ Backend health check returns 200 OK  
✅ Upload URL generation works  
✅ File upload to GCS succeeds  
✅ Job creation returns jobId  
✅ Job status polling works  
✅ Job completes successfully  
✅ Download URL is accessible  
✅ Mastered file downloads correctly  

## Common Issues and Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Backend 404 | Endpoint not found | Check `VITE_BACKEND_URL` |
| GCS 403 | Upload/download fails | Check service account permissions |
| Auth 401 | Unauthorized | Sign in again |
| Job timeout | Job never completes | Check backend logs for errors |
| Edge Function 500 | Old code still calling Edge Function | Use `masteringService.ts` directly |

---

**Last Updated**: After backend fixes completion  
**Backend URL**: `https://mastering-backend-azkp62xtaq-uc.a.run.app`  
**Status**: ✅ Ready for testing

