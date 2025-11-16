export interface EnhancementSettings {
  targetBitrate: number;
  sampleRate: number;
  noiseReduction: boolean;
  noiseReductionLevel: number;
  normalization: boolean;
  normalizationLevel: number;
  compression: boolean;
  compressionRatio: number;
  outputFormat: string;
  gainAdjustment: number;
  enableEQ: boolean;
  eqBands: number[];
}

export const generateFFmpegCommand = (
  inputFile: string,
  outputFile: string,
  settings: EnhancementSettings,
): string => {
  const filters: string[] = [];

  // 1. Noise Reduction (using afftdn filter for spectral noise reduction)
  if (settings.noiseReduction) {
    const noiseReduction = Math.min(
      (settings.noiseReductionLevel / 100) * 30,
      30,
    ); // Max 30dB reduction
    filters.push(`afftdn=nt=w:om=o:tn=1:nr=${noiseReduction}`);
  }

  // 2. EQ bands (10-band equalizer)
  if (settings.enableEQ && settings.eqBands.some((band) => band !== 0)) {
    const eqFreqs = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    const eqFilters = settings.eqBands
      .map((gain, i) =>
        gain !== 0
          ? `equalizer=f=${eqFreqs[i]}:width_type=h:width=200:g=${gain}`
          : null,
      )
      .filter(Boolean);
    filters.push(...eqFilters);
  }

  // 3. Vocal clarity enhancement (enhancing 1-4kHz range for speech)
  filters.push("equalizer=f=2000:width_type=h:width=1000:g=2"); // Boost vocal presence

  // 4. Dynamic compression for consistency
  if (settings.compression) {
    const ratio = settings.compressionRatio;
    const threshold = -18; // dB
    const attack = 5; // ms
    const release = 50; // ms
    filters.push(
      `acompressor=threshold=${threshold}dB:ratio=${ratio}:attack=${attack}:release=${release}`,
    );
  }

  // 5. Gain adjustment (before normalization)
  if (settings.gainAdjustment !== 0) {
    filters.push(`volume=${settings.gainAdjustment}dB`);
  }

  // 6. Normalization (loudness normalization to target LUFS)
  if (settings.normalization) {
    const targetLUFS = settings.normalizationLevel; // e.g., -23 for broadcast, -16 for streaming
    filters.push(`loudnorm=I=${targetLUFS}:TP=-1.5:LRA=11`);
  }

  // 7. Final limiter to prevent clipping and maximize loudness
  filters.push(
    "alimiter=level_in=1:level_out=0.95:limit=0.95:attack=5:release=50",
  );

  // Build the complete FFmpeg command
  const audioFilter = filters.length > 0 ? `-af "${filters.join(",")}"` : "";

  // Audio codec and quality settings
  let codecSettings = "";
  switch (settings.outputFormat) {
    case "mp3":
      codecSettings = `-c:a libmp3lame -b:a ${settings.targetBitrate}k -q:a 0`;
      break;
    case "flac":
      codecSettings = `-c:a flac -compression_level 8`;
      break;
    case "wav":
      codecSettings = `-c:a pcm_s24le`;
      break;
    case "ogg":
      codecSettings = `-c:a libvorbis -b:a ${settings.targetBitrate}k`;
      break;
    default:
      codecSettings = `-c:a libmp3lame -b:a ${settings.targetBitrate}k`;
  }

  return `ffmpeg -i "${inputFile}" ${audioFilter} -ar ${settings.sampleRate} ${codecSettings} -y "${outputFile}"`;
};

export const getExpectedFileSize = (
  originalSize: number,
  originalDuration: number,
  settings: EnhancementSettings,
): number => {
  // Calculate expected file size based on new settings
  const durationMinutes = originalDuration / 60;

  let estimatedSize: number;

  switch (settings.outputFormat) {
    case "mp3":
    case "ogg":
      // For compressed formats: bitrate * duration
      estimatedSize = (settings.targetBitrate * 1000 * originalDuration) / 8; // Convert to bytes
      break;
    case "flac":
      // FLAC typically 50-60% of WAV size
      estimatedSize = settings.sampleRate * 2 * 2 * originalDuration * 0.55; // 16-bit stereo, 55% compression
      break;
    case "wav":
      // Uncompressed: sample_rate * bit_depth * channels * duration
      estimatedSize = settings.sampleRate * 3 * 2 * originalDuration; // 24-bit stereo
      break;
    default:
      estimatedSize = originalSize * 1.5;
  }

  return Math.round(estimatedSize);
};

export const validateEnhancementSettings = (
  settings: EnhancementSettings,
): string[] => {
  const issues: string[] = [];

  if (settings.targetBitrate < 128) {
    issues.push(
      "Bitrate too low for quality enhancement (minimum 128 kbps recommended)",
    );
  }

  if (settings.sampleRate < 44100) {
    issues.push(
      "Sample rate too low for quality enhancement (minimum 44.1 kHz recommended)",
    );
  }

  if (settings.noiseReductionLevel > 80) {
    issues.push(
      "High noise reduction may cause artifacts (recommended: 50-70%)",
    );
  }

  if (Math.abs(settings.gainAdjustment) > 12) {
    issues.push(
      "Excessive gain adjustment may cause distortion (recommended: ±6dB)",
    );
  }

  return issues;
};

// Professional presets based on audio content type
export const professionalPresets = {
  "Music Mastering": {
    targetBitrate: 320,
    sampleRate: 96000,
    noiseReduction: true,
    noiseReductionLevel: 30,
    normalization: true,
    normalizationLevel: -16, // Streaming loudness standard
    compression: true,
    compressionRatio: 3,
    outputFormat: "flac",
    gainAdjustment: 0,
    enableEQ: true,
    eqBands: [1, 0.5, 0, 0, 0.5, 1, 1.5, 1, 0.5, 0],
  },
  "Podcast/Voice": {
    targetBitrate: 192,
    sampleRate: 48000,
    noiseReduction: true,
    noiseReductionLevel: 60,
    normalization: true,
    normalizationLevel: -16,
    compression: true,
    compressionRatio: 4,
    outputFormat: "mp3",
    gainAdjustment: 3,
    enableEQ: true,
    eqBands: [-3, -2, 0, 2, 4, 3, 2, 1, -1, -2],
  },
  "Vinyl Restoration": {
    targetBitrate: 320,
    sampleRate: 96000,
    noiseReduction: true,
    noiseReductionLevel: 70,
    normalization: true,
    normalizationLevel: -18,
    compression: true,
    compressionRatio: 2.5,
    outputFormat: "flac",
    gainAdjustment: 2,
    enableEQ: true,
    eqBands: [2, 1, 0, -0.5, 0, 1, 2, 1.5, 0, -1],
  },
  "Live Recording": {
    targetBitrate: 320,
    sampleRate: 48000,
    noiseReduction: true,
    noiseReductionLevel: 50,
    normalization: true,
    normalizationLevel: -14,
    compression: true,
    compressionRatio: 3.5,
    outputFormat: "wav",
    gainAdjustment: 1,
    enableEQ: true,
    eqBands: [0.5, 0, 0, 1, 1.5, 2, 1.5, 1, 0.5, 0],
  },
};
