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
// Complete mapping for all 24 keys (12 major + 12 minor)
const CAMELOT_MAP: Record<string, string> = {
  // Major keys (B)
  "C major": "8B",
  "Db major": "3B",
  "D major": "10B",
  "Eb major": "5B",
  "E major": "12B",
  "F major": "7B",
  "Gb major": "2B",
  "G major": "9B",
  "Ab major": "4B",
  "A major": "11B",
  "Bb major": "6B",
  "B major": "1B",
  
  // Minor keys (A)
  "C minor": "5A",
  "C# minor": "12A",
  "D minor": "7A",
  "D# minor": "2A",
  "E minor": "9A",
  "F minor": "4A",
  "F# minor": "11A",
  "G minor": "6A",
  "G# minor": "1A",
  "A minor": "8A",
  "A# minor": "3A",
  "Bb minor": "5A",
  "B minor": "10A",
  
  // Aliases with sharps/flats
  "C# major": "3B",
  "D# major": "5B",
  "F# major": "2B",
  "G# major": "4B",
  "A# major": "6B",
  "Db minor": "12A",
  "Eb minor": "9A",
  "Gb minor": "11A",
  "Ab minor": "1A",
};

let essentiaInstance: any = null;
let isInitializing = false;

/**
 * Initialize Essentia.js WASM
 * Lazy loads Essentia only when needed
 */
async function initEssentia() {
  if (essentiaInstance) {
    console.log('✅ Essentia already initialized');
    return essentiaInstance;
  }
  
  if (isInitializing) {
    console.log('⏳ Waiting for Essentia initialization...');
    // Wait for existing initialization
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return essentiaInstance;
  }

  try {
    isInitializing = true;
    console.log('🔄 Initializing Essentia.js...');
    
    // Dynamic import of Essentia.js modules
    const { default: Essentia } = await import('essentia.js/dist/essentia.js-core.es.js');
    const { EssentiaWASM } = await import('essentia.js/dist/essentia-wasm.web.js');
    
    console.log('📦 Essentia modules loaded, initializing WASM...');
    
    // Load WASM module
    const essentiaModule = await EssentiaWASM();
    essentiaInstance = new Essentia(essentiaModule);
    
    console.log('✅ Essentia.js initialized successfully');
    return essentiaInstance;
  } catch (error) {
    console.error('❌ Failed to initialize Essentia.js:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
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
    console.log('🎹 Starting key detection...');
    const essentia = await initEssentia();
    
    if (!essentia) {
      console.error('❌ Essentia not available, returning fallback');
      return {
        tonic: "",
        mode: "minor",
        camelot: "N/A",
        confidence: 0
      };
    }

    console.log(`📊 Analyzing audio buffer: ${audioBuffer.length} samples @ ${sampleRate}Hz`);

    // Convert to Essentia vector
    const vectorSignal = essentia.arrayToVector(audioBuffer);
    console.log('✅ Converted to Essentia vector');

    // Compute chromagram (HPCP - Harmonic Pitch Class Profile)
    const chromaResult = essentia.Chromagram(vectorSignal);
    const chroma = chromaResult.chromagram;
    console.log('✅ Chromagram computed');

    // Estimate key from chromagram
    const chromaVector = essentia.arrayToVector(chroma);
    const keyResult = essentia.Key(chromaVector);
    console.log('✅ Key estimation complete');

    // Extract results
    const key = keyResult.key || 'C';
    const scale = keyResult.scale || 'major';
    const strength = keyResult.strength || 0;

    console.log(`🎵 Detected: ${key} ${scale} (strength: ${strength.toFixed(2)})`);

    // Map to Camelot notation
    const label = `${key} ${scale}`;
    const camelot = CAMELOT_MAP[label] || "N/A";
    
    if (camelot === "N/A") {
      console.warn(`⚠️ No Camelot mapping found for: ${label}`);
      console.log('Available mappings:', Object.keys(CAMELOT_MAP));
    } else {
      console.log(`✅ Camelot notation: ${camelot}`);
    }

    return {
      tonic: key,
      mode: scale as "major" | "minor",
      camelot,
      confidence: strength
    };
  } catch (error) {
    console.error("❌ Key detection error:", error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
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
  console.log(`🎼 Detecting key for file: ${file.name}`);
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    console.log('✅ AudioContext created');
    
    const arrayBuffer = await file.arrayBuffer();
    console.log(`✅ File loaded: ${arrayBuffer.byteLength} bytes`);
    
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log(`✅ Audio decoded: ${audioBuffer.numberOfChannels} channels, ${audioBuffer.duration.toFixed(2)}s`);
    
    // Convert to mono Float32Array (mix down if stereo)
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
    
    const sampleRate = audioBuffer.sampleRate;
    console.log(`📊 Sample rate: ${sampleRate}Hz`);
    
    const result = await detectKeyFromBuffer(channelData, sampleRate);
    console.log(`✅ Key detection complete for ${file.name}: ${result.camelot}`);
    
    return result;
  } catch (error) {
    console.error(`❌ Error analyzing file ${file.name}:`, error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    return {
      tonic: "",
      mode: "minor",
      camelot: "N/A",
      confidence: 0
    };
  }
}
