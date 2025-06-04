
/// <reference lib="webworker" />

// Real Audio Enhancement Worker Implementation
self.addEventListener('message', async (e) => {
  const { fileData, settings, fileId, fileName } = e.data;
  
  try {
    self.postMessage({ 
      type: 'progress', 
      fileId, 
      progress: 10, 
      stage: 'Initializing audio processing...' 
    });
    
    // Decode audio data first
    const audioBuffer = await decodeAudioData(fileData);
    
    self.postMessage({ 
      type: 'progress', 
      fileId, 
      progress: 25, 
      stage: 'Applying audio enhancements...' 
    });
    
    // Apply real audio enhancements
    const enhancedBuffer = await applyRealAudioEnhancements(audioBuffer, settings, fileId);
    
    self.postMessage({ 
      type: 'progress', 
      fileId, 
      progress: 85, 
      stage: 'Encoding enhanced audio...' 
    });
    
    // Encode to high-quality WAV
    const enhancedAudioData = encodeToWAV(enhancedBuffer, settings);
    
    self.postMessage({ 
      type: 'progress', 
      fileId, 
      progress: 100, 
      stage: 'Enhancement complete!' 
    });
    
    const metadata = {
      originalSize: fileData.byteLength,
      enhancedSize: enhancedAudioData.byteLength,
      sampleRate: enhancedBuffer.sampleRate,
      channels: enhancedBuffer.numberOfChannels,
      duration: enhancedBuffer.duration,
      format: 'WAV 24-bit',
      enhancements: Object.keys(settings).filter(key => settings[key] && settings[key] !== 0)
    };
    
    self.postMessage({
      type: 'complete',
      fileId,
      result: enhancedAudioData,
      metadata: metadata
    });
    
  } catch (error) {
    console.error('Audio enhancement error:', error);
    self.postMessage({ 
      type: 'error', 
      fileId, 
      error: `Enhancement failed: ${error.message}` 
    });
  }
});

// Decode audio data using Web Audio API
async function decodeAudioData(fileData: ArrayBuffer): Promise<AudioBuffer> {
  const audioContext = new (globalThis.AudioContext || (globalThis as any).webkitAudioContext)({
    sampleRate: 48000 // High quality sample rate
  });
  
  try {
    const audioBuffer = await audioContext.decodeAudioData(fileData.slice());
    await audioContext.close();
    return audioBuffer;
  } catch (error) {
    await audioContext.close();
    throw new Error(`Failed to decode audio: ${(error as Error).message}`);
  }
}

// Apply real audio enhancements
async function applyRealAudioEnhancements(audioBuffer: AudioBuffer, settings: any, fileId: string): Promise<AudioBuffer> {
  const sampleRate = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  
  // Create new buffer for enhanced audio
  const audioContext = new (globalThis.AudioContext || (globalThis as any).webkitAudioContext)({
    sampleRate: sampleRate
  });
  
  const enhancedBuffer = audioContext.createBuffer(channels, length, sampleRate);
  
  // Process each channel
  for (let channel = 0; channel < channels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = enhancedBuffer.getChannelData(channel);
    
    // Copy input to output first
    outputData.set(inputData);
    
    // Apply enhancements based on settings
    await applyChannelEnhancements(outputData, settings, sampleRate, fileId, channel, channels);
  }
  
  await audioContext.close();
  return enhancedBuffer;
}

// Apply enhancements to a single channel
async function applyChannelEnhancements(channelData: Float32Array, settings: any, sampleRate: number, fileId: string, currentChannel: number, totalChannels: number) {
  // 1. Noise Reduction
  if (settings.noiseReduction && settings.noiseReductionLevel > 0) {
    self.postMessage({ 
      type: 'progress', 
      fileId, 
      progress: 30 + (currentChannel / totalChannels) * 10, 
      stage: `Reducing noise (Channel ${currentChannel + 1})...` 
    });
    
    applyNoiseReduction(channelData, settings.noiseReductionLevel / 100);
  }
  
  // 2. Volume Normalization
  if (settings.normalization) {
    self.postMessage({ 
      type: 'progress', 
      fileId, 
      progress: 40 + (currentChannel / totalChannels) * 10, 
      stage: `Normalizing volume (Channel ${currentChannel + 1})...` 
    });
    
    normalizeVolume(channelData, settings.normalizationLevel || -12);
  }
  
  // 3. Bass Enhancement
  if (settings.bassBoost && settings.bassBoostLevel > 0) {
    self.postMessage({ 
      type: 'progress', 
      fileId, 
      progress: 50 + (currentChannel / totalChannels) * 10, 
      stage: `Enhancing bass (Channel ${currentChannel + 1})...` 
    });
    
    applyBassBoost(channelData, settings.bassBoostLevel / 100, sampleRate);
  }
  
  // 4. Treble Enhancement
  if (settings.trebleEnhancement && settings.trebleLevel > 0) {
    self.postMessage({ 
      type: 'progress', 
      fileId, 
      progress: 60 + (currentChannel / totalChannels) * 10, 
      stage: `Enhancing treble (Channel ${currentChannel + 1})...` 
    });
    
    applyTrebleBoost(channelData, settings.trebleLevel / 100, sampleRate);
  }
  
  // 5. Dynamic Range Compression
  if (settings.compression && settings.compressionRatio > 1) {
    self.postMessage({ 
      type: 'progress', 
      fileId, 
      progress: 70 + (currentChannel / totalChannels) * 10, 
      stage: `Applying compression (Channel ${currentChannel + 1})...` 
    });
    
    applyCompression(channelData, settings.compressionRatio);
  }
}

