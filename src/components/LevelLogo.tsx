import React from 'react';
import { BarChart3 } from 'lucide-react';
export const LevelLogo = () => {
  return <div className="flex items-center gap-3">
      <div className="relative">
        <BarChart3 className="h-8 w-8 text-cyan-400 animate-pulse rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-600/20 blur-xl -z-10 animate-pulse" />
      </div>
      <h1 style={{
      fontFamily: "'Orbitron', 'Exo 2', 'Rajdhani', 'Audiowide', monospace",
      textShadow: '0 0 30px rgba(6, 182, 212, 0.5), 0 0 60px rgba(59, 130, 246, 0.3)',
      letterSpacing: '0.1em'
    }} className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent tracking-wider relative text-5xl font-extrabold text-center">
        LEVEL
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-600/20 blur-xl -z-10 animate-pulse" />
      </h1>
    </div>;
};