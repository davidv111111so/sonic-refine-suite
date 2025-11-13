# Google Cloud Storage CORS Configuration

## Problem
Browser uploads to GCS are failing with "Network error during upload" because the bucket doesn't have CORS configured.

## Solution

### Step 1: Create CORS Configuration File

Create a file named `cors.json` with the following content:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```

For production, replace `"*"` with your specific domain:
```json
[
  {
    "origin": ["https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com"],
    "method": ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```

### Step 2: Apply CORS Configuration

Run this command to apply CORS to your bucket:

```bash
gsutil cors set cors.json gs://spectrum-mastering-files-857351913435
```

### Step 3: Verify CORS Configuration

Check if CORS is properly configured:

```bash
gsutil cors get gs://spectrum-mastering-files-857351913435
```

You should see the CORS configuration you just set.

### Step 4: Test Upload

After applying CORS, try uploading a file again from the AI Mastering tab.

## Troubleshooting

### Error: "Network error during upload"
- **Cause**: CORS not configured or misconfigured
- **Solution**: Follow Step 2 above

### Error: "403 Forbidden"
- **Cause**: Signed URL permissions issue
- **Solution**: Verify the service account has `storage.objects.create` permission

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"
- **Cause**: CORS configuration not applied
- **Solution**: Re-run the `gsutil cors set` command

## Important Notes

1. **Security**: For production, always specify your exact domain instead of using `"*"`
2. **Caching**: CORS changes may take a few minutes to propagate
3. **Testing**: Clear your browser cache after changing CORS settings

## Alternative: Set CORS via Console

If you don't have `gsutil` installed:

1. Go to [Google Cloud Console](https://console.cloud.google.com/storage/browser)
2. Select your bucket: `spectrum-mastering-files-857351913435`
3. Click on the "Permissions" tab
4. Click "Edit CORS configuration"
5. Paste the JSON configuration above
6. Click "Save"

## Verify Everything Works

After setting CORS, test the full flow:
1. Go to AI Mastering tab
2. Upload an audio file
3. Select a preset or reference
4. Click "Master My Track"
5. The upload should now work without errors
