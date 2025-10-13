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
const EQ_PRESETS = [{
  name: 'Flat',
  nameES: 'Plano',
  icon: Music2,
  values: [0, 0, 0, 0, 0]
}, {
  name: 'Bass Boost',
  nameES: 'Realce de Graves',
  icon: Disc3,
  values: [6, 3, 0, 0, 0]
}, {
  name: 'Treble Boost',
  nameES: 'Realce de Agudos',
  icon: Headphones,
  values: [0, 0, 0, 3, 6]
}, {
  name: 'V-Shape',
  nameES: 'Forma V',
  icon: Guitar,
  values: [5, 2, -2, 2, 5]
}, {
  name: 'Vocal',
  nameES: 'Vocal',
  icon: Mic,
  values: [0, 2, 4, 2, 0]
}, {
  name: 'Rock',
  nameES: 'Rock',
  icon: Guitar,
  values: [4, 2, 0, 2, 4]
}, {
  name: 'Jazz',
  nameES: 'Jazz',
  icon: Music2,
  values: [3, 1, -1, 1, 3]
}, {
  name: 'Classical',
  nameES: 'Clásica',
  icon: Music2,
  values: [0, 1, 2, 1, 0]
}, {
  name: 'Electronic',
  nameES: 'Electrónica',
  icon: Disc3,
  values: [5, 0, -2, 0, 4]
}, {
  name: 'Hip-Hop',
  nameES: 'Hip-Hop',
  icon: Disc3,
  values: [6, 4, 1, -1, 2]
}, {
  name: 'Podcast',
  nameES: 'Podcast',
  icon: Mic,
  values: [-2, 1, 3, 1, -2]
}, {
  name: 'Live',
  nameES: 'En Vivo',
  icon: Headphones,
  values: [2, 3, 2, 3, 2]
}];
export const FiveBandEqualizer = memo(({
  eqBands,
  onEQBandChange,
  onResetEQ,
  enabled,
  onEnabledChange
}: FiveBandEqualizerProps) => {
  const {
    t,
    language
  } = useLanguage();

  // 5 band EQ frequencies (Bass, Low Mid, Mid, High Mid, Treble)
  const eqFrequencies = [60, 250, 1000, 4000, 12000];
  const bandLabels = ['Bass', 'Low Mid', 'Mid', 'High Mid', 'Treble'];
  const applyPreset = useCallback((values: number[]) => {
    // Apply the 5 preset values directly to the 5 visual band indices
    bandIndices.forEach((bandIndex, visualIndex) => {
      onEQBandChange(bandIndex, values[visualIndex] || 0);
    });
  }, [onEQBandChange]);
  const getEQColor = (index: number) => {
    const colors = ['#ff1744',
    // Red for Bass
    '#ff6d00',
    // Orange for Low Mid  
    '#ffc400',
    // Yellow for Mid
    '#3d5afe',
    // Blue for High Mid
    '#651fff' // Purple for Treble
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
  return <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600">
      <CardHeader className="pb-3 bg-zinc-950">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-teal-100">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded"></div>
            Equalizer
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white">Audio EQ</span>
              <Switch checked={enabled} onCheckedChange={onEnabledChange} className="bg-indigo-800 hover:bg-indigo-700" />
            </div>
            <Button variant="outline" size="sm" onClick={onResetEQ} className="h-8 text-xs bg-slate-800 dark:bg-black border-slate-700 dark:border-slate-800 hover:bg-slate-700 dark:hover:bg-slate-900 text-white">
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 bg-zinc-950">
        {enabled ? <div className="relative space-y-4">
            {/* EQ Presets Strip - Vibrant & Stylish */}
            <div className="bg-gradient-to-br from-purple-600/80 via-pink-600/80 to-blue-600/80 dark:from-purple-700/90 dark:via-pink-700/90 dark:to-blue-700/90 rounded-2xl p-5 border-3 border-white/20 shadow-2xl shadow-purple-500/50 backdrop-blur-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse bg-gray-950 my-0 mx-0 px-0 py-[28px]"></div>
              <h4 className="text-base font-black mb-4 tracking-wide flex items-center gap-2 relative z-10">
                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent text-xl drop-shadow-lg font-bold">
                  ✨ EQ Presets
                </span>
                <span className="text-[11px] text-white/95 font-semibold bg-black/30 px-2 py-1 rounded-full">(Quick Adjustments)</span>
              </h4>
              <div className="grid grid-cols-6 gap-2.5 relative z-10">
                {EQ_PRESETS.map(preset => {
              const Icon = preset.icon;
              const displayName = language === 'ES' ? preset.nameES : preset.name;
              return <Button key={preset.name} variant="outline" size="sm" onClick={() => applyPreset(preset.values)} className="bg-gradient-to-br from-slate-800 via-slate-900 to-black border-2 border-purple-400/60 hover:border-cyan-300 hover:scale-110 hover:shadow-2xl hover:shadow-cyan-400/70 hover:from-purple-700 hover:via-pink-600 hover:to-blue-700 h-auto py-3 px-3 flex flex-col items-center gap-2 transition-all duration-300 font-bold relative group overflow-hidden" title={displayName}>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Icon className="h-5 w-5 text-cyan-300 group-hover:text-white relative z-10 drop-shadow-lg animate-pulse" />
                      <span className="text-[10px] leading-tight text-center whitespace-nowrap bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent group-hover:from-white group-hover:via-white group-hover:to-white relative z-10 animate-pulse font-extrabold">
                        {displayName}
                      </span>
                    </Button>;
            })}
              </div>
            </div>

            {/* 5-Band EQ - Professional & Colorful */}
            <div className="relative bg-gradient-to-br from-slate-900 via-purple-950 to-blue-950 rounded-2xl p-6 border-3 border-purple-400/40 shadow-2xl shadow-purple-500/30 backdrop-blur-sm overflow-hidden">
              
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/10 to-pink-500/5 animate-pulse mx-0 py-0 my-0 px-0"></div>
              
              {/* EQ Background Grid */}
              <div className="absolute left-6 right-6 top-6 bottom-6 bg-black/40 rounded-xl border-2 border-cyan-500/20 shadow-inner">
                {/* Horizontal grid lines with glow */}
                {getTickMarks().map(mark => <div key={mark} className="absolute left-0 right-0 border-t border-cyan-400/20" style={{
              top: `${(12 - mark) / 24 * 100}%`,
              boxShadow: '0 0 10px rgba(34, 211, 238, 0.1)'
            }}>
                    <span className="absolute left-2 -top-2.5 bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent font-mono drop-shadow-lg text-right text-xs font-thin">
                      {mark > 0 ? '+' : ''}{mark}dB
                    </span>
                  </div>)}
              </div>

              <div className="flex justify-center items-end gap-7 py-4 relative z-10">
                {bandIndices.map((bandIndex, visualIndex) => <div key={bandIndex} className="flex flex-col items-center group">
                    
                    {/* Band Label */}
                    <div className="text-sm text-center mb-1 font-black text-white drop-shadow-lg">
                      {bandLabels[visualIndex]}
                    </div>
                    <div className="text-xs text-center mb-3 font-mono text-cyan-300 font-semibold">
                      {eqFrequencies[visualIndex] < 1000 ? `${eqFrequencies[visualIndex]}Hz` : `${eqFrequencies[visualIndex] / 1000}k`}
                    </div>

                    {/* Fader Container with Glow */}
                    <div className="relative h-44 w-10 mb-3">
                      
                      {/* Fader Track with Vibrant Colors */}
                      <div className="absolute inset-x-1 inset-y-2 rounded-full border-2 shadow-inner" style={{
                  background: `linear-gradient(180deg, ${getEQColor(visualIndex)}60 0%, #0f172a 50%, ${getEQColor(visualIndex)}60 100%)`,
                  borderColor: getEQColor(visualIndex),
                  boxShadow: `inset 0 3px 6px rgba(0,0,0,0.6), 0 0 20px ${getEQColor(visualIndex)}40`
                }} />

                      {/* Slider */}
                      <div className="h-full flex items-center justify-center">
                        <Slider orientation="vertical" value={[eqBands[bandIndex] || 0]} onValueChange={([value]) => onEQBandChange(bandIndex, value)} min={-12} max={12} step={0.5} className="h-40 w-7 group-hover:scale-110 transition-transform duration-300 text-zinc-50" />
                      </div>
                      
                      {/* Visual Level Indicator */}
                      <div className="absolute inset-x-0 bottom-2 rounded-t-lg transition-all duration-300 pointer-events-none" style={{
                  height: `${((eqBands[bandIndex] || 0) + 12) / 24 * 100}%`,
                  background: `linear-gradient(180deg, ${getEQColor(visualIndex)}80, ${getEQColor(visualIndex)}20)`,
                  boxShadow: `0 0 30px ${getEQColor(visualIndex)}60`,
                  opacity: 0.4
                }} />
                    </div>

                    {/* Value Display with Color */}
                    <div className="text-sm text-center font-mono font-black rounded-lg px-3 py-1.5 min-w-[4rem] border-2 shadow-lg" style={{
                color: 'white',
                backgroundColor: `${getEQColor(visualIndex)}30`,
                borderColor: getEQColor(visualIndex),
                boxShadow: `0 0 20px ${getEQColor(visualIndex)}50, inset 0 0 10px ${getEQColor(visualIndex)}20`
              }}>
                      {eqBands[bandIndex] > 0 ? '+' : ''}{eqBands[bandIndex]}dB
                    </div>
                  </div>)}
              </div>

              {/* EQ Branding with Glow */}
              <div className="absolute bottom-3 right-4 text-xs text-cyan-300 font-mono font-bold drop-shadow-lg py-[19px] my-[5px] mx-[18px]">
                SPECTRUM 5-BAND EQ ✨
              </div>
            </div>
          </div> : <div className="text-center py-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-600">
            <div className="text-4xl mb-3">🎚️</div>
            <p className="bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent text-base font-bold animate-pulse">
              Enable Audio EQ to access the equalizer
            </p>
          </div>}
      </CardContent>
    </Card>;
});
FiveBandEqualizer.displayName = 'FiveBandEqualizer';