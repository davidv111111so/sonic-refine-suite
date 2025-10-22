/**
 * Musical Key Detection using autocorrelation and chromagram analysis
 * Provides Camelot notation for harmonic mixing
 * 
 * This is a simplified implementation that doesn't rely on Essentia.js
 */

import { Note, Key as TonalKey } from 'tonal';

/** Result of key analysis */
export interface KeyAnalysis {
  tonic: string;
  mode: "major" | "minor";
  camelot: string;
  confidence: number;
}

// Complete Camelot wheel mapping (all 24 keys)
const CAMELOT_MAP: Record<string, string> = {
  // Major keys (B)
  "C major": "8B", "C# major": "3B", "Db major": "3B",
  "D major": "10B", "D# major": "5B", "Eb major": "5B",
  "E major": "12B",
  "F major": "7B", "F# major": "2B", "Gb major": "2B",
  "G major": "9B", "G# major": "4B", "Ab major": "4B",
  "A major": "11B", "A# major": "6B", "Bb major": "6B",
  "B major": "1B",
  
  // Minor keys (A)
  "C minor": "5A", "C# minor": "12A", "Db minor": "12A",
  "D minor": "7A", "D# minor": "2A", "Eb minor": "2A",
  "E minor": "9A",
  "F minor": "4A", "F# minor": "11A", "Gb minor": "11A",
  "G minor": "6A", "G# minor": "1A", "Ab minor": "1A",
  "A minor": "8A", "A# minor": "3A", "Bb minor": "3A",
  "B minor": "10A",
};

/**
 * Calculate chromagram from audio samples using proper FFT
 * Returns energy for each of the 12 pitch classes (C, C#, D, ...)
 */
function calculateChromagram(audioBuffer: Float32Array, sampleRate: number): Float32Array {
  const chromagram = new Float32Array(12);
  const fftSize = 16384; // Even larger FFT (16384) for better frequency resolution
  const hopSize = 8192; // Larger hop for more overlap
  
  // Reference frequency for pitch calculation
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75); // C0 frequency ≈ 16.35 Hz
  
  // Process the audio in overlapping windows with randomization
  const numWindows = Math.floor((audioBuffer.length - fftSize) / hopSize);
  const analyzeEveryN = Math.max(1, Math.floor(numWindows / 10)); // Analyze 10 random windows max
  
  for (let windowIdx = 0; windowIdx < numWindows; windowIdx += analyzeEveryN) {
    // Add randomization: pick a random offset within the hop range
    const randomOffset = Math.floor(Math.random() * hopSize * 0.5);
    const i = windowIdx * hopSize + randomOffset;
    
    if (i + fftSize > audioBuffer.length) break;
    
    const segment = audioBuffer.slice(i, i + fftSize);
    
    // Apply Blackman-Harris window (better than Hamming for musical signals)
    const windowed = new Float32Array(fftSize);
    for (let j = 0; j < fftSize; j++) {
      const a0 = 0.35875;
      const a1 = 0.48829;
      const a2 = 0.14128;
      const a3 = 0.01168;
      const w = a0 - a1 * Math.cos(2 * Math.PI * j / (fftSize - 1))
                  + a2 * Math.cos(4 * Math.PI * j / (fftSize - 1))
                  - a3 * Math.cos(6 * Math.PI * j / (fftSize - 1));
      windowed[j] = segment[j] * w;
    }
    
    // Simple DFT for magnitude spectrum (real audio input)
    for (let bin = 1; bin < fftSize / 2; bin++) {
      const freq = (bin * sampleRate) / fftSize;
      
      // Focus on accurate musical range (60Hz to 5kHz) with emphasis on fundamentals
      if (freq < 60 || freq > 5000) continue;
      
      // Weight lower frequencies more (fundamentals are stronger predictors)
      const freqWeight = freq < 500 ? 2.0 : (freq < 2000 ? 1.5 : 1.0);
      
      // Calculate magnitude from time-domain samples
      let real = 0, imag = 0;
      for (let n = 0; n < fftSize; n++) {
        const angle = (2 * Math.PI * bin * n) / fftSize;
        real += windowed[n] * Math.cos(angle);
        imag += windowed[n] * Math.sin(angle);
      }
      const magnitude = Math.sqrt(real * real + imag * imag) * freqWeight;
      
      // Convert frequency to semitones from C0
      const semitone = 12 * Math.log2(freq / C0);
      const pitchClass = Math.round(semitone) % 12;
      
      // Accumulate weighted energy in the corresponding pitch class
      if (pitchClass >= 0 && pitchClass < 12) {
        chromagram[pitchClass] += magnitude;
      }
    }
  }
  
  // Normalize chromagram
  const maxValue = Math.max(...chromagram);
  if (maxValue > 0) {
    for (let i = 0; i < 12; i++) {
      chromagram[i] /= maxValue;
    }
  }
  
  return chromagram;
}

