import { useState, useMemo } from 'react';
import { Settings, Wand2, Zap, Filter, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SaveLocationSelector } from '@/components/SaveLocationSelector';
import { BasicSettings } from '@/components/enhancement/BasicSettings';
import { AudioProcessingSettings } from '@/components/enhancement/AudioProcessingSettings';
import { EqualizerSettings } from '@/components/enhancement/EqualizerSettings';
import { AudioSettingsTooltip } from '@/components/AudioSettingsTooltip';
import { FFmpegReference } from '@/components/FFmpegReference';

interface EnhancementSettingsProps {
  onEnhance: (settings: EnhancementSettings) => void;
  isProcessing: boolean;
  hasFiles: boolean;
  onSaveLocationChange?: (location: string | FileSystemDirectoryHandle) => void;
}

interface EnhancementSettings {
  targetBitrate: number;
  sampleRate: number;
  noiseReduction: boolean;
  noiseReductionLevel: number;
  normalization: boolean;
  normalizationLevel: number;
  bassBoost: boolean;
  bassBoostLevel: number;
  trebleEnhancement: boolean;
  trebleLevel: number;
  compression: boolean;
  compressionRatio: number;
  outputFormat: string;
  gainAdjustment: number;
  enableEQ: boolean;
  eqBands: number[];
}

// Move getQualityLevel function outside component to avoid hoisting issues
const getQualityLevel = (settings: EnhancementSettings) => {
  let score = 0;
  
  if (settings.sampleRate >= 192000) score += 4;
  else if (settings.sampleRate >= 96000) score += 3;
  else if (settings.sampleRate >= 44100) score += 2;
  else score += 1;
  
  if (settings.targetBitrate >= 320) score += 2;
  else if (settings.targetBitrate >= 256) score += 1;
  
  if (settings.outputFormat === 'flac' || settings.outputFormat === 'wav') score += 2;
  else if (settings.outputFormat === 'mp3') score += 1;
  
  if (settings.enableEQ) score += 1;
  if (settings.noiseReduction) score += 1;
  if (settings.normalization) score += 1;
  
  if (score >= 8) return 'Studio';
  if (score >= 6) return 'High';
  if (score >= 4) return 'Good';
  return 'Standard';
};

