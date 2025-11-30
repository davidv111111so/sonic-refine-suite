/**
 * Advanced Settings Modal for AI Mastering
 * Provides fine-grained control over mastering parameters
 */

import React from 'react';
import { SimpleModal } from '@/components/ui/SimpleModal';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, RotateCcw } from 'lucide-react';

export interface MasteringSettings {
  // Core Matchering settings
  threshold: number;
  epsilon: number;
  max_piece_length: number; // in seconds
  fft_size: number;

  // Output format
  output_bits: string;

  // Optional extended settings (for compatibility)
  bpm?: number;
  time_signature_numerator?: number;
  time_signature_denominator?: number;
  piece_length_bars?: number;
  resampling_method?: string;
  spectrum_compensation?: string;
  loudness_compensation?: string;
  analyze_full_spectrum?: boolean;
  spectrum_smoothing_width?: number;
  smoothing_steps?: number;
  spectrum_correction_hops?: number;
  loudness_steps?: number;
  spectrum_bands?: number;
  normalize_reference?: boolean;
  normalize?: boolean;
  limiter_method?: string;
  limiter_threshold_db?: number;
  loudness_correction_limiting?: boolean;
  amplify?: boolean;
  clipping?: boolean;
  output_channels?: number;
  dithering_method?: string;
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
  max_piece_length: 15.0, // Default approx 661500 samples / 44100
  fft_size: 4096,
  output_bits: '16',
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
      maxWidth="max-w-2xl"
    >
      <div className="space-y-1 mb-6">
        <p className="text-slate-400 text-sm">
          Fine-tune mastering parameters for professional results
        </p>
      </div>

      <div className="space-y-6">
        {/* Core Settings */}
        <div className="space-y-4 p-4 rounded-lg border border-slate-700 bg-slate-800/50">
          <h3 className="font-semibold flex items-center gap-2 text-white">
            ⚙️ Core Processing
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Threshold</Label>
              <input
                type="number"
                value={settings.threshold}
                onChange={(e) => handleChange('threshold', parseFloat(e.target.value))}
                step="0.000001"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500">Matching threshold (0.0 - 1.0)</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Epsilon (Min Value)</Label>
              <input
                type="number"
                value={settings.epsilon}
                onChange={(e) => handleChange('epsilon', parseFloat(e.target.value))}
                step="0.000001"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500">Minimum value floor</p>
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
              <p className="text-xs text-slate-500">Processing chunk size</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">FFT Size</Label>
              <input
                type="number"
                value={settings.fft_size}
                onChange={(e) => handleChange('fft_size', parseInt(e.target.value))}
                step="256"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500">Window size for analysis</p>
            </div>
          </div>
        </div>

        {/* Output Format */}
        <div className="space-y-4 p-4 rounded-lg border border-slate-700 bg-slate-800/50">
          <h3 className="font-semibold flex items-center gap-2 text-white">
            💾 Output Format
          </h3>

          <div className="space-y-2">
            <Label className="text-slate-300">Output Bit Depth</Label>
            <Select
              value={settings.output_bits || '16'}
              onValueChange={(v) => handleChange('output_bits', v)}
            >
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white z-[100]">
                <SelectItem value="16">16-bit</SelectItem>
                <SelectItem value="24">24-bit</SelectItem>
                <SelectItem value="32">32-bit</SelectItem>
                <SelectItem value="32 (IEEE float)">32-bit Float</SelectItem>
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
    </SimpleModal>
  );
};
