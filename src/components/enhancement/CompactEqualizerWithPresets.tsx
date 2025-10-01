import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AudioSettingsTooltip } from '@/components/AudioSettingsTooltip';
import { Music2, Mic, Headphones, Guitar, Piano, Disc3, Radio, MessageSquare, Speaker, Volume2 } from 'lucide-react';

interface CompactEqualizerWithPresetsProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
}

const EQ_PRESETS = [
  { name: 'Flat', icon: Radio, values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'Podcast', icon: MessageSquare, values: [2, 3, 4, 3, 0, -2, -3, -2, 0, 0] },
  { name: 'Electronic', icon: Disc3, values: [4, 3, 0, 0, -2, 2, 3, 4, 5, 4] },
  { name: 'Hip Hop', icon: Speaker, values: [6, 4, 2, 1, 0, -1, 0, 1, 2, 3] },
  { name: 'Rock', icon: Guitar, values: [3, 2, 0, -1, -2, 0, 2, 3, 4, 3] },
  { name: 'Classical', icon: Piano, values: [0, 0, 0, 0, 0, 0, -1, -1, 2, 3] },
  { name: 'Jazz', icon: Music2, values: [2, 1, 0, 1, 2, 0, 0, 1, 2, 2] },
  { name: 'Pop', icon: Headphones, values: [1, 2, 3, 2, 0, -1, 0, 1, 2, 2] },
  { name: 'Vocal', icon: Mic, values: [-2, -1, 1, 3, 4, 4, 2, 0, -1, -2] },
  { name: 'Bass Boost', icon: Volume2, values: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0] },
];

export const CompactEqualizerWithPresets = ({ 
  settings, 
  onSettingChange, 
  onEQBandChange, 
  onResetEQ 
}: CompactEqualizerWithPresetsProps) => {
  const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

  const applyPreset = (values: number[]) => {
    values.forEach((value, index) => {
      onEQBandChange(index, value);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={settings.enableEQ}
            onCheckedChange={(checked) => onSettingChange('enableEQ', checked)}
          />
          <span className="text-sm font-medium text-white">Enable Equalizer</span>
          <AudioSettingsTooltip setting="eq" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetEQ}
          className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white h-7 text-xs"
        >
          Reset
        </Button>
      </div>
      
      {settings.enableEQ && (
        <div className="grid grid-cols-2 gap-4">
          {/* Compact Equalizer */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h4 className="text-xs font-medium text-slate-300 mb-3">10-Band Equalizer</h4>
            <div className="flex justify-center items-end gap-2">
              {eqFrequencies.map((freq, index) => (
                <div key={freq} className="flex flex-col items-center">
                  <div className="h-24 flex items-end justify-center mb-1 relative">
                    <Slider
                      orientation="vertical"
                      value={[settings.eqBands[index]]}
                      onValueChange={([value]) => onEQBandChange(index, value)}
                      min={-12}
                      max={12}
                      step={0.5}
                      className="h-20 w-4"
                    />
                  </div>
                  <div className="text-[10px] font-medium text-blue-400">
                    {freq < 1000 ? freq : `${freq/1000}k`}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {settings.eqBands[index] > 0 ? '+' : ''}{settings.eqBands[index]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EQ Presets */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h4 className="text-xs font-medium text-slate-300 mb-3">EQ Presets</h4>
            <div className="grid grid-cols-2 gap-2">
              {EQ_PRESETS.map((preset) => {
                const Icon = preset.icon;
                return (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset.values)}
                    className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white h-auto py-2 flex flex-col items-center gap-1"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-[10px]">{preset.name}</span>
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
