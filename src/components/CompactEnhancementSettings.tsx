
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Zap, Volume2, Headphones } from 'lucide-react';

interface CompactEnhancementSettingsProps {
  onEnhance: (settings: any) => void;
  isProcessing: boolean;
  hasFiles: boolean;
}

export const CompactEnhancementSettings = ({ 
  onEnhance, 
  isProcessing, 
  hasFiles
}: CompactEnhancementSettingsProps) => {
  const [noiseReductionEnabled, setNoiseReductionEnabled] = useState(true);
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [stereoWideningEnabled, setStereoWideningEnabled] = useState(true);
  
  const [settings, setSettings] = useState({
    sampleRate: 48000,
    bitDepth: 16,
    noiseReduction: 30,
    compression: 40,
    bassBoost: 0,
    midBoost: 0,
    trebleBoost: 0,
    stereoWidening: 25,
    normalization: true,
    highFreqRestoration: true,
    outputFormat: 'wav',
    targetBitrate: 320
  });

  const handleEnhance = () => {
    const finalSettings = {
      ...settings,
      noiseReduction: noiseReductionEnabled ? settings.noiseReduction : 0,
      compression: compressionEnabled ? settings.compression : 0,
      stereoWidening: stereoWideningEnabled ? settings.stereoWidening : 0
    };
    onEnhance(finalSettings);
  };

  const ToggleButton = ({ enabled, onToggle, icon, label, color }: any) => (
    <button
      onClick={onToggle}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
        enabled 
          ? `bg-${color}-500 text-white shadow-lg shadow-${color}-500/50 ring-2 ring-${color}-400/30` 
          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
      }`}
      title={`Toggle ${label}`}
      style={enabled ? {
        boxShadow: `0 0 20px ${color === 'green' ? '#10b981' : color === 'yellow' ? '#f59e0b' : '#a855f7'}40`,
        backgroundColor: color === 'green' ? '#10b981' : color === 'yellow' ? '#f59e0b' : '#a855f7'
      } : {}}
    >
      {icon}
    </button>
  );

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-3">
          <Settings className="h-5 w-5 text-blue-400" />
          Enhancement Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Quick Toggle Switches with Neon Colors */}
        <div className="flex items-center justify-around p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex flex-col items-center gap-2">
            <ToggleButton
              enabled={noiseReductionEnabled}
              onToggle={() => setNoiseReductionEnabled(!noiseReductionEnabled)}
              icon={<Volume2 className="h-4 w-4" />}
              label="Noise Reduction"
              color="green"
            />
            <span className="text-xs text-slate-400 font-medium">Noise</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ToggleButton
              enabled={compressionEnabled}
              onToggle={() => setCompressionEnabled(!compressionEnabled)}
              icon={<Zap className="h-4 w-4" />}
              label="Compression"
              color="yellow"
            />
            <span className="text-xs text-slate-400 font-medium">Compress</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ToggleButton
              enabled={stereoWideningEnabled}
              onToggle={() => setStereoWideningEnabled(!stereoWideningEnabled)}
              icon={<Headphones className="h-4 w-4" />}
              label="Stereo Widening"
              color="purple"
            />
            <span className="text-xs text-slate-400 font-medium">Stereo</span>
          </div>
        </div>

        {/* Quality Settings */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-300 mb-1 block">Sample Rate</label>
            <Select value={settings.sampleRate.toString()} onValueChange={(value) => setSettings({...settings, sampleRate: parseInt(value)})}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="44100">44.1 kHz</SelectItem>
                <SelectItem value="48000">48 kHz</SelectItem>
                <SelectItem value="96000">96 kHz</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-300 mb-1 block">Format</label>
            <Select value={settings.outputFormat} onValueChange={(value) => setSettings({...settings, outputFormat: value})}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wav">WAV</SelectItem>
                <SelectItem value="mp3">MP3</SelectItem>
                <SelectItem value="flac">FLAC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Enhancement Controls */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Noise Reduction</span>
              <span>{settings.noiseReduction}%</span>
            </div>
            <Slider
              value={[settings.noiseReduction]}
              onValueChange={([value]) => setSettings({...settings, noiseReduction: value})}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Compression</span>
              <span>{settings.compression}%</span>
            </div>
            <Slider
              value={[settings.compression]}
              onValueChange={([value]) => setSettings({...settings, compression: value})}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Stereo Widening</span>
              <span>{settings.stereoWidening}%</span>
            </div>
            <Slider
              value={[settings.stereoWidening]}
              onValueChange={([value]) => setSettings({...settings, stereoWidening: value})}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-2 pt-2 border-t border-slate-700">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="normalization"
              checked={settings.normalization}
              onCheckedChange={(checked) => setSettings({...settings, normalization: !!checked})}
              className="border-slate-600"
            />
            <label htmlFor="normalization" className="text-xs text-slate-300">Volume Normalization</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="highfreq"
              checked={settings.highFreqRestoration}
              onCheckedChange={(checked) => setSettings({...settings, highFreqRestoration: !!checked})}
              className="border-slate-600"
            />
            <label htmlFor="highfreq" className="text-xs text-slate-300">High-Frequency Restoration</label>
          </div>
        </div>

        {/* Enhance Button */}
        <Button
          onClick={handleEnhance}
          disabled={!hasFiles || isProcessing}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
          size="lg"
        >
          {isProcessing ? 'Enhancing...' : 'Enhance Audio'}
        </Button>
      </CardContent>
    </Card>
  );
};
