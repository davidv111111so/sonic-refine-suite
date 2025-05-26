
import { useState } from 'react';
import { Settings, Wand2, Volume2, Zap, Filter, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface EnhancementSettingsProps {
  onEnhance: (settings: EnhancementSettings) => void;
  isProcessing: boolean;
  hasFiles: boolean;
}

interface EnhancementSettings {
  targetBitrate: number;
  sampleRates: number[];
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
    sampleRates: [44100],
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
    enableEQ: false,
    eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 10-band EQ
  });

  const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  const sampleRateOptions = [22050, 44100, 48000, 96000];

  const getFrequencyColor = (freq: number) => {
    if (freq <= 125) return 'text-red-400'; // Sub-bass / Bass
    if (freq <= 500) return 'text-orange-400'; // Low-mid
    if (freq <= 2000) return 'text-yellow-400'; // Mid
    if (freq <= 8000) return 'text-green-400'; // High-mid
    return 'text-blue-400'; // Treble
  };

  const handleSettingChange = (key: keyof EnhancementSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSampleRateChange = (rate: number, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      sampleRates: checked 
        ? [...prev.sampleRates, rate].sort((a, b) => a - b)
        : prev.sampleRates.filter(r => r !== rate)
    }));
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
    onEnhance(settings);
  };

  const presets = [
    {
      name: "Vinyl Restoration",
      settings: {
        targetBitrate: 320,
        sampleRates: [48000],
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
        sampleRates: [44100],
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
        sampleRates: [48000],
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
        sampleRates: [44100],
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
        sampleRates: [44100],
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
        sampleRates: [48000],
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

  return (
    <div className="space-y-4">
      {/* Presets */}
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
              <label className="text-sm font-medium text-white">Output Format</label>
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
                <label className="text-sm font-medium text-white">Target Bitrate</label>
                <span className="text-sm text-slate-400">{settings.targetBitrate} kbps</span>
              </div>
              <Slider
                value={[settings.targetBitrate]}
                onValueChange={([value]) => handleSettingChange('targetBitrate', value)}
                min={128}
                max={320}
                step={32}
                className="w-full"
              />
            </div>

            {/* Sample Rates */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Sample Rates</label>
              <div className="grid grid-cols-2 gap-2">
                {sampleRateOptions.map((rate) => (
                  <div key={rate} className="flex items-center space-x-2">
                    <Checkbox
                      id={`rate-${rate}`}
                      checked={settings.sampleRates.includes(rate)}
                      onCheckedChange={(checked) => handleSampleRateChange(rate, checked as boolean)}
                      className="border-slate-500"
                    />
                    <label htmlFor={`rate-${rate}`} className="text-sm text-slate-300">
                      {rate >= 1000 ? `${rate/1000}k` : rate} Hz
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Gain Adjustment */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-white">Gain Adjustment</label>
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
                <label className="text-sm font-medium text-white">Noise Reduction</label>
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

            {/* Normalization */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Audio Normalization</label>
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

            {/* Dynamic Range Compression */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Dynamic Compression</label>
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

      {/* EQ Settings */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Sliders className="h-4 w-4" />
            10-Band Equalizer
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
          
          {settings.enableEQ && (
            <div className="flex justify-center items-end gap-3 py-4">
              {eqFrequencies.map((freq, index) => (
                <div key={freq} className="flex flex-col items-center">
                  <div className="h-32 flex items-end justify-center mb-2">
                    <Slider
                      orientation="vertical"
                      value={[settings.eqBands[index]]}
                      onValueChange={([value]) => handleEQBandChange(index, value)}
                      min={-12}
                      max={12}
                      step={0.5}
                      className="h-28 w-4"
                    />
                  </div>
                  <div className={`text-xs font-medium ${getFrequencyColor(freq)} mb-1`}>
                    {freq < 1000 ? `${freq}Hz` : `${freq/1000}kHz`}
                  </div>
                  <div className="text-xs text-slate-300">
                    {settings.eqBands[index] > 0 ? '+' : ''}{settings.eqBands[index]}dB
                  </div>
                </div>
              ))}
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
                  ? "All settings configured. Enhanced files will be saved to your Desktop."
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
