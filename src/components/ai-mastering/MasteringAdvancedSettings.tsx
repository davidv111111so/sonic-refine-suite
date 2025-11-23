/**
 * Advanced Settings Modal for AI Mastering
 * Provides fine-grained control over mastering parameters
 */

import React from 'react';
import { SimpleModal } from '@/components/ui/SimpleModal';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Settings, RotateCcw } from 'lucide-react';

export interface MasteringSettings {
  // Core Matchering settings
  threshold: number;
  epsilon: number;
  max_piece_length: number;
  bpm: number;
  time_signature_numerator: number;
  time_signature_denominator: number;
  piece_length_bars: number;

  // Method settings
  resampling_method: string;
  spectrum_compensation: string;
  loudness_compensation: string;

  // Spectrum analysis
  analyze_full_spectrum: boolean;
  spectrum_smoothing_width: number;
  smoothing_steps: number;
  spectrum_correction_hops: number;
  loudness_steps: number;
  spectrum_bands: number;
  fft_size: number;

  // Normalization
  normalize_reference: boolean;
  normalize: boolean;

  // Limiter
  limiter_method: string;
  limiter_threshold_db: number;
  loudness_correction_limiting: boolean;

  // Output processing
  amplify: boolean;
  clipping: boolean;

  // Output format
  output_bits: string;
  output_channels: number;
  dithering_method: string;
}

interface MasteringAdvancedSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: MasteringSettings;
  onSettingsChange: (settings: MasteringSettings) => void;
}

const DEFAULT_SETTINGS: MasteringSettings = {
  threshold: 0.998138,
  epsilon: 0.000001,
  max_piece_length: 30.0,
  bpm: 0.0,
  time_signature_numerator: 4,
  time_signature_denominator: 4,
  piece_length_bars: 8.0,
  resampling_method: 'FastSinc',
  spectrum_compensation: 'Frequency-Domain (Gain Envelope)',
  loudness_compensation: 'LUFS (Whole Signal)',
  analyze_full_spectrum: false,
  spectrum_smoothing_width: 3,
  smoothing_steps: 1,
  spectrum_correction_hops: 2,
  loudness_steps: 10,
  spectrum_bands: 32,
  fft_size: 4096,
  normalize_reference: false,
  normalize: false,
  limiter_method: 'True Peak',
  limiter_threshold_db: -1.0,
  loudness_correction_limiting: false,
  amplify: false,
  clipping: false,
  output_bits: '32 (IEEE float)',
  output_channels: 2,
  dithering_method: 'TPDF',
};

