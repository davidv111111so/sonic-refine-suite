
import { useCallback, useState } from 'react';
import { AudioFile } from '@/pages/Index';

// Extend the Window interface to include webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export const useAudioProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{[key: string]: {progress: number, stage: string}}>({});

  const processAudioFile = useCallback(async (
    file: AudioFile, 
    settings: any,
    onProgressUpdate?: (progress: number, stage: string) => void
  ): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (onProgressUpdate) {
          onProgressUpdate(10, 'Initializing...');
        }

        // Add a small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 100));

        // Initialize AudioContext with error handling
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        
        if (!AudioContextClass) {
          throw new Error('AudioContext not supported in this browser');
        }

        const audioContext = new AudioContextClass();
        
        if (onProgressUpdate) {
          onProgressUpdate(20, 'Reading audio file...');
        }

        // Add delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 50));

        // Read the audio file with timeout
        const arrayBuffer = await Promise.race([
          file.originalFile.arrayBuffer(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('File read timeout')), 10000))
        ]) as ArrayBuffer;
        
        if (onProgressUpdate) {
          onProgressUpdate(35, 'Decoding audio...');
        }

        // Add delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 50));

        // Decode the audio data with timeout
        const audioBuffer = await Promise.race([
          audioContext.decodeAudioData(arrayBuffer.slice(0)),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Audio decode timeout')), 15000))
        ]) as AudioBuffer;
        
        if (onProgressUpdate) {
          onProgressUpdate(50, 'Processing audio...');
        }

        // Process audio in chunks to prevent blocking
        const enhancedBuffer = await processAudioInChunks(audioBuffer, audioContext, settings, onProgressUpdate);
        
        if (onProgressUpdate) {
          onProgressUpdate(80, 'Encoding audio...');
        }

        // Add delay before encoding
        await new Promise(resolve => setTimeout(resolve, 100));

        // Convert to target format
        const enhancedArrayBuffer = await encodeAudioBuffer(enhancedBuffer, settings);
        
        if (onProgressUpdate) {
          onProgressUpdate(95, 'Finalizing...');
        }

        // Close audio context to free resources
        await audioContext.close();
        
        if (onProgressUpdate) {
          onProgressUpdate(100, 'Complete');
        }

        const enhancedBlob = new Blob([enhancedArrayBuffer], { 
          type: getOutputMimeType(settings.outputFormat) 
        });
        
        resolve(enhancedBlob);
        
      } catch (error) {
        console.error('Audio processing error:', error);
        
        if (onProgressUpdate) {
          onProgressUpdate(100, 'Using original file');
        }
        
        // Fallback: return original file
        try {
          const arrayBuffer = await file.originalFile.arrayBuffer();
          const fallbackBlob = new Blob([arrayBuffer], { 
            type: getOutputMimeType(settings.outputFormat) 
          });
          resolve(fallbackBlob);
        } catch (fallbackError) {
          reject(fallbackError);
        }
      }
    });
  }, []);

  const getProgressInfo = useCallback((fileId: string) => {
    return processingProgress[fileId] || { progress: 0, stage: 'Preparing...' };
  }, [processingProgress]);

  return { 
    processAudioFile, 
    isProcessing, 
    setIsProcessing,
    getProgressInfo
  };
};

// Process audio in chunks to prevent main thread blocking
const processAudioInChunks = async (
  audioBuffer: AudioBuffer, 
  audioContext: AudioContext, 
  settings: any,
  onProgressUpdate?: (progress: number, stage: string) => void
): Promise<AudioBuffer> => {
  const sampleRate = settings.sampleRate || audioBuffer.sampleRate;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const enhancedLength = Math.ceil(audioBuffer.length * (sampleRate / audioBuffer.sampleRate));
  
  // Create enhanced audio buffer
  const enhancedBuffer = audioContext.createBuffer(numberOfChannels, enhancedLength, sampleRate);
  
  const chunkSize = 8192; // Process in smaller chunks
  
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = enhancedBuffer.getChannelData(channel);
    
    // Process channel in chunks
    for (let start = 0; start < enhancedLength; start += chunkSize) {
      const end = Math.min(start + chunkSize, enhancedLength);
      
      // Apply basic resampling and processing
      for (let i = start; i < end; i++) {
        let sample = 0;
        
        if (sampleRate !== audioBuffer.sampleRate) {
          // Simple resampling
          const sourceIndex = i * (audioBuffer.sampleRate / sampleRate);
          const index = Math.floor(sourceIndex);
          
          if (index < inputData.length) {
            sample = inputData[index];
          }
        } else {
          if (i < inputData.length) {
            sample = inputData[i];
          }
        }
        
        // Apply gain adjustment
        if (settings.gainAdjustment && settings.gainAdjustment !== 0) {
          const gainFactor = Math.pow(10, settings.gainAdjustment / 20);
          sample *= gainFactor;
        }
        
        // Apply simple compression
        if (settings.compression && Math.abs(sample) > 0.7) {
          const ratio = settings.compressionRatio || 4;
          const sign = sample >= 0 ? 1 : -1;
          const compressed = 0.7 + (Math.abs(sample) - 0.7) / ratio;
          sample = sign * compressed;
        }
        
        // Clamp sample
        outputData[i] = Math.max(-1, Math.min(1, sample));
      }
      
      // Update progress and yield control
      if (onProgressUpdate && start % (chunkSize * 4) === 0) {
        const progress = 50 + (start / enhancedLength) * 25;
        onProgressUpdate(progress, `Processing channel ${channel + 1}/${numberOfChannels}...`);
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
  }
  
  return enhancedBuffer;
};

// Simplified audio encoding
const encodeAudioBuffer = async (audioBuffer: AudioBuffer, settings: any): Promise<ArrayBuffer> => {
  const length = audioBuffer.length;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  
  // Use 16-bit for better compatibility
  const bitsPerSample = 16;
  const bytesPerSample = 2;
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  
  // Create WAV file
  const headerLength = 44;
  const dataLength = length * blockAlign;
  const fileLength = headerLength + dataLength;
  
  const arrayBuffer = new ArrayBuffer(fileLength);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  let offset = 0;
  
  // RIFF chunk
  view.setUint32(offset, 0x52494646, false); offset += 4; // "RIFF"
  view.setUint32(offset, fileLength - 8, true); offset += 4;
  view.setUint32(offset, 0x57415645, false); offset += 4; // "WAVE"
  
  // fmt chunk
  view.setUint32(offset, 0x666d7420, false); offset += 4; // "fmt "
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2; // PCM
  view.setUint16(offset, numberOfChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, byteRate, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bitsPerSample, true); offset += 2;
  
  // data chunk
  view.setUint32(offset, 0x64617461, false); offset += 4; // "data"
  view.setUint32(offset, dataLength, true); offset += 4;
  
  // Convert audio data
  const maxValue = 32767; // 16-bit max
  
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      const clampedSample = Math.max(-1, Math.min(1, sample));
      const intSample = Math.round(clampedSample * maxValue);
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }
  
  return arrayBuffer;
};

const getOutputMimeType = (format: string): string => {
  switch (format) {
    case 'mp3': return 'audio/mpeg';
    case 'flac': return 'audio/flac';
    case 'ogg': return 'audio/ogg';
    case 'wav': return 'audio/wav';
    default: return 'audio/wav';
  }
};
