import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AudioSettingsTooltip } from '@/components/AudioSettingsTooltip';
import { Music2, Mic, Headphones, Guitar, Piano, Disc3, Radio, MessageSquare, Speaker, Volume2, Waves, Music, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { memo, useCallback } from 'react';

interface CompactEqualizerWithPresetsProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
}

// 10 Professional EQ Presets with Real dB Values for Web Audio API
// These values map directly to BiquadFilterNode gain parameters
const EQ_PRESETS = [
  { name: 'Jazz', nameES: 'Jazz', icon: Music2, values: [2, 1, 0, 1, 2, 3, 2, 1, 2, 2] },
  { name: 'Electronic', nameES: 'Electrónica', icon: Disc3, values: [5, 4, 2, 0, -2, 2, 3, 4, 5, 6] },
  { name: 'Podcast', nameES: 'Podcast', icon: MessageSquare, values: [2, 3, 5, 4, 2, 0, -2, -3, -2, 0] },
  { name: 'Reggae', nameES: 'Reggae', icon: Waves, values: [6, 4, 2, 0, -1, 0, 1, 2, 3, 2] },
  { name: 'Latin', nameES: 'Latina', icon: Music, values: [3, 2, 1, 0, 1, 2, 3, 2, 1, 2] },
  { name: 'Rock', nameES: 'Rock', icon: Guitar, values: [4, 3, 1, 0, -2, -1, 2, 3, 4, 3] },
  { name: 'Acoustic Clarity', nameES: 'Claridad Acústica', icon: Lightbulb, values: [0, 0, 1, 2, 3, 4, 3, 2, 1, 0] },
  { name: 'Vocal Warmth', nameES: 'Calidez Vocal', icon: Mic, values: [-1, 0, 2, 4, 5, 4, 2, 0, -1, -2] },
  { name: 'Heavy Bass', nameES: 'Graves Potentes', icon: Volume2, values: [8, 7, 5, 3, 1, 0, 0, 0, 0, 0] },
  { name: 'Live', nameES: 'En Vivo', icon: Headphones, values: [2, 2, 1, 0, 1, 2, 3, 3, 2, 2] },
];

// Memoized EQ Band component to prevent unnecessary re-renders
const EQBand = memo(({ 
  freq, 
  index, 
  value, 
  onChange 
}: { 
  freq: number; 
  index: number; 
  value: number; 
  onChange: (index: number, value: number) => void;
}) => {
  const handleChange = useCallback((newValue: number[]) => {
    onChange(index, newValue[0]);
  }, [index, onChange]);

  return (
    <div className="flex flex-col items-center">
      <div className="h-12 flex items-end justify-center mb-1 relative">
        <Slider
          orientation="vertical"
          value={[value]}
          onValueChange={handleChange}
          min={-12}
          max={12}
          step={0.5}
          className="h-11 w-2.5"
        />
      </div>
      <div className="text-[7px] font-medium text-blue-400 mb-0.5">
        {freq < 1000 ? freq : `${freq/1000}k`}
      </div>
      <div className="text-[6px] text-slate-400 font-mono">
        {value > 0 ? '+' : ''}{value}
      </div>
    </div>
  );
});

EQBand.displayName = 'EQBand';

export const CompactEqualizerWithPresets = ({ 
  settings, 
  onSettingChange, 
  onEQBandChange, 
  onResetEQ 
}: CompactEqualizerWithPresetsProps) => {
  const { t, language } = useLanguage();
  const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

  // Memoized preset application function
  const applyPreset = useCallback((values: number[]) => {
    values.forEach((value, index) => {
      onEQBandChange(index, value);
    });
  }, [onEQBandChange]);

  return (
    <div className="space-y-3">
      {/* Header with Enable Toggle and Reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={settings.enableEQ}
            onCheckedChange={(checked) => onSettingChange('enableEQ', checked)}
          />
          <span className="text-sm font-medium text-white">
            {t('eq.enableEqualizer')}
          </span>
          <AudioSettingsTooltip setting="eq" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetEQ}
          className="bg-slate-800 dark:bg-black border-slate-700 hover:bg-slate-700 dark:hover:bg-slate-900 text-white h-7 text-xs px-2"
        >
          {t('eq.reset')}
        </Button>
      </div>
      
      {settings.enableEQ && (
        <div className="space-y-3">
          {/* EQ Presets Strip - ON TOP */}
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 dark:from-purple-950/60 dark:to-blue-950/60 rounded-lg p-2.5 border border-purple-700/50 dark:border-purple-800/70">
            <h4 className="text-[9px] font-semibold text-purple-300 mb-2 tracking-wide flex items-center gap-1">
              {t('eq.eqPresets')}
              <span className="text-[7px] text-purple-400/70">(Real dB values)</span>
            </h4>
            <div className="grid grid-cols-5 gap-1.5">
              {EQ_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const displayName = language === 'ES' ? preset.nameES : preset.name;
                return (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset.values)}
                    className="bg-slate-800/90 dark:bg-black/80 border-slate-600 dark:border-slate-700 hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 hover:border-purple-500 text-white h-auto py-1.5 px-1 flex flex-col items-center gap-0.5 transition-all duration-300"
                    title={displayName}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="text-[7px] leading-tight text-center">
                      {displayName}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Compact Equalizer - 35% smaller, below presets */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 dark:from-black/90 dark:to-slate-950/80 rounded-lg p-2.5 border border-slate-700 dark:border-slate-800">
            <h4 className="text-[9px] font-semibold text-cyan-400 mb-2 tracking-wide">
              {t('eq.tenBandEqualizer')}
            </h4>
            <div className="flex justify-center items-end gap-1.5">
              {eqFrequencies.map((freq, index) => (
                <EQBand
                  key={freq}
                  freq={freq}
                  index={index}
                  value={settings.eqBands[index]}
                  onChange={onEQBandChange}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
