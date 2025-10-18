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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Mastering Settings</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-4 p-4">
          {/* Row 1 */}
          <div className="space-y-2">
            <Label className="text-white text-sm">Threshold</Label>
            <Input
              type="number"
              value={settings.threshold}
              onChange={(e) => handleChange('threshold', parseFloat(e.target.value))}
              step="0.000001"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">Epsilon</Label>
            <Input
              type="number"
              value={settings.epsilon}
              onChange={(e) => handleChange('epsilon', parseFloat(e.target.value))}
              step="0.000001"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">Max Piece Length (seconds)</Label>
            <Input
              type="number"
              value={settings.maxPieceLength}
              onChange={(e) => handleChange('maxPieceLength', parseFloat(e.target.value))}
              step="0.1"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

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

          <div className="space-y-2">
            <Label className="text-white text-sm">Time Signature Numerator</Label>
            <Input
              type="number"
              value={settings.timeSignatureNumerator}
              onChange={(e) => handleChange('timeSignatureNumerator', parseInt(e.target.value))}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Row 2 */}
          <div className="space-y-2">
            <Label className="text-white text-sm">Time Signature Denominator</Label>
            <Input
              type="number"
              value={settings.timeSignatureDenominator}
              onChange={(e) => handleChange('timeSignatureDenominator', parseInt(e.target.value))}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">Piece Length (bars)</Label>
            <Input
              type="number"
              value={settings.pieceLengthBars}
              onChange={(e) => handleChange('pieceLengthBars', parseFloat(e.target.value))}
              step="0.1"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">Resampling Method</Label>
            <Select
              value={settings.resamplingMethod}
              onValueChange={(value) => handleChange('resamplingMethod', value)}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FastSinc">FastSinc</SelectItem>
                <SelectItem value="Linear">Linear</SelectItem>
                <SelectItem value="Cubic">Cubic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">Spectrum Compensation</Label>
            <Select
              value={settings.spectrumCompensation}
              onValueChange={(value) => handleChange('spectrumCompensation', value)}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Frequency-Domain (Gain Envelope)">Frequency-Domain (Gain Envelope)</SelectItem>
                <SelectItem value="Time-Domain">Time-Domain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">Loudness Compensation</Label>
            <Select
              value={settings.loudnessCompensation}
              onValueChange={(value) => handleChange('loudnessCompensation', value)}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LUFS (Whole Signal)">LUFS (Whole Signal)</SelectItem>
                <SelectItem value="RMS">RMS</SelectItem>
                <SelectItem value="Peak">Peak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Row 3 */}
          <div className="space-y-2 flex flex-col items-center justify-center">
            <Label className="text-white text-sm text-center">Analyze Full Spectrum</Label>
            <Checkbox
              checked={settings.analyzeFullSpectrum}
              onCheckedChange={(checked) => handleChange('analyzeFullSpectrum', checked)}
              className="border-slate-600"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">Spectrum Smoothing Width</Label>
            <Input
              type="number"
              value={settings.spectrumSmoothingWidth}
              onChange={(e) => handleChange('spectrumSmoothingWidth', parseInt(e.target.value))}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">Smoothing Steps</Label>
            <Input
              type="number"
              value={settings.smoothingSteps}
              onChange={(e) => handleChange('smoothingSteps', parseInt(e.target.value))}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">Spectrum Correction Hops</Label>
            <Input
              type="number"
              value={settings.spectrumCorrectionHops}
              onChange={(e) => handleChange('spectrumCorrectionHops', parseInt(e.target.value))}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">Loudness Steps</Label>
            <Input
              type="number"
              value={settings.loudnessSteps}
              onChange={(e) => handleChange('loudnessSteps', parseInt(e.target.value))}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Row 4 */}
          <div className="space-y-2">
            <Label className="text-white text-sm">Spectrum Bands</Label>
            <Input
              type="number"
              value={settings.spectrumBands}
              onChange={(e) => handleChange('spectrumBands', parseInt(e.target.value))}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">FFT Size</Label>
            <Input
              type="number"
              value={settings.fftSize}
              onChange={(e) => handleChange('fftSize', parseInt(e.target.value))}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2 flex flex-col items-center justify-center">
            <Label className="text-white text-sm text-center">Normalize Reference</Label>
            <Checkbox
              checked={settings.normalizeReference}
              onCheckedChange={(checked) => handleChange('normalizeReference', checked)}
              className="border-slate-600"
            />
          </div>

          <div className="space-y-2 flex flex-col items-center justify-center">
            <Label className="text-white text-sm text-center">Normalize</Label>
            <Checkbox
              checked={settings.normalize}
              onCheckedChange={(checked) => handleChange('normalize', checked)}
              className="border-slate-600"
            />
          </div>

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
                <SelectItem value="Peak">Peak</SelectItem>
                <SelectItem value="RMS">RMS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Row 5 */}
          <div className="space-y-2">
            <Label className="text-white text-sm">Limiter Threshold dB</Label>
            <Input
              type="number"
              value={settings.limiterThreshold}
              onChange={(e) => handleChange('limiterThreshold', parseFloat(e.target.value))}
              step="0.1"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2 flex flex-col items-center justify-center">
            <Label className="text-white text-sm text-center">Loudness Correction Limiting</Label>
            <Checkbox
              checked={settings.loudnessCorrectionLimiting}
              onCheckedChange={(checked) => handleChange('loudnessCorrectionLimiting', checked)}
              className="border-slate-600"
            />
          </div>

          <div className="space-y-2 flex flex-col items-center justify-center">
            <Label className="text-white text-sm text-center">Amplify</Label>
            <Checkbox
              checked={settings.amplify}
              onCheckedChange={(checked) => handleChange('amplify', checked)}
              className="border-slate-600"
            />
          </div>

          <div className="space-y-2 flex flex-col items-center justify-center">
            <Label className="text-white text-sm text-center">Clipping</Label>
            <Checkbox
              checked={settings.clipping}
              onCheckedChange={(checked) => handleChange('clipping', checked)}
              className="border-slate-600"
            />
          </div>

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
                <SelectItem value="32 (IEEE float)">32 (IEEE float)</SelectItem>
                <SelectItem value="16">16</SelectItem>
                <SelectItem value="24">24</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Row 6 */}
          <div className="space-y-2">
            <Label className="text-white text-sm">Output Channels</Label>
            <Select
              value={settings.outputChannels.toString()}
              onValueChange={(value) => handleChange('outputChannels', parseInt(value))}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="1">1</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                <SelectItem value="TPDF">TPDF</SelectItem>
                <SelectItem value="None">None</SelectItem>
                <SelectItem value="Triangular">Triangular</SelectItem>
              </SelectContent>
            </Select>
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
