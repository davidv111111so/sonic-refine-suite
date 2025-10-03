import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RotateCcw } from 'lucide-react';

interface ProfessionalEqualizerProps {
  eqBands: number[];
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

export const ProfessionalEqualizer = ({ 
  eqBands, 
  onEQBandChange, 
  onResetEQ,
  enabled,
  onEnabledChange
}: ProfessionalEqualizerProps) => {
  // 5 band EQ frequencies and labels
  const eqFrequencies = [60, 250, 1000, 4000, 12000];
  const bandLabels = ['Bass', 'Low Mid', 'Mid', 'High Mid', 'Treble'];
  
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
          <div className="relative">
            {/* Professional DJ Console Style EQ */}
            <div className="bg-gradient-to-br from-slate-900 via-black to-slate-950 dark:from-black dark:via-slate-950 dark:to-black rounded-xl p-8 border-2 border-slate-700 dark:border-slate-800 shadow-2xl">
              
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

              <div className="flex justify-center items-end gap-8 py-6 relative z-10">
                {eqFrequencies.map((freq, index) => (
                  <div key={freq} className="flex flex-col items-center group">
                    
                    {/* Frequency Label */}
                    <div className="text-xs font-bold text-center mb-1 text-slate-300 group-hover:text-white transition-colors">
                      {bandLabels[index]}
                    </div>
                    <div className="text-xs text-center mb-3 font-mono text-slate-400">
                      {freq < 1000 ? `${freq}Hz` : `${freq/1000}k`}
                    </div>

                    {/* Professional Fader Container */}
                    <div className="relative h-48 w-8 mb-4">
                      
                      {/* Fader Track Background */}
                      <div 
                        className="absolute inset-x-1 inset-y-2 rounded-full border-2 shadow-inner"
                        style={{
                          background: `linear-gradient(180deg, 
                            ${getEQColor(index)}20 0%, 
                            #1e293b 50%, 
                            ${getEQColor(index)}20 100%)`,
                          borderColor: '#334155',
                          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
                        }}
                      />

                      {/* Tick marks */}
                      <div className="absolute inset-y-2 -right-2 w-2">
                        {getTickMarks().filter((_, i) => i % 2 === 0).map((mark, idx) => (
                          <div 
                            key={mark}
                            className="absolute right-0 w-1 h-px bg-slate-600"
                            style={{ top: `${((12 - mark) / 24) * 100}%` }}
                          />
                        ))}
                      </div>

                      {/* Active Level Indicator */}
                      {eqBands[index] !== 0 && (
                        <div 
                          className="absolute inset-x-1 rounded-full transition-all duration-300"
                          style={{
                            background: `linear-gradient(180deg, 
                              ${getEQColor(index)}60 0%, 
                              ${getEQColor(index)}30 100%)`,
                            boxShadow: `0 0 12px ${getEQColor(index)}40`,
                            top: eqBands[index] > 0 
                              ? `${8 + ((12 - eqBands[index]) / 24) * (192 - 16)}px`
                              : `${8 + ((12) / 24) * (192 - 16)}px`,
                            bottom: eqBands[index] < 0 
                              ? `${8 + ((12 + eqBands[index]) / 24) * (192 - 16)}px`
                              : `${8 + ((12) / 24) * (192 - 16)}px`
                          }}
                        />
                      )}

                      {/* Professional Slider */}
                      <div className="h-full flex items-center justify-center">
                        <Slider
                          orientation="vertical"
                          value={[eqBands[index] || 0]}
                          onValueChange={([value]) => onEQBandChange(index, value)}
                          min={-12}
                          max={12}
                          step={0.5}
                          className="h-44 w-6 professional-fader group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    </div>

                    {/* Value Display */}
                    <div 
                      className="text-sm text-center min-w-16 font-mono bg-black/80 rounded-lg px-3 py-1 border-2 shadow-lg backdrop-blur-sm"
                      style={{
                        color: eqBands[index] !== 0 ? getEQColor(index) : '#94a3b8',
                        borderColor: eqBands[index] !== 0 ? getEQColor(index) + '60' : '#475569',
                        boxShadow: eqBands[index] !== 0 
                          ? `0 0 15px ${getEQColor(index)}40, inset 0 1px 2px rgba(0,0,0,0.5)` 
                          : 'inset 0 1px 2px rgba(0,0,0,0.5)'
                      }}
                    >
                      {eqBands[index] > 0 ? '+' : ''}{eqBands[index]}dB
                    </div>
                  </div>
                ))}
              </div>

              {/* Professional EQ Branding */}
              <div className="absolute bottom-2 right-4 text-xs text-slate-500 font-mono">
                SPECTRUM PRO EQ
              </div>
            </div>

            {/* LED-style status indicators */}
            <div className="flex justify-center mt-4 gap-4">
              {eqBands.map((band, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                    band !== 0 
                      ? 'animate-pulse shadow-lg' 
                      : 'opacity-30'
                  }`}
                  style={{
                    backgroundColor: band !== 0 ? getEQColor(index) : '#475569',
                    borderColor: getEQColor(index),
                    boxShadow: band !== 0 ? `0 0 10px ${getEQColor(index)}60` : 'none'
                  }}
                />
              ))}
            </div>

          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <div className="text-lg mb-2">🎚️</div>
            <p>Enable Audio EQ to access the professional equalizer</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};