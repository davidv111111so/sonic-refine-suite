/**
 * Advanced Settings Backend Mapping for AI Mastering
 * Maps UI settings to Python backend parameters
 */

import { MasteringSettings } from './MasteringAdvancedSettings';

export interface BackendMasteringParams {
  // Matchering parameters from settings_mastering_tab-2.jpg
  threshold: number;
  epsilon: number;
  max_piece_length: number;
  bpm: number;
  time_signature_numerator: number;
  time_signature_denominator: number;
  piece_length_bars: number;
  resampling_method: string;
  spectrum_compensation: string;
  loudness_compensation: string;
  analyze_full_spectrum: boolean;
  spectrum_smoothing_width: number;
  smoothing_steps: number;
  spectrum_correction_hops: number;
  loudness_steps: number;
  spectrum_bands: number;
  fft_size: number;
  normalize_reference: boolean;
  normalize: boolean;
  limiter_method: string;
  limiter_threshold_db: number;
  loudness_correction_limiting: boolean;
  amplify: boolean;
  clipping: boolean;
  output_bits: number;
  output_channels: number;
  dithering_method: string;
}

/**
 * Convert UI settings to backend parameters
 */
export function mapSettingsToBackend(settings: MasteringSettings): BackendMasteringParams {
  // Parse output bits with fallback to 32 if undefined
  const outputBits = settings.output_bits 
    ? parseInt(settings.output_bits.split(' ')[0]) 
    : 32;

  return {
    // Core Matchering settings - directly from UI
    threshold: settings.threshold,
    epsilon: settings.epsilon,
    max_piece_length: settings.max_piece_length,
    bpm: settings.bpm,
    time_signature_numerator: settings.time_signature_numerator,
    time_signature_denominator: settings.time_signature_denominator,
    piece_length_bars: settings.piece_length_bars,
    resampling_method: settings.resampling_method,
    spectrum_compensation: settings.spectrum_compensation,
    loudness_compensation: settings.loudness_compensation,
    
    // Spectrum analysis
    analyze_full_spectrum: settings.analyze_full_spectrum,
    spectrum_smoothing_width: settings.spectrum_smoothing_width,
    smoothing_steps: settings.smoothing_steps,
    spectrum_correction_hops: settings.spectrum_correction_hops,
    loudness_steps: settings.loudness_steps,
    spectrum_bands: settings.spectrum_bands,
    fft_size: settings.fft_size,
    
    // Normalization
    normalize_reference: settings.normalize_reference,
    normalize: settings.normalize,
    
    // Limiter
    limiter_method: settings.limiter_method,
    limiter_threshold_db: settings.limiter_threshold_db,
    loudness_correction_limiting: settings.loudness_correction_limiting,
    
    // Output processing
    amplify: settings.amplify,
    clipping: settings.clipping,
    
    // Output format
    output_bits: outputBits,
    output_channels: settings.output_channels,
    dithering_method: settings.dithering_method,
  };
}

/**
 * Convert UI settings to enhanced backend parameters (same as base for new interface)
 */
export function mapSettingsToEnhancedBackend(settings: MasteringSettings): BackendMasteringParams {
  return mapSettingsToBackend(settings);
}

/**
 * Validate backend parameters
 */
export function validateBackendParams(params: BackendMasteringParams): string[] {
  const errors: string[] = [];
  
  if (params.threshold < 0 || params.threshold > 1) {
    errors.push('Threshold must be between 0 and 1');
  }
  
  if (params.epsilon <= 0) {
    errors.push('Epsilon must be greater than 0');
  }
  
  if (params.max_piece_length <= 0) {
    errors.push('Max piece length must be positive');
  }
  
  if (params.fft_size < 512 || params.fft_size > 8192) {
    errors.push('FFT size must be between 512 and 8192');
  }
  
  if (params.output_bits !== 16 && params.output_bits !== 24 && params.output_bits !== 32) {
    errors.push('Output bits must be 16, 24, or 32');
  }
  
  if (params.limiter_threshold_db > 0 || params.limiter_threshold_db < -10) {
    errors.push('Limiter threshold must be between -10 and 0 dB');
  }
  
  return errors;
}
