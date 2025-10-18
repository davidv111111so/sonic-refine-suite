import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface AdjustableFrequencyBandProps {
  bandLabel: string;
  frequency: number;
  value: number;
  minFreq: number;
  maxFreq: number;
  color: string;
  onFrequencyChange: (frequency: number) => void;
  onValueChange: (value: number) => void;
}

export const AdjustableFrequencyBand = ({
  bandLabel,
  frequency,
  value,
  minFreq,
  maxFreq,
  color,
  onFrequencyChange,
  onValueChange
}: AdjustableFrequencyBandProps) => {
  const formatFrequency = (freq: number) => {
    return freq < 1000 ? `${freq} Hz` : `${(freq / 1000).toFixed(2)} kHz`;
  };

  const adjustFrequency = (direction: 'up' | 'down') => {
    const step = (maxFreq - minFreq) / 20; // 20 steps across the range
    const newFreq = direction === 'up' 
      ? Math.min(maxFreq, frequency + step)
      : Math.max(minFreq, frequency - step);
    onFrequencyChange(Math.round(newFreq));
  };

  return (
    <div className="flex flex-col items-center group">
      {/* Band Label */}
      <div className="text-sm text-center mb-1 font-black text-white drop-shadow-lg">
        {bandLabel}
      </div>
      
      {/* Frequency Display with Adjustment Buttons */}
      <div className="flex items-center gap-1 mb-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => adjustFrequency('down')}
          className="h-6 w-6 p-0 hover:bg-white/10"
        >
          <ChevronLeft className="h-3 w-3 text-cyan-300" />
        </Button>
        <div className="text-xs text-center font-mono text-cyan-300 font-semibold min-w-[80px]">
          {formatFrequency(frequency)}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => adjustFrequency('up')}
          className="h-6 w-6 p-0 hover:bg-white/10"
        >
          <ChevronRight className="h-3 w-3 text-cyan-300" />
        </Button>
      </div>

      {/* Frequency Range Info */}
      <div className="text-[10px] text-slate-400 mb-2 text-center">
        {formatFrequency(minFreq)} - {formatFrequency(maxFreq)}
      </div>

      {/* Fader Container with Glow */}
      <div className="relative h-44 w-10 mb-3">
        {/* Fader Track with Vibrant Colors */}
        <div 
          className="absolute inset-x-1 inset-y-2 rounded-full border-2 shadow-inner"
          style={{
            background: `linear-gradient(180deg, ${color}60 0%, #0f172a 50%, ${color}60 100%)`,
            borderColor: color,
            boxShadow: `inset 0 3px 6px rgba(0,0,0,0.6), 0 0 20px ${color}40`
          }}
        />

        {/* Slider */}
        <div className="h-full flex items-center justify-center">
          <Slider
            orientation="vertical"
            value={[value || 0]}
            onValueChange={([val]) => onValueChange(val)}
            min={-12}
            max={12}
            step={0.5}
            className="h-40 w-7 group-hover:scale-110 transition-transform duration-300 text-zinc-50"
          />
        </div>

        {/* Visual Level Indicator */}
        <div 
          className="absolute inset-x-0 bottom-2 rounded-t-lg transition-all duration-300 pointer-events-none"
          style={{
            height: `${((value || 0) + 12) / 24 * 100}%`,
            background: `linear-gradient(180deg, ${color}80, ${color}20)`,
            boxShadow: `0 0 30px ${color}60`,
            opacity: 0.4
          }}
        />
      </div>

      {/* Value Display with Color */}
      <div 
        className="text-sm text-center font-mono font-black rounded-lg px-3 py-1.5 min-w-[4rem] border-2 shadow-lg"
        style={{
          color: 'white',
          backgroundColor: `${color}30`,
          borderColor: color,
          boxShadow: `0 0 20px ${color}50, inset 0 0 10px ${color}20`
        }}
      >
        {value > 0 ? '+' : ''}{value}dB
      </div>
    </div>
  );
};
