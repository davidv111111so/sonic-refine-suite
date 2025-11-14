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
const FREQUENCIES = [64, 125, 250, 500, 1000, 2000, 4000, 8000]; // Removed 32Hz and 16000Hz as they don't affect audio
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
          Professional Equalizer
        </h3>
        <Button variant="outline" size="sm" onClick={onReset} className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white hover:text-cyan-400 transition-all">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-8 gap-3 bg-slate-950/50 p-6 rounded-xl border border-slate-700/50 relative overflow-hidden">
        {/* Professional DJ Grid Background */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gridGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#06b6d4', stopOpacity: 0.4}} />
              <stop offset="50%" style={{stopColor: '#8b5cf6', stopOpacity: 0.3}} />
              <stop offset="100%" style={{stopColor: '#ec4899', stopOpacity: 0.4}} />
            </linearGradient>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="url(#gridGradient)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Frequency Zone Indicators */}
          <line x1="10%" y1="0" x2="10%" y2="100%" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
          <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
          <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#d946ef" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
          <line x1="90%" y1="0" x2="90%" y2="100%" stroke="#ec4899" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
          
          {/* Horizontal level lines */}
          <line x1="0" y1="25%" x2="100%" y2="25%" stroke="url(#gridGradient)" strokeWidth="0.5" opacity="0.2" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="url(#gridGradient)" strokeWidth="1" opacity="0.3" />
          <line x1="0" y1="75%" x2="100%" y2="75%" stroke="url(#gridGradient)" strokeWidth="0.5" opacity="0.2" />
          
          {/* Zone labels */}
          <text x="5%" y="95%" fill="#06b6d4" fontSize="8" opacity="0.5">SUB</text>
          <text x="20%" y="95%" fill="#8b5cf6" fontSize="8" opacity="0.5">BASS</text>
          <text x="40%" y="95%" fill="#a855f7" fontSize="8" opacity="0.5">MID</text>
          <text x="65%" y="95%" fill="#d946ef" fontSize="8" opacity="0.5">HIGH</text>
          <text x="85%" y="95%" fill="#ec4899" fontSize="8" opacity="0.5">AIR</text>
        </svg>
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

      <div className="mt-6 p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 animate-pulse"></div>
        
        <div className="h-20 relative flex items-end justify-around z-10">
          {bands.map((band, index) => {
          const height = Math.max(0, Math.min(100, 50 + band.gain / 12 * 40));
          const color = index < 2 ? 'from-cyan-500 to-cyan-400' : 
                        index < 5 ? 'from-purple-500 to-purple-400' : 
                        index < 8 ? 'from-pink-500 to-pink-400' : 
                        'from-red-500 to-red-400';
          return <div key={index} className={`w-full mx-0.5 bg-gradient-to-t ${color} rounded-t transition-all duration-300 shadow-lg`} style={{
            height: `${height}%`,
            boxShadow: `0 0 10px ${index < 2 ? '#06b6d4' : index < 5 ? '#8b5cf6' : index < 8 ? '#ec4899' : '#ef4444'}40`
          }} />;
        })}
        </div>
      </div>
    </Card>;
};