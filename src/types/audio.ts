
export interface AudioFile {
  id: string;
  name: string;
  size: number;
  enhancedSize?: number;
  type: string;
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  status: 'uploaded' | 'processing' | 'enhanced' | 'error';
  progress?: number;
  processingStage?: string;
  originalFile: File;
  enhancedUrl?: string;
  originalUrl?: string;
  artist?: string;
  title?: string;
  artworkUrl?: string;
  fileType?: 'mp3' | 'wav' | 'flac' | 'unsupported'; // v2.0: Exposed file type
  harmonicKey?: string; // Harmonic key analysis for mixing
}

export interface AudioStats {
  total: number;
  uploaded: number;
  processing: number;
  enhanced: number;
}
