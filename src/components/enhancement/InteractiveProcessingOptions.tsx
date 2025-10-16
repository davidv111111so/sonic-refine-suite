import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, RotateCcw, AlertTriangle, Users } from 'lucide-react';
import { AudioSettingsTooltip } from '@/components/AudioSettingsTooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserSubscription } from '@/hooks/useUserSubscription';
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
  const {
    t
  } = useLanguage();
  const {
    isPremium
  } = useUserSubscription();

  // Check if stereo widening is in anti-phase territory (>70% is risky)
  const isAntiPhase = stereoWidening > 70;
  return <Card className="bg-slate-900/90 dark:bg-black/90 border-slate-700 dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 bg-clip-text font-bold text-lg text-violet-200">
            <Settings className="h-4 w-4 text-pink-400" />
            {t('processing.options')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onBatchModeChange(!batchMode)} className={`h-8 text-xs ${batchMode ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 dark:border-slate-800 text-white bg-slate-800'}`}>
              <Users className="h-3 w-3 mr-1" />
              {batchMode ? t('processing.batchMode') : t('processing.individualMode')}
            </Button>
            <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs border-slate-700 dark:border-slate-800 text-red-700 bg-zinc-50">
              <RotateCcw className="h-3 w-3 mr-1" />
              {t('button.reset')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-6">
        {/* Noise Reduction */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text flex items-center text-cyan-300">
              Noise Reduction
              <AudioSettingsTooltip setting="noiseReduction" />
            </label>
            <Switch checked={noiseReductionEnabled} onCheckedChange={onNoiseReductionEnabledChange} className="text-sky-300 bg-indigo-900 hover:bg-indigo-800" />
          </div>
          {noiseReductionEnabled && <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs bg-gradient-to-r from-slate-200 to-gray-200 bg-clip-text text-transparent font-semibold">Intensity</span>
                <span className="text-xs text-white font-mono font-bold">{noiseReduction}%</span>
              </div>
              <Slider value={[noiseReduction]} onValueChange={([value]) => onNoiseReductionChange(value)} min={0} max={100} step={1} className="w-full" />
            </div>}
        </div>

        {/* Normalization - Restricted to 0dB to -3dB, default -0.3dB */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text flex items-center text-cyan-300">
              {t('settings.normalization')}
              <AudioSettingsTooltip setting="normalization" />
            </label>
            <Switch checked={normalize} onCheckedChange={onNormalizeChange} className="bg-indigo-900 hover:bg-indigo-800" />
          </div>
          {normalize && <div className="space-y-2">
              <div className="flex justify-between">
                
                <span className="text-xs font-mono font-bold text-slate-50">{normalizeLevel.toFixed(1)} dB</span>
              </div>
              <Slider value={[normalizeLevel]} onValueChange={([value]) => onNormalizeLevelChange(Math.max(-3, Math.min(0, value)))} min={-3} max={0} step={0.1} className="w-full" />
              <p className="text-[10px] text-slate-200">{t('processing.normalizationInfo')}</p>
            </div>}
        </div>

        {/* Dynamic Compression - Limited ratios and threshold */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text flex items-center text-cyan-300">
              {t('settings.compression')}
              <AudioSettingsTooltip setting="compression" />
            </label>
            <Switch checked={compressionEnabled} onCheckedChange={onCompressionEnabledChange} className="text-violet-500 bg-indigo-900 hover:bg-indigo-800" />
          </div>
          {compressionEnabled && <div className="space-y-3">
              {/* Compression Ratio - Limited to 1:1, 2:1, 4:1 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs bg-gradient-to-r from-slate-200 to-gray-200 bg-clip-text text-transparent font-semibold">{t('processing.compressionRatio')}</span>
                  <span className="text-xs font-mono font-bold text-slate-50">{compressionRatio}</span>
                </div>
                <Select value={compressionRatio} onValueChange={onCompressionRatioChange}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="2:1">2:1</SelectItem>
                    <SelectItem value="4:1">4:1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Threshold Control */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs bg-gradient-to-r from-slate-200 to-gray-200 bg-clip-text text-transparent font-semibold">{t('processing.threshold')}</span>
                  <span className="text-xs font-mono font-bold text-slate-50">{compressionThreshold} dB</span>
                </div>
                <Slider value={[compressionThreshold]} onValueChange={([value]) => onCompressionThresholdChange(value)} min={-40} max={0} step={1} className="w-full" />
                <p className="text-[10px] text-slate-200">{t('processing.thresholdInfo')}</p>
              </div>
            </div>}
        </div>

        {/* Stereo Widening - Premium Feature with Anti-Phase Warning */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text flex items-center text-cyan-300">
              {t('settings.stereoWidening')}
              <AudioSettingsTooltip setting="stereoWidening" />
              {isPremium && <span className="ml-2 text-[10px] bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-2 py-0.5 rounded-full font-bold">PREMIUM</span>}
            </label>
            <Switch checked={stereoWideningEnabled} onCheckedChange={onStereoWideningEnabledChange} disabled={!isPremium} className="text-left bg-indigo-900 hover:bg-indigo-800" />
          </div>
          {stereoWideningEnabled && isPremium && <div className="space-y-2">
              {isAntiPhase && <div className="flex items-center gap-2 p-2 bg-red-900/30 border border-red-600/50 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-[10px] text-red-300">{t('processing.antiPhaseWarning')}</span>
                </div>}
              <div className="flex justify-between">
                <span className="text-xs bg-gradient-to-r from-slate-200 to-gray-200 bg-clip-text text-transparent font-semibold">{t('processing.width')}</span>
                <span className={`text-xs font-mono font-bold ${isAntiPhase ? 'text-red-400' : 'text-white'}`}>{stereoWidening}%</span>
              </div>
              <Slider value={[stereoWidening]} onValueChange={([value]) => onStereoWideningChange(value)} min={0} max={100} step={1} className={`w-full ${isAntiPhase ? '[&_[role=slider]]:bg-red-500 [&_[role=slider]]:border-red-600' : ''}`} />
              <p className="text-[10px] text-slate-400">{t('processing.stereoWideningInfo')}</p>
            </div>}
          {!isPremium && stereoWideningEnabled && <p className="text-[10px] text-amber-400">{t('processing.premiumRequired')}</p>}
        </div>
      </CardContent>
    </Card>;
};