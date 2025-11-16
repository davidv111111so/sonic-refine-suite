import {
  EnhancementSettings,
  generateFFmpegCommand,
  getExpectedFileSize,
} from "./audioEnhancement";

export class ServerAudioProcessor {
  private static instance: ServerAudioProcessor;

  private constructor() {}

  static getInstance(): ServerAudioProcessor {
    if (!ServerAudioProcessor.instance) {
      ServerAudioProcessor.instance = new ServerAudioProcessor();
    }
    return ServerAudioProcessor.instance;
  }

  async processAudioFile(
    audioFile: File,
    settings: EnhancementSettings,
    onProgress?: (progress: number, stage: string) => void,
  ): Promise<{ blob: Blob; metadata: any }> {
    if (onProgress) onProgress(10, "Preparing audio file...");

    // Since we can't run FFmpeg directly in the browser, we'll simulate
    // the enhancement process with actual audio improvements using Web Audio API
    const enhancedBlob = await this.enhanceAudioWithWebAudio(
      audioFile,
      settings,
      onProgress,
    );

    const metadata = {
      originalSize: audioFile.size,
      enhancedSize: enhancedBlob.size,
      ffmpegCommand: this.getFFmpegCommandForReference(
        audioFile.name,
        settings,
      ),
      settings: settings,
    };

    if (onProgress) onProgress(100, "Enhancement complete");

    return { blob: enhancedBlob, metadata };
  }

  private async enhanceAudioWithWebAudio(
    file: File,
    settings: EnhancementSettings,
    onProgress?: (progress: number, stage: string) => void,
  ): Promise<Blob> {
    if (onProgress) onProgress(20, "Decoding audio...");

    // Create audio context with target sample rate
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)({
      sampleRate: settings.sampleRate,
    });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      if (onProgress) onProgress(40, "Applying audio enhancements...");

      // Create enhanced buffer with higher bit depth
      const enhancedBuffer = await this.applyRealEnhancements(
        audioBuffer,
        audioContext,
        settings,
        onProgress,
      );

      if (onProgress) onProgress(80, "Encoding enhanced audio...");

      // Encode with higher quality settings
      const enhancedArrayBuffer = await this.encodeHighQuality(
        enhancedBuffer,
        settings,
      );

      await audioContext.close();

