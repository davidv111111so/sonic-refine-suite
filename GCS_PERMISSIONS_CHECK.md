# GCS Permissions Verification

## Service Account Details
- **Service Account Email**: `857351913435-compute@developer.gserviceaccount.com`
- **Bucket Name**: `spectrum-mastering-files-857351913435`
- **Project ID**: `total-acumen-473702-j1`

## Required Permissions
The Cloud Run service account needs `roles/storage.objectAdmin` on the bucket to:
- Generate signed URLs for upload/download
- Upload files to GCS
- Download files from GCS
- Read/write files in the bucket

## Verification Command

Run this command to check if permissions are correctly set:

```bash
gsutil iam get gs://spectrum-mastering-files-857351913435 | grep "857351913435-compute@developer.gserviceaccount.com"
```

Or check via gcloud:

```bash
gcloud storage buckets get-iam-policy gs://spectrum-mastering-files-857351913435 --project=total-acumen-473702-j1
```

## Fix Command (if permissions are missing)

If the service account doesn't have the required permissions, run:

```bash
gsutil iam ch serviceAccount:857351913435-compute@developer.gserviceaccount.com:roles/storage.objectAdmin gs://spectrum-mastering-files-857351913435
```

Or via gcloud:

```bash
gcloud storage buckets add-iam-policy-binding gs://spectrum-mastering-files-857351913435 \
  --member=serviceAccount:857351913435-compute@developer.gserviceaccount.com \
  --role=roles/storage.objectAdmin \
  --project=total-acumen-473702-j1
```

## Signed URL Generation

The backend generates signed URLs using:
- **Upload URLs**: `PUT` method, 15 minutes expiration
- **Download URLs**: `GET` method, 24 hours expiration

These are generated in `backend/main.py`:
- Line 217-222: Upload URL generation (`/api/generate-upload-url`)
- Line 184-188: Download URL generation (in `run_mastering_task`)

## Testing GCS Access

Test that the backend can generate signed URLs:

```bash
# Test health endpoint first
curl https://mastering-backend-azkp62xtaq-uc.a.run.app/health

# Test upload URL generation (requires auth token)
curl -X POST https://mastering-backend-azkp62xtaq-uc.a.run.app/api/generate-upload-url \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.wav","fileType":"audio/wav"}'
```

If this returns 403, check GCS permissions.

## Common Issues

1. **403 Forbidden on signed URLs**: Service account lacks `roles/storage.objectAdmin`
2. **403 on file upload**: Upload signed URL may have expired (15 minutes) or Content-Type mismatch
3. **403 on file download**: Download signed URL may have expired (24 hours) or file doesn't exist

