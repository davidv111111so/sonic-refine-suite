
import { useCallback, useState } from 'react';
import { AudioFile } from '@/types/audio';

export const useAdvancedAudioProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processAudioFile = useCallback(async (
    file: AudioFile, 
    settings: any,
    onProgressUpdate?: (progress: number, stage: string) => void
  ): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      let audioContext: AudioContext | null = null;
      
      try {
        console.log('Starting audio processing for:', file.name);
        
        if (onProgressUpdate) {
          onProgressUpdate(5, 'Initializing audio context...');
        }

        // Create audio context with original sample rate to maintain BPM
        const arrayBuffer = await file.originalFile.arrayBuffer();
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        if (onProgressUpdate) {
          onProgressUpdate(15, 'Decoding audio data...');
        }

        // Decode the audio with proper error handling
        let audioBuffer;
        try {
          audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        } catch (decodeError) {
          console.error('Audio decoding error:', decodeError);
          
          // Try to handle common audio format issues
          if (decodeError.name === 'EncodingError' || decodeError.message.includes('Unable to decode')) {
            // Try creating a copy of the array buffer
            const clonedBuffer = arrayBuffer.slice(0);
            try {
              audioBuffer = await audioContext.decodeAudioData(clonedBuffer);
            } catch (secondError) {
              console.error('Second decode attempt failed:', secondError);
              throw new Error(`Audio processing failed: ${decodeError.message || 'Unable to decode audio data'}`);
            }
          } else {
            throw new Error(`Audio processing failed: ${decodeError.message || 'Unable to decode audio data'}`);
          }
        }
        
        const originalSampleRate = audioBuffer.sampleRate;
        
        if (onProgressUpdate) {
          onProgressUpdate(30, 'Applying Perfect Audio enhancements...');
        }

        // Create offline context with ORIGINAL sample rate to maintain BPM
        const offlineContext = new OfflineAudioContext(
          audioBuffer.numberOfChannels,
          audioBuffer.length,
          originalSampleRate // Keep original sample rate
        );

        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        let currentNode: AudioNode = source;

        if (onProgressUpdate) {
          onProgressUpdate(50, 'Processing audio effects...');
        }

        // Apply enhancements only if Perfect Audio is enabled
        if (settings.enableEQ && settings.eqBands) {
          currentNode = await applyEqualizer(offlineContext, currentNode, settings.eqBands);
        }

        if (settings.noiseReduction && settings.noiseReduction > 0) {
          currentNode = applyNoiseReduction(offlineContext, currentNode, settings.noiseReduction);
        }

        if (settings.compression && settings.compression > 0) {
          currentNode = applyCompression(offlineContext, currentNode, settings.compression);
        }

        if (settings.bassBoost !== 0) {
          currentNode = applyBassBoost(offlineContext, currentNode, settings.bassBoost);
        }

        if (settings.trebleBoost !== 0) {
          currentNode = applyTrebleBoost(offlineContext, currentNode, settings.trebleBoost);
        }

        if (onProgressUpdate) {
          onProgressUpdate(75, 'Finalizing audio...');
        }

        // Connect to destination
        currentNode.connect(offlineContext.destination);
        source.start();

        // Render the audio
        const renderedBuffer = await offlineContext.startRendering();
        
        if (onProgressUpdate) {
          onProgressUpdate(90, 'Encoding output...');
        }

        // Convert to blob with chunked processing to prevent crashes
        const blob = await audioBufferToBlob(renderedBuffer, settings.outputFormat || 'wav');
        
        if (onProgressUpdate) {
          onProgressUpdate(100, 'Enhancement complete!');
        }

        // Clean up
        if (audioContext.state !== 'closed') {
          await audioContext.close();
        }

        resolve(blob);
        
      } catch (error) {
        console.error('Audio processing error:', error);
        
        // Clean up on error
        if (audioContext && audioContext.state !== 'closed') {
          try {
            await audioContext.close();
          } catch (closeError) {
            console.warn('Error closing audio context:', closeError);
          }
        }
        
        if (onProgressUpdate) {
          onProgressUpdate(100, 'Enhancement failed');
        }
        
        reject(new Error(`Audio processing failed: ${error.message}`));
      }
    });
  }, []);

  return { processAudioFile, isProcessing, setIsProcessing };
};

// Helper functions for audio processing
const applyEqualizer = async (context: OfflineAudioContext, input: AudioNode, eqBands: number[]): Promise<AudioNode> => {
  const frequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  let currentNode = input;

  for (let i = 0; i < eqBands.length && i < frequencies.length; i++) {
    if (eqBands[i] !== 0) {
      const filter = context.createBiquadFilter();
      
      if (i === 0) {
        filter.type = 'lowshelf';
      } else if (i === frequencies.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
        filter.Q.value = 1.0;
      }
      
      filter.frequency.value = frequencies[i];
      filter.gain.value = eqBands[i];
      
      currentNode.connect(filter);
      currentNode = filter;
    }
  }

  return currentNode;
};

const applyNoiseReduction = (context: OfflineAudioContext, input: AudioNode, level: number): AudioNode => {
  const filter = context.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = Math.min(200, level * 2);
  filter.Q.value = 0.7;
  
  input.connect(filter);
  return filter;
};

const applyCompression = (context: OfflineAudioContext, input: AudioNode, ratio: number): AudioNode => {
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -20;
  compressor.knee.value = 5;
  compressor.ratio.value = Math.max(1, ratio / 10);
  compressor.attack.value = 0.005;
  compressor.release.value = 0.1;
  
  input.connect(compressor);
  return compressor;
};

const applyBassBoost = (context: OfflineAudioContext, input: AudioNode, boost: number): AudioNode => {
  const filter = context.createBiquadFilter();
  filter.type = 'lowshelf';
  filter.frequency.value = 200;
  filter.gain.value = boost;
  
  input.connect(filter);
  return filter;
};

const applyTrebleBoost = (context: OfflineAudioContext, input: AudioNode, boost: number): AudioNode => {
  const filter = context.createBiquadFilter();
  filter.type = 'highshelf';
  filter.frequency.value = 3000;
  filter.gain.value = boost;
  
  input.connect(filter);
  return filter;
};

// Chunked audio buffer to blob conversion to prevent crashes
const audioBufferToBlob = async (audioBuffer: AudioBuffer, format: string): Promise<Blob> => {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  
  // Use 16-bit for compatibility and smaller file size
  const bytesPerSample = 2;
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  
  const headerLength = 44;
  const dataLength = length * blockAlign;
  const fileLength = headerLength + dataLength;
  
  const arrayBuffer = new ArrayBuffer(fileLength);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  let offset = 0;
  view.setUint32(offset, 0x52494646, false); offset += 4; // "RIFF"
  view.setUint32(offset, fileLength - 8, true); offset += 4;
  view.setUint32(offset, 0x57415645, false); offset += 4; // "WAVE"
  view.setUint32(offset, 0x666d7420, false); offset += 4; // "fmt "
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2; // PCM
  view.setUint16(offset, numberOfChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, byteRate, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, 16, true); offset += 2; // 16-bit
  view.setUint32(offset, 0x64617461, false); offset += 4; // "data"
  view.setUint32(offset, dataLength, true); offset += 4;
  
  // Convert audio data in chunks to prevent blocking
  const chunkSize = 4096;
  const maxValue = 32767;
  
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
    
    // Yield control every chunk to prevent blocking
    if (i % (chunkSize * 10) === 0) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
};