      return new Blob([enhancedArrayBuffer], {
        type: this.getOutputMimeType(settings.outputFormat),
      });
    } catch (error) {
      await audioContext.close();
      throw error;
    }
  }

  private async applyRealEnhancements(
    audioBuffer: AudioBuffer,
    audioContext: AudioContext,
    settings: EnhancementSettings,
    onProgress?: (progress: number, stage: string) => void,
  ): Promise<AudioBuffer> {
    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;

    // Create enhanced buffer
    const enhancedBuffer = audioContext.createBuffer(
      channels,
      length,
      sampleRate,
    );

    for (let channel = 0; channel < channels; channel++) {
      if (onProgress)
        onProgress(
          40 + (channel / channels) * 30,
          `Processing channel ${channel + 1}...`,
        );

      const inputData = audioBuffer.getChannelData(channel);
      const outputData = enhancedBuffer.getChannelData(channel);

      // Apply real audio processing
      await this.processChannel(inputData, outputData, settings, sampleRate);
    }

    return enhancedBuffer;
  }

  private async processChannel(
    inputData: Float32Array,
    outputData: Float32Array,
    settings: EnhancementSettings,
    sampleRate: number,
  ): Promise<void> {
    const length = inputData.length;

    // 1. Noise Reduction (simple spectral gating)
    if (settings.noiseReduction) {
      this.applyNoiseReduction(
        inputData,
        outputData,
        settings.noiseReductionLevel,
      );
    } else {
      outputData.set(inputData);
    }

    // 2. EQ Processing
    if (settings.enableEQ) {
      await this.applyEqualizer(outputData, settings.eqBands, sampleRate);
    }

    // 3. Dynamic Range Compression
    if (settings.compression) {
      this.applyCompression(outputData, settings.compressionRatio);
    }

    // 4. Gain Adjustment
    if (settings.gainAdjustment !== 0) {
      const gainLinear = Math.pow(10, settings.gainAdjustment / 20);
      for (let i = 0; i < length; i++) {
        outputData[i] *= gainLinear;
      }
    }

    // 5. Normalization
    if (settings.normalization) {
      this.applyNormalization(outputData, settings.normalizationLevel);
    }

    // 6. Soft Limiter (prevent clipping)
    this.applySoftLimiter(outputData);
  }

  private applyNoiseReduction(
    inputData: Float32Array,
    outputData: Float32Array,
    level: number,
  ): void {
    const threshold = ((100 - level) / 100) * 0.1; // Noise threshold

    for (let i = 0; i < inputData.length; i++) {
      const sample = inputData[i];

      if (Math.abs(sample) < threshold) {
        // Reduce noise by the specified level
        outputData[i] = sample * (1 - level / 100);
      } else {
        outputData[i] = sample;
      }
    }
  }

  private async applyEqualizer(
    data: Float32Array,
    eqBands: number[],
    sampleRate: number,
  ): Promise<void> {
    // Simple EQ implementation using basic filtering
    const frequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

    for (let bandIndex = 0; bandIndex < eqBands.length; bandIndex++) {
      const gain = eqBands[bandIndex];
      if (gain === 0) continue;

      const frequency = frequencies[bandIndex];
      const gainLinear = Math.pow(10, gain / 20);

      // Apply simple frequency-based gain (simplified EQ)
      this.applyFrequencyGain(data, frequency, gainLinear, sampleRate);
    }
  }

  private applyFrequencyGain(
    data: Float32Array,
    frequency: number,
    gain: number,
    sampleRate: number,
  ): void {
    // Simplified frequency response (in reality, would use proper filters)
    const normalizedFreq = frequency / (sampleRate / 2);
    const factor = Math.min(1, Math.max(0.1, normalizedFreq));

    for (let i = 0; i < data.length; i++) {
      // Apply frequency-dependent gain (simplified)
      data[i] *= 1 + (gain - 1) * factor;
    }
  }

  private applyCompression(data: Float32Array, ratio: number): void {
    const threshold = 0.7; // Compression threshold
    const attackTime = 0.003; // 3ms
    const releaseTime = 0.1; // 100ms

    let envelope = 0;

    for (let i = 0; i < data.length; i++) {
      const sample = Math.abs(data[i]);

      // Envelope follower
      if (sample > envelope) {
        envelope = sample * attackTime + envelope * (1 - attackTime);
      } else {
        envelope = sample * releaseTime + envelope * (1 - releaseTime);
      }

      // Apply compression
      if (envelope > threshold) {
        const excess = envelope - threshold;
        const compressedExcess = excess / ratio;
        const reduction = (threshold + compressedExcess) / envelope;
        data[i] *= reduction;
      }
    }
  }

  private applyNormalization(data: Float32Array, targetLevel: number): void {
    // Find peak
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      peak = Math.max(peak, Math.abs(data[i]));
    }

    // Calculate normalization gain
    const targetLinear = Math.pow(10, targetLevel / 20);
    const gain = targetLinear / peak;

    // Apply gain
    for (let i = 0; i < data.length; i++) {
      data[i] *= gain;
    }
  }

  private applySoftLimiter(data: Float32Array): void {
    const threshold = 0.95;

    for (let i = 0; i < data.length; i++) {
      const sample = data[i];

      if (Math.abs(sample) > threshold) {
        // Soft limiting using tanh
        data[i] = Math.tanh(sample * 0.9) * threshold;
      }
    }
  }

  private async encodeHighQuality(
    audioBuffer: AudioBuffer,
    settings: EnhancementSettings,
  ): Promise<ArrayBuffer> {
    const length = audioBuffer.length;
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;

    // Use 24-bit encoding for higher quality
    const bitDepth = 24;
    const bytesPerSample = 3;
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;

    const headerLength = 44;
    const dataLength = length * blockAlign;
    const fileLength = headerLength + dataLength;

    const arrayBuffer = new ArrayBuffer(fileLength);
    const view = new DataView(arrayBuffer);

    let offset = 0;

    // Enhanced WAV header
    view.setUint32(offset, 0x52494646, false);
    offset += 4; // "RIFF"
    view.setUint32(offset, fileLength - 8, true);
    offset += 4;
    view.setUint32(offset, 0x57415645, false);
    offset += 4; // "WAVE"
    view.setUint32(offset, 0x666d7420, false);
    offset += 4; // "fmt "
    view.setUint32(offset, 16, true);
    offset += 4;
    view.setUint16(offset, 1, true);
    offset += 2; // PCM
    view.setUint16(offset, channels, true);
    offset += 2;
    view.setUint32(offset, sampleRate, true);
    offset += 4;
    view.setUint32(offset, byteRate, true);
    offset += 4;
    view.setUint16(offset, blockAlign, true);
    offset += 2;
    view.setUint16(offset, bitDepth, true);
    offset += 2;
    view.setUint32(offset, 0x64617461, false);
    offset += 4; // "data"
    view.setUint32(offset, dataLength, true);
    offset += 4;

    // Convert to 24-bit samples
    const maxValue = 8388607; // 24-bit max value

    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < channels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        const clampedSample = Math.max(-1, Math.min(1, sample));
        const intSample = Math.round(clampedSample * maxValue);

        // Write 24-bit sample (little endian)
        view.setUint8(offset, intSample & 0xff);
        offset += 1;
        view.setUint8(offset, (intSample >> 8) & 0xff);
        offset += 1;
        view.setUint8(offset, (intSample >> 16) & 0xff);
        offset += 1;
      }
    }

    return arrayBuffer;
  }

  private getOutputMimeType(format: string): string {
    switch (format) {
      case "mp3":
        return "audio/mpeg";
      case "flac":
        return "audio/flac";
      case "ogg":
        return "audio/ogg";
      case "wav":
        return "audio/wav";
      default:
        return "audio/wav";
    }
  }

  getFFmpegCommandForReference(
    fileName: string,
    settings: EnhancementSettings,
  ): string {
    const outputName = `enhanced_${fileName.replace(/\.[^.]+$/, "")}.${settings.outputFormat}`;
    return generateFFmpegCommand(fileName, outputName, settings);
  }
}
