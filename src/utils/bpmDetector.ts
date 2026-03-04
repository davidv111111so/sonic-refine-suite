/**
 * BPM Detection using web-audio-beat-detector
 * Analyzes audio files to detect tempo (Beats Per Minute)
 */

import { analyze } from 'web-audio-beat-detector';
import { getAudioContext } from './audioContextManager';

export interface BPMAnalysis {
  bpm: number;
  confidence: number;
  offset: number;     // Time of the first beat (downbeat) in seconds
  grid: number[];       // Array of timestamp intervals for the beatgrid
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

    const bpm = Math.round(tempo);
    const interval = 60.0 / bpm;

    // Detect first beat offset looking for loud transients in the first few seconds
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const maxSearchSamples = Math.min(channelData.length, sampleRate * 5); // search first 5 seconds

    let firstPeakIndex = 0;
    let maxEnergy = 0;
    const windowSize = Math.floor(sampleRate * 0.05); // 50ms window

    for (let i = 0; i < maxSearchSamples; i += windowSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        if (i + j < maxSearchSamples) {
          energy += Math.abs(channelData[i + j]);
        }
      }
      if (energy > maxEnergy) {
        maxEnergy = energy;
        firstPeakIndex = i;
      }
    }

    // Refine peak exactly
    let refinedIndex = firstPeakIndex;
    let localMax = 0;
    for (let i = firstPeakIndex; i < firstPeakIndex + windowSize && i < maxSearchSamples; i++) {
      if (channelData[i] > localMax) {
        localMax = channelData[i];
        refinedIndex = i;
      }
    }

    let offset = refinedIndex / sampleRate;

    // Build beatgrid up to the duration of the track
    const grid: number[] = [];
    let currentBeat = offset;
    while (currentBeat < audioBuffer.duration) {
      grid.push(currentBeat);
      currentBeat += interval;
    }

    return {
      bpm,
      confidence: 0.8,
      offset,
      grid
    };
  } catch (error) {
    console.error('❌ BPM detection failed:', error);
    return { bpm: 120, confidence: 0, offset: 0, grid: [] }; // Fallback to 120 BPM
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
        const bpm = e.data.bpm;
        const interval = 60.0 / bpm;
        const offset = 0; // Worker doesn't calculate offset yet
        const grid: number[] = [];
        let currentBeat = offset;
        while (currentBeat < audioBuffer.duration) {
          grid.push(currentBeat);
          currentBeat += interval;
        }

        resolve({
          bpm,
          confidence: 0.8,
          offset,
          grid
        });
        worker.terminate();
      } else if (e.data.type === 'ERROR') {
        console.error(e.data.error);
        resolve({ bpm: 120, confidence: 0, offset: 0, grid: [] }); // Fallback
        worker.terminate();
      }
    };

    worker.onerror = (err) => {
      console.error("Worker Error:", err);
      resolve({ bpm: 120, confidence: 0, offset: 0, grid: [] });
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
