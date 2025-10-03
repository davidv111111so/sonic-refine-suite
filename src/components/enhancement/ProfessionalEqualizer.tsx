import React, { memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, Music2, Mic, Headphones, Guitar, Disc3, Radio, MessageSquare, Volume2, Waves, Music, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProfessionalEqualizerProps {
  eqBands: number[];
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

// 10 Professional EQ Presets with Real dB Values
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

export const ProfessionalEqualizer = ({ 
  eqBands, 
  onEQBandChange, 
  onResetEQ,
  enabled,
  onEnabledChange
}: ProfessionalEqualizerProps) => {
  const { t, language } = useLanguage();
  
  // 10 band EQ frequencies
  const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  
  const applyPreset = useCallback((values: number[]) => {
    values.forEach((value, index) => {
      onEQBandChange(index, value);
    });
  }, [onEQBandChange]);
  
  const getEQColor = (index: number) => {
    const colors = [
      '#ff1744', // Red for Bass
      '#ff6d00', // Orange for Low Mid  
      '#ffc400', // Yellow for Mid
      '#3d5afe', // Blue for High Mid
      '#651fff'  // Purple for Treble
    ];
    return colors[index];
  };

  const getTickMarks = () => {
    const marks = [];
    for (let i = -12; i <= 12; i += 3) {
      marks.push(i);
    }
    return marks;
  };

  return (
    <Card className="bg-slate-900/90 dark:bg-black/90 border-slate-700 dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded"></div>
            Equalizer
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Audio EQ</span>
              <Switch
                checked={enabled}
                onCheckedChange={onEnabledChange}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onResetEQ}
              className="h-8 text-xs bg-slate-800 dark:bg-black border-slate-700 dark:border-slate-800 hover:bg-slate-700 dark:hover:bg-slate-900 text-white"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {enabled ? (
          <div className="relative space-y-4">
            {/* EQ Presets Strip - ON TOP */}
            <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 dark:from-purple-950/60 dark:to-blue-950/60 rounded-lg p-3 border border-purple-700/50 dark:border-purple-800/70">
              <h4 className="text-sm font-semibold text-purple-300 dark:text-purple-200 mb-2 tracking-wide flex items-center gap-2">
                Professional EQ Presets
                <span className="text-xs text-purple-400/70">(Real dB values)</span>
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {EQ_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const displayName = language === 'ES' ? preset.nameES : preset.name;
                  return (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset.values)}
                      className="bg-slate-800/90 dark:bg-black/80 border-slate-600 dark:border-slate-700 hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 hover:border-purple-500 text-white h-auto py-2 px-2 flex flex-col items-center gap-1 transition-all duration-300"
                      title={displayName}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[9px] leading-tight text-center">
                        {displayName}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Professional EQ - Compact 35% smaller */}
            <div className="bg-gradient-to-br from-slate-900 via-black to-slate-950 dark:from-black dark:via-slate-950 dark:to-black rounded-xl p-5 border-2 border-slate-700 dark:border-slate-800 shadow-2xl">
              
              {/* EQ Background Grid */}
              <div className="absolute inset-8 bg-slate-900/50 rounded-lg border border-slate-700">
                {/* Horizontal grid lines */}
                {getTickMarks().map((mark, idx) => (
                  <div 
                    key={mark}
                    className="absolute left-0 right-0 border-t border-slate-700/30"
                    style={{ top: `${((12 - mark) / 24) * 100}%` }}
                  >
                    <span className="absolute -left-8 -top-2 text-xs text-slate-500 font-mono">
                      {mark > 0 ? `+${mark}` : mark}dB
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center items-end gap-3 py-4 relative z-10">
                {eqFrequencies.map((freq, index) => (
                  <div key={freq} className="flex flex-col items-center group">
                    
                    {/* Frequency Label */}
                    <div className="text-[10px] text-center mb-2 font-mono text-blue-400 dark:text-blue-300">
                      {freq < 1000 ? `${freq}Hz` : `${freq/1000}k`}
                    </div>

                    {/* Compact Fader Container - 35% smaller */}
                    <div className="relative h-32 w-6 mb-3">
                      
                      {/* Compact Fader Track Background */}
                      <div 
                        className="absolute inset-x-0.5 inset-y-1 rounded-full border shadow-inner"
                        style={{
                          background: `linear-gradient(180deg, #3b82f620 0%, #1e293b 50%, #3b82f620 100%)`,
                          borderColor: '#334155',
                          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5)'
                        }}
                      />

                      {/* Compact Slider */}
                      <div className="h-full flex items-center justify-center">
                        <Slider
                          orientation="vertical"
                          value={[eqBands[index] || 0]}
                          onValueChange={([value]) => onEQBandChange(index, value)}
                          min={-12}
                          max={12}
                          step={0.5}
                          className="h-28 w-5 group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    </div>

                    {/* Compact Value Display */}
                    <div className="text-[9px] text-center font-mono text-slate-300 dark:text-slate-200 bg-black/60 rounded px-1.5 py-0.5">
                      {eqBands[index] > 0 ? '+' : ''}{eqBands[index]}
                    </div>
                  </div>
                ))}
              </div>

              {/* Professional EQ Branding */}
              <div className="absolute bottom-1 right-2 text-[9px] text-slate-500 dark:text-slate-600 font-mono">
                SPECTRUM EQ
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 dark:text-slate-300">
            <div className="text-lg mb-2">🎚️</div>
            <p className="text-white">Enable Audio EQ to access the professional equalizer</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};