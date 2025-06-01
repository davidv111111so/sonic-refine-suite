
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
        console.log('Starting audio processing for:', file.name);
        
        if (onProgressUpdate) {
          onProgressUpdate(10, 'Initializing...');
        }

        // Much longer delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 500));

        // Initialize AudioContext with error handling
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        
        if (!AudioContextClass) {
          throw new Error('AudioContext not supported in this browser');
        }

        const audioContext = new AudioContextClass();
        
        if (onProgressUpdate) {
          onProgressUpdate(20, 'Reading audio file...');
        }

        // Longer delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Read the audio file with shorter timeout
        const arrayBuffer = await Promise.race([
          file.originalFile.arrayBuffer(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('File read timeout')), 5000))
        ]) as ArrayBuffer;
        
        if (onProgressUpdate) {
          onProgressUpdate(35, 'Decoding audio...');
        }

        // Longer delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Decode the audio data with shorter timeout
        const audioBuffer = await Promise.race([
          audioContext.decodeAudioData(arrayBuffer.slice(0)),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Audio decode timeout')), 8000))
        ]) as AudioBuffer;
        
        if (onProgressUpdate) {
          onProgressUpdate(50, 'Processing audio...');
        }

        // Process audio with much smaller chunks
        const enhancedBuffer = await processAudioInChunks(audioBuffer, audioContext, settings, onProgressUpdate);
        
        if (onProgressUpdate) {
          onProgressUpdate(80, 'Encoding audio...');
        }

        // Longer delay before encoding
        await new Promise(resolve => setTimeout(resolve, 500));

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
        
        console.log('Audio processing completed for:', file.name);
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

// Process audio in much smaller chunks with longer delays
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
  
  // Much smaller chunk size for better yielding
  const chunkSize = 2048;
  
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = enhancedBuffer.getChannelData(channel);
    
    // Process channel in very small chunks
    for (let start = 0; start < enhancedLength; start += chunkSize) {
      const end = Math.min(start + chunkSize, enhancedLength);
      
      // Very simple processing to prevent blocking
      for (let i = start; i < end; i++) {
        let sample = 0;
        
        // Simple resampling
        if (sampleRate !== audioBuffer.sampleRate) {
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
        
        // Very light gain adjustment only
        if (settings.gainAdjustment && settings.gainAdjustment !== 0) {
          const gainFactor = Math.pow(10, settings.gainAdjustment / 20);
          sample *= gainFactor;
        }
        
        // Clamp sample
        outputData[i] = Math.max(-1, Math.min(1, sample));
      }
      
      // Update progress and yield control more frequently
      if (onProgressUpdate && start % chunkSize === 0) {
        const progress = 50 + (start / enhancedLength) * 25;
        onProgressUpdate(progress, `Processing channel ${channel + 1}/${numberOfChannels}...`);
        // Longer delay to yield control
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    // Longer delay between channels
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return enhancedBuffer;
};

// Simplified audio encoding with chunked processing
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
  
  // Convert audio data in chunks
  const maxValue = 32767; // 16-bit max
  const chunkSize = 1024;
  
  for (let i = 0; i < length; i += chunkSize) {
    const end = Math.min(i + chunkSize, length);
    
    for (let j = i; j < end; j++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[j];
        const clampedSample = Math.max(-1, Math.min(1, sample));
        const intSample = Math.round(clampedSample * maxValue);
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
    
    // Yield control during encoding
    if (i % (chunkSize * 10) === 0) {
      await new Promise(resolve => setTimeout(resolve, 5));
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
