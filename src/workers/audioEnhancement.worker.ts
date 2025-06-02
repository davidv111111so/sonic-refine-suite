
// Web Worker for audio processing to prevent main thread blocking
self.onmessage = async function(e) {
  const { fileData, settings, fileId } = e.data;
  
  try {
    console.log('Worker: Starting audio processing for file:', fileId);
    
    // Post progress update
    self.postMessage({ type: 'progress', fileId, progress: 10, stage: 'Initializing...' });
    
    // Initialize AudioContext
    const AudioContextClass = self.AudioContext || self.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('AudioContext not supported');
    }
    
    const audioContext = new AudioContextClass();
    
    self.postMessage({ type: 'progress', fileId, progress: 20, stage: 'Reading audio file...' });
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(fileData.slice(0));
    
    self.postMessage({ type: 'progress', fileId, progress: 40, stage: 'Processing audio...' });
    
    // Process audio with simplified algorithms
    const enhancedBuffer = await processAudioSimple(audioBuffer, audioContext, settings, fileId);
    
    self.postMessage({ type: 'progress', fileId, progress: 80, stage: 'Encoding audio...' });
    
    // Encode result
    const enhancedArrayBuffer = await encodeAudioSimple(enhancedBuffer, settings);
    
    self.postMessage({ type: 'progress', fileId, progress: 100, stage: 'Complete' });
    
    // Send result back
    self.postMessage({ 
      type: 'complete', 
      fileId, 
      result: enhancedArrayBuffer 
    });
    
    await audioContext.close();
    
  } catch (error) {
    console.error('Worker: Audio processing error:', error);
    self.postMessage({ 
      type: 'error', 
      fileId, 
      error: error.message 
    });
  }
};

// Simplified audio processing with aggressive chunking
async function processAudioSimple(audioBuffer: AudioBuffer, audioContext: AudioContext, settings: any, fileId: string) {
  const sampleRate = settings.sampleRate || audioBuffer.sampleRate;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const enhancedLength = Math.ceil(audioBuffer.length * (sampleRate / audioBuffer.sampleRate));
  
  const enhancedBuffer = audioContext.createBuffer(numberOfChannels, enhancedLength, sampleRate);
  
  // Very small chunks for better yielding
  const chunkSize = 1024;
  
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = enhancedBuffer.getChannelData(channel);
    
    for (let start = 0; start < enhancedLength; start += chunkSize) {
      const end = Math.min(start + chunkSize, enhancedLength);
      
      // Simple processing per chunk
      for (let i = start; i < end; i++) {
        let sample = 0;
        
        // Basic resampling
        if (sampleRate !== audioBuffer.sampleRate) {
          const sourceIndex = i * (audioBuffer.sampleRate / sampleRate);
          const index = Math.floor(sourceIndex);
          sample = index < inputData.length ? inputData[index] : 0;
        } else {
          sample = i < inputData.length ? inputData[i] : 0;
        }
        
        // Apply gain if specified
        if (settings.gainAdjustment) {
          const gainFactor = Math.pow(10, settings.gainAdjustment / 20);
          sample *= gainFactor;
        }
        
        // Clamp
        outputData[i] = Math.max(-1, Math.min(1, sample));
      }
      
      // Yield control every chunk
      if (start % (chunkSize * 4) === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
        self.postMessage({ 
          type: 'progress', 
          fileId, 
          progress: 40 + (start / enhancedLength) * 35, 
          stage: `Processing channel ${channel + 1}/${numberOfChannels}...` 
        });
      }
    }
  }
  
  return enhancedBuffer;
}

// Simplified encoding
async function encodeAudioSimple(audioBuffer: AudioBuffer, settings: any): Promise<ArrayBuffer> {
  const length = audioBuffer.length;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  
  const bitsPerSample = 16;
  const bytesPerSample = 2;
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  
  const headerLength = 44;
  const dataLength = length * blockAlign;
  const fileLength = headerLength + dataLength;
  
  const arrayBuffer = new ArrayBuffer(fileLength);
  const view = new DataView(arrayBuffer);
  
  let offset = 0;
  
  // WAV header
  view.setUint32(offset, 0x52494646, false); offset += 4; // "RIFF"
  view.setUint32(offset, fileLength - 8, true); offset += 4;
  view.setUint32(offset, 0x57415645, false); offset += 4; // "WAVE"
  view.setUint32(offset, 0x666d7420, false); offset += 4; // "fmt "
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, numberOfChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, byteRate, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bitsPerSample, true); offset += 2;
  view.setUint32(offset, 0x64617461, false); offset += 4; // "data"
  view.setUint32(offset, dataLength, true); offset += 4;
  
  // Convert audio data
  const maxValue = 32767;
  
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      const clampedSample = Math.max(-1, Math.min(1, sample));
      const intSample = Math.round(clampedSample * maxValue);
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
    
    // Yield occasionally during encoding
    if (i % 4096 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
  
  return arrayBuffer;
}
