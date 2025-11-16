import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Settings, RotateCcw } from "lucide-react";
import { AudioSettingsTooltip } from "@/components/AudioSettingsTooltip";
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
  onReset,
}: InteractiveProcessingOptionsProps) => {
  return (
    <Card className="bg-slate-900/90 dark:bg-black/90 border-slate-700 dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 bg-clip-text font-bold text-lg bg-gray-900 hover:bg-gray-800 text-violet-200">
            <Settings className="h-4 w-4 text-pink-400" />
            Processing Options
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="h-8 text-xs border-slate-700 dark:border-slate-800 text-red-700 bg-zinc-50"
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
            <label className="text-sm font-bold bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text flex items-center text-cyan-300">
              Noise Reduction
              <AudioSettingsTooltip setting="noiseReduction" />
            </label>
            <Switch
              checked={noiseReductionEnabled}
              onCheckedChange={onNoiseReductionEnabledChange}
              className="text-sky-300 bg-indigo-900 hover:bg-indigo-800"
            />
          </div>
          {noiseReductionEnabled && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs bg-gradient-to-r from-slate-200 to-gray-200 bg-clip-text text-transparent font-semibold">
                  Intensity
                </span>
                <span className="text-xs text-white font-mono font-bold">
                  {noiseReduction}%
                </span>
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
            <label className="text-sm font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text flex items-center text-cyan-300">
              Audio Normalization
              <AudioSettingsTooltip setting="normalization" />
            </label>
            <Switch
              checked={normalize}
              onCheckedChange={onNormalizeChange}
              className="bg-indigo-900 hover:bg-indigo-800"
            />
          </div>
          {normalize && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs bg-gradient-to-r from-slate-200 to-gray-200 bg-clip-text font-semibold text-amber-400">
                  Target Level
                </span>
                <span className="text-xs text-white font-mono font-bold">
                  {normalizeLevel} dB
                </span>
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
            <label className="text-sm font-bold bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text flex items-center text-sky-400">
              Dynamic Compression
              <AudioSettingsTooltip setting="compression" />
            </label>
            <Switch
              checked={compressionEnabled}
              onCheckedChange={onCompressionEnabledChange}
              className="text-violet-500 bg-indigo-900 hover:bg-indigo-800"
            />
          </div>
          {compressionEnabled && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs bg-gradient-to-r from-slate-200 to-gray-200 bg-clip-text text-transparent font-semibold">
                  Ratio
                </span>
                <span className="text-xs text-white font-mono font-bold">
                  {compression}:1
                </span>
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
            <label className="text-sm font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text flex items-center text-sky-400">
              Stereo Widening
              <AudioSettingsTooltip setting="stereoWidening" />
            </label>
            <Switch
              checked={stereoWideningEnabled}
              onCheckedChange={onStereoWideningEnabledChange}
              className="text-left bg-indigo-900 hover:bg-indigo-800"
            />
          </div>
          {stereoWideningEnabled && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs bg-gradient-to-r from-slate-200 to-gray-200 bg-clip-text text-transparent font-semibold">
                  Width
                </span>
                <span className="text-xs text-white font-mono font-bold">
                  {stereoWidening}%
                </span>
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
