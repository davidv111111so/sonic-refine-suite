import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';
export interface EQBand {
  frequency: number;
  gain: number;
}
interface TenBandEqualizerProps {
  bands: EQBand[];
  onBandChange: (index: number, gain: number) => void;
  onReset: () => void;
}
const FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
export const TenBandEqualizer: React.FC<TenBandEqualizerProps> = ({
  bands,
  onBandChange,
  onReset
}) => {
  const formatFrequency = (freq: number) => {
    if (freq >= 1000) {
      return `${freq / 1000}kHz`;
    }
    return `${freq}Hz`;
  };
  return <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
          <span className="text-3xl">🎚️</span>
          Professional 10-Band Equalizer
        </h3>
        <Button variant="outline" size="sm" onClick={onReset} className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white hover:text-cyan-400 transition-all">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-10 gap-3 bg-slate-950/50 p-6 rounded-xl border border-slate-700/50 relative">
        {/* Professional DJ Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="eq-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="0.5"/>
              </pattern>
              <linearGradient id="freq-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(239, 68, 68, 0.2)" />
                <stop offset="50%" stopColor="rgba(34, 197, 94, 0.2)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.2)" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#eq-grid)" />
            <rect width="100%" height="100%" fill="url(#freq-gradient)" />
            {/* Center line at 0dB */}
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(6, 182, 212, 0.5)" strokeWidth="1.5" strokeDasharray="5,5"/>
            {/* +6dB line */}
            <line x1="0" y1="25%" x2="100%" y2="25%" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="1" strokeDasharray="3,3"/>
            {/* -6dB line */}
            <line x1="0" y1="75%" x2="100%" y2="75%" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="1" strokeDasharray="3,3"/>
          </svg>
        </div>
        
        {bands.map((band, index) => <div key={index} className="flex flex-col items-center gap-3 relative z-10">
            {/* Gain value display with gradient */}
            <div className={`text-xs font-mono font-bold px-3 py-2 rounded-lg min-w-[65px] text-center transition-all ${band.gain > 0 ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' : band.gain < 0 ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white' : 'bg-slate-800/70 text-slate-400'}`}>
              {band.gain >= 0 ? '+' : ''}{band.gain.toFixed(1)}dB
            </div>

            {/* Vertical slider with custom styling */}
            <div className="h-48 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-sm"></div>
              <Slider orientation="vertical" value={[band.gain]} min={-12} max={12} step={0.1} onValueChange={values => onBandChange(index, values[0])} className="h-full z-10" />
            </div>

            {/* Frequency label with gradient */}
            <div className="text-xs font-bold text-center w-full bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {formatFrequency(FREQUENCIES[index])}
            </div>
          </div>)}
      </div>

      {/* Real-time frequency response visualization */}
      <div className="mt-6 p-4 bg-slate-950/50 rounded-lg border border-slate-700/50">
        <div className="text-xs text-center text-slate-400 mb-2 bg-green-300">
          Frequency Response Curve
        </div>
        <div className="h-20 relative flex items-end justify-around">
          {bands.map((band, index) => {
          const height = Math.max(0, Math.min(100, 50 + band.gain / 12 * 40));
          return <div key={index} className="w-full mx-0.5 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-t transition-all duration-300" style={{
            height: `${height}%`
          }} />;
        })}
        </div>
      </div>
    </Card>;
};