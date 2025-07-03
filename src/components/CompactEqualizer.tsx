
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface CompactEqualizerProps {
  eqBands: number[];
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
  enabled: boolean;
}

export const CompactEqualizer = ({ eqBands, onEQBandChange, onResetEQ, enabled }: CompactEqualizerProps) => {
  const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  
  const getEQColor = (index: number, value: number) => {
    const colors = [
      '#ff6b6b', '#ff8e53', '#ff9f43', '#feca57', '#48cab3',
      '#0abde3', '#3742fa', '#7d5fff', '#e056fd', '#ff3838'
    ];
    const intensity = Math.abs(value) / 12;
    const opacity = 0.4 + (intensity * 0.6);
    return colors[index];
  };

  const getSliderBackground = (index: number, value: number) => {
    const color = getEQColor(index, value);
    const intensity = Math.abs(value) / 12;
    return {
      background: `linear-gradient(to top, ${color}${Math.floor((0.3 + intensity * 0.7) * 255).toString(16).padStart(2, '0')}, transparent)`,
      borderRadius: '4px',
      transition: 'all 0.3s ease'
    };
  };

  if (!enabled) return null;

  return (
    <div className="bg-slate-900/60 rounded-lg p-4 border-2 border-slate-600 shadow-inner">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-blue-400 tracking-wide">Perfect Audio 10-Band EQ</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetEQ}
          className="h-7 text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-white font-medium px-3"
        >
          Reset
        </Button>
      </div>
      
      <div className="relative">
        {/* Enhanced EQ with stylish sliders */}
        <div className="flex justify-center items-end gap-3 py-3 px-3 border-2 border-slate-600 rounded-lg bg-slate-800/40 backdrop-blur-sm">
          {eqFrequencies.map((freq, index) => (
            <div key={freq} className="flex flex-col items-center group">
              <div className="h-20 flex items-end justify-center mb-2 relative">
                <div 
                  className="absolute inset-x-0 bottom-0 rounded-t transition-all duration-500 ease-out"
                  style={getSliderBackground(index, eqBands[index])}
                />
                <div className="relative z-10">
                  <Slider
                    orientation="vertical"
                    value={[eqBands[index]]}
                    onValueChange={([value]) => onEQBandChange(index, value)}
                    min={-12}
                    max={12}
                    step={0.5}
                    className="h-16 w-5 group-hover:scale-105 transition-transform duration-200"
                    style={{
                      '--slider-track': getEQColor(index, eqBands[index]),
                      '--slider-range': getEQColor(index, eqBands[index]),
                      '--slider-thumb': '#ffffff'
                    } as React.CSSProperties}
                  />
                </div>
              </div>
              <div className="text-xs text-blue-400 mb-1 text-center font-bold tracking-tight">
                {freq < 1000 ? `${freq}Hz` : `${freq/1000}k`}
              </div>
              <div 
                className="text-xs text-center min-w-9 font-mono bg-slate-800/80 rounded-full px-2 py-1 border transition-colors duration-200"
                style={{
                  color: eqBands[index] !== 0 ? getEQColor(index, eqBands[index]) : '#94a3b8',
                  borderColor: eqBands[index] !== 0 ? getEQColor(index, eqBands[index]) + '40' : '#475569'
                }}
              >
                {eqBands[index] > 0 ? '+' : ''}{eqBands[index]}dB
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
