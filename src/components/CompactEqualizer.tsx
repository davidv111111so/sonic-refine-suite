
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
      '#8B0000', '#FF4500', '#FF8C00', '#FFD700', '#9ACD32',
      '#00FF7F', '#00CED1', '#4169E1', '#8A2BE2', '#FF1493'
    ];
    const intensity = Math.abs(value) / 12;
    const opacity = 0.3 + (intensity * 0.7);
    return `${colors[index]}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
  };

  if (!enabled) return null;

  return (
    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-blue-400">10-Band Equalizer</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetEQ}
          className="h-6 text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
        >
          Reset
        </Button>
      </div>
      
      <div className="relative">
        {/* Compact EQ with proper boundaries */}
        <div className="flex justify-center items-end gap-2 py-2 px-2 border border-slate-600/50 rounded bg-slate-800/30">
          {eqFrequencies.map((freq, index) => (
            <div key={freq} className="flex flex-col items-center">
              <div className="h-16 flex items-end justify-center mb-1 relative">
                <div 
                  className="absolute inset-0 rounded opacity-30 transition-all duration-300"
                  style={{
                    background: `linear-gradient(to top, ${getEQColor(index, eqBands[index])}, transparent)`,
                    transform: `scaleY(${0.2 + Math.abs(eqBands[index]) / 12 * 0.8})`
                  }}
                />
                <Slider
                  orientation="vertical"
                  value={[eqBands[index]]}
                  onValueChange={([value]) => onEQBandChange(index, value)}
                  min={-12}
                  max={12}
                  step={0.5}
                  className="h-14 w-4 relative z-10"
                />
              </div>
              <div className="text-xs text-blue-400 mb-1 text-center font-medium">
                {freq < 1000 ? `${freq}Hz` : `${freq/1000}k`}
              </div>
              <div className="text-xs text-white text-center min-w-8 font-mono bg-slate-800/50 rounded px-1">
                {eqBands[index] > 0 ? '+' : ''}{eqBands[index]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
