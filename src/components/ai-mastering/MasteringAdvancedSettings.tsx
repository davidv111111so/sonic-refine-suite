/**
 * Advanced Settings Modal for AI Mastering
 * Provides fine-grained control over mastering parameters
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  // Output settings
  outputBits: 16 | 24 | 32;
  dithering: boolean;
  
  // Limiter settings
  limiterMethod: 'classic' | 'modern' | 'transparent';
  limiterCeiling: number; // dB (typically -0.1 to -3)
  
  // Dynamics
  targetLoudness: number; // LUFS (-23 to -6)
  dynamicRange: number; // LU (6-20)
  
  // Spectrum analysis
  spectralBalance: boolean;
  lowEndEnhancement: number; // 0-100%
  highEndCrispness: number; // 0-100%
  
  // Advanced
  stereoWidth: number; // 0-100%
  warmth: number; // 0-100%
}

interface MasteringAdvancedSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: MasteringSettings;
  onSettingsChange: (settings: MasteringSettings) => void;
}

const DEFAULT_SETTINGS: MasteringSettings = {
  outputBits: 24,
  dithering: true,
  limiterMethod: 'modern',
  limiterCeiling: -0.3,
  targetLoudness: -14,
  dynamicRange: 12,
  spectralBalance: true,
  lowEndEnhancement: 50,
  highEndCrispness: 50,
  stereoWidth: 100,
  warmth: 50,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5" />
            Advanced Mastering Settings
          </DialogTitle>
          <DialogDescription>
            Fine-tune mastering parameters for professional results
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Output Format */}
          <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
            <h3 className="font-semibold text-white flex items-center gap-2">
              🎚️ Output Format
            </h3>
            
            <div className="space-y-2">
              <Label>Bit Depth</Label>
              <Select
                value={settings.outputBits.toString()}
                onValueChange={(v) => handleChange('outputBits', parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16">16-bit (CD Quality)</SelectItem>
                  <SelectItem value="24">24-bit (Studio Quality)</SelectItem>
                  <SelectItem value="32">32-bit Float (Maximum)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Dithering</Label>
              <Switch
                checked={settings.dithering}
                onCheckedChange={(v) => handleChange('dithering', v)}
              />
            </div>
          </div>

          {/* Limiter Settings */}
          <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
            <h3 className="font-semibold text-white flex items-center gap-2">
              🔊 Limiter Settings
            </h3>
            
            <div className="space-y-2">
              <Label>Limiter Method</Label>
              <Select
                value={settings.limiterMethod}
                onValueChange={(v) => handleChange('limiterMethod', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic (Aggressive)</SelectItem>
                  <SelectItem value="modern">Modern (Balanced)</SelectItem>
                  <SelectItem value="transparent">Transparent (Clean)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Ceiling</Label>
                <span className="text-sm text-slate-400">{settings.limiterCeiling} dB</span>
              </div>
              <Slider
                value={[settings.limiterCeiling]}
                min={-3}
                max={-0.1}
                step={0.1}
                onValueChange={(v) => handleChange('limiterCeiling', v[0])}
              />
            </div>
          </div>

          {/* Loudness & Dynamics */}
          <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
            <h3 className="font-semibold text-white flex items-center gap-2">
              📊 Loudness & Dynamics
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Target Loudness</Label>
                <span className="text-sm text-slate-400">{settings.targetLoudness} LUFS</span>
              </div>
              <Slider
                value={[settings.targetLoudness]}
                min={-23}
                max={-6}
                step={1}
                onValueChange={(v) => handleChange('targetLoudness', v[0])}
              />
              <p className="text-xs text-slate-500">
                Streaming: -14 LUFS | Club: -8 LUFS | Spotify: -14 LUFS
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Dynamic Range</Label>
                <span className="text-sm text-slate-400">{settings.dynamicRange} LU</span>
              </div>
              <Slider
                value={[settings.dynamicRange]}
                min={6}
                max={20}
                step={1}
                onValueChange={(v) => handleChange('dynamicRange', v[0])}
              />
            </div>
          </div>

          {/* Spectral Balance */}
          <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                🎨 Spectral Balance
              </h3>
              <Switch
                checked={settings.spectralBalance}
                onCheckedChange={(v) => handleChange('spectralBalance', v)}
              />
            </div>

            {settings.spectralBalance && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Low-End Enhancement</Label>
                    <span className="text-sm text-slate-400">{settings.lowEndEnhancement}%</span>
                  </div>
                  <Slider
                    value={[settings.lowEndEnhancement]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(v) => handleChange('lowEndEnhancement', v[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>High-End Crispness</Label>
                    <span className="text-sm text-slate-400">{settings.highEndCrispness}%</span>
                  </div>
                  <Slider
                    value={[settings.highEndCrispness]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(v) => handleChange('highEndCrispness', v[0])}
                  />
                </div>
              </>
            )}
          </div>

          {/* Advanced Controls */}
          <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
            <h3 className="font-semibold text-white flex items-center gap-2">
              ⚙️ Advanced Controls
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Stereo Width</Label>
                <span className="text-sm text-slate-400">{settings.stereoWidth}%</span>
              </div>
              <Slider
                value={[settings.stereoWidth]}
                min={0}
                max={150}
                step={5}
                onValueChange={(v) => handleChange('stereoWidth', v[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Warmth</Label>
                <span className="text-sm text-slate-400">{settings.warmth}%</span>
              </div>
              <Slider
                value={[settings.warmth]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => handleChange('warmth', v[0])}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              Apply Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
