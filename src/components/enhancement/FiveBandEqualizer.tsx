import React, { memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AdvancedEQPresetsWithCompensation } from './AdvancedEQPresetsWithCompensation';
interface FiveBandEqualizerProps {
  eqBands: number[];
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}
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

  // 5 band EQ frequencies optimized for psychoacoustic response
  const eqFrequencies = [50, 145, 874, 5560, 17200];
  const bandLabels = language === 'ES' ? ['Graves / Sub', 'Medio-Grave / Punch', 'Medio', 'Medio-Agudo / Presencia', 'Agudos / Air'] : ['Low / Sub', 'Mid Low / Punch', 'Mid', 'Mid High / Presence', 'High / Air'];
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onEnabledChange(!enabled)} className={`w-8 h-8 p-0 transition-all duration-300 ${enabled ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-blue-400 shadow-lg shadow-blue-500/50' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}>
              <div className={`w-3 h-3 rounded ${enabled ? 'bg-white' : 'bg-slate-400'}`}></div>
            </Button>
            <CardTitle className="text-base text-teal-100 mx-[4px] my-[6px] py-0 px-px">
              {language === 'ES' ? 'Ecualizador' : 'Equalizer'}
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-slate-400 hover:text-cyan-400 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm bg-slate-800 border-slate-600 text-slate-200 p-4">
                  <p className="text-sm">
                    {language === 'ES' ? 'El rango predeterminado ha seleccionado frecuencias que son psicoacústicamente agradables para el oído humano, resaltando naturalmente los tonos más embellecedores en el audio.' : 'The default range has selected frequencies that are psychoacoustically pleasing to the human ear, naturally highlighting the most embellishing tones in the audio.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onResetEQ} className="h-8 text-xs bg-slate-800 dark:bg-black border-slate-700 dark:border-slate-800 hover:bg-slate-700 dark:hover:bg-slate-900 text-white">
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 bg-zinc-950">
        {enabled ? <div className="relative space-y-4">
            {/* Professional Presets Section */}
            <div className="mb-4">
              <AdvancedEQPresetsWithCompensation onEQBandChange={onEQBandChange} />
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
                    <div className="text-sm text-center mb-1 font-black text-white drop-shadow-lg bg-violet-600 rounded-lg">
                      {bandLabels[visualIndex]}
                    </div>
                    <div className="text-xs text-center mb-3 font-mono text-cyan-300 font-semibold bg-indigo-500">
                      {eqFrequencies[visualIndex] < 1000 ? `${eqFrequencies[visualIndex]} Hz` : `${(eqFrequencies[visualIndex] / 1000).toFixed(2)} kHz`}
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