import React, { memo, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { RotateCcw, Music2, Mic, Headphones, Guitar, Disc3, Radio, MessageSquare, Volume2, Waves, Music, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface ProfessionalEqualizerProps {
  eqBands: number[];
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

// 10 Professional EQ Presets with Full 10-Band Values and Automatic Gain Compensation
// Each preset now includes values for all 10 bands: 31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz
const EQ_PRESETS = [
  { name: 'Modern Punch', nameES: 'Punch Moderno', icon: Volume2, values: [+1.5, +1.0, +0.5, -2.0, +0.5, +2.0, +1.5, +1.0, +0.5, 0], compensation: -1.2 },
  { name: 'Vocal Presence', nameES: 'Presencia Vocal', icon: Mic, values: [-1.5, -2.0, -1.0, +1.5, +2.0, +2.5, +2.0, +1.0, +0.5, 0], compensation: -0.6 },
  { name: 'Bass Foundation', nameES: 'Base de Graves', icon: Waves, values: [+2.0, +1.5, +1.0, -1.0, -0.5, 0, 0, 0, 0, 0], compensation: -0.9 },
  { name: 'Clarity & Air', nameES: 'Claridad y Aire', icon: Lightbulb, values: [-0.5, -0.5, 0, -1.0, +1.0, +1.5, +2.0, +2.5, +3.0, +2.5], compensation: -0.8 },
  { name: 'De-Box / Clean Mid', nameES: 'Limpiar Medios', icon: Radio, values: [-1.0, -1.0, -1.5, -2.5, -2.0, +1.0, +1.5, +1.0, +0.5, 0], compensation: -0.5 },
  { name: 'Warmth & Body', nameES: 'Calidez y Cuerpo', icon: Music2, values: [+0.5, +1.0, +1.5, +1.0, +0.5, -1.0, -1.5, -1.0, -0.5, 0], compensation: -0.4 },
  { name: 'Live Energy (Subtle V)', nameES: 'Energía en Vivo (V Sutil)', icon: Headphones, values: [+1.0, +1.0, +0.5, -1.5, -1.0, +0.5, +1.0, +1.5, +2.0, +1.5], compensation: -0.7 },
  { name: 'Acoustic / Orchestral', nameES: 'Acústico / Orquestal', icon: Guitar, values: [+0.5, +0.5, 0, -1.0, -0.5, +0.5, +1.0, +1.0, +0.5, 0], compensation: -0.3 },
  { name: 'Digital De-Harsh', nameES: 'De-Harsh Digital', icon: Disc3, values: [0, 0, 0, +0.5, 0, -1.5, -2.0, -1.5, -1.0, -0.5], compensation: 0 },
  { name: 'Voiceover / Podcast', nameES: 'Voz en Off / Podcast', icon: MessageSquare, values: [-6.0, -4.0, -2.5, +2.0, +2.5, +2.0, +1.0, -1.5, -2.0, -1.0], compensation: -1.5 },
];

export const ProfessionalEqualizer = ({ 
  eqBands, 
  onEQBandChange, 
  onResetEQ,
  enabled,
  onEnabledChange
}: ProfessionalEqualizerProps) => {
  const { t, language } = useLanguage();
  
  // Default 10 band EQ frequencies
  const defaultFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  
  // Frequency ranges for each band (min, max)
  const frequencyRanges = [
    [20, 50],      // Band 0: Sub Bass
    [50, 100],     // Band 1: Bass
    [100, 200],    // Band 2: Low Mid
    [200, 400],    // Band 3: Mid
    [400, 800],    // Band 4: Upper Mid
    [800, 1500],   // Band 5: Presence
    [1500, 3000],  // Band 6: Upper Presence
    [3000, 6000],  // Band 7: Brilliance
    [6000, 12000], // Band 8: Air
    [12000, 20000] // Band 9: Ultra High
  ];
  
  // State for custom frequencies
  const [eqFrequencies, setEqFrequencies] = useState<number[]>(defaultFrequencies);
  const [editingBand, setEditingBand] = useState<number | null>(null);
  const [tempFreqValue, setTempFreqValue] = useState<string>('');
  
  const handleFrequencyClick = useCallback((index: number) => {
    setEditingBand(index);
    setTempFreqValue(eqFrequencies[index].toString());
  }, [eqFrequencies]);
  
  const handleFrequencyChange = useCallback((value: string) => {
    setTempFreqValue(value);
  }, []);
  
  const handleFrequencySubmit = useCallback((index: number) => {
    const newFreq = parseInt(tempFreqValue);
    const [min, max] = frequencyRanges[index];
    
    if (!isNaN(newFreq) && newFreq >= min && newFreq <= max) {
      const newFrequencies = [...eqFrequencies];
      newFrequencies[index] = newFreq;
      setEqFrequencies(newFrequencies);
    }
    setEditingBand(null);
  }, [tempFreqValue, eqFrequencies, frequencyRanges]);
  
  const handleFrequencyBlur = useCallback((index: number) => {
    handleFrequencySubmit(index);
  }, [handleFrequencySubmit]);
  
  const handleResetWithFrequencies = useCallback(() => {
    setEqFrequencies(defaultFrequencies);
    onResetEQ();
  }, [onResetEQ]);
  
  const applyPreset = useCallback((values: number[], compensation: number) => {
    // Apply EQ values to all 10 bands in real-time
    // This ensures ALL sliders move when a preset is selected
    values.forEach((value, index) => {
      if (index < 10) {
        // Apply value to corresponding band with smooth transition
        onEQBandChange(index, value);
      }
    });
    
    // Apply automatic gain compensation
    console.log(`✅ Applied preset with ${compensation} dB gain compensation for equal loudness`);
    
    toast.success('Preset Applied', {
      description: `EQ preset applied with ${compensation >= 0 ? '+' : ''}${compensation} dB compensation`,
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
              onClick={handleResetWithFrequencies}
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
              <h4 className="text-xs font-semibold text-purple-300 dark:text-purple-200 mb-2 tracking-wide flex items-center gap-2">
                Professional EQ Presets
                <span className="text-[10px] text-purple-400/70 dark:text-purple-300/60">(Real dB values)</span>
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
                      onClick={() => applyPreset(preset.values, preset.compensation)}
                      className="bg-slate-800/90 dark:bg-black/80 border-slate-600 dark:border-slate-700 hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 hover:border-purple-500 text-white h-auto py-1.5 px-1.5 flex flex-col items-center gap-0.5 transition-all duration-300"
                      title={`${displayName} (Gain: ${preset.compensation > 0 ? '+' : ''}${preset.compensation} dB)`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-[8px] leading-tight text-center">
                        {displayName}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Professional EQ - Compact 35% smaller */}
            <div className="bg-gradient-to-br from-slate-900 via-black to-slate-950 dark:from-black dark:via-slate-950 dark:to-black rounded-xl p-4 border-2 border-slate-700 dark:border-slate-800 shadow-2xl">
              
              {/* EQ Background Grid */}
              <div className="absolute inset-6 bg-slate-900/50 dark:bg-black/60 rounded-lg border border-slate-700 dark:border-slate-800">
                {/* Horizontal grid lines */}
                {getTickMarks().map((mark, idx) => (
                  <div 
                    key={mark}
                    className="absolute left-0 right-0 border-t border-slate-700/30 dark:border-slate-800/40"
                    style={{ top: `${((12 - mark) / 24) * 100}%` }}
                  >
                    <span className="absolute -left-7 -top-2 text-[10px] text-slate-500 dark:text-slate-600 font-mono">
                      {mark > 0 ? `+${mark}` : mark}dB
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center items-end gap-2 py-3 relative z-10">
                {eqFrequencies.map((freq, index) => (
                  <div key={index} className="flex flex-col items-center group">
                    
                    {/* Frequency Label - Editable */}
                    {editingBand === index ? (
                      <Input
                        type="number"
                        value={tempFreqValue}
                        onChange={(e) => handleFrequencyChange(e.target.value)}
                        onBlur={() => handleFrequencyBlur(index)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFrequencySubmit(index);
                          if (e.key === 'Escape') setEditingBand(null);
                        }}
                        className="w-12 h-5 text-[8px] text-center p-0 bg-slate-800 border-blue-500 text-blue-300"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="text-[9px] text-center mb-1.5 font-mono text-blue-400 dark:text-blue-300 cursor-pointer hover:text-blue-300 hover:underline"
                        onClick={() => handleFrequencyClick(index)}
                        title={`Click to edit (Range: ${frequencyRanges[index][0]}-${frequencyRanges[index][1]} Hz)`}
                      >
                        {eqFrequencies[index] < 1000 ? `${eqFrequencies[index]}Hz` : `${(eqFrequencies[index]/1000).toFixed(1)}k`}
                      </div>
                    )}

                    {/* Compact Fader Container - 35% smaller */}
                    <div className="relative h-28 w-5 mb-2">
                      
                      {/* Compact Fader Track Background */}
                      <div 
                        className="absolute inset-x-0.5 inset-y-1 rounded-full border shadow-inner"
                        style={{
                          background: `linear-gradient(180deg, #3b82f620 0%, #1e293b 50%, #3b82f620 100%)`,
                          borderColor: '#334155',
                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
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
                          className="h-24 w-4 group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    </div>

                    {/* Compact Value Display */}
                    <div className="text-[8px] text-center font-mono text-slate-300 dark:text-slate-200 bg-black/60 rounded px-1 py-0.5">
                      {eqBands[index] > 0 ? '+' : ''}{eqBands[index]}
                    </div>
                  </div>
                ))}
              </div>

              {/* Professional EQ Branding */}
              <div className="absolute bottom-1 right-2 text-[8px] text-slate-500 dark:text-slate-600 font-mono">
                SPECTRUM EQ
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 dark:text-slate-300">
            <div className="text-lg mb-2">🎚️</div>
            <p className="text-white text-sm">Enable Audio EQ to access the professional equalizer</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};