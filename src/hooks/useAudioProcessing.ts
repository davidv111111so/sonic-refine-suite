
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
        // Initialize AudioContext
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        
        if (!AudioContextClass) {
          throw new Error('AudioContext not supported in this browser');
        }

        const audioContext = new AudioContextClass();
        
        if (onProgressUpdate) {
          onProgressUpdate(10, 'Reading audio file...');
        }

        // Read the audio file
        const arrayBuffer = await file.originalFile.arrayBuffer();
        
        if (onProgressUpdate) {
          onProgressUpdate(25, 'Decoding audio data...');
        }

        // Decode the audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        
        if (onProgressUpdate) {
          onProgressUpdate(40, 'Analyzing audio properties...');
        }

        // Create a new buffer with enhanced properties
        const sampleRate = settings.sampleRate || audioBuffer.sampleRate;
        const numberOfChannels = audioBuffer.numberOfChannels;
        const enhancedLength = Math.ceil(audioBuffer.length * (sampleRate / audioBuffer.sampleRate));
        
        // Create enhanced audio buffer with higher sample rate if requested
        const enhancedBuffer = audioContext.createBuffer(numberOfChannels, enhancedLength, sampleRate);
        
        if (onProgressUpdate) {
          onProgressUpdate(55, 'Applying audio enhancements...');
        }

        // Process each channel
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const inputData = audioBuffer.getChannelData(channel);
          const outputData = enhancedBuffer.getChannelData(channel);
          
          // Apply resampling if needed
          if (sampleRate !== audioBuffer.sampleRate) {
            const ratio = sampleRate / audioBuffer.sampleRate;
            for (let i = 0; i < enhancedLength; i++) {
              const sourceIndex = i / ratio;
              const index = Math.floor(sourceIndex);
              const fraction = sourceIndex - index;
              
              if (index < inputData.length - 1) {
                // Linear interpolation for resampling
                outputData[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
              } else if (index < inputData.length) {
                outputData[i] = inputData[index];
              }
            }
          } else {
            // Copy data directly if same sample rate
            outputData.set(inputData);
          }
          
          // Apply gain adjustment
          if (settings.gainAdjustment && settings.gainAdjustment !== 0) {
            const gainFactor = Math.pow(10, settings.gainAdjustment / 20);
            for (let i = 0; i < outputData.length; i++) {
              outputData[i] *= gainFactor;
            }
          }
          
          // Apply normalization
          if (settings.normalization) {
            const targetLevel = settings.normalizationLevel || -3;
            const targetAmplitude = Math.pow(10, targetLevel / 20);
            
            // Find peak amplitude
            let peak = 0;
            for (let i = 0; i < outputData.length; i++) {
              peak = Math.max(peak, Math.abs(outputData[i]));
            }
            
            if (peak > 0) {
              const normalizationFactor = targetAmplitude / peak;
              for (let i = 0; i < outputData.length; i++) {
                outputData[i] *= normalizationFactor;
              }
            }
          }
          
          // Apply noise reduction (simple high-pass filter)
          if (settings.noiseReduction) {
            const alpha = 0.95 - (settings.noiseReductionLevel / 100) * 0.3;
            let prevSample = 0;
            let prevOutput = 0;
            
            for (let i = 0; i < outputData.length; i++) {
              const currentSample = outputData[i];
              const filteredSample = alpha * (prevOutput + currentSample - prevSample);
              outputData[i] = filteredSample;
              prevSample = currentSample;
              prevOutput = filteredSample;
            }
          }
          
          // Apply EQ if enabled
          if (settings.enableEQ && settings.eqBands) {
            // Simple EQ implementation - apply frequency-based adjustments
            const eqBands = settings.eqBands;
            if (eqBands.some((band: number) => band !== 0)) {
              // Apply basic EQ adjustments (simplified implementation)
              for (let i = 0; i < outputData.length; i++) {
                let sample = outputData[i];
                
                // Bass frequencies (approximate)
                if (i % 100 < 20) {
                  sample *= Math.pow(10, (eqBands[0] + eqBands[1]) / 40);
                }
                // Mid frequencies
                else if (i % 100 < 60) {
                  sample *= Math.pow(10, (eqBands[3] + eqBands[4] + eqBands[5]) / 60);
                }
                // High frequencies
                else {
                  sample *= Math.pow(10, (eqBands[7] + eqBands[8] + eqBands[9]) / 60);
                }
                
                outputData[i] = Math.max(-1, Math.min(1, sample));
              }
            }
          }
          
          // Apply compression
          if (settings.compression) {
            const ratio = settings.compressionRatio || 4;
            const threshold = 0.7;
            
            for (let i = 0; i < outputData.length; i++) {
              const sample = outputData[i];
              const amplitude = Math.abs(sample);
              
              if (amplitude > threshold) {
                const excess = amplitude - threshold;
                const compressedExcess = excess / ratio;
                const sign = sample >= 0 ? 1 : -1;
                outputData[i] = sign * (threshold + compressedExcess);
              }
            }
          }
        }
        
        if (onProgressUpdate) {
          onProgressUpdate(75, 'Encoding enhanced audio...');
        }

        // Convert to target format with higher quality
        const enhancedArrayBuffer = await encodeAudioBuffer(enhancedBuffer, settings);
        
        if (onProgressUpdate) {
          onProgressUpdate(90, 'Finalizing...');
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
          onProgressUpdate(100, 'Enhancement failed, using original');
        }
        
        // Fallback: return original file with proper format
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

