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
    <div className="flex flex-col items-center group relative p-3 rounded-2xl border border-transparent hover:border-slate-800/50 hover:bg-slate-900/30 transition-all duration-300">
      {/* Band Label (Capsule) */}
      <div 
        className="text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full mb-3"
        style={{
          color: color,
          backgroundColor: `${color}15`,
          border: `1px solid ${color}30`,
          boxShadow: `0 0 10px ${color}20, inset 0 0 8px ${color}10`
        }}
      >
        {bandLabel}
      </div>
      
      {/* Frequency Display with Adjustment Buttons */}
      <div className="flex items-center gap-1 mb-2 bg-slate-950/60 rounded-lg p-1 border border-slate-800/80 shadow-inner">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => adjustFrequency('down')}
          className="h-5 w-5 p-0 hover:bg-white/10 rounded-md"
        >
          <ChevronLeft className="h-3 w-3 text-slate-400 group-hover:text-cyan-300 transition-colors" />
        </Button>
        <div className="text-[11px] text-center font-mono text-slate-300 group-hover:text-white transition-colors font-semibold min-w-[65px]">
          {formatFrequency(frequency)}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => adjustFrequency('up')}
          className="h-5 w-5 p-0 hover:bg-white/10 rounded-md"
        >
          <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-cyan-300 transition-colors" />
        </Button>
      </div>

      {/* Frequency Range Info */}
      <div className="text-[9px] text-slate-500 mb-4 text-center font-medium tracking-wide">
        {formatFrequency(minFreq)} - {formatFrequency(maxFreq)}
      </div>

      {/* Fader Container with Glow & Glass */}
      <div className="relative h-44 w-10 mb-4">
        {/* Modern Fader Track (Glassmorphism) */}
        <div 
          className="absolute inset-x-2 inset-y-1 rounded-full backdrop-blur-md"
          style={{
            background: `linear-gradient(180deg, ${color}30 0%, rgba(15,23,42,0.6) 50%, ${color}30 100%)`,
            border: `1px solid ${color}40`,
            boxShadow: `inset 0 4px 10px rgba(0,0,0,0.8), 0 0 15px ${color}20`
          }}
        />

        {/* Center Indication Mark */}
        <div className="absolute top-[50%] left-[-4px] right-[-4px] h-[1px] bg-slate-700/80 z-0"></div>

        {/* Slider */}
        <div className="h-full flex items-center justify-center relative z-10">
          <Slider
            orientation="vertical"
            value={[value || 0]}
            onValueChange={([val]) => onValueChange(val)}
            min={-12}
            max={12}
            step={0.5}
            className="h-40 w-7 group-hover:scale-105 transition-transform duration-300 cursor-ns-resize"
          />
        </div>

        {/* Dynamic Visual Level Indicator (Neon Glow) */}
        <div 
          className="absolute inset-x-2 bottom-1 rounded-t-full rounded-b-full transition-all duration-300 pointer-events-none"
          style={{
            height: `${Math.max(4, ((value || 0) + 12) / 24 * 100)}%`,
            background: `linear-gradient(0deg, ${color}90, ${color}30)`,
            boxShadow: `0 -5px 20px ${color}80, inset 0 0 8px ${color}`,
            opacity: 0.8
          }}
        />
      </div>

      {/* Value Display Indicator Component */}
      <div 
        className="text-xs text-center font-mono font-bold rounded-lg px-4 py-1.5 min-w-[4.5rem] transition-all duration-300"
        style={{
          color: value !== 0 ? 'white' : '#94a3b8',
          backgroundColor: value !== 0 ? `${color}25` : 'rgba(15,23,42,0.8)',
          borderColor: value !== 0 ? `${color}60` : 'rgba(30,41,59,0.8)',
          borderWidth: '1px',
          boxShadow: value !== 0 ? `0 0 15px ${color}30, inset 0 0 5px ${color}10` : 'inset 0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        {value > 0 ? '+' : ''}{value.toFixed(1)} <span className="text-[9px] opacity-70">dB</span>
      </div>
    </div>
  );
};
