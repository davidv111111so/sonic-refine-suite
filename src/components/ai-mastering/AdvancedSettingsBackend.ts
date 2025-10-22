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
  // Map limiter method
  const limiterMethodMap: Record<string, string> = {
    'classic': 'True Peak',
    'modern': 'True Peak',
    'transparent': 'True Peak'
  };

  // Map spectrum compensation based on spectralBalance setting
  const spectrumCompensation = settings.spectralBalance 
    ? 'Frequency-Domain (Gain Envelope)' 
    : 'Frequency-Domain (Gain Envelope)';

  // Map loudness compensation
  const loudnessCompensation = 'LUFS (Whole Signal)';

  // Map resampling method
  const resamplingMethod = 'FastSinc';

  // Map dithering
  const ditheringMethod = settings.dithering ? 'TPDF' : 'None';

  return {
    // Core Matchering settings
    threshold: 0.998138, // Default from image
    epsilon: 0.000001, // Default from image
    max_piece_length: 30.0, // seconds
    bpm: 0.0, // Auto-detect
    time_signature_numerator: 4,
    time_signature_denominator: 4,
    piece_length_bars: 8.0,
    resampling_method: resamplingMethod,
    spectrum_compensation: spectrumCompensation,
    loudness_compensation: loudnessCompensation,
    
    // Spectrum analysis
    analyze_full_spectrum: settings.spectralBalance,
    spectrum_smoothing_width: 3,
    smoothing_steps: 1,
    spectrum_correction_hops: 2,
    loudness_steps: 10,
    spectrum_bands: 32,
    fft_size: 4096,
    
    // Normalization
    normalize_reference: true,
    normalize: true,
    
    // Limiter
    limiter_method: limiterMethodMap[settings.limiterMethod] || 'True Peak',
    limiter_threshold_db: settings.limiterCeiling,
    loudness_correction_limiting: true,
    
    // Output processing
    amplify: settings.spectralBalance,
    clipping: false,
    
    // Output format
    output_bits: settings.outputBits,
    output_channels: 2,
    dithering_method: ditheringMethod,
  };
}

/**
 * Enhanced settings with additional parameters
 */
export interface EnhancedBackendParams extends BackendMasteringParams {
  // Additional custom parameters
  target_loudness_lufs: number;
  dynamic_range_lu: number;
  low_end_enhancement: number;
  high_end_crispness: number;
  stereo_width_percent: number;
  warmth_percent: number;
}

/**
 * Convert UI settings to enhanced backend parameters
 */
export function mapSettingsToEnhancedBackend(settings: MasteringSettings): EnhancedBackendParams {
  const baseParams = mapSettingsToBackend(settings);
  
  return {
    ...baseParams,
    target_loudness_lufs: settings.targetLoudness,
    dynamic_range_lu: settings.dynamicRange,
    low_end_enhancement: settings.lowEndEnhancement,
    high_end_crispness: settings.highEndCrispness,
    stereo_width_percent: settings.stereoWidth,
    warmth_percent: settings.warmth,
  };
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