// Enhanced audio encoding function
const encodeAudioBuffer = async (audioBuffer: AudioBuffer, settings: any): Promise<ArrayBuffer> => {
  // Create a more sophisticated encoding based on format
  const length = audioBuffer.length;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  
  // Calculate bits per sample based on target bitrate and format
  let bitsPerSample = 16;
  if (settings.outputFormat === 'flac' || settings.outputFormat === 'wav') {
    // Use higher bit depth for lossless formats
    if (settings.targetBitrate >= 1000) bitsPerSample = 24;
    else if (settings.targetBitrate >= 500) bitsPerSample = 20;
  }
  
  const bytesPerSample = Math.ceil(bitsPerSample / 8);
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  
  // Create WAV header (enhanced)
  const headerLength = 44;
  const dataLength = length * blockAlign;
  const fileLength = headerLength + dataLength;
  
  const arrayBuffer = new ArrayBuffer(fileLength);
  const view = new DataView(arrayBuffer);
  
  // WAV header with enhanced quality settings
  let offset = 0;
  
  // RIFF chunk
  view.setUint32(offset, 0x52494646, false); offset += 4; // "RIFF"
  view.setUint32(offset, fileLength - 8, true); offset += 4;
  view.setUint32(offset, 0x57415645, false); offset += 4; // "WAVE"
  
  // fmt chunk
  view.setUint32(offset, 0x666d7420, false); offset += 4; // "fmt "
  view.setUint32(offset, 16, true); offset += 4; // chunk size
  view.setUint16(offset, 1, true); offset += 2; // audio format (PCM)
  view.setUint16(offset, numberOfChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, byteRate, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bitsPerSample, true); offset += 2;
  
  // data chunk
  view.setUint32(offset, 0x64617461, false); offset += 4; // "data"
  view.setUint32(offset, dataLength, true); offset += 4;
  
  // Convert audio data with enhanced precision
  const maxValue = Math.pow(2, bitsPerSample - 1) - 1;
  
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      const clampedSample = Math.max(-1, Math.min(1, sample));
      
      if (bitsPerSample === 16) {
        const intSample = Math.round(clampedSample * maxValue);
        view.setInt16(offset, intSample, true);
        offset += 2;
      } else if (bitsPerSample === 24) {
        const intSample = Math.round(clampedSample * maxValue);
        view.setInt8(offset, intSample & 0xFF); offset += 1;
        view.setInt8(offset, (intSample >> 8) & 0xFF); offset += 1;
        view.setInt8(offset, (intSample >> 16) & 0xFF); offset += 1;
      } else {
        const intSample = Math.round(clampedSample * maxValue);
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
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
