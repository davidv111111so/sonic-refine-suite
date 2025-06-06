
import { useState, useMemo } from 'react';
import { Settings, Wand2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CompactEnhancementSettingsProps {
  onEnhance: (settings: EnhancementSettings) => void;
  isProcessing: boolean;
  hasFiles: boolean;
}

interface EnhancementSettings {
  sampleRate: number;
  bitDepth: number;
  noiseReduction: number;
  compression: number;
  bassBoost: number;
  midBoost: number;
  trebleBoost: number;
  stereoWidening: number;
  normalization: boolean;
  highFreqRestoration: boolean;
  outputFormat: string;
}

export const CompactEnhancementSettings = ({ onEnhance, isProcessing, hasFiles }: CompactEnhancementSettingsProps) => {
  const [settings, setSettings] = useState<EnhancementSettings>({
    sampleRate: 44100,
    bitDepth: 16,
    noiseReduction: 30,
    compression: 20,
    bassBoost: 0,
    midBoost: 0,
    trebleBoost: 0,
    stereoWidening: 10,
    normalization: true,
    highFreqRestoration: false,
    outputFormat: 'wav',
  });

  const handleSettingChange = (key: keyof EnhancementSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const estimatedQuality = useMemo(() => {
    let score = 0;
    if (settings.sampleRate >= 96000) score += 3;
    else if (settings.sampleRate >= 48000) score += 2;
    else score += 1;
    
    if (settings.bitDepth === 24) score += 2;
    else score += 1;
    
    if (settings.noiseReduction > 0) score += 1;
    if (settings.normalization) score += 1;
    
    if (score >= 6) return 'Studio';
    if (score >= 4) return 'High';
    return 'Good';
  }, [settings]);

  return (
    <div className="space-y-3">
      {/* Audio Quality Settings */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <Settings className="h-4 w-4" />
            Audio Quality Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Sample Rate</label>
              <Select value={settings.sampleRate.toString()} onValueChange={(value) => handleSettingChange('sampleRate', parseInt(value))}>
                <SelectTrigger className="h-8 bg-slate-700 border-slate-600 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="44100">44.1 kHz</SelectItem>
                  <SelectItem value="48000">48.0 kHz</SelectItem>
                  <SelectItem value="88200">88.2 kHz</SelectItem>
                  <SelectItem value="96000">96 kHz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Bit Depth</label>
              <Select value={settings.bitDepth.toString()} onValueChange={(value) => handleSettingChange('bitDepth', parseInt(value))}>
                <SelectTrigger className="h-8 bg-slate-700 border-slate-600 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16">16-bit</SelectItem>
                  <SelectItem value="24">24-bit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-xs text-slate-400 text-center">
            Quality: <span className="text-blue-400 font-medium">{estimatedQuality}</span>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Enhancement Options */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Real-Time Enhancement Options</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Noise Reduction */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">Noise Reduction</label>
              <span className="text-xs text-slate-300">{settings.noiseReduction}%</span>
            </div>
            <Slider
              value={[settings.noiseReduction]}
              onValueChange={([value]) => handleSettingChange('noiseReduction', value)}
              min={0}
              max={100}
              step={5}
              className="h-2"
            />
          </div>

          {/* Dynamic Range Compression */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">Dynamic Range Compression</label>
              <span className="text-xs text-slate-300">{settings.compression}%</span>
            </div>
            <Slider
              value={[settings.compression]}
              onValueChange={([value]) => handleSettingChange('compression', value)}
              min={0}
              max={100}
              step={5}
              className="h-2"
            />
          </div>

          {/* EQ Boost */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400">EQ Boost</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-500">Bass</span>
                  <span className="text-xs text-slate-300">{settings.bassBoost > 0 ? '+' : ''}{settings.bassBoost}dB</span>
                </div>
                <Slider
                  value={[settings.bassBoost]}
                  onValueChange={([value]) => handleSettingChange('bassBoost', value)}
                  min={-12}
                  max={12}
                  step={1}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-500">Mid</span>
                  <span className="text-xs text-slate-300">{settings.midBoost > 0 ? '+' : ''}{settings.midBoost}dB</span>
                </div>
                <Slider
                  value={[settings.midBoost]}
                  onValueChange={([value]) => handleSettingChange('midBoost', value)}
                  min={-12}
                  max={12}
                  step={1}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-500">Treble</span>
                  <span className="text-xs text-slate-300">{settings.trebleBoost > 0 ? '+' : ''}{settings.trebleBoost}dB</span>
                </div>
                <Slider
                  value={[settings.trebleBoost]}
                  onValueChange={([value]) => handleSettingChange('trebleBoost', value)}
                  min={-12}
                  max={12}
                  step={1}
                  className="h-2"
                />
              </div>
            </div>
          </div>

          {/* Stereo Widening */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">Stereo Widening</label>
              <span className="text-xs text-slate-300">{settings.stereoWidening}%</span>
            </div>
            <Slider
              value={[settings.stereoWidening]}
              onValueChange={([value]) => handleSettingChange('stereoWidening', value)}
              min={0}
              max={100}
              step={5}
              className="h-2"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.normalization}
                onCheckedChange={(checked) => handleSettingChange('normalization', checked)}
              />
              <label className="text-xs text-slate-400">Volume Normalization</label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.highFreqRestoration}
                onCheckedChange={(checked) => handleSettingChange('highFreqRestoration', checked)}
              />
              <label className="text-xs text-slate-400">High-freq Restoration</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Format & Enhancement Button */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Export Format</label>
              <Select value={settings.outputFormat} onValueChange={(value) => handleSettingChange('outputFormat', value)}>
                <SelectTrigger className="h-8 bg-slate-700 border-slate-600 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp3">MP3</SelectItem>
                  <SelectItem value="wav">WAV</SelectItem>
                  <SelectItem value="flac">FLAC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => onEnhance(settings)}
              disabled={!hasFiles || isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-8 text-xs"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="h-3 w-3" />
                  Enhance Audio
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
