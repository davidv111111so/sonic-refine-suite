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

interface EnhancementSettingsProps {
  onEnhance: (settings: EnhancementSettings) => void;
  isProcessing: boolean;
  hasFiles: boolean;
}

interface EnhancementSettings {
  targetBitrate: number;
  sampleRate: number; // Changed from array to single value
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

export const EnhancementSettings = ({ onEnhance, isProcessing, hasFiles }: EnhancementSettingsProps) => {
  const [settings, setSettings] = useState<EnhancementSettings>({
    targetBitrate: 320,
    sampleRate: 44100, // Default to 44.1kHz
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
    enableEQ: true, // Default to expanded
    eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 10-band EQ
  });

  const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  // Updated sample rate options (removed 22050, 48000, 88200, 384000)
  const sampleRateOptions = [
    { value: 44100, label: '44.1 kHz', description: 'CD Quality' },
    { value: 96000, label: '96 kHz', description: 'Hi-Res Audio' },
    { value: 176400, label: '176.4 kHz', description: 'Audiophile' },
    { value: 192000, label: '192 kHz', description: 'Studio Quality' }
  ];

  // File size estimation
  const estimatedFileSize = useMemo(() => {
    const baseSize = 40; // MB for a typical 4-minute song
    
    // Sample rate multiplier
    const sampleRateMultiplier = settings.sampleRate / 44100;
    
    // Bitrate multiplier
    const bitrateMultiplier = settings.targetBitrate / 320;
    
    // Format multiplier
    const formatMultiplier = settings.outputFormat === 'flac' ? 1.5 : 
                            settings.outputFormat === 'wav' ? 2 : 1;
    
    // Processing effects (compression reduces size, others may increase)
    const effectsMultiplier = settings.compression ? 0.9 : 1;
    
    const estimatedSize = baseSize * sampleRateMultiplier * bitrateMultiplier * formatMultiplier * effectsMultiplier;
    
    return estimatedSize.toFixed(1);
  }, [settings.sampleRate, settings.targetBitrate, settings.outputFormat, settings.compression]);

  const getFrequencyColor = (freq: number, bandValue: number) => {
    const intensity = Math.abs(bandValue) / 12; // Normalize to 0-1
    const alpha = 0.3 + intensity * 0.7; // Base opacity + dynamic
    
    if (freq <= 125) return `rgba(239, 68, 68, ${alpha})`; // red
    if (freq <= 500) return `rgba(249, 115, 22, ${alpha})`; // orange
    if (freq <= 2000) return `rgba(234, 179, 8, ${alpha})`; // yellow
    if (freq <= 8000) return `rgba(34, 197, 94, ${alpha})`; // green
    return `rgba(59, 130, 246, ${alpha})`; // blue
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
    // Convert single sample rate back to array format for compatibility
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
        eqBands: [2, 1, 0, -1, 0, 1, 2, 1, -1, -2] // Vinyl restoration curve
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
        eqBands: [-3, -2, 0, 2, 4, 3, 2, 1, -1, -2] // Voice clarity
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
        eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // Flat response
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
        eqBands: [6, 4, 2, 1, 0, -1, -2, -1, 0, 1] // Bass boost
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
        eqBands: [-2, -1, 0, 1, 3, 4, 3, 2, 1, 0] // Vocal presence
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
        eqBands: [3, 2, 1, 0, 1, 2, 3, 4, 3, 2] // Electronic music curve
      }
    }
  ];

  const applyPreset = (preset: any) => {
    setSettings(prev => ({ ...prev, ...preset.settings }));
  };

  // Get bitrate options based on format
  const getBitrateOptions = () => {
    switch (settings.outputFormat) {
      case 'mp3':
        return { min: 128, max: 320, step: 32, options: [128, 160, 192, 224, 256, 288, 320] };
      case 'ogg':
        return { min: 128, max: 500, step: 32, options: [128, 160, 192, 224, 256, 320, 384, 448, 500] };
      case 'flac':
      case 'wav':
        return { min: 500, max: 2000, step: 100, options: [500, 750, 1000, 1411, 1536, 2000] }; // Lossless equivalent rates
      default:
        return { min: 128, max: 320, step: 32, options: [128, 160, 192, 224, 256, 288, 320] };
    }
  };

  const bitrateOptions = getBitrateOptions();

  return (
    <div className="space-y-4">
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

            {/* File Size Estimation */}
            <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-300">Expected file size:</span>
                <span className="text-sm font-medium text-blue-200">{estimatedFileSize} MB</span>
              </div>
              <div className="text-xs text-blue-400 mt-1">Per 4-minute track (approximate)</div>
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

      {/* Enhanced EQ Settings - Always expanded */}
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