/**
 * Major and minor key profiles (Krumhansl-Kessler)
 */
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

/**
 * Calculate correlation between chromagram and key profile
 */
function correlate(chromagram: Float32Array, profile: number[], shift: number): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const chromaIdx = (i + shift) % 12;
    sum += chromagram[chromaIdx] * profile[i];
  }
  return sum;
}

/**
 * Detect musical key from audio buffer
 */
export async function detectKeyFromBuffer(
  audioBuffer: Float32Array,
  sampleRate: number
): Promise<KeyAnalysis> {
  try {
    console.log('🎹 Starting key detection (simplified algorithm)...');
    console.log(`📊 Analyzing ${audioBuffer.length} samples @ ${sampleRate}Hz`);

    // Calculate chromagram
    const chromagram = calculateChromagram(audioBuffer, sampleRate);
    console.log('✅ Chromagram computed:', chromagram);

    // Find best matching key
    let bestKey = 0;
    let bestMode: "major" | "minor" = "major";
    let bestScore = -Infinity;

    // Test all 24 keys (12 major + 12 minor)
    for (let shift = 0; shift < 12; shift++) {
      const majorScore = correlate(chromagram, MAJOR_PROFILE, shift);
      const minorScore = correlate(chromagram, MINOR_PROFILE, shift);

      if (majorScore > bestScore) {
        bestScore = majorScore;
        bestKey = shift;
        bestMode = "major";
      }

      if (minorScore > bestScore) {
        bestScore = minorScore;
        bestKey = shift;
        bestMode = "minor";
      }
    }

    // Map to note names
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const tonic = noteNames[bestKey];
    const mode = bestMode;

    // Calculate confidence (0-1)
    const confidence = Math.min(1, bestScore / 10);

    console.log(`🎵 Detected: ${tonic} ${mode} (confidence: ${confidence.toFixed(2)})`);

    // Map to Camelot notation
    const label = `${tonic} ${mode}`;
    const camelot = CAMELOT_MAP[label] || "N/A";

    if (camelot === "N/A") {
      console.warn(`⚠️ No Camelot mapping for: ${label}`);
    } else {
      console.log(`✅ Camelot notation: ${camelot}`);
    }

    return {
      tonic,
      mode,
      camelot,
      confidence
    };
  } catch (error) {
    console.error("❌ Key detection error:", error);
    return {
      tonic: "",
      mode: "minor",
      camelot: "N/A",
      confidence: 0
    };
  }
}

/**
 * Detect key from audio file
 */
export async function detectKeyFromFile(file: File): Promise<KeyAnalysis> {
  console.log(`🎼 Detecting key for file: ${file.name}`);
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    console.log('✅ AudioContext created');
    
    const arrayBuffer = await file.arrayBuffer();
    console.log(`✅ File loaded: ${arrayBuffer.byteLength} bytes`);
    
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log(`✅ Audio decoded: ${audioBuffer.numberOfChannels} channels, ${audioBuffer.duration.toFixed(2)}s`);
    
    // Convert to mono Float32Array
    let channelData: Float32Array;
    if (audioBuffer.numberOfChannels === 1) {
      channelData = audioBuffer.getChannelData(0);
      console.log('✅ Using mono channel data');
    } else {
      // Mix stereo to mono
      console.log('🔄 Mixing stereo to mono...');
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      channelData = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        channelData[i] = (left[i] + right[i]) / 2;
      }
      console.log('✅ Stereo mixed to mono');
    }
    
    // Use only first 30 seconds for faster analysis
    const sampleRate = audioBuffer.sampleRate;
    const maxSamples = Math.min(channelData.length, sampleRate * 30);
    const analysisBuffer = channelData.slice(0, maxSamples);
    
    console.log(`📊 Sample rate: ${sampleRate}Hz`);
    
    const result = await detectKeyFromBuffer(analysisBuffer, sampleRate);
    console.log(`✅ Key detection complete for ${file.name}: ${result.camelot}`);
    
    return result;
  } catch (error) {
    console.error(`❌ Error analyzing file ${file.name}:`, error);
    return {
      tonic: "",
      mode: "minor",
      camelot: "N/A",
      confidence: 0
    };
  }
}
