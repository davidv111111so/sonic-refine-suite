# Genre Preset Reference Files Upload Guide

This guide explains how to upload the reference audio files required for genre-based AI mastering presets.

## Overview

The AI Mastering feature requires reference audio files for each genre preset. These files serve as "target sounds" that Matchering will use to master your tracks.

## Required Reference Files

You need to upload 12 reference audio files (one per genre):

| Preset ID | File Name | Description |
|-----------|-----------|-------------|
| flat | `flat-reference.wav` | Neutral, balanced reference |
| bass-boost | `bass-boost-reference.wav` | Enhanced low-end reference |
| treble-boost | `treble-boost-reference.wav` | Enhanced high-end reference |
| jazz | `jazz-reference.wav` | Jazz genre reference |
| classical | `classical-reference.wav` | Classical music reference |
| electronic | `electronic-reference.wav` | Electronic/EDM reference |
| v-shape | `v-shape-reference.wav` | V-shaped EQ reference |
| vocal | `vocal-reference.wav` | Vocal-focused reference |
| rock | `rock-reference.wav` | Rock music reference |
| hip-hop | `hip-hop-reference.wav` | Hip-hop/rap reference |
| podcast | `podcast-reference.wav` | Podcast/voice reference |
| live | `live-reference.wav` | Live performance reference |

## File Requirements

### Audio Specifications
- **Format**: WAV (preferred) or high-quality MP3
- **Bit Depth**: 16-bit or 24-bit
- **Sample Rate**: 44.1 kHz or 48 kHz
- **Channels**: Stereo (2 channels)
- **Duration**: 30-60 seconds (representative clip of the full song)
- **Quality**: Professional mastered track that exemplifies the genre

### Selection Tips
Choose reference tracks that:
- Are professionally mastered
- Represent the desired sonic characteristics of the genre
- Have balanced frequency response
- Are free of distortion or artifacts
- Match the target loudness for the genre

## Upload Method 1: Using Google Cloud Console (Recommended for Beginners)

### Step 1: Access Google Cloud Storage
1. Go to https://console.cloud.google.com/storage
2. Sign in with your Google Cloud account
3. Select project: `total-acumen-473702-j1`

### Step 2: Navigate to Bucket
1. Find and click on bucket: `level-audio-mastering`
2. If the bucket doesn't exist, create it:
   - Click "CREATE BUCKET"
   - Name: `level-audio-mastering`
   - Location: `us-central1` (Iowa)
   - Storage class: Standard
   - Access control: Uniform

### Step 3: Create References Folder
1. Inside the bucket, click "CREATE FOLDER"
2. Name: `references`
3. Click "CREATE"

### Step 4: Upload Files
1. Click on the `references` folder
2. Click "UPLOAD FILES"
3. Select all 12 reference WAV files
4. Wait for upload to complete

### Step 5: Make Files Publicly Accessible (Option A - Public Access)
For each uploaded file:
1. Click the three dots menu (⋮) next to the file
2. Select "Edit permissions"
3. Click "+ ADD ENTRY"
4. Entity: "Public"
5. Name: "allUsers"
6. Access: "Reader"
7. Click "SAVE"

**Alternative - Keep Private (Option B - Signed URLs)**
If you prefer to keep files private, the backend can generate signed URLs. In this case, update `frontend/src/utils/presetReferences.ts` to use the backend API for loading references instead of direct GCS URLs.

## Upload Method 2: Using gsutil Command Line (Recommended for Developers)

### Prerequisites
```bash
# Install Google Cloud SDK if not already installed
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set project
gcloud config set project total-acumen-473702-j1
```

### Upload All Files at Once
```bash
# Navigate to folder containing your reference files
cd /path/to/your/reference/files

# Upload all WAV files to GCS
gsutil -m cp *.wav gs://level-audio-mastering/references/

# Verify upload
gsutil ls gs://level-audio-mastering/references/
```

### Make Files Public (if using public access)
```bash
# Make all reference files publicly readable
gsutil -m acl ch -u AllUsers:R gs://level-audio-mastering/references/*.wav
```

## Upload Method 3: Using Python Script

Create a file `upload_references.py`:

```python
from google.cloud import storage
import os

def upload_references(source_folder, bucket_name='level-audio-mastering'):
    """Upload all reference files to GCS"""
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    
    reference_files = [
        'flat-reference.wav',
        'bass-boost-reference.wav',
        'treble-boost-reference.wav',
        'jazz-reference.wav',
        'classical-reference.wav',
        'electronic-reference.wav',
        'v-shape-reference.wav',
        'vocal-reference.wav',
        'rock-reference.wav',
        'hip-hop-reference.wav',
        'podcast-reference.wav',
        'live-reference.wav',
    ]
    
    for filename in reference_files:
        source_path = os.path.join(source_folder, filename)
        if not os.path.exists(source_path):
            print(f"⚠️  Missing: {filename}")
            continue
            
        destination_blob = bucket.blob(f'references/{filename}')
        destination_blob.upload_from_filename(source_path)
        
        # Make public (optional)
        destination_blob.make_public()
        
        print(f"✅ Uploaded: {filename}")
    
    print("✨ All references uploaded!")

if __name__ == '__main__':
    # Update this path to your reference files location
    upload_references('/path/to/your/reference/files')
```

Run the script:
```bash
python upload_references.py
```

## Verification

After uploading, verify the files are accessible:

### Using Web Browser
Try accessing a file directly:
```
https://storage.googleapis.com/level-audio-mastering/references/rock-reference.wav
```

If public, it should download. If you get a 403 error, the file is private (which is fine if using signed URLs).

### Using gsutil
```bash
gsutil ls -L gs://level-audio-mastering/references/
```

This will show all files and their metadata.

### Using Frontend
1. Open your Sonic Refine Suite application
2. Navigate to AI Mastering → Genre Presets
3. Select a target file
4. Choose a genre preset (e.g., Rock)
5. Click "Master with AI Preset"
6. The reference should load automatically

If you see an error like "Reference file not found", check:
- File name matches exactly (case-sensitive)
- File is in the `references/` folder
- File has proper permissions

## Troubleshooting

### Error: "Reference file not found"
- **Cause**: File doesn't exist in GCS or wrong path
- **Solution**: Re-upload the file and verify the path

### Error: "Access denied to reference file"
- **Cause**: File permissions not set correctly
- **Solution**: Make file public or implement signed URLs in backend

### Error: "Failed to download reference"
- **Cause**: Network issue or bucket misconfiguration
- **Solution**: Check bucket exists and has correct permissions

### Wrong Mastering Output
- **Cause**: Reference file has poor quality or wrong characteristics
- **Solution**: Replace with a better reference track

## For Collaborators

If you're a collaborator and need to upload references:

1. **Get Access**: Ask the project owner (davidv111111@gmail.com) to grant you Storage Admin access
2. **Set Up gcloud**: Install Google Cloud SDK and authenticate
3. **Upload Files**: Use any method above
4. **Test**: Verify files work in the application

## Security Considerations

### Public vs Private References

**Public References (Easier)**
- ✅ Simple to implement
- ✅ Fast access
- ❌ Anyone can download reference files
- ❌ Uses bandwidth

**Private References with Signed URLs (More Secure)**
- ✅ Controlled access
- ✅ No unauthorized downloads
- ❌ Requires backend endpoint
- ❌ Signed URLs expire

For production, consider:
- Using private files with signed URLs generated by backend
- Implementing caching in the frontend
- Rate limiting downloads

## Cost Considerations

- **Storage**: ~$0.02/GB per month (minimal for 12 WAV files)
- **Bandwidth**: ~$0.12/GB for downloads (only when users select presets)
- **Operations**: Negligible cost for file reads

Expected monthly cost: < $1 for typical usage.

## Updates and Maintenance

To update a reference file:
1. Upload new file with same name (overwrites old one)
2. Clear frontend cache (or wait for cache expiration)
3. Test the updated preset

To add new presets:
1. Upload new reference file to GCS
2. Update `PRESET_REFERENCES` in `frontend/src/utils/presetReferences.ts`
3. Update `genrePresets` in `GenrePresetsMastering.tsx`
4. Redeploy frontend

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify GCS bucket and files exist
3. Test file accessibility directly via URL
4. Contact: davidv111111@gmail.com

---

**Last Updated**: November 2024
**Project**: Sonic Refine Suite - AI Mastering Feature

