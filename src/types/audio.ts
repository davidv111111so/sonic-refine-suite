
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
  fileType?: 'mp3' | 'wav' | 'flac' | 'mp4' | 'm4v' | 'mov' | 'webm' | 'unsupported';
  harmonicKey?: string; // Camelot notation for harmonic mixing (e.g., "8A")
  bpm?: number; // Beats per minute (detected automatically)
  metadata?: {
    format?: string;
    channels?: number;
    sampleRate?: number;
    bitDepth?: number;
  };
  lastModified?: number;
}

export interface AudioStats {
  total: number;
  uploaded: number;
  processing: number;
  enhanced: number;
}
