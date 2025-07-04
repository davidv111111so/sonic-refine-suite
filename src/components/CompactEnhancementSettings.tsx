import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Zap, Volume2, Headphones, Sparkles, Trash2 } from 'lucide-react';
import { EnhancedMiniPlayer } from '@/components/EnhancedMiniPlayer';

interface CompactEnhancementSettingsProps {
  onEnhance: (settings: any) => void;
  isProcessing: boolean;
  hasFiles: boolean;
  uploadedFiles?: any[];
  onRemoveFile?: (id: string) => void;
  eqBands: number[];
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
  eqEnabled: boolean;
  onApplyPreset?: (settings: any) => void;
}

export const CompactEnhancementSettings = ({ 
  onEnhance, 
  isProcessing, 
  hasFiles,
  uploadedFiles = [],
  onRemoveFile,
  eqBands = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  onEQBandChange = () => {},
  onResetEQ = () => {},
  eqEnabled = true,
  onApplyPreset
}: CompactEnhancementSettingsProps) => {
  const [noiseReductionEnabled, setNoiseReductionEnabled] = useState(true);
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [stereoWideningEnabled, setStereoWideningEnabled] = useState(true);
  
  const [settings, setSettings] = useState({
    sampleRate: 44100, // Default to 44.1 kHz
    bitDepth: 16,
    noiseReduction: 30,
    compression: 40,
    bassBoost: 0,
    midBoost: 0,
    trebleBoost: 0,
    stereoWidening: 25,
    normalization: true,
    highFreqRestoration: true,
    outputFormat: 'mp3', // Default to MP3
    targetBitrate: 320
  });

  // Update settings when preset is applied
  useEffect(() => {
    if (onApplyPreset) {
      const originalOnApplyPreset = onApplyPreset;
      onApplyPreset = (presetSettings: any) => {
        if (presetSettings.noiseReduction !== undefined) {
          setSettings(prev => ({ ...prev, noiseReduction: presetSettings.noiseReduction }));
          setNoiseReductionEnabled(presetSettings.noiseReduction > 0);
        }
        if (presetSettings.compression !== undefined) {
          setSettings(prev => ({ ...prev, compression: presetSettings.compression }));
          setCompressionEnabled(presetSettings.compression > 0);
        }
        if (presetSettings.stereoWidening !== undefined) {
          setSettings(prev => ({ ...prev, stereoWidening: presetSettings.stereoWidening }));
          setStereoWideningEnabled(presetSettings.stereoWidening > 0);
        }
        if (presetSettings.bassBoost !== undefined) {
          setSettings(prev => ({ ...prev, bassBoost: presetSettings.bassBoost }));
        }
        if (presetSettings.midBoost !== undefined) {
          setSettings(prev => ({ ...prev, midBoost: presetSettings.midBoost }));
        }
        if (presetSettings.trebleBoost !== undefined) {
          setSettings(prev => ({ ...prev, trebleBoost: presetSettings.trebleBoost }));
        }
        originalOnApplyPreset(presetSettings);
      };
    }
  }, [onApplyPreset]);

  const handleEnhance = () => {
    const finalSettings = {
      ...settings,
      noiseReduction: noiseReductionEnabled ? settings.noiseReduction : 0,
      compression: compressionEnabled ? settings.compression : 0,
      stereoWidening: stereoWideningEnabled ? settings.stereoWidening : 0
    };
    onEnhance(finalSettings);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const ToggleButton = ({ enabled, onToggle, icon, label, color }: any) => (
    <button
      onClick={onToggle}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 transform hover:scale-110 ${
        enabled 
          ? `text-white shadow-2xl ring-2 ring-opacity-50 animate-pulse` 
          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
      }`}
      title={`Toggle ${label}`}
      style={enabled ? {
        background: `linear-gradient(135deg, ${color}80, ${color}ff)`,
        boxShadow: `0 0 30px ${color}80, 0 0 60px ${color}40, inset 0 0 20px ${color}20`,
        borderColor: color + '60'
      } : {}}
    >
      {icon}
    </button>
  );

  const CustomSlider = ({ enabled, value, onChange, label, max = 100, color }: any) => (
    <div className={`transition-all duration-300 ${!enabled ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
      <div className="flex justify-between text-xs text-slate-300 mb-2">
        <span>{label}</span>
        <span className="font-mono">{value}%</span>
      </div>
      <div className="relative">
        <Slider
          value={[value]}
          onValueChange={([val]) => onChange(val)}
          max={max}
          step={5}
          className="w-full"
          disabled={!enabled}
          style={{
            '--slider-track': enabled ? color : '#64748b',
            '--slider-range': enabled ? color : '#64748b',
            '--slider-thumb': enabled ? '#ffffff' : '#94a3b8'
          } as React.CSSProperties}
        />
        {enabled && (
          <div 
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${color}20, transparent)`,
              boxShadow: `0 0 10px ${color}40`
            }}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Songs Ready for Enhancement */}
      {uploadedFiles.length > 0 && (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-400" />
              Songs Ready for Enhancement ({uploadedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded border border-slate-700">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate font-medium">{file.name}</p>
                      <div className="text-xs text-slate-400">
                        {formatFileSize(file.size)} • Ready for enhancement
                      </div>
                    </div>
                    {(file.status === 'error' || file.status === 'uploaded') && onRemoveFile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveFile(file.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/50 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Mini Player for each file */}
                  <EnhancedMiniPlayer file={file} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-3">
            <Settings className="h-5 w-5 text-blue-400" />
            Enhancement Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-6">
          {/* Neon Toggle Switches */}
          <div className="flex items-center justify-around p-6 bg-gradient-to-r from-slate-800/80 to-slate-700/80 rounded-xl border border-slate-600 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <ToggleButton
                enabled={noiseReductionEnabled}
                onToggle={() => setNoiseReductionEnabled(!noiseReductionEnabled)}
                icon={<Volume2 className="h-5 w-5" />}
                label="Noise Reduction"
                color="#10b981"
              />
              <span className="text-xs text-slate-300 font-bold tracking-wide">Noise</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <ToggleButton
                enabled={compressionEnabled}
                onToggle={() => setCompressionEnabled(!compressionEnabled)}
                icon={<Zap className="h-5 w-5" />}
                label="Compression"
                color="#f59e0b"
              />
              <span className="text-xs text-slate-300 font-bold tracking-wide">Compress</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <ToggleButton
                enabled={stereoWideningEnabled}
                onToggle={() => setStereoWideningEnabled(!stereoWideningEnabled)}
                icon={<Headphones className="h-5 w-5" />}
                label="Stereo Widening"
                color="#a855f7"
              />
              <span className="text-xs text-slate-300 font-bold tracking-wide">Stereo</span>
            </div>
          </div>

          {/* Quality Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 mb-2 block font-medium">Sample Rate</label>
              <Select value={settings.sampleRate.toString()} onValueChange={(value) => setSettings({...settings, sampleRate: parseInt(value)})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-10">
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
              <label className="text-xs text-slate-300 mb-2 block font-medium">Format</label>
              <Select value={settings.outputFormat} onValueChange={(value) => setSettings({...settings, outputFormat: value})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp3">MP3</SelectItem>
                  <SelectItem value="wav">WAV</SelectItem>
                  <SelectItem value="flac">FLAC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Modern Enhancement Controls */}
          <div className="space-y-4">
            <CustomSlider
              enabled={noiseReductionEnabled}
              value={settings.noiseReduction}
              onChange={(value: number) => setSettings({...settings, noiseReduction: value})}
              label="Noise Reduction"
              color="#10b981"
            />

            <CustomSlider
              enabled={compressionEnabled}
              value={settings.compression}
              onChange={(value: number) => setSettings({...settings, compression: value})}
              label="Compression"
              color="#f59e0b"
            />

            <CustomSlider
              enabled={stereoWideningEnabled}
              value={settings.stereoWidening}
              onChange={(value: number) => setSettings({...settings, stereoWidening: value})}
              label="Stereo Widening"
              color="#a855f7"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 pt-4 border-t border-slate-700">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="normalization"
                checked={settings.normalization}
                onCheckedChange={(checked) => setSettings({...settings, normalization: !!checked})}
                className="border-slate-500"
              />
              <label htmlFor="normalization" className="text-sm text-slate-300 font-medium">Volume Normalization</label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="highfreq"
                checked={settings.highFreqRestoration}
                onCheckedChange={(checked) => setSettings({...settings, highFreqRestoration: !!checked})}
                className="border-slate-500"
              />
              <label htmlFor="highfreq" className="text-sm text-slate-300 font-medium">High-Frequency Restoration</label>
            </div>
          </div>

          {/* Enhanced Perfect Audio Enhancement Button */}
          <Button
            onClick={handleEnhance}
            disabled={!hasFiles || isProcessing}
            className={`w-full h-14 text-xl font-bold relative overflow-hidden transition-all duration-500 transform hover:scale-105 ${
              !hasFiles || isProcessing 
                ? 'opacity-50 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-600 shadow-2xl hover:shadow-3xl'
            }`}
            style={{
              boxShadow: !hasFiles || isProcessing ? '' : '0 0 40px rgba(147, 51, 234, 0.6), 0 0 80px rgba(59, 130, 246, 0.4), 0 0 120px rgba(6, 182, 212, 0.2)',
              animation: !hasFiles || isProcessing ? '' : 'pulse 3s infinite'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Sparkles className="h-6 w-6 mr-3" />
            {isProcessing ? 'Enhancing...' : 'Perfect Audio Enhancement'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
