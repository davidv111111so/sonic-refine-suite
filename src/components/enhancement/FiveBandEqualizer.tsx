import React, { memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, Music2, Mic, Headphones, Guitar, Disc3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FiveBandEqualizerProps {
  eqBands: number[];
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

// 12 Professional EQ Presets with Real dB Values (5-band)
const EQ_PRESETS = [
  { name: 'Flat', nameES: 'Plano', icon: Music2, values: [0, 0, 0, 0, 0] },
  { name: 'Bass Boost', nameES: 'Realce de Graves', icon: Disc3, values: [6, 3, 0, 0, 0] },
  { name: 'Treble Boost', nameES: 'Realce de Agudos', icon: Headphones, values: [0, 0, 0, 3, 6] },
  { name: 'V-Shape', nameES: 'Forma V', icon: Guitar, values: [5, 2, -2, 2, 5] },
  { name: 'Vocal', nameES: 'Vocal', icon: Mic, values: [0, 2, 4, 2, 0] },
  { name: 'Rock', nameES: 'Rock', icon: Guitar, values: [4, 2, 0, 2, 4] },
  { name: 'Jazz', nameES: 'Jazz', icon: Music2, values: [3, 1, -1, 1, 3] },
  { name: 'Classical', nameES: 'Clásica', icon: Music2, values: [0, 1, 2, 1, 0] },
  { name: 'Electronic', nameES: 'Electrónica', icon: Disc3, values: [5, 0, -2, 0, 4] },
  { name: 'Hip-Hop', nameES: 'Hip-Hop', icon: Disc3, values: [6, 4, 1, -1, 2] },
  { name: 'Podcast', nameES: 'Podcast', icon: Mic, values: [-2, 1, 3, 1, -2] },
  { name: 'Live', nameES: 'En Vivo', icon: Headphones, values: [2, 3, 2, 3, 2] },
];

export const FiveBandEqualizer = memo(({ 
  eqBands, 
  onEQBandChange, 
  onResetEQ,
  enabled,
  onEnabledChange
}: FiveBandEqualizerProps) => {
  const { t, language } = useLanguage();
  
  // 5 band EQ frequencies (Bass, Low Mid, Mid, High Mid, Treble)
  const eqFrequencies = [60, 250, 1000, 4000, 12000];
  const bandLabels = ['Bass', 'Low Mid', 'Mid', 'High Mid', 'Treble'];
  
  const applyPreset = useCallback((values: number[]) => {
    // Pad values to 10 bands if needed (keep middle bands at 0)
    const paddedValues = [...values];
    while (paddedValues.length < 10) {
      paddedValues.splice(Math.floor(paddedValues.length / 2), 0, 0);
    }
    
    paddedValues.forEach((value, index) => {
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

  // Map 5 bands to the first 5 of the 10-band array
  const bandIndices = [0, 2, 4, 7, 9];

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
              <span className="text-xs text-white">Audio EQ</span>
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
            {/* EQ Presets Strip - ON TOP with better styling */}
            <div className="bg-gradient-to-br from-purple-900/70 via-blue-900/70 to-indigo-900/70 dark:from-purple-950/90 dark:via-blue-950/90 dark:to-indigo-950/90 rounded-xl p-4 border-2 border-purple-500/70 dark:border-purple-600/90 shadow-2xl shadow-purple-900/60 backdrop-blur-sm">
              <h4 className="text-sm font-bold mb-3 tracking-wide flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent text-lg">EQ Presets</span>
                <span className="text-[10px] text-white/90 font-normal">(Quick adjustments)</span>
              </h4>
              <div className="grid grid-cols-6 gap-2">
                {EQ_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const displayName = language === 'ES' ? preset.nameES : preset.name;
                  return (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset.values)}
                      className="bg-gradient-to-br from-slate-700/90 via-slate-800/90 to-slate-900/90 dark:from-black/90 dark:via-slate-950/90 dark:to-black/90 border-2 border-slate-500/80 dark:border-slate-600/80 hover:bg-gradient-to-br hover:from-purple-600 hover:via-purple-500 hover:to-blue-600 hover:border-purple-300 hover:scale-110 hover:shadow-xl hover:shadow-purple-500/60 text-white h-auto py-2.5 px-3 flex flex-col items-center gap-1.5 transition-all duration-300 font-bold"
                      title={displayName}
                    >
                      <Icon className="h-4 w-4 text-purple-200" />
                      <span className="text-[10px] leading-tight text-center whitespace-nowrap">
                        {displayName}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* 5-Band EQ with better background */}
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-black dark:from-black dark:via-black dark:to-slate-950 rounded-xl p-6 border-2 border-slate-600 dark:border-slate-700 shadow-2xl backdrop-blur-sm" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.4) 0%, rgba(0, 0, 0, 0.8) 100%)' }}>
              
              {/* EQ Background Grid */}
              <div className="absolute left-6 right-6 top-6 bottom-6 bg-slate-900/50 dark:bg-black/60 rounded-lg border border-slate-700 dark:border-slate-800">
                {/* Horizontal grid lines */}
                {getTickMarks().map((mark) => (
                  <div 
                    key={mark}
                    className="absolute left-0 right-0 border-t border-slate-700/30 dark:border-slate-800/40"
                    style={{ top: `${((12 - mark) / 24) * 100}%` }}
                  >
                    <span className="absolute -left-9 -top-2 text-[10px] text-white font-mono">
                      {mark > 0 ? `+${mark}` : mark}dB
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center items-end gap-6 py-4 relative z-10">
                {bandIndices.map((bandIndex, visualIndex) => (
                  <div key={bandIndex} className="flex flex-col items-center group">
                    
                    {/* Frequency Label */}
                    <div className="text-xs text-center mb-2 font-mono text-white">
                      {bandLabels[visualIndex]}
                    </div>
                    <div className="text-[10px] text-center mb-2 font-mono text-white/70">
                      {eqFrequencies[visualIndex] < 1000 ? `${eqFrequencies[visualIndex]}Hz` : `${eqFrequencies[visualIndex]/1000}k`}
                    </div>

                    {/* Fader Container */}
                    <div className="relative h-40 w-8 mb-3">
                      
                      {/* Fader Track Background */}
                      <div 
                        className="absolute inset-x-1 inset-y-2 rounded-full border shadow-inner"
                        style={{
                          background: `linear-gradient(180deg, ${getEQColor(visualIndex)}40 0%, #1e293b 50%, ${getEQColor(visualIndex)}40 100%)`,
                          borderColor: '#334155',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                        }}
                      />

                      {/* Slider */}
                      <div className="h-full flex items-center justify-center">
                        <Slider
                          orientation="vertical"
                          value={[eqBands[bandIndex] || 0]}
                          onValueChange={([value]) => onEQBandChange(bandIndex, value)}
                          min={-12}
                          max={12}
                          step={0.5}
                          className="h-36 w-6 group-hover:scale-110 transition-transform duration-200"
                        />
                      </div>
                    </div>

                    {/* Value Display */}
                    <div className="text-xs text-center font-mono text-white bg-black/80 rounded px-2 py-1 min-w-[3rem]">
                      {eqBands[bandIndex] > 0 ? '+' : ''}{eqBands[bandIndex]}dB
                    </div>
                  </div>
                ))}
              </div>

              {/* EQ Branding */}
              <div className="absolute bottom-2 right-3 text-[10px] text-white/50 font-mono">
                SPECTRUM 5-BAND EQ
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-white">
            <div className="text-lg mb-2">🎚️</div>
            <p className="text-white text-sm">Enable Audio EQ to access the equalizer</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

FiveBandEqualizer.displayName = 'FiveBandEqualizer';
