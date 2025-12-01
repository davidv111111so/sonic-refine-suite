import React from 'react';
import { BarChart3 } from 'lucide-react';

interface LevelLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showIcon?: boolean;
}

export const LevelLogo = ({ className = "", size = "xl", showIcon = true }: LevelLogoProps) => {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-4xl",
    xl: "text-5xl"
  };

  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-7 w-7",
    xl: "h-8 w-8"
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showIcon && (
        <div className="relative">
          <BarChart3 className={`${iconSizes[size]} text-cyan-400 animate-pulse rounded-full`} />
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-600/20 blur-xl -z-10 animate-pulse" />
        </div>
      )}
      <h1
        style={{
          fontFamily: "'Orbitron', 'Exo 2', 'Rajdhani', 'Audiowide', monospace",
          textShadow: '0 0 30px rgba(6, 182, 212, 0.5), 0 0 60px rgba(59, 130, 246, 0.3)',
          letterSpacing: '0.1em'
        }}
        className={`bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent tracking-wider relative font-extrabold text-center ${sizeClasses[size]}`}
      >
        LEVEL
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-600/20 blur-xl -z-10 animate-pulse" />
      </h1>
    </div>
  );
};