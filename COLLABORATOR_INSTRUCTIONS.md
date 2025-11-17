# Collaborator Access & Testing Instructions

## 🌐 Access URLs

### For Testing and Mastering
Your collaborator can access the application through these URLs:

1. **Lovable Preview (Development)**
   - URL: `https://id-preview--7d506715-84dc-4abb-95cb-4ef4492a151b.lovable.app/`
   - Best for: Testing latest changes immediately

2. **Lovable Published (Production)**
   - URL: `https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovable.app/`
   - Best for: Stable production use

3. **Backend API (Cloud Run)**
   - URL: `https://mastering-backend-azkp62xtaq-uc.a.run.app`
   - Status: `https://mastering-backend-azkp62xtaq-uc.a.run.app/health`

4. **GitHub Repository**
   - URL: `https://github.com/davidv111111so/sonic-refine-suite`
   - Latest commit: Successfully pushed

---

## 🎵 AI Mastering Feature - Complete Testing Guide

### Prerequisites
- Admin/Premium account (for reference track uploads up to 150MB)
- Supported audio formats: WAV, MP3, FLAC, AAC
- Recommended: WAV or FLAC for best quality

### Step-by-Step Testing Process

#### 1. Navigate to AI Mastering Tab
- Open any of the access URLs above
- Click on the **"AI Mastering"** tab in the main navigation

#### 2. Upload Your Track (Target)
- Click **"Select Target Audio"** or drag & drop
- Choose the track you want to master
- Wait for upload to complete

#### 3. Choose a Reference
You have two options:

**Option A: Genre Presets (Recommended for beginners)**
- Click on any genre button (Rock, EDM, Jazz, Hip Hop, Classical, etc.)
- The button will glow when a reference track is uploaded to that genre
- Genre names are now synced between "Admin: Reference Track Management" and "Choose a Genre Reference" sections

**Option B: Upload Custom Reference**
- Click **"Upload Reference Track"**
- Select your own professionally mastered reference track
- This gives you more control over the final sound

#### 4. Master Your Track
- Click the **"Master My Track"** button
- Processing typically takes 30-60 seconds depending on file size
- A progress indicator will show the mastering status

#### 5. Download Results
- Once complete, click **"Download Mastered Track"**
- **Important**: The output file will be in the **SAME FORMAT** as your input
  - If you uploaded MP3 → you get MP3 (320kbps)
  - If you uploaded WAV → you get WAV (24-bit)
  - If you uploaded FLAC → you get FLAC (compressed lossless)
- File size will reflect real mastering processing (not same as source)

---

## 🔧 Recent Fixes & Improvements

### 1. **Backend Mastering (100% Real)**
- ✅ Uses Matchering Python library for professional-grade mastering
- ✅ Output format matches input format (preserves quality)
- ✅ Real audio enhancement applied (not just conversion)
- ✅ File sizes reflect actual processing

### 2. **Admin/Premium Features**
- ✅ Reference track upload limit increased to **150MB** (was 100MB)
- ✅ Genre preset names synced between admin and user sections
- ✅ Genre buttons glow when reference track is uploaded

### 3. **Enhance Tab Improvements**
- ✅ "Before" and "After" file sizes update in **real-time**
- ✅ Accurate calculations based on selected format (MP3/WAV/FLAC)
- ✅ Reflects actual bitrate, sample rate, and bit depth settings

### 4. **UI/UX Enhancements**
- ✅ AI Mastering Setup Checker collapsed by default (expandable)
- ✅ Help Guide and Advanced Settings modals now display correctly
- ✅ Fixed gray transparent screen issue
- ✅ Improved modal z-index for proper layering

### 5. **Media Player Stability**
- ✅ Removed crashing "Particles" visualizer mode
- ✅ Added fullscreen toggle button for visualizer
- ✅ Renamed "Fun Visualizer" to "Level Visualizer"
- ✅ Improved playback error handling
- ✅ Fixed upload playback failures

### 6. **Dynamic Range Compressor**
- ✅ All settings are real and applied in real-time
- ✅ Threshold: 0 to -3dB range
- ✅ Ratio: 1 to 4:1 range
- ✅ Attack: 0.1ms to 3ms
- ✅ Release: 0ms to 3ms

---

## 🧪 Testing Checklist for Collaborator

### AI Mastering Tests
- [ ] Upload a WAV file → verify output is WAV
- [ ] Upload an MP3 file → verify output is MP3 (320kbps)
- [ ] Upload a FLAC file → verify output is FLAC
- [ ] Test with genre preset (e.g., Rock)
- [ ] Test with custom reference track
- [ ] Verify genre button glows after uploading reference
- [ ] Check that mastered file sounds enhanced (not just converted)
- [ ] Verify file size is different from source (real processing)

### Enhance Tab Tests
- [ ] Upload multiple files
- [ ] Change output format (MP3 → WAV → FLAC)
- [ ] Verify "After" size updates in real-time
- [ ] Test different sample rates (44.1kHz, 48kHz, 96kHz)
- [ ] Test different bit depths (16-bit, 24-bit)
- [ ] Click "Level" button and verify processing completes

### Media Player Tests
- [ ] Upload a song to media player
- [ ] Verify playback starts successfully
- [ ] Test visualizer modes (Bars, Wave, Circular)
- [ ] Click fullscreen button on visualizer
- [ ] Adjust compressor settings and hear changes
- [ ] Adjust EQ bands and hear changes
- [ ] Test volume control

### Modal Tests
- [ ] Click "Help Guide" button → verify content displays
- [ ] Click "Advanced Settings" button → verify content displays
- [ ] Close modals with X button
- [ ] Close modals by clicking outside

---

## 🚨 Known Issues & Workarounds

### Issue: Processing is slow with "Level" button
**Status**: Optimized but may still show browser prompt on large files
**Workaround**: 
- Use smaller files (under 10MB) for faster processing
- Click "Wait" if browser shows "Page Unresponsive" prompt
- Processing will complete successfully

### Issue: Lovable runtime error (Cannot access 'E' before initialization)
**Status**: Fixed in latest push
**Solution**: Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

---

## 📊 Performance Expectations

### Mastering Times (Approximate)
- Small file (3-5 min, 10-20MB): 20-40 seconds
- Medium file (5-10 min, 20-50MB): 40-90 seconds
- Large file (10+ min, 50-150MB): 90-180 seconds

### File Size Changes
- **MP3 → MP3**: Similar size (±10%)
- **WAV → WAV**: May increase slightly due to 24-bit processing
- **FLAC → FLAC**: Varies based on compression (50-70% of WAV)
- **MP3 → WAV**: Significant increase (5-10x larger)

---

## 🔐 Authentication & Permissions

### Admin Access
- Upload reference tracks up to **150MB**
- Manage genre presets
- Access advanced mastering settings

### Premium Access
- Upload reference tracks up to **150MB**
- All mastering features enabled
- Priority processing (future feature)

### Free Access
- Genre presets available
- Upload target tracks (no limit)
- Standard mastering quality

---

## 📞 Support & Feedback

### Reporting Issues
1. Take a screenshot of the error
2. Note the exact steps to reproduce
3. Check browser console (F12) for error messages
4. Share with development team

### Feature Requests
- Submit via GitHub Issues
- Include use case and expected behavior
- Provide examples if possible

---

## 🎉 Latest Changes Summary

**Date**: November 16, 2025

**Major Updates**:
1. Backend now outputs same format as input (real mastering)
2. Enhance tab shows accurate Before/After file sizes
3. Fixed modal display issues (Help Guide, Advanced Settings)
4. Removed crashing visualizer mode, added fullscreen
5. Improved playback stability
6. Increased admin/premium upload limit to 150MB
7. Synced genre preset names across UI

**All changes pushed to GitHub**: ✅
**Lovable deployment**: Auto-deployed from GitHub

---

## 🔗 Quick Links

- **GitHub**: https://github.com/davidv111111so/sonic-refine-suite
- **Lovable Preview**: https://id-preview--7d506715-84dc-4abb-95cb-4ef4492a151b.lovable.app/
- **Lovable Production**: https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovable.app/
- **Backend Health**: https://mastering-backend-azkp62xtaq-uc.a.run.app/health
- **API Docs**: https://mastering-backend-azkp62xtaq-uc.a.run.app/docs

---

**Ready to test!** 🚀

