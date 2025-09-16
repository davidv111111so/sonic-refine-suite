// Audio processing utilities for v2.0
// Updated to remove M4A support and implement WAV default with MP3 preservation

export interface ProcessingSettings {
  outputFormat: 'wav' | 'mp3' | 'flac';
  sampleRate: number;
  bitDepth: 16 | 24;
  bitrate?: number; // For MP3 only
  noiseReduction: number;
  noiseReductionEnabled: boolean;
  normalize: boolean;
  normalizeLevel: number;
  bassBoost: number;
  trebleEnhancement: number;
  compression: number;
  compressionEnabled: boolean;
  gainAdjustment: number;
  stereoWidening: number;
  stereoWideningEnabled: boolean;
  eqBands: number[];
  enableEQ: boolean;
}

export const getDefaultSettings = (inputFile: File): ProcessingSettings => {
  const fileExtension = inputFile.name.toLowerCase().split('.').pop();
  
  return {
    outputFormat: fileExtension === 'mp3' ? 'mp3' : 'wav', // Preserve MP3, default to WAV
    sampleRate: 44100, // Always default to 44.1kHz
    bitDepth: 16, // Always default to 16-bit
    bitrate: 320, // Default MP3 bitrate
    noiseReduction: 50,
    noiseReductionEnabled: false,
    normalize: true,
    normalizeLevel: -3,
    bassBoost: 0,
    trebleEnhancement: 0,
    compression: 4,
    compressionEnabled: false,
    gainAdjustment: 0,
    stereoWidening: 25,
    stereoWideningEnabled: false,
    eqBands: [0, 0, 0, 0, 0], // 5-band EQ
    enableEQ: true
  };
};

export const validateFileFormat = (file: File): boolean => {
  const supportedFormats = ['mp3', 'wav', 'flac']; // v2.0 supports MP3, WAV, and FLAC
  const extension = file.name.toLowerCase().split('.').pop();
  return supportedFormats.includes(extension || '');
};

export const getFileType = (filename: string): 'mp3' | 'wav' | 'flac' | 'unsupported' => {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'mp3') return 'mp3';
  if (ext === 'wav') return 'wav';
  if (ext === 'flac') return 'flac';
  return 'unsupported';
};

// Conversion endpoints (placeholder for backend integration)
export const convertAudio = async (file: AudioFile, targetFormat: 'mp3' | 'wav' | 'flac'): Promise<Blob> => {
  // This would integrate with actual conversion endpoints
  throw new Error('Conversion endpoints not yet implemented - requires backend integration');
};

export interface AudioFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploaded' | 'processing' | 'enhanced' | 'error';
  originalFile: File;
  fileType?: 'mp3' | 'wav' | 'flac' | 'unsupported'; // Exposed file type for API
}

// Update audio file with type information
export const enrichAudioFile = (file: AudioFile): AudioFile => {
  return {
    ...file,
    fileType: getFileType(file.name)
  };
};