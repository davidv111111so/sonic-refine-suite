import { useState, useEffect } from 'react';

/**
 * Hook to estimate output file size based on format and settings
 * 
 * File size estimation formulas:
 * - WAV: (sample_rate * bit_depth * channels * duration) / 8
 * - MP3: Approximately bitrate * duration / 8
 * - FLAC: Approximately 50-70% of WAV size (compression ratio)
 */

interface EstimationSettings {
  format: string;
  sampleRate: number;
  bitDepth: number;
  bitrate?: number;
  duration?: number;
  channels?: number;
}

export const useEstimatedFileSize = (
  originalSize: number,
  settings: EstimationSettings
) => {
  const [estimatedSize, setEstimatedSize] = useState<number>(0);

  useEffect(() => {
    const duration = settings.duration || 0;
    const channels = settings.channels || 2;
    const format = settings.format?.toLowerCase() || 'mp3';

    let estimated = 0;

    switch (format) {
      case 'wav':
        // WAV: Uncompressed PCM
        // Formula: (sample_rate * bit_depth * channels * duration) / 8
        estimated = (settings.sampleRate * settings.bitDepth * channels * duration) / 8;
        break;

      case 'mp3':
        // MP3: Compressed audio based on bitrate
        // Formula: (bitrate * duration) / 8
        const bitrate = settings.bitrate || 320; // Default 320kbps
        estimated = (bitrate * 1000 * duration) / 8;
        break;

      case 'flac':
        // FLAC: Lossless compression (typically 50-70% of WAV size)
        const wavSize = (settings.sampleRate * settings.bitDepth * channels * duration) / 8;
        estimated = wavSize * 0.6; // Average 60% compression
        break;

      default:
        // Unknown format: use original size as estimate
        estimated = originalSize;
    }

    // Add a small overhead for file headers and metadata (approximately 1-2%)
    estimated = estimated * 1.015;

    setEstimatedSize(Math.round(estimated));
  }, [
    originalSize, 
    settings.format, 
    settings.sampleRate, 
    settings.bitDepth, 
    settings.bitrate, 
    settings.duration, 
    settings.channels
  ]);

  return estimatedSize;
};

/**
 * Format bytes to human-readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
