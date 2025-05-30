import { useState, useMemo } from 'react';
import { Settings, Wand2, Volume2, Zap, Filter, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AudioSettingsTooltip } from '@/components/AudioSettingsTooltip';
import { SaveLocationSelector } from '@/components/SaveLocationSelector';

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

  const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  const sampleRateOptions = [
    { value: 44100, label: '44.1 kHz', description: 'CD Quality' },
    { value: 96000, label: '96 kHz', description: 'Hi-Res Audio' },
    { value: 176400, label: '176.4 kHz', description: 'Audiophile' },
    { value: 192000, label: '192 kHz', description: 'Studio Quality' }
  ];

  // Enhanced file size estimation with more accurate calculations
  const estimatedFileSize = useMemo(() => {
    const baseSize = 40; // MB for a typical 4-minute song at 320kbps MP3
    
    // Sample rate multiplier (more accurate)
    const sampleRateMultiplier = settings.sampleRate / 44100;
    
    // Bitrate multiplier (more accurate for different formats)
    let bitrateMultiplier = settings.targetBitrate / 320;
    
    // Format multiplier (more realistic)
    let formatMultiplier = 1;
    switch (settings.outputFormat) {
      case 'flac':
        formatMultiplier = 1.8; // FLAC is typically 1.5-2x larger than high-quality MP3
        break;
      case 'wav':
        formatMultiplier = 2.5; // WAV is uncompressed
        break;
      case 'ogg':
        formatMultiplier = 0.9; // OGG is slightly more efficient than MP3
        break;
      default: // mp3
        formatMultiplier = 1;
    }
    
    // Processing effects multiplier
    let effectsMultiplier = 1;
    if (settings.enableEQ) {
      const eqIntensity = settings.eqBands.reduce((sum, band) => sum + Math.abs(band), 0) / 10;
      effectsMultiplier *= (1 + eqIntensity * 0.05);
    }
    if (settings.noiseReduction) effectsMultiplier *= 1.02;
    if (settings.compression) effectsMultiplier *= 0.95; // Compression reduces size
    if (settings.normalization) effectsMultiplier *= 1.01;
    
    // Gain adjustment impact
    const gainMultiplier = 1 + Math.abs(settings.gainAdjustment) * 0.01;
    
    const estimatedSize = baseSize * sampleRateMultiplier * bitrateMultiplier * formatMultiplier * effectsMultiplier * gainMultiplier;
    
    return {
      size: estimatedSize.toFixed(1),
      quality: getQualityLevel(settings),
      improvement: Math.max(1, estimatedSize / baseSize).toFixed(1)
    };
  }, [settings]);

  const getQualityLevel = (settings: EnhancementSettings) => {
    let score = 0;
    
    // Sample rate scoring
    if (settings.sampleRate >= 192000) score += 4;
    else if (settings.sampleRate >= 96000) score += 3;
    else if (settings.sampleRate >= 44100) score += 2;
    else score += 1;
    
    // Bitrate scoring
    if (settings.targetBitrate >= 320) score += 2;
    else if (settings.targetBitrate >= 256) score += 1;
    
    // Format scoring
    if (settings.outputFormat === 'flac' || settings.outputFormat === 'wav') score += 2;
    else if (settings.outputFormat === 'mp3') score += 1;
    
    // Processing scoring
    if (settings.enableEQ) score += 1;
    if (settings.noiseReduction) score += 1;
    if (settings.normalization) score += 1;
    
    if (score >= 8) return 'Studio';
    if (score >= 6) return 'High';
    if (score >= 4) return 'Good';
    return 'Standard';
  };

  const getFrequencyColor = (freq: number, bandValue: number) => {
    const intensity = Math.abs(bandValue) / 12;
    const alpha = 0.3 + intensity * 0.7;
    
    if (freq <= 125) return `rgba(239, 68, 68, ${alpha})`;
    if (freq <= 500) return `rgba(249, 115, 22, ${alpha})`;
    if (freq <= 2000) return `rgba(234, 179, 8, ${alpha})`;
    if (freq <= 8000) return `rgba(34, 197, 94, ${alpha})`;
    return `rgba(59, 130, 246, ${alpha})`;
  };

  const getFrequencyTextColor = (freq: number) => {
    if (freq <= 125) return 'text-red-400';
    if (freq <= 500) return 'text-orange-400';
    if (freq <= 2000) return 'text-yellow-400';
    if (freq <= 8000) return 'text-green-400';
    return 'text-blue-400';
  };

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

  // ... keep existing code (presets array and applyPreset function)
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

  const getBitrateOptions = () => {
    switch (settings.outputFormat) {
      case 'mp3':
        return { min: 128, max: 320, step: 32, options: [128, 160, 192, 224, 256, 288, 320] };
      case 'ogg':
        return { min: 128, max: 500, step: 32, options: [128, 160, 192, 224, 256, 320, 384, 448, 500] };
      case 'flac':
      case 'wav':
        return { min: 500, max: 2000, step: 100, options: [500, 750, 1000, 1411, 1536, 2000] };
      default:
        return { min: 128, max: 320, step: 32, options: [128, 160, 192, 224, 256, 288, 320] };
    }
  };

  const bitrateOptions = getBitrateOptions();

  return (
    <div className="space-y-4">
      {/* Save Location Selector */}
      <SaveLocationSelector 
        onLocationSelected={onSaveLocationChange || (() => {})}
        currentLocation="Downloads folder"
      />

      {/* Specialized Presets */}
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
        {/* Basic Settings */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-lg">
              <Settings className="h-4 w-4" />
              Basic Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* Output Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white flex items-center">
                Output Format
                <AudioSettingsTooltip setting="outputFormat" />
              </label>
              <Select
                value={settings.outputFormat}
                onValueChange={(value) => handleSettingChange('outputFormat', value)}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="mp3">MP3</SelectItem>
                  <SelectItem value="flac">FLAC (Lossless)</SelectItem>
                  <SelectItem value="wav">WAV (Uncompressed)</SelectItem>
                  <SelectItem value="ogg">OGG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Bitrate */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-white flex items-center">
                  Target Bitrate
                  <AudioSettingsTooltip setting="targetBitrate" />
                </label>
                <span className="text-sm text-slate-400">
                  {settings.outputFormat === 'flac' || settings.outputFormat === 'wav' 
                    ? `${settings.targetBitrate} kbps (Lossless)`
                    : `${settings.targetBitrate} kbps`
                  }
                </span>
              </div>
              <Slider
                value={[settings.targetBitrate]}
                onValueChange={([value]) => handleSettingChange('targetBitrate', value)}
                min={bitrateOptions.min}
                max={bitrateOptions.max}
                step={bitrateOptions.step}
                className="w-full"
              />
              <div className="text-xs text-slate-500">
                {settings.outputFormat === 'flac' || settings.outputFormat === 'wav' 
                  ? 'Lossless formats: Higher values = better dynamic range'
                  : 'Lossy formats: Higher values = better quality'
                }
              </div>
            </div>

            {/* Sample Rate - Updated with radio buttons */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white flex items-center">
                Sample Rate
                <AudioSettingsTooltip setting="sampleRate" />
              </label>
              <RadioGroup
                value={settings.sampleRate.toString()}
                onValueChange={(value) => handleSettingChange('sampleRate', parseInt(value))}
                className="grid grid-cols-1 gap-3"
              >
                {sampleRateOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/50 border border-slate-600 hover:bg-slate-700 transition-colors">
                    <RadioGroupItem
                      value={option.value.toString()}
                      id={`rate-${option.value}`}
                      className="border-slate-400 text-blue-400"
                    />
                    <label 
                      htmlFor={`rate-${option.value}`} 
                      className="flex-1 cursor-pointer"
                    >
                      <div className="text-sm font-medium text-slate-200">{option.label}</div>
                      <div className="text-xs text-slate-400">{option.description}</div>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Enhanced File Size Estimation */}
            <div className="p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/30 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-blue-300">File size:</span>
                    <span className="text-sm font-medium text-blue-200">{estimatedFileSize.size} MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-300">Quality:</span>
                    <span className="text-sm font-medium text-purple-200">{estimatedFileSize.quality}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-green-300">Improvement:</span>
                    <span className="text-sm font-medium text-green-200">{estimatedFileSize.improvement}x</span>
                  </div>
                  <div className="text-xs text-slate-400">Per 4-min track</div>
                </div>
              </div>
            </div>

            {/* Gain Adjustment */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-white flex items-center">
                  Gain Adjustment
                  <AudioSettingsTooltip setting="gainAdjustment" />
                </label>
                <span className="text-sm text-slate-400">{settings.gainAdjustment > 0 ? '+' : ''}{settings.gainAdjustment} dB</span>
              </div>
              <Slider
                value={[settings.gainAdjustment]}
                onValueChange={([value]) => handleSettingChange('gainAdjustment', value)}
                min={-12}
                max={12}
                step={0.5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Audio Processing */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-lg">
              <Filter className="h-4 w-4" />
              Audio Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* Noise Reduction */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white flex items-center">
                  Noise Reduction
                  <AudioSettingsTooltip setting="noiseReduction" />
                </label>
                <Switch
                  checked={settings.noiseReduction}
                  onCheckedChange={(checked) => handleSettingChange('noiseReduction', checked)}
                />
              </div>
              {settings.noiseReduction && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Intensity</span>
                    <span className="text-xs text-slate-400">{settings.noiseReductionLevel}%</span>
                  </div>
                  <Slider
                    value={[settings.noiseReductionLevel]}
                    onValueChange={([value]) => handleSettingChange('noiseReductionLevel', value)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              )}
            </div>

            <Separator className="bg-slate-600" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white flex items-center">
                  Audio Normalization
                  <AudioSettingsTooltip setting="normalization" />
                </label>
                <Switch
                  checked={settings.normalization}
                  onCheckedChange={(checked) => handleSettingChange('normalization', checked)}
                />
              </div>
              {settings.normalization && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Target Level</span>
                    <span className="text-xs text-slate-400">{settings.normalizationLevel} dB</span>
                  </div>
                  <Slider
                    value={[settings.normalizationLevel]}
                    onValueChange={([value]) => handleSettingChange('normalizationLevel', value)}
                    min={-12}
                    max={0}
                    step={1}
                  />
                </div>
              )}
            </div>

            <Separator className="bg-slate-600" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white flex items-center">
                  Dynamic Compression
                  <AudioSettingsTooltip setting="compression" />
                </label>
                <Switch
                  checked={settings.compression}
                  onCheckedChange={(checked) => handleSettingChange('compression', checked)}
                />
              </div>
              {settings.compression && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Ratio</span>
                    <span className="text-xs text-slate-400">{settings.compressionRatio}:1</span>
                  </div>
                  <Slider
                    value={[settings.compressionRatio]}
                    onValueChange={([value]) => handleSettingChange('compressionRatio', value)}
                    min={1}
                    max={10}
                    step={0.5}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EQ Settings - Always expanded */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Sliders className="h-4 w-4" />
            10-Band Equalizer
            <AudioSettingsTooltip setting="eq" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center justify-between">
            <Switch
              checked={settings.enableEQ}
              onCheckedChange={(checked) => handleSettingChange('enableEQ', checked)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={resetEQ}
              className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white h-8"
            >
              Reset EQ
            </Button>
          </div>
          
          {/* EQ is always visible when enabled */}
          {settings.enableEQ && (
            <div className="relative bg-slate-900/50 rounded-lg p-6">
              {/* Grid lines */}
              <div className="absolute inset-6 pointer-events-none">
                <div className="h-full w-full grid grid-cols-10 gap-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="relative">
                      <div className="absolute inset-0 border-l border-slate-600/30"></div>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <div 
                          key={j} 
                          className="absolute w-full border-t border-slate-600/20"
                          style={{ top: `${(j + 1) * 11.11}%` }}
                        ></div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-center items-end gap-3 py-4 relative z-10">
                {eqFrequencies.map((freq, index) => (
                  <div key={freq} className="flex flex-col items-center">
                    <div className="h-32 flex items-end justify-center mb-2 relative">
                      <div 
                        className="absolute inset-0 rounded opacity-20"
                        style={{ 
                          background: `linear-gradient(to top, ${getFrequencyColor(freq, settings.eqBands[index])}, transparent)`
                        }}
                      ></div>
                      <Slider
                        orientation="vertical"
                        value={[settings.eqBands[index]]}
                        onValueChange={([value]) => handleEQBandChange(index, value)}
                        min={-12}
                        max={12}
                        step={0.5}
                        className="h-28 w-6 relative z-10"
                      />
                    </div>
                    <div className={`text-xs font-medium ${getFrequencyTextColor(freq)} mb-1`}>
                      {freq < 1000 ? `${freq}Hz` : `${freq/1000}kHz`}
                    </div>
                    <div className="text-xs text-slate-300">
                      {settings.eqBands[index] > 0 ? '+' : ''}{settings.eqBands[index]}dB
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhancement Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Ready to Enhance</h3>
              <p className="text-slate-400 text-sm">
                {hasFiles 
                  ? "All settings configured. Enhanced files will be saved to your selected folder."
                  : "Upload audio files first to begin enhancement."
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
                  Processing...
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
