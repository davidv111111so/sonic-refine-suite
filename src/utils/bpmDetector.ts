/**
 * BPM Detection using web-audio-beat-detector
 * Analyzes audio files to detect tempo (Beats Per Minute)
 */

import { analyze } from 'web-audio-beat-detector';
import { getAudioContext } from './audioContextManager';

export interface BPMAnalysis {
  bpm: number;
  confidence: number;
  offset?: number;
}

/**
 * Detect BPM from an audio file
 * Uses Web Audio API directly for fast analysis
 * @param file Audio file to analyze
 * @returns BPM analysis result
 */
export async function detectBPMFromFile(file: File): Promise<BPMAnalysis> {
  try {
    const start = Date.now();

    // Use Web Audio directly for faster analysis
    const audioContext = getAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const tempo = await analyze(audioBuffer);

    console.log(`✅ BPM Detection: ${Math.round(tempo)} BPM (${Date.now() - start}ms)`);

    return {
      bpm: Math.round(tempo),
      confidence: 0.8,
      offset: 0
    };
  } catch (error) {
    console.error('❌ BPM detection failed:', error);
    return { bpm: 120, confidence: 0, offset: 0 }; // Fallback to 120 BPM
  }
}

/**
 * Detect BPM from an AudioBuffer
 * @param audioBuffer AudioBuffer to analyze
 * @returns BPM analysis result
 */
export async function detectBPMFromBuffer(audioBuffer: AudioBuffer): Promise<BPMAnalysis> {
  return new Promise((resolve) => {
    // Phase 4: Offload to Worker
    const worker = new Worker(new URL('../workers/audio.worker.ts', import.meta.url), { type: 'module' });

    // Convert to Float32Array (Channel 0) - Zero Copy if possible
    // Note: getChannelData returns a view, but we must slice or copy to transfer if we want to be safe, 
    // or just post it. structuredClone might handle it.
    const channelData = audioBuffer.getChannelData(0);

    // We send a copy to avoid detaching the buffer used by Player
    const bufferCopy = new Float32Array(channelData);

    worker.postMessage({
      type: 'ANALYZE_BPM',
      buffer: bufferCopy,
      sampleRate: audioBuffer.sampleRate
    }, [bufferCopy.buffer]);

    worker.onmessage = (e) => {
      if (e.data.type === 'BPM_RESULT') {
        console.log(`✅ Worker BPM: ${e.data.bpm}`);
        resolve({
          bpm: e.data.bpm,
          confidence: 0.8,
          offset: 0
        });
        worker.terminate();
      } else if (e.data.type === 'ERROR') {
        console.error(e.data.error);
        resolve({ bpm: 120, confidence: 0 }); // Fallback
        worker.terminate();
      }
    };

    worker.onerror = (err) => {
      console.error("Worker Error:", err);
      resolve({ bpm: 120, confidence: 0 });
      worker.terminate();
    };
  });
}

/**
 * Batch detect BPM for multiple files
 * @param files Array of audio files
 * @param onProgress Callback for progress updates
 * @returns Array of BPM analysis results
 */
export async function batchDetectBPM(
  files: File[],
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<Map<string, BPMAnalysis>> {
  const results = new Map<string, BPMAnalysis>();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (onProgress) {
      onProgress(i + 1, files.length, file.name);
    }

    const analysis = await detectBPMFromFile(file);
    results.set(file.name, analysis);

    // Small delay to prevent overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}