export const EnhancementSettings = ({ onEnhance, isProcessing, hasFiles, onSaveLocationChange }: EnhancementSettingsProps) => {
  const [settings, setSettings] = useState<EnhancementSettings>({
    targetBitrate: 320,
    sampleRate: 44100,
    noiseReduction: true,
    noiseReductionLevel: 50,
    normalization: true,
    normalizationLevel: -3,
    bassBoost: false,
    bassBoostLevel: 20,
    trebleEnhancement: false,
    trebleLevel: 15,
    compression: false,
    compressionRatio: 4,
    outputFormat: 'mp3',
    gainAdjustment: 0,
    enableEQ: true,
    eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  });

  const estimatedFileSize = useMemo(() => {
    const baseSize = 40;
    const sampleRateMultiplier = settings.sampleRate / 44100;
    let bitrateMultiplier = settings.targetBitrate / 320;
    
    let formatMultiplier = 1;
    switch (settings.outputFormat) {
      case 'flac': formatMultiplier = 1.8; break;
      case 'wav': formatMultiplier = 2.5; break;
      case 'ogg': formatMultiplier = 0.9; break;
      default: formatMultiplier = 1;
    }
    
    let effectsMultiplier = 1;
    if (settings.enableEQ) {
      const eqIntensity = settings.eqBands.reduce((sum, band) => sum + Math.abs(band), 0) / 10;
      effectsMultiplier *= (1 + eqIntensity * 0.05);
    }
    if (settings.noiseReduction) effectsMultiplier *= 1.02;
    if (settings.compression) effectsMultiplier *= 0.95;
    if (settings.normalization) effectsMultiplier *= 1.01;
    
    const gainMultiplier = 1 + Math.abs(settings.gainAdjustment) * 0.01;
    const estimatedSize = baseSize * sampleRateMultiplier * bitrateMultiplier * formatMultiplier * effectsMultiplier * gainMultiplier;
    
    return {
      size: estimatedSize.toFixed(1),
      quality: getQualityLevel(settings),
      improvement: Math.max(1, estimatedSize / baseSize).toFixed(1)
    };
  }, [settings]);

  const handleSettingChange = (key: keyof EnhancementSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleEQBandChange = (bandIndex: number, value: number) => {
    const newEqBands = [...settings.eqBands];
    newEqBands[bandIndex] = value;
    setSettings(prev => ({ ...prev, eqBands: newEqBands }));
  };

  const resetEQ = () => {
    setSettings(prev => ({ ...prev, eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }));
  };

  const handleEnhance = () => {
    const enhancementSettings = {
      ...settings,
      sampleRates: [settings.sampleRate]
    };
    onEnhance(enhancementSettings);
  };

  const presets = [
    {
      name: "Vinyl Restoration",
      settings: {
        targetBitrate: 320,
        sampleRate: 96000,
        noiseReduction: true,
        noiseReductionLevel: 70,
        normalization: true,
        normalizationLevel: -3,
        outputFormat: 'flac',
        enableEQ: true,
        eqBands: [2, 1, 0, -1, 0, 1, 2, 1, -1, -2]
      }
    },
    {
      name: "Voice Memo",
      settings: {
        targetBitrate: 192,
        sampleRate: 44100,
        noiseReduction: true,
        noiseReductionLevel: 90,
        normalization: true,
        normalizationLevel: -1,
        outputFormat: 'mp3',
        enableEQ: true,
        eqBands: [-3, -2, 0, 2, 4, 3, 2, 1, -1, -2]
      }
    },
    {
      name: "Flat",
      settings: {
        targetBitrate: 320,
        sampleRate: 96000,
        noiseReduction: false,
        normalization: true,
        normalizationLevel: -6,
        outputFormat: 'flac',
        enableEQ: true,
        eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      }
    },
    {
      name: "Bass",
      settings: {
        targetBitrate: 320,
        sampleRate: 44100,
        noiseReduction: true,
        noiseReductionLevel: 30,
        normalization: true,
        normalizationLevel: -3,
        outputFormat: 'mp3',
        enableEQ: true,
        eqBands: [6, 4, 2, 1, 0, -1, -2, -1, 0, 1]
      }
    },
    {
      name: "Vocal",
      settings: {
        targetBitrate: 256,
        sampleRate: 44100,
        noiseReduction: true,
        noiseReductionLevel: 40,
        normalization: true,
        normalizationLevel: -2,
        outputFormat: 'mp3',
        enableEQ: true,
        eqBands: [-2, -1, 0, 1, 3, 4, 3, 2, 1, 0]
      }
    },
    {
      name: "Electronic",
      settings: {
        targetBitrate: 320,
        sampleRate: 96000,
        noiseReduction: false,
        normalization: true,
        normalizationLevel: -3,
        outputFormat: 'mp3',
        enableEQ: true,
        eqBands: [3, 2, 1, 0, 1, 2, 3, 4, 3, 2]
      }
    }
  ];

  const applyPreset = (preset: any) => {
    setSettings(prev => ({ ...prev, ...preset.settings }));
  };

  return (
    <div className="space-y-4">
      <SaveLocationSelector 
        onLocationSelected={onSaveLocationChange || (() => {})}
        currentLocation="Downloads folder"
      />

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Wand2 className="h-4 w-4" />
            Specialized Presets
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white h-auto py-2"
                onClick={() => applyPreset(preset)}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-lg">
              <Settings className="h-4 w-4" />
              Basic Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <BasicSettings 
              settings={settings}
              onSettingChange={handleSettingChange}
              estimatedFileSize={estimatedFileSize}
            />
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-lg">
              <Filter className="h-4 w-4" />
              Audio Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <AudioProcessingSettings 
              settings={settings}
              onSettingChange={handleSettingChange}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Sliders className="h-4 w-4" />
            10-Band Equalizer
            <AudioSettingsTooltip setting="eq" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <EqualizerSettings 
            settings={settings}
            onSettingChange={handleSettingChange}
            onEQBandChange={handleEQBandChange}
            onResetEQ={resetEQ}
          />
        </CardContent>
      </Card>

      {/* Add FFmpeg Reference */}
      <FFmpegReference settings={settings} fileName="your_audio_file.wav" />

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Ready to Enhance</h3>
              <p className="text-slate-400 text-sm">
                {hasFiles 
                  ? "Professional audio enhancement will increase loudness, reduce noise, and improve clarity with larger file sizes."
                  : "Upload audio files first to begin professional enhancement."
                }
              </p>
            </div>
            <Button
              onClick={handleEnhance}
              disabled={!hasFiles || isProcessing}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2"
            >
              {isProcessing ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Enhance Audio
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