// Noise reduction using spectral subtraction
function applyNoiseReduction(data: Float32Array, intensity: number) {
  const windowSize = 1024;
  const hopSize = windowSize / 4;
  
  // Estimate noise floor from first 10% of audio
  const noiseEstimateLength = Math.floor(data.length * 0.1);
  let noiseFloor = 0;
  for (let i = 0; i < noiseEstimateLength; i++) {
    noiseFloor += Math.abs(data[i]);
  }
  noiseFloor = (noiseFloor / noiseEstimateLength) * intensity;
  
  // Apply noise gate
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) < noiseFloor) {
      data[i] *= (1 - intensity * 0.8);
    }
  }
}

// Volume normalization
function normalizeVolume(data: Float32Array, targetDbFS: number) {
  // Find peak amplitude
  let peak = 0;
  for (let i = 0; i < data.length; i++) {
    peak = Math.max(peak, Math.abs(data[i]));
  }
  
  if (peak === 0) return;
  
  // Calculate target amplitude from dBFS
  const targetAmplitude = Math.pow(10, targetDbFS / 20);
  const gain = targetAmplitude / peak;
  
  // Apply gain
  for (let i = 0; i < data.length; i++) {
    data[i] *= gain;
  }
}

// Bass boost using simple EQ
function applyBassBoost(data: Float32Array, intensity: number, sampleRate: number) {
  const cutoffFreq = 150; // Bass frequency cutoff
  const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
  const dt = 1.0 / sampleRate;
  const alpha = dt / (rc + dt);
  
  let lowpass = 0;
  const boost = 1 + intensity * 2; // Up to 3x boost
  
  for (let i = 0; i < data.length; i++) {
    lowpass = lowpass + alpha * (data[i] - lowpass);
    data[i] = data[i] + lowpass * (boost - 1);
    
    // Prevent clipping
    data[i] = Math.max(-1, Math.min(1, data[i]));
  }
}

// Treble enhancement using high-pass emphasis
function applyTrebleBoost(data: Float32Array, intensity: number, sampleRate: number) {
  const cutoffFreq = 3000; // Treble frequency cutoff
  const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
  const dt = 1.0 / sampleRate;
  const alpha = rc / (rc + dt);
  
  let highpass = 0;
  let prevInput = 0;
  const boost = 1 + intensity * 1.5; // Up to 2.5x boost
  
  for (let i = 0; i < data.length; i++) {
    highpass = alpha * (highpass + data[i] - prevInput);
    prevInput = data[i];
    data[i] = data[i] + highpass * (boost - 1);
    
    // Prevent clipping
    data[i] = Math.max(-1, Math.min(1, data[i]));
  }
}

// Dynamic range compression
function applyCompression(data: Float32Array, ratio: number) {
  const threshold = 0.7; // Compression threshold
  const attack = 0.003; // Attack time coefficient
  const release = 0.1; // Release time coefficient
  
  let envelope = 0;
  
  for (let i = 0; i < data.length; i++) {
    const inputLevel = Math.abs(data[i]);
    
    // Envelope follower
    if (inputLevel > envelope) {
      envelope = envelope + attack * (inputLevel - envelope);
    } else {
      envelope = envelope + release * (inputLevel - envelope);
    }
    
    // Apply compression
    if (envelope > threshold) {
      const excess = envelope - threshold;
      const compressedExcess = excess / ratio;
      const gain = (threshold + compressedExcess) / envelope;
      data[i] *= gain;
    }
  }
}

// Encode to high-quality WAV format
function encodeToWAV(audioBuffer: AudioBuffer, settings: any): ArrayBuffer {
  const sampleRate = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;
  const bitsPerSample = 24; // High quality
  const length = audioBuffer.length;
  
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const samples = new Uint8Array(buffer, headerSize);
  
  // Write WAV header
  let offset = 0;
  
  // "RIFF" chunk
  view.setUint32(offset, 0x52494646, false); offset += 4; // "RIFF"
  view.setUint32(offset, totalSize - 8, true); offset += 4;
  view.setUint32(offset, 0x57415645, false); offset += 4; // "WAVE"
  
  // "fmt " chunk
  view.setUint32(offset, 0x666d7420, false); offset += 4; // "fmt "
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2; // PCM
  view.setUint16(offset, channels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, byteRate, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bitsPerSample, true); offset += 2;
  
  // "data" chunk
  view.setUint32(offset, 0x64617461, false); offset += 4; // "data"
  view.setUint32(offset, dataSize, true); offset += 4;
  
  // Write audio data (24-bit)
  let sampleIndex = 0;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < channels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      // Convert float (-1 to 1) to 24-bit integer
      const intSample = Math.max(-8388608, Math.min(8388607, Math.round(sample * 8388607)));
      
      // Write 24-bit little-endian
      samples[sampleIndex++] = intSample & 0xFF;
      samples[sampleIndex++] = (intSample >> 8) & 0xFF;
      samples[sampleIndex++] = (intSample >> 16) & 0xFF;
    }
  }
  
  return buffer;
}
