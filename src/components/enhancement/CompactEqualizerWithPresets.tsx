import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AudioSettingsTooltip } from '@/components/AudioSettingsTooltip';
import { Music2, Mic, Headphones, Guitar, Piano, Disc3, Radio, MessageSquare, Speaker, Volume2, Waves, Music, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CompactEqualizerWithPresetsProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
}

// 10 Professional EQ Presets with Real Values for Matchering API
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

export const CompactEqualizerWithPresets = ({ 
  settings, 
  onSettingChange, 
  onEQBandChange, 
  onResetEQ 
}: CompactEqualizerWithPresetsProps) => {
  const { t, language } = useLanguage();
  const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

  // Apply EQ preset values to all bands
  const applyPreset = (values: number[]) => {
    values.forEach((value, index) => {
      onEQBandChange(index, value);
    });
  };

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
          className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white h-7 text-xs px-2"
        >
          {t('eq.reset')}
        </Button>
      </div>
      
      {settings.enableEQ && (
        <div className="grid grid-cols-[1fr_1.2fr] gap-3">
          {/* Compact Equalizer - 40% smaller */}
          <div className="bg-gradient-to-br from-slate-900/70 to-slate-800/50 rounded-lg p-3 border border-slate-700">
            <h4 className="text-[10px] font-semibold text-cyan-400 mb-2 tracking-wide">
              {t('eq.tenBandEqualizer')}
            </h4>
            <div className="flex justify-center items-end gap-1.5">
              {eqFrequencies.map((freq, index) => (
                <div key={freq} className="flex flex-col items-center">
                  <div className="h-16 flex items-end justify-center mb-1 relative">
                    <Slider
                      orientation="vertical"
                      value={[settings.eqBands[index]]}
                      onValueChange={([value]) => onEQBandChange(index, value)}
                      min={-12}
                      max={12}
                      step={0.5}
                      className="h-14 w-3"
                    />
                  </div>
                  <div className="text-[8px] font-medium text-blue-400">
                    {freq < 1000 ? freq : `${freq/1000}k`}
                  </div>
                  <div className="text-[7px] text-slate-400 font-mono">
                    {settings.eqBands[index] > 0 ? '+' : ''}{settings.eqBands[index]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EQ Presets Strip - 10 Functional Presets */}
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-3 border border-purple-700/50">
            <h4 className="text-[10px] font-semibold text-purple-300 mb-2 tracking-wide">
              {t('eq.eqPresets')}
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
                    className="bg-slate-800/80 border-slate-600 hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 hover:border-purple-500 text-white h-auto py-1.5 px-1 flex flex-col items-center gap-0.5 transition-all duration-300"
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
        </div>
      )}
    </div>
  );
};
