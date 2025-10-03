import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Settings, RotateCcw } from 'lucide-react';

interface InteractiveProcessingOptionsProps {
  noiseReduction: number;
  noiseReductionEnabled: boolean;
  normalize: boolean;
  normalizeLevel: number;
  compression: number;
  compressionEnabled: boolean;
  stereoWidening: number;
  stereoWideningEnabled: boolean;
  onNoiseReductionChange: (value: number) => void;
  onNoiseReductionEnabledChange: (enabled: boolean) => void;
  onNormalizeChange: (enabled: boolean) => void;
  onNormalizeLevelChange: (level: number) => void;
  onCompressionChange: (value: number) => void;
  onCompressionEnabledChange: (enabled: boolean) => void;
  onStereoWideningChange: (value: number) => void;
  onStereoWideningEnabledChange: (enabled: boolean) => void;
  onReset: () => void;
}

export const InteractiveProcessingOptions = ({
  noiseReduction,
  noiseReductionEnabled,
  normalize,
  normalizeLevel,
  compression,
  compressionEnabled,
  stereoWidening,
  stereoWideningEnabled,
  onNoiseReductionChange,
  onNoiseReductionEnabledChange,
  onNormalizeChange,
  onNormalizeLevelChange,
  onCompressionChange,
  onCompressionEnabledChange,
  onStereoWideningChange,
  onStereoWideningEnabledChange,
  onReset
}: InteractiveProcessingOptionsProps) => {

  return (
    <Card className="bg-slate-900/90 dark:bg-black/90 border-slate-700 dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <Settings className="h-4 w-4" />
            Processing Options
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="h-8 text-xs bg-slate-800 dark:bg-black border-slate-700 dark:border-slate-800 hover:bg-slate-700 dark:hover:bg-slate-900 text-white"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-6">
        {/* Noise Reduction */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white">Noise Reduction</label>
            <Switch
              checked={noiseReductionEnabled}
              onCheckedChange={onNoiseReductionEnabledChange}
            />
          </div>
          {noiseReductionEnabled && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Intensity</span>
                <span className="text-xs text-slate-300 font-mono">{noiseReduction}%</span>
              </div>
              <Slider
                value={[noiseReduction]}
                onValueChange={([value]) => onNoiseReductionChange(value)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Normalization */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white">Audio Normalization</label>
            <Switch
              checked={normalize}
              onCheckedChange={onNormalizeChange}
            />
          </div>
          {normalize && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Target Level</span>
                <span className="text-xs text-slate-300 font-mono">{normalizeLevel} dB</span>
              </div>
              <Slider
                value={[normalizeLevel]}
                onValueChange={([value]) => onNormalizeLevelChange(value)}
                min={-12}
                max={0}
                step={0.1}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Dynamic Compression */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white">Dynamic Compression</label>
            <Switch
              checked={compressionEnabled}
              onCheckedChange={onCompressionEnabledChange}
            />
          </div>
          {compressionEnabled && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Ratio</span>
                <span className="text-xs text-slate-300 font-mono">{compression}:1</span>
              </div>
              <Slider
                value={[compression]}
                onValueChange={([value]) => onCompressionChange(value)}
                min={1}
                max={10}
                step={0.5}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Stereo Widening */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white">Stereo Widening</label>
            <Switch
              checked={stereoWideningEnabled}
              onCheckedChange={onStereoWideningEnabledChange}
            />
          </div>
          {stereoWideningEnabled && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Width</span>
                <span className="text-xs text-slate-300 font-mono">{stereoWidening}%</span>
              </div>
              <Slider
                value={[stereoWidening]}
                onValueChange={([value]) => onStereoWideningChange(value)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};