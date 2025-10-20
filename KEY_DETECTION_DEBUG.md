# Key Detection Debugging Guide

## ✅ Expected Behavior

When uploading audio files, the system should:
1. Show a loading toast: "Analyzing X files..."
2. Detect BPM and musical key for each file
3. Convert key to Camelot notation (e.g., "8A", "5B")
4. Display results in the track list table

## 🔍 How to Debug

### Step 1: Open Browser Console

Press `F12` or `Cmd+Option+I` (Mac) to open developer tools.

### Step 2: Upload a File and Watch the Logs

Look for these log messages in order:

```
📝 Starting analysis for: [filename]
✅ AudioContext created
✅ File loaded: [bytes] bytes
✅ Audio decoded: [channels] channels, [duration]s
✅ Using mono channel data (or: Mixing stereo to mono...)
📊 Sample rate: [Hz]Hz
🎹 Starting key detection...
🔄 Initializing Essentia.js... (or: ✅ Essentia already initialized)
📦 Essentia modules loaded, initializing WASM...
✅ Essentia.js initialized successfully
📊 Analyzing audio buffer: [samples] samples @ [Hz]Hz
✅ Converted to Essentia vector
✅ Chromagram computed
✅ Key estimation complete
🎵 Detected: [key] [major/minor] (strength: [0-1])
✅ Camelot notation: [XX]
✅ Key detection complete for [filename]: [Camelot]
✅ BPM detected: [number] for [filename]
```

### Step 3: Check for Errors

#### If you see: `❌ Failed to initialize Essentia.js`
**Problem**: Essentia.js WASM module failed to load.

**Solutions**:
1. Check your internet connection
2. Clear browser cache and reload
3. Try a different browser (Chrome/Firefox recommended)
4. Check if WASM is supported: `WebAssembly` should be defined in console

#### If you see: `❌ Essentia not available, returning fallback`
**Problem**: Essentia couldn't initialize, returning "N/A" for all keys.

**Solutions**:
1. Refresh the page and try again
2. Check for Content Security Policy (CSP) blocking WASM
3. Ensure HTTPS is being used (required for some WASM features)

#### If you see: `⚠️ No Camelot mapping found for: [key] [scale]`
**Problem**: Essentia detected a key but it's not in our Camelot mapping.

**Solutions**:
1. Note the exact key/scale in the console
2. This is a rare edge case - the key might be enharmonic (e.g., "C#" vs "Db")
3. Report this to the developer with the console log

#### If you see: `⚠️ Key detection returned N/A`
**Problem**: Detection completed but no valid key was found.

**Possible Causes**:
- Audio file is too short
- Audio is very noisy or percussive (no clear pitch)
- File is corrupted
- Audio format is not fully supported

## 🎹 Camelot Wheel Reference

The Camelot Wheel is used for harmonic mixing:

### Major Keys (B)
- 1B = B Major
- 2B = F# Major (Gb Major)
- 3B = Db Major (C# Major)
- 4B = Ab Major (G# Major)
- 5B = Eb Major (D# Major)
- 6B = Bb Major (A# Major)
- 7B = F Major
- 8B = C Major
- 9B = G Major
- 10B = D Major
- 11B = A Major
- 12B = E Major

### Minor Keys (A)
- 1A = G# Minor (Ab Minor)
- 2A = D# Minor (Eb Minor)
- 3A = A# Minor (Bb Minor)
- 4A = F Minor
- 5A = C Minor (Bb Minor)
- 6A = G Minor
- 7A = D Minor
- 8A = A Minor
- 9A = E Minor
- 10A = B Minor
- 11A = F# Minor (Gb Minor)
- 12A = C# Minor (Db Minor)

## 🔧 Technical Details

### Detection Process
1. **Load Audio**: Read file as ArrayBuffer
2. **Decode**: Use Web Audio API to decode to PCM
3. **Mix to Mono**: If stereo, average left/right channels
4. **Chromagram**: Essentia computes HPCP (Harmonic Pitch Class Profile)
5. **Key Estimation**: Essentia's Key algorithm analyzes chromagram
6. **Camelot Mapping**: Convert musical key to Camelot notation

### Dependencies
- **Essentia.js**: Music analysis library with WASM backend
- **web-audio-beat-detector**: BPM detection
- **Web Audio API**: Browser audio processing

### Supported Audio Formats
- MP3 (best support)
- WAV (best support)
- FLAC (good support)
- Other formats depend on browser codec support

## 🚀 Performance Tips

1. **File Size**: Smaller files analyze faster (< 10MB recommended)
2. **Batch Upload**: Analyzing multiple files runs in parallel (batches of 3)
3. **Audio Quality**: Higher quality = more accurate detection
4. **File Format**: WAV files are fastest to decode

## 📊 Accuracy Notes

- **BPM Detection**: ~95% accurate for electronic/pop music
- **Key Detection**: ~85% accurate, lower for:
  - Very percussive tracks (drums only)
  - Atonal/experimental music
  - Very short clips (< 30 seconds)
  - Heavy distortion or noise

## 🆘 Still Having Issues?

1. Check browser console for red error messages
2. Copy the entire console log
3. Note which file is failing
4. Try with a simple, clean audio file first (e.g., piano melody)
5. Report the issue with console logs attached
