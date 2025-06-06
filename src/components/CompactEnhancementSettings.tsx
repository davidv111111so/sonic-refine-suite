
import { useState, useMemo } from 'react';
import { Settings, Wand2, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

const SettingTooltip = ({ content, children }: { content: string; children: React.ReactNode }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 cursor-help">
          {children}
          <HelpCircle className="h-3 w-3 text-slate-400 hover:text-white transition-colors" />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-slate-800 border-slate-600 text-white">
        <p className="text-xs">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const CompactEnhancementSettings = ({ onEnhance, isProcessing, hasFiles }: CompactEnhancementSettingsProps) => {
  const [showEQ, setShowEQ] = useState(true); // EQ expanded by default
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
    outputFormat: 'mp3',
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
    
    if (score >= 6) return 'Studio Quality';
    if (score >= 4) return 'High Quality';
    return 'Good Quality';
  }, [settings]);

  // Dynamic colors for EQ bands
  const getEQColor = (value: number) => {
    if (value > 0) return 'from-green-500/30 to-green-400/60';
    if (value < 0) return 'from-red-500/30 to-red-400/60';
    return 'from-slate-500/20 to-slate-400/40';
  };

  return (
    <div className="space-y-3">
      {/* Audio Quality Settings */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <Settings className="h-4 w-4" />
            Audio Quality Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <SettingTooltip content="Higher sample rates capture more audio detail. 44.1kHz is CD quality, 48kHz is professional standard, 96kHz is high-resolution.">
                <label className="text-xs text-slate-300 mb-1 block font-medium">Sample Rate</label>
              </SettingTooltip>
              <Select value={settings.sampleRate.toString()} onValueChange={(value) => handleSettingChange('sampleRate', parseInt(value))}>
                <SelectTrigger className="h-8 bg-slate-700 border-slate-600 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="44100" className="text-white">44.1 kHz</SelectItem>
                  <SelectItem value="48000" className="text-white">48.0 kHz</SelectItem>
                  <SelectItem value="88200" className="text-white">88.2 kHz</SelectItem>
                  <SelectItem value="96000" className="text-white">96 kHz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <SettingTooltip content="Bit depth determines dynamic range. 16-bit is CD quality with 96dB range, 24-bit provides 144dB range for professional audio.">
                <label className="text-xs text-slate-300 mb-1 block font-medium">Bit Depth</label>
              </SettingTooltip>
              <Select value={settings.bitDepth.toString()} onValueChange={(value) => handleSettingChange('bitDepth', parseInt(value))}>
                <SelectTrigger className="h-8 bg-slate-700 border-slate-600 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="16" className="text-white">16-bit</SelectItem>
                  <SelectItem value="24" className="text-white">24-bit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-xs text-center">
            <span className="text-slate-400">Quality: </span>
            <span className="text-blue-400 font-medium">{estimatedQuality}</span>
          </div>
        </CardContent>
      </Card>

      {/* Perfect Audio Enhancement Options */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Perfect Audio Enhancement Options</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Noise Reduction */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <SettingTooltip content="Removes background noise, hiss, and unwanted artifacts. Higher values provide more aggressive noise removal.">
                <label className="text-xs text-slate-300 font-medium">Noise Reduction</label>
              </SettingTooltip>
              <span className="text-xs text-white font-bold">{settings.noiseReduction}%</span>
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
              <SettingTooltip content="Evens out volume differences between loud and quiet parts. Perfect for consistent listening levels.">
                <label className="text-xs text-slate-300 font-medium">Dynamic Compression</label>
              </SettingTooltip>
              <span className="text-xs text-white font-bold">{settings.compression}%</span>
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

          {/* EQ Section with Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <SettingTooltip content="Adjust frequency response to enhance bass, midrange, and treble frequencies for optimal sound balance.">
                <label className="text-xs text-slate-300 font-medium">EQ Boost</label>
              </SettingTooltip>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEQ(!showEQ)}
                className="h-6 px-2 text-xs text-slate-400 hover:text-white"
              >
                {showEQ ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </div>
            
            {showEQ && (
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <SettingTooltip content="Enhances low frequencies (60-250Hz). Adds warmth and punch to drums and bass instruments.">
                      <span className="text-xs text-slate-400 font-medium">Bass</span>
                    </SettingTooltip>
                    <span className="text-xs text-white font-bold">{settings.bassBoost > 0 ? '+' : ''}{settings.bassBoost}dB</span>
                  </div>
                  <div className="relative">
                    <div 
                      className={`absolute inset-0 bg-gradient-to-t ${getEQColor(settings.bassBoost)} rounded opacity-50`}
                      style={{ transform: `scaleY(${0.2 + Math.abs(settings.bassBoost) / 12 * 0.8})` }}
                    />
                    <Slider
                      value={[settings.bassBoost]}
                      onValueChange={([value]) => handleSettingChange('bassBoost', value)}
                      min={-12}
                      max={12}
                      step={1}
                      className="h-2 relative z-10"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <SettingTooltip content="Adjusts mid frequencies (250Hz-4kHz). Critical for vocal clarity and instrument presence.">
                      <span className="text-xs text-slate-400 font-medium">Mid</span>
                    </SettingTooltip>
                    <span className="text-xs text-white font-bold">{settings.midBoost > 0 ? '+' : ''}{settings.midBoost}dB</span>
                  </div>
                  <div className="relative">
                    <div 
                      className={`absolute inset-0 bg-gradient-to-t ${getEQColor(settings.midBoost)} rounded opacity-50`}
                      style={{ transform: `scaleY(${0.2 + Math.abs(settings.midBoost) / 12 * 0.8})` }}
                    />
                    <Slider
                      value={[settings.midBoost]}
                      onValueChange={([value]) => handleSettingChange('midBoost', value)}
                      min={-12}
                      max={12}
                      step={1}
                      className="h-2 relative z-10"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <SettingTooltip content="Enhances high frequencies (4kHz-20kHz). Adds sparkle, air, and detail to cymbals and vocals.">
                      <span className="text-xs text-slate-400 font-medium">Treble</span>
                    </SettingTooltip>
                    <span className="text-xs text-white font-bold">{settings.trebleBoost > 0 ? '+' : ''}{settings.trebleBoost}dB</span>
                  </div>
                  <div className="relative">
                    <div 
                      className={`absolute inset-0 bg-gradient-to-t ${getEQColor(settings.trebleBoost)} rounded opacity-50`}
                      style={{ transform: `scaleY(${0.2 + Math.abs(settings.trebleBoost) / 12 * 0.8})` }}
                    />
                    <Slider
                      value={[settings.trebleBoost]}
                      onValueChange={([value]) => handleSettingChange('trebleBoost', value)}
                      min={-12}
                      max={12}
                      step={1}
                      className="h-2 relative z-10"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stereo Widening */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <SettingTooltip content="Expands the stereo image for a wider, more immersive soundstage. Great for headphone listening.">
                <label className="text-xs text-slate-300 font-medium">Stereo Widening</label>
              </SettingTooltip>
              <span className="text-xs text-white font-bold">{settings.stereoWidening}%</span>
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
              <SettingTooltip content="Automatically adjusts overall volume to a consistent level across all tracks for uniform playback.">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.normalization}
                    onCheckedChange={(checked) => handleSettingChange('normalization', checked)}
                  />
                  <label className="text-xs text-slate-300 font-medium">Volume Normalize</label>
                </div>
              </SettingTooltip>
            </div>
            <div className="flex items-center space-x-2">
              <SettingTooltip content="Restores high-frequency content lost during compression or analog-to-digital conversion.">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.highFreqRestoration}
                    onCheckedChange={(checked) => handleSettingChange('highFreqRestoration', checked)}
                  />
                  <label className="text-xs text-slate-300 font-medium">High-freq Restore</label>
                </div>
              </SettingTooltip>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Format & Enhancement Button */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <SettingTooltip content="Choose output format: MP3 (small, compatible), WAV (uncompressed, large), FLAC (lossless compression).">
                <label className="text-xs text-slate-300 mb-1 block font-medium">Export Format</label>
              </SettingTooltip>
              <Select value={settings.outputFormat} onValueChange={(value) => handleSettingChange('outputFormat', value)}>
                <SelectTrigger className="h-8 bg-slate-700 border-slate-600 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="mp3" className="text-white">MP3 (Recommended)</SelectItem>
                  <SelectItem value="wav" className="text-white">WAV (Uncompressed)</SelectItem>
                  <SelectItem value="flac" className="text-white">FLAC (Lossless)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => onEnhance(settings)}
              disabled={!hasFiles || isProcessing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 h-8 text-xs shadow-lg disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enhancing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="h-3 w-3" />
                  Perfect Audio
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
