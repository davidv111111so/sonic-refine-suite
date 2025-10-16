// Musical Key Detection using Essentia.js and Tonal
// Provides Camelot notation for harmonic mixing

/** Result of key analysis */
export interface KeyAnalysis {
  tonic: string;
  mode: "major" | "minor";
  camelot: string;
  confidence: number;
}

// Map of (tonic + mode) → Camelot notation
const CAMELOT_MAP: Record<string, string> = {
  "C major": "8B",
  "A minor": "8A",
  "G major": "9B",
  "E minor": "9A",
  "D major": "10B",
  "B minor": "10A",
  "A major": "11B",
  "F# minor": "11A",
  "F#m": "11A",
  "E major": "12B",
  "C# minor": "12A",
  "C#m": "12A",
  "B major": "1B",
  "G# minor": "1A",
  "G#m": "1A",
  "F# major": "2B",
  "D# minor": "2A",
  "D#m": "2A",
  "C# major": "3B",
  "A# minor": "3A",
  "A#m": "3A",
  "G# major": "4B",
  "F minor": "4A",
  "D# major": "5B",
  "Eb major": "5B",
  "Bb minor": "5A",
  "C minor": "5A",
  "A# major": "6B",
  "Bb major": "7B",
  "G minor": "6A",
  "F major": "7B"
};

let essentiaInstance: any = null;
let isInitializing = false;

/**
 * Initialize Essentia.js WASM
 * Lazy loads Essentia only when needed
 */
async function initEssentia() {
  if (essentiaInstance) return essentiaInstance;
  if (isInitializing) {
    // Wait for existing initialization
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return essentiaInstance;
  }

  try {
    isInitializing = true;
    
    // Dynamic import of Essentia.js modules
    const { default: Essentia } = await import('essentia.js/dist/essentia.js-core.es.js');
    const { EssentiaWASM } = await import('essentia.js/dist/essentia-wasm.web.js');
    
    // Load WASM module
    const essentiaModule = await EssentiaWASM();
    essentiaInstance = new Essentia(essentiaModule);
    
    return essentiaInstance;
  } catch (error) {
    console.error('Failed to initialize Essentia.js:', error);
    return null;
  } finally {
    isInitializing = false;
  }
}

/**
 * Detect musical key from audio buffer using real Essentia.js analysis
 * @param audioBuffer Float32Array with audio samples (mono or mixed)
 * @param sampleRate number (Hz)
 */
export async function detectKeyFromBuffer(
  audioBuffer: Float32Array,
  sampleRate: number
): Promise<KeyAnalysis> {
  try {
    const essentia = await initEssentia();
    
    if (!essentia) {
      // Fallback if Essentia fails to load
      return {
        tonic: "",
        mode: "minor",
        camelot: "N/A",
        confidence: 0
      };
    }

    // Convert to Essentia vector
    const vectorSignal = essentia.arrayToVector(audioBuffer);

    // Compute chromagram (HPCP - Harmonic Pitch Class Profile)
    const chromaResult = essentia.Chromagram(vectorSignal);
    const chroma = chromaResult.chromagram;

    // Estimate key from chromagram
    const chromaVector = essentia.arrayToVector(chroma);
    const keyResult = essentia.Key(chromaVector);

    // Extract results
    const key = keyResult.key || 'C';
    const scale = keyResult.scale || 'major';
    const strength = keyResult.strength || 0;

    // Map to Camelot notation
    const label = `${key} ${scale}`;
    const camelot = CAMELOT_MAP[label] || CAMELOT_MAP[`${key}${scale === 'minor' ? 'm' : ''}`] || "N/A";

    return {
      tonic: key,
      mode: scale as "major" | "minor",
      camelot,
      confidence: strength
    };
  } catch (error) {
    console.error("Key detection error:", error);
    
    // Return fallback result
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
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Convert to mono Float32Array (mix down if stereo)
    let channelData: Float32Array;
    if (audioBuffer.numberOfChannels === 1) {
      channelData = audioBuffer.getChannelData(0);
    } else {
      // Mix stereo to mono
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      channelData = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        channelData[i] = (left[i] + right[i]) / 2;
      }
    }
    
    const sampleRate = audioBuffer.sampleRate;
    
    return await detectKeyFromBuffer(channelData, sampleRate);
  } catch (error) {
    console.error("Error analyzing file:", error);
    return {
      tonic: "",
      mode: "minor",
      camelot: "N/A",
      confidence: 0
    };
  }
}
