// Audio processing utilities for v2.0
// Updated to remove M4A support and implement WAV default with MP3 preservation

export interface ProcessingSettings {
  outputFormat: 'wav' | 'mp3';
  sampleRate: number;
  bitDepth: number;
  noiseReduction: number;
  normalize: boolean;
  bassBoost: number;
  trebleEnhancement: number;
  compression: number;
  gainAdjustment: number;
  eqBands: number[];
  enableEQ: boolean;
}

export const getDefaultSettings = (inputFile: File): ProcessingSettings => {
  const fileExtension = inputFile.name.toLowerCase().split('.').pop();
  
  return {
    outputFormat: fileExtension === 'mp3' ? 'mp3' : 'wav', // Preserve MP3, default to WAV
    sampleRate: 44100, // v2.0 default
    bitDepth: 16, // v2.0 default
    noiseReduction: 0,
    normalize: true,
    bassBoost: 0,
    trebleEnhancement: 0,
    compression: 0,
    gainAdjustment: 0,
    eqBands: [0, 0, 0, 0, 0], // 5-band EQ
    enableEQ: true
  };
};

export const validateFileFormat = (file: File): boolean => {
  const supportedFormats = ['mp3', 'wav']; // v2.0 only supports MP3 and WAV
  const extension = file.name.toLowerCase().split('.').pop();
  return supportedFormats.includes(extension || '');
};

export const getFileType = (filename: string): 'mp3' | 'wav' | 'unsupported' => {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'mp3') return 'mp3';
  if (ext === 'wav') return 'wav';
  return 'unsupported';
};

// Conversion endpoints (placeholder for backend integration)
export const convertAudio = async (file: AudioFile, targetFormat: 'mp3' | 'wav'): Promise<Blob> => {
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
  fileType?: 'mp3' | 'wav' | 'unsupported'; // Exposed file type for API
}

// Update audio file with type information
export const enrichAudioFile = (file: AudioFile): AudioFile => {
  return {
    ...file,
    fileType: getFileType(file.name)
  };
};