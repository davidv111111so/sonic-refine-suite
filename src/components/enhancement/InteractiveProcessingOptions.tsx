import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, RotateCcw, AlertTriangle, Users, Layers } from 'lucide-react';
import { AudioSettingsTooltip } from '@/components/AudioSettingsTooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { Badge } from '@/components/ui/badge';

interface InteractiveProcessingOptionsProps {
  noiseReduction: number;
  noiseReductionEnabled: boolean;
  normalize: boolean;
  normalizeLevel: number;
  compression: number;
  compressionEnabled: boolean;
  compressionThreshold: number;
  compressionRatio: string;
  stereoWidening: number;
  stereoWideningEnabled: boolean;
  batchMode: boolean;
  onNoiseReductionChange: (value: number) => void;
  onNoiseReductionEnabledChange: (enabled: boolean) => void;
  onNormalizeChange: (enabled: boolean) => void;
  onNormalizeLevelChange: (level: number) => void;
  onCompressionChange: (value: number) => void;
  onCompressionEnabledChange: (enabled: boolean) => void;
  onCompressionThresholdChange: (value: number) => void;
  onCompressionRatioChange: (ratio: string) => void;
  onStereoWideningChange: (value: number) => void;
  onStereoWideningEnabledChange: (enabled: boolean) => void;
  onBatchModeChange: (enabled: boolean) => void;
  onReset: () => void;
}

export const InteractiveProcessingOptions = ({
  noiseReduction,
  noiseReductionEnabled,
  normalize,
  normalizeLevel,
  compression,
  compressionEnabled,
  compressionThreshold,
  compressionRatio,
  stereoWidening,
  stereoWideningEnabled,
  batchMode,
  onNoiseReductionChange,
  onNoiseReductionEnabledChange,
  onNormalizeChange,
  onNormalizeLevelChange,
  onCompressionChange,
  onCompressionEnabledChange,
  onCompressionThresholdChange,
  onCompressionRatioChange,
  onStereoWideningChange,
  onStereoWideningEnabledChange,
  onBatchModeChange,
  onReset
}: InteractiveProcessingOptionsProps) => {
  const { t } = useLanguage();
  const { isPremium } = useUserSubscription();

  // Check if stereo widening is in anti-phase territory (>70% is risky)
  const isAntiPhase = stereoWidening > 70;

  return (
    <Card className="bg-slate-900/90 border-slate-800 mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-slate-200">Processing Options</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => onBatchModeChange(false)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${!batchMode
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
              >
                <Users className="w-3.5 h-3.5" />
                Individual
              </button>
              <button
                onClick={() => onBatchModeChange(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${batchMode
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Batch
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="h-6 px-2 text-[10px] border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Noise Reduction */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Noise Reduction</label>
            <div className="flex items-center gap-3">
              {noiseReductionEnabled && <span className="text-xs font-mono text-cyan-400">{noiseReduction}%</span>}
              <Switch checked={noiseReductionEnabled} onCheckedChange={onNoiseReductionEnabledChange} className="data-[state=checked]:bg-cyan-500" />
            </div>
          </div>
          {noiseReductionEnabled && (
            <Slider
              value={[noiseReduction]}
              onValueChange={([value]) => onNoiseReductionChange(value)}
              min={0}
              max={100}
              step={1}
              className="[&_.relative]:bg-slate-800 [&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:border-cyan-500"
            />
          )}
        </div>

        {/* Audio Normalization */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-slate-300">Audio Normalization</label>
              <p className="text-[10px] text-slate-500">LUFS target -14. Optimal for mastering.</p>
            </div>
            <div className="flex items-center gap-3">
              {normalize && <span className="text-xs font-mono text-purple-400">{normalizeLevel.toFixed(1)} dB</span>}
              <Switch checked={normalize} onCheckedChange={onNormalizeChange} className="data-[state=checked]:bg-purple-500" />
            </div>
          </div>
          {normalize && (
            <Slider
              value={[normalizeLevel]}
              onValueChange={([value]) => onNormalizeLevelChange(Math.max(-3, Math.min(0, value)))}
              min={-3}
              max={0}
              step={0.1}
              className="[&_.relative]:bg-slate-800 [&_[role=slider]]:bg-purple-400 [&_[role=slider]]:border-purple-500"
            />
          )}
        </div>

        {/* Dynamic Compression */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Dynamic Compression</label>
            <Switch checked={compressionEnabled} onCheckedChange={onCompressionEnabledChange} className="data-[state=checked]:bg-green-500" />
          </div>
          {compressionEnabled && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Ratio</span>
                <Select value={compressionRatio} onValueChange={onCompressionRatioChange}>
                  <SelectTrigger className="h-6 w-20 text-xs bg-slate-950 border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="2:1">2:1</SelectItem>
                    <SelectItem value="4:1">4:1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Threshold</span>
                  <span className="font-mono text-green-400">{compressionThreshold} dB</span>
                </div>
                <Slider
                  value={[compressionThreshold]}
                  onValueChange={([value]) => onCompressionThresholdChange(value)}
                  min={-24}
                  max={0}
                  step={1}
                  className="[&_.relative]:bg-slate-800 [&_[role=slider]]:bg-green-400 [&_[role=slider]]:border-green-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stereo Widening */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-300">Stereo Widening</label>
              {isPremium && <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-[9px] px-1.5 py-0">PREMIUM</Badge>}
            </div>
            <div className="flex items-center gap-3">
              {stereoWideningEnabled && <span className={`text-xs font-mono ${isAntiPhase ? 'text-red-400' : 'text-blue-400'}`}>{stereoWidening}%</span>}
              <Switch checked={stereoWideningEnabled} onCheckedChange={onStereoWideningEnabledChange} disabled={!isPremium} className="data-[state=checked]:bg-blue-500" />
            </div>
          </div>
          {stereoWideningEnabled && isPremium && (
            <div className="space-y-1">
              {isAntiPhase && (
                <p className="text-[10px] text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Anti-phase risk
                </p>
              )}
              <Slider
                value={[stereoWidening]}
                onValueChange={([value]) => onStereoWideningChange(value)}
                min={0}
                max={100}
                step={1}
                className={`[&_.relative]:bg-slate-800 [&_[role=slider]]:bg-blue-400 [&_[role=slider]]:border-blue-500 ${isAntiPhase ? '[&_[role=slider]]:bg-red-500 [&_[role=slider]]:border-red-600' : ''}`}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};