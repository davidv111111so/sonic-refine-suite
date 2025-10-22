import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface MasteringSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: MasteringSettings;
  onSettingsChange: (settings: MasteringSettings) => void;
}

export interface MasteringSettings {
  threshold: number;
  epsilon: number;
  maxPieceLength: number;
  bpm: number;
  timeSignatureNumerator: number;
  timeSignatureDenominator: number;
  pieceLengthBars: number;
  resamplingMethod: string;
  spectrumCompensation: string;
  loudnessCompensation: string;
  analyzeFullSpectrum: boolean;
  spectrumSmoothingWidth: number;
  smoothingSteps: number;
  spectrumCorrectionHops: number;
  loudnessSteps: number;
  spectrumBands: number;
  fftSize: number;
  normalizeReference: boolean;
  normalize: boolean;
  limiterMethod: string;
  limiterThreshold: number;
  loudnessCorrectionLimiting: boolean;
  amplify: boolean;
  clipping: boolean;
  outputBits: string;
  outputChannels: number;
  ditheringMethod: string;
}

export const MasteringSettingsModal = ({
  open,
  onOpenChange,
  settings,
  onSettingsChange
}: MasteringSettingsModalProps) => {
  const handleChange = (key: keyof MasteringSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700 z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Advanced Settings</DialogTitle>
          <p className="text-sm text-slate-400 mt-2">Essential mastering parameters for professional results</p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 p-4">
          {/* Dithering Method */}
          <div className="space-y-2">
            <Label className="text-white text-sm">Dithering Method</Label>
            <Select
              value={settings.ditheringMethod}
              onValueChange={(value) => handleChange('ditheringMethod', value)}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="RPDF">RPDF (Rectangular)</SelectItem>
                <SelectItem value="TPDF">TPDF (Triangular)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Output Bits - LIMITED TO 16 and 24 */}
          <div className="space-y-2">
            <Label className="text-white text-sm">Output Bits</Label>
            <Select
              value={settings.outputBits}
              onValueChange={(value) => handleChange('outputBits', value)}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16">16</SelectItem>
                <SelectItem value="24">24</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clipping Checkbox */}
          <div className="space-y-2 flex flex-col items-start justify-center">
            <Label className="text-white text-sm">Clipping</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={settings.clipping}
                onCheckedChange={(checked) => handleChange('clipping', checked)}
                className="border-slate-600"
              />
              <Label className="text-slate-400 text-xs cursor-pointer">Enable hard clipping</Label>
            </div>
          </div>

          {/* Limiter Method */}
          <div className="space-y-2">
            <Label className="text-white text-sm">Limiter Method</Label>
            <Select
              value={settings.limiterMethod}
              onValueChange={(value) => handleChange('limiterMethod', value)}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="True Peak">True Peak</SelectItem>
                <SelectItem value="Sample Peak">Sample Peak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* BPM */}
          <div className="space-y-2">
            <Label className="text-white text-sm">BPM</Label>
            <Input
              type="number"
              value={settings.bpm}
              onChange={(e) => handleChange('bpm', parseFloat(e.target.value))}
              step="0.1"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
