import { useState } from 'react';
import { Settings, Wand2, Volume2, Zap, Filter, Equalizer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface EnhancementSettingsProps {
  onEnhance: (settings: EnhancementSettings) => void;
  isProcessing: boolean;
  hasFiles: boolean;
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

export const EnhancementSettings = ({ onEnhance, isProcessing, hasFiles }: EnhancementSettingsProps) => {
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
    enableEQ: false,
    eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 10-band EQ
  });

  const eqFrequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

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
    onEnhance(settings);
  };

  const presets = [
    {
      name: "High Quality",
      settings: {
        targetBitrate: 320,
        sampleRate: 44100,
        noiseReduction: true,
        noiseReductionLevel: 30,
        normalization: true,
        normalizationLevel: -3,
        outputFormat: 'flac'
      }
    },
    {
      name: "Balanced",
      settings: {
        targetBitrate: 256,
        sampleRate: 44100,
        noiseReduction: true,
        noiseReductionLevel: 50,
        normalization: true,
        normalizationLevel: -6,
        outputFormat: 'mp3'
      }
    },
    {
      name: "Space Saving",
      settings: {
        targetBitrate: 192,
        sampleRate: 44100,
        noiseReduction: true,
        noiseReductionLevel: 70,
        normalization: true,
        normalizationLevel: -9,
        outputFormat: 'mp3'
      }
    }
  ];

  const applyPreset = (preset: any) => {
    setSettings(prev => ({ ...prev, ...preset.settings }));
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Wand2 className="h-5 w-5" />
            Quick Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
                onClick={() => applyPreset(preset)}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings className="h-5 w-5" />
              Basic Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Output Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Output Format</label>
              <Select
                value={settings.outputFormat}
                onValueChange={(value) => handleSettingChange('outputFormat', value)}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="mp3">MP3</SelectItem>
                  <SelectItem value="flac">FLAC (Lossless)</SelectItem>
                  <SelectItem value="wav">WAV</SelectItem>
                  <SelectItem value="ogg">OGG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Bitrate */}
            <div className="space-y-3">
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

            {/* Sample Rate */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Sample Rate</label>
              <Select
                value={settings.sampleRate.toString()}
                onValueChange={(value) => handleSettingChange('sampleRate', parseInt(value))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="22050">22.05 kHz</SelectItem>
                  <SelectItem value="44100">44.1 kHz (CD Quality)</SelectItem>
                  <SelectItem value="48000">48 kHz</SelectItem>
                  <SelectItem value="96000">96 kHz (High-Res)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gain Adjustment */}
            <div className="space-y-3">
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Filter className="h-5 w-5" />
              Audio Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Noise Reduction */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Noise Reduction</label>
                <Switch
                  checked={settings.noiseReduction}
                  onCheckedChange={(checked) => handleSettingChange('noiseReduction', checked)}
                />
              </div>
              {settings.noiseReduction && (
                <div className="space-y-2">
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Audio Normalization</label>
                <Switch
                  checked={settings.normalization}
                  onCheckedChange={(checked) => handleSettingChange('normalization', checked)}
                />
              </div>
              {settings.normalization && (
                <div className="space-y-2">
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Dynamic Compression</label>
                <Switch
                  checked={settings.compression}
                  onCheckedChange={(checked) => handleSettingChange('compression', checked)}
                />
              </div>
              {settings.compression && (
                <div className="space-y-2">
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Equalizer className="h-5 w-5" />
            10-Band Equalizer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Switch
              checked={settings.enableEQ}
              onCheckedChange={(checked) => handleSettingChange('enableEQ', checked)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={resetEQ}
              className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
            >
              Reset EQ
            </Button>
          </div>
          
          {settings.enableEQ && (
            <div className="grid grid-cols-5 lg:grid-cols-10 gap-4">
              {eqFrequencies.map((freq, index) => (
                <div key={freq} className="text-center">
                  <div className="h-32 flex items-end justify-center mb-2">
                    <Slider
                      orientation="vertical"
                      value={[settings.eqBands[index]]}
                      onValueChange={([value]) => handleEQBandChange(index, value)}
                      min={-12}
                      max={12}
                      step={0.5}
                      className="h-28"
                    />
                  </div>
                  <div className="text-xs text-slate-400">
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
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Ready to Enhance</h3>
              <p className="text-slate-400">
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
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
            >
              {isProcessing ? (
                <>
                  <Zap className="h-5 w-5 mr-2 animate-pulse" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
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