export const MasteringAdvancedSettings: React.FC<MasteringAdvancedSettingsProps> = ({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}) => {
  const handleChange = (key: keyof MasteringSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const handleReset = () => {
    onSettingsChange(DEFAULT_SETTINGS);
  };

  return (
    <SimpleModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <span>AI Mastering - Advanced Settings</span>
        </div>
      }
      maxWidth="max-w-4xl"
    >
      <div className="space-y-1 mb-6">
        <p className="text-slate-400 text-sm">
          Fine-tune mastering parameters for professional results
        </p>
      </div>

      <div className="overflow-y-auto max-h-[calc(85vh-120px)] pr-2 -mr-2">
        <div className="space-y-6">
          {/* Core Settings */}
          <div className="space-y-4 p-4 rounded-lg border border-slate-700 bg-slate-800/50">
            <h3 className="font-semibold flex items-center gap-2 text-white">
              ⚙️ Core Settings
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Threshold</Label>
                <input
                  type="number"
                  value={settings.threshold}
                  onChange={(e) => handleChange('threshold', parseFloat(e.target.value))}
                  step="0.000001"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Epsilon</Label>
                <input
                  type="number"
                  value={settings.epsilon}
                  onChange={(e) => handleChange('epsilon', parseFloat(e.target.value))}
                  step="0.000001"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Max Piece Length (seconds)</Label>
                <input
                  type="number"
                  value={settings.max_piece_length}
                  onChange={(e) => handleChange('max_piece_length', parseFloat(e.target.value))}
                  step="1"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">BPM</Label>
                <input
                  type="number"
                  value={settings.bpm}
                  onChange={(e) => handleChange('bpm', parseFloat(e.target.value))}
                  step="0.1"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Time Signature Numerator</Label>
                <input
                  type="number"
                  value={settings.time_signature_numerator}
                  onChange={(e) => handleChange('time_signature_numerator', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Time Signature Denominator</Label>
                <input
                  type="number"
                  value={settings.time_signature_denominator}
                  onChange={(e) => handleChange('time_signature_denominator', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Piece Length (bars)</Label>
                <input
                  type="number"
                  value={settings.piece_length_bars}
                  onChange={(e) => handleChange('piece_length_bars', parseFloat(e.target.value))}
                  step="0.1"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Method Settings */}
          <div className="space-y-4 p-4 rounded-lg border border-slate-700 bg-slate-800/50">
            <h3 className="font-semibold flex items-center gap-2 text-white">
              🔧 Method Settings
            </h3>

            <div className="space-y-2">
              <Label className="text-slate-300">Resampling Method</Label>
              <Select
                value={settings.resampling_method}
                onValueChange={(v) => handleChange('resampling_method', v)}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="FastSinc">FastSinc</SelectItem>
                  <SelectItem value="Sinc">Sinc</SelectItem>
                  <SelectItem value="Linear">Linear</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Spectrum Compensation</Label>
              <Select
                value={settings.spectrum_compensation}
                onValueChange={(v) => handleChange('spectrum_compensation', v)}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="Frequency-Domain (Gain Envelope)">Frequency-Domain (Gain Envelope)</SelectItem>
                  <SelectItem value="Time-Domain">Time-Domain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Loudness Compensation</Label>
              <Select
                value={settings.loudness_compensation}
                onValueChange={(v) => handleChange('loudness_compensation', v)}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="LUFS (Whole Signal)">LUFS (Whole Signal)</SelectItem>
                  <SelectItem value="RMS">RMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Spectrum Analysis */}
          <div className="space-y-4 p-4 rounded-lg border border-slate-700 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2 text-white">
                📊 Spectrum Analysis
              </h3>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-slate-300">Analyze Full Spectrum</Label>
                <Switch
                  checked={settings.analyze_full_spectrum}
                  onCheckedChange={(v) => handleChange('analyze_full_spectrum', v)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Spectrum Smoothing Width</Label>
                <input
                  type="number"
                  value={settings.spectrum_smoothing_width}
                  onChange={(e) => handleChange('spectrum_smoothing_width', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Smoothing Steps</Label>
                <input
                  type="number"
                  value={settings.smoothing_steps}
                  onChange={(e) => handleChange('smoothing_steps', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Spectrum Correction Hops</Label>
                <input
                  type="number"
                  value={settings.spectrum_correction_hops}
                  onChange={(e) => handleChange('spectrum_correction_hops', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Loudness Steps</Label>
                <input
                  type="number"
                  value={settings.loudness_steps}
                  onChange={(e) => handleChange('loudness_steps', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Spectrum Bands</Label>
                <input
                  type="number"
                  value={settings.spectrum_bands}
                  onChange={(e) => handleChange('spectrum_bands', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">FFT Size</Label>
                <input
                  type="number"
                  value={settings.fft_size}
                  onChange={(e) => handleChange('fft_size', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Normalization */}
          <div className="space-y-4 p-4 rounded-lg border border-slate-700 bg-slate-800/50">
            <h3 className="font-semibold flex items-center gap-2 text-white">
              🎚️ Normalization
            </h3>

            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Normalize Reference</Label>
              <Switch
                checked={settings.normalize_reference}
                onCheckedChange={(v) => handleChange('normalize_reference', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Normalize</Label>
              <Switch
                checked={settings.normalize}
                onCheckedChange={(v) => handleChange('normalize', v)}
              />
            </div>
          </div>

          {/* Limiter Settings */}
          <div className="space-y-4 p-4 rounded-lg border border-slate-700 bg-slate-800/50">
            <h3 className="font-semibold flex items-center gap-2 text-white">
              🔊 Limiter Settings
            </h3>

            <div className="space-y-2">
              <Label className="text-slate-300">Limiter Method</Label>
              <Select
                value={settings.limiter_method}
                onValueChange={(v) => handleChange('limiter_method', v)}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="True Peak">True Peak</SelectItem>
                  <SelectItem value="Sample Peak">Sample Peak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Limiter Threshold dB</Label>
              <input
                type="number"
                value={settings.limiter_threshold_db}
                onChange={(e) => handleChange('limiter_threshold_db', parseFloat(e.target.value))}
                step="0.1"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Loudness Correction Limiting</Label>
              <Switch
                checked={settings.loudness_correction_limiting}
                onCheckedChange={(v) => handleChange('loudness_correction_limiting', v)}
              />
            </div>
          </div>

          {/* Output Processing */}
          <div className="space-y-4 p-4 rounded-lg border border-slate-700 bg-slate-800/50">
            <h3 className="font-semibold flex items-center gap-2 text-white">
              🎛️ Output Processing
            </h3>

            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Amplify</Label>
              <Switch
                checked={settings.amplify}
                onCheckedChange={(v) => handleChange('amplify', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Clipping</Label>
              <Switch
                checked={settings.clipping}
                onCheckedChange={(v) => handleChange('clipping', v)}
              />
            </div>
          </div>

          {/* Output Format */}
          <div className="space-y-4 p-4 rounded-lg border border-slate-700 bg-slate-800/50">
            <h3 className="font-semibold flex items-center gap-2 text-white">
              💾 Output Format
            </h3>

            <div className="space-y-2">
              <Label className="text-slate-300">Output Bits</Label>
              <Select
                value={settings.output_bits || '32 (IEEE float)'}
                onValueChange={(v) => handleChange('output_bits', v)}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="16">16-bit</SelectItem>
                  <SelectItem value="24">24-bit</SelectItem>
                  <SelectItem value="32">32-bit</SelectItem>
                  <SelectItem value="32 (IEEE float)">32 (IEEE float)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Output Channels</Label>
              <Select
                value={settings.output_channels?.toString() || '2'}
                onValueChange={(v) => handleChange('output_channels', parseInt(v))}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="1">Mono (1)</SelectItem>
                  <SelectItem value="2">Stereo (2)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Dithering Method</Label>
              <Select
                value={settings.dithering_method}
                onValueChange={(v) => handleChange('dithering_method', v)}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="TPDF">TPDF</SelectItem>
                  <SelectItem value="RPDF">RPDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              Save & Close
            </Button>
          </div>
        </div>
      </div>
    </SimpleModal>
  );
};
