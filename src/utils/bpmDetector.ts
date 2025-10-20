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
 * @param file Audio file to analyze
 * @returns BPM analysis result
 */
export async function detectBPMFromFile(file: File): Promise<BPMAnalysis> {
  try {
    const audioContext = getAudioContext();
    
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Analyze tempo using web-audio-beat-detector
    const tempo = await analyze(audioBuffer);
    
    const roundedBPM = Math.round(tempo);
    
    console.log(`✅ BPM Detection: ${roundedBPM} BPM for file "${file.name}"`);
    
    return {
      bpm: roundedBPM,
      confidence: 0.8, // web-audio-beat-detector doesn't provide confidence, using default
      offset: undefined
    };
  } catch (error) {
    console.error('❌ BPM detection failed:', error);
    
    // Return a fallback value
    return {
      bpm: 120, // Default tempo
      confidence: 0,
      offset: undefined
    };
  }
}

/**
 * Detect BPM from an AudioBuffer
 * @param audioBuffer AudioBuffer to analyze
 * @returns BPM analysis result
 */
export async function detectBPMFromBuffer(audioBuffer: AudioBuffer): Promise<BPMAnalysis> {
  try {
    const tempo = await analyze(audioBuffer);
    const roundedBPM = Math.round(tempo);
    
    console.log(`✅ BPM Detection: ${roundedBPM} BPM`);
    
    return {
      bpm: roundedBPM,
      confidence: 0.8,
      offset: undefined
    };
  } catch (error) {
    console.error('❌ BPM detection failed:', error);
    
    return {
      bpm: 120,
      confidence: 0,
      offset: undefined
    };
  }
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
