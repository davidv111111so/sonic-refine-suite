
import React, { useState, useEffect, useRef } from 'react';
import { AudioWaveform } from 'lucide-react';

export const AnimatedTitle = () => {
  const [eqAnimation, setEqAnimation] = useState(Array(12).fill(0));
  const animationFrameRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const animateEQ = () => {
      setEqAnimation(prev => 
        prev.map(() => Math.random() * 100)
      );
      animationFrameRef.current = setTimeout(animateEQ, 150);
    };
    animateEQ();
    
    return () => {
      if (animationFrameRef.current) {
        clearTimeout(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <h1 className="text-5xl font-bold text-white flex items-center gap-4">
        <div className="relative">
          <AudioWaveform className="h-12 w-12 text-blue-400 animate-pulse" />
          <div className="absolute inset-0 h-12 w-12 bg-blue-400/20 rounded-full animate-ping"></div>
          <div className="absolute inset-0 h-12 w-12 bg-purple-400/10 rounded-full animate-pulse delay-300"></div>
        </div>
        <div className="flex items-center gap-1">
          {"PERFECT AUDIO".split('').map((letter, index) => (
            <div key={index} className="relative inline-block">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-lg relative z-10">
                {letter === ' ' ? '\u00A0' : letter}
              </span>
              {letter !== ' ' && (
                <div className="absolute inset-0 flex items-end justify-center opacity-30 pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-blue-500 to-purple-500 mx-px rounded-full transition-all duration-150"
                      style={{
                        height: `${Math.max(10, eqAnimation[index * 3 + i] || 0)}%`,
                        animationDelay: `${i * 50}ms`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </h1>
      <p className="text-slate-300 text-base ml-16 mt-2 font-medium">Professional audio enhancement in your browser</p>
      <div className="absolute -top-3 -left-3 w-16 h-16 bg-gradient-to-r from-blue-500/15 to-purple-500/15 rounded-full blur-2xl"></div>
      <div className="absolute -top-1 -right-1 w-12 h-12 bg-gradient-to-l from-purple-500/10 to-blue-500/10 rounded-full blur-xl"></div>
    </div>
  );
};
