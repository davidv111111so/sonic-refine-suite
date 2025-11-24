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
  const { t } = useLanguage();
  const { isPremium } = useUserSubscription();

  // Check if stereo widening is in anti-phase territory (>70% is risky)
  const isAntiPhase = stereoWidening > 70;

  return (
    <Card className="bg-slate-900/90 dark:bg-black/90 border-slate-700 dark:border-slate-800">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 bg-clip-text font-bold text-lg text-violet-200">
            <Settings className="h-4 w-4 text-pink-400" />
            {t('processing.options')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBatchModeChange(!batchMode)}
              className={`h-7 text-xs ${batchMode ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 dark:border-slate-800 text-white bg-slate-800'}`}
            >
              <Users className="h-3 w-3 mr-1" />
              {batchMode ? t('processing.batchMode') : t('processing.individualMode')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="h-7 text-xs border-slate-700 dark:border-slate-800 text-red-700 bg-zinc-50"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              {t('button.reset')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: Noise Reduction & Normalization */}
          <div className="space-y-4">
            {/* Noise Reduction */}
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text flex items-center text-cyan-300">
                  Noise Reduction
                  <AudioSettingsTooltip setting="noiseReduction" />
                </label>
                <Switch checked={noiseReductionEnabled} onCheckedChange={onNoiseReductionEnabledChange} className="scale-75 data-[state=checked]:bg-cyan-500" />
              </div>
              {noiseReductionEnabled && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-400">Intensity</span>
                    <span className="text-[10px] text-white font-mono">{noiseReduction}%</span>
                  </div>
                  <Slider value={[noiseReduction]} onValueChange={([value]) => onNoiseReductionChange(value)} min={0} max={100} step={1} className="w-full" />
                </div>
              )}
            </div>

            {/* Normalization */}
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text flex items-center text-cyan-300">
                  {t('settings.normalization')}
                  <AudioSettingsTooltip setting="normalization" />
                </label>
                <Switch checked={normalize} onCheckedChange={onNormalizeChange} className="scale-75 data-[state=checked]:bg-purple-500" />
              </div>
              {normalize && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-400">Target Level</span>
                    <span className="text-[10px] font-mono font-bold text-slate-50">{normalizeLevel.toFixed(1)} dB</span>
                  </div>
                  <Slider value={[normalizeLevel]} onValueChange={([value]) => onNormalizeLevelChange(Math.max(-3, Math.min(0, value)))} min={-3} max={0} step={0.1} className="w-full" />
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Compression & Stereo Widening */}
          <div className="space-y-4">
            {/* Dynamic Compression */}
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text flex items-center text-cyan-300">
                  {t('settings.compression')}
                  <AudioSettingsTooltip setting="compression" />
                </label>
                <Switch checked={compressionEnabled} onCheckedChange={onCompressionEnabledChange} className="scale-75 data-[state=checked]:bg-green-500" />
              </div>
              {compressionEnabled && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">{t('processing.compressionRatio')}</span>
                    <Select value={compressionRatio} onValueChange={onCompressionRatioChange}>
                      <SelectTrigger className="h-6 text-[10px] w-20 bg-slate-900 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">1:1</SelectItem>
                        <SelectItem value="2:1">2:1</SelectItem>
                        <SelectItem value="4:1">4:1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-400">{t('processing.threshold')}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-50">{compressionThreshold} dB</span>
                    </div>
                    <Slider value={[compressionThreshold]} onValueChange={([value]) => onCompressionThresholdChange(value)} min={-24} max={0} step={1} className="w-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Stereo Widening */}
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text flex items-center text-cyan-300">
                  {t('settings.stereoWidening')}
                  <AudioSettingsTooltip setting="stereoWidening" />
                  {isPremium && <span className="ml-2 text-[8px] bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-1.5 py-0.5 rounded-full font-bold">PRO</span>}
                </label>
                <Switch checked={stereoWideningEnabled} onCheckedChange={onStereoWideningEnabledChange} disabled={!isPremium} className="scale-75 data-[state=checked]:bg-blue-500" />
              </div>
              {stereoWideningEnabled && isPremium && (
                <div className="space-y-1">
                  {isAntiPhase && (
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle className="h-3 w-3 text-red-400" />
                      <span className="text-[8px] text-red-300">{t('processing.antiPhaseWarning')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-400">{t('processing.width')}</span>
                    <span className={`text-[10px] font-mono font-bold ${isAntiPhase ? 'text-red-400' : 'text-white'}`}>{stereoWidening}%</span>
                  </div>
                  <Slider value={[stereoWidening]} onValueChange={([value]) => onStereoWideningChange(value)} min={0} max={100} step={1} className={`w-full ${isAntiPhase ? '[&_[role=slider]]:bg-red-500 [&_[role=slider]]:border-red-600' : ''}`} />
                </div>
              )}
              {!isPremium && stereoWideningEnabled && <p className="text-[10px] text-amber-400 mt-1">{t('processing.premiumRequired')}</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};