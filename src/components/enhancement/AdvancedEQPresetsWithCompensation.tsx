import React, { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Music2, Mic, Guitar, Lightbulb, Volume2, Waves, Music, Disc3, MessageSquare, Headphones } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdvancedEQPresetsWithCompensationProps {
  onEQBandChange: (bandIndex: number, value: number) => void;
}

// Professional EQ Presets with Real dB Values (matching user specifications)
const EQ_PRESETS = [
  { 
    name: 'Modern Punch', 
    nameES: 'Golpe Moderno',
    icon: Volume2, 
    values: [1.5, 1.0, -2.0, 0.5, 2.0]
  },
  { 
    name: 'Vocal Presence', 
    nameES: 'Presencia Vocal',
    icon: Mic, 
    values: [-1.5, -2.0, 1.5, 2.0, 0.5]
  },
  { 
    name: 'Bass Foundation', 
    nameES: 'Base de Graves',
    icon: Waves, 
    values: [2.0, 1.0, -1.0, 0, -0.5]
  },
  { 
    name: 'Clarity & Air', 
    nameES: 'Claridad y Aire',
    icon: Lightbulb, 
    values: [-0.5, 0, -1.0, 1.5, 2.5]
  },
  { 
    name: 'De-Box / Clean Mid', 
    nameES: 'Des-caja / Medios Limpios',
    icon: Music, 
    values: [-1.0, -1.5, -2.5, 1.0, 0.5]
  },
  { 
    name: 'Warmth & Body', 
    nameES: 'Calidez y Cuerpo',
    icon: Guitar, 
    values: [0.5, 1.5, 1.0, -1.0, -1.5]
  },
  { 
    name: 'Live Energy (Subtle V)', 
    nameES: 'Energía en Vivo (V Sutil)',
    icon: Headphones, 
    values: [1.0, 0.5, -1.5, 0.5, 1.5]
  },
  { 
    name: 'Acoustic / Orchestral', 
    nameES: 'Acústica / Orquestal',
    icon: Music2, 
    values: [0.5, -1.0, 0, 0.5, 1.0]
  },
  { 
    name: 'Digital De-Harsh', 
    nameES: 'Suavizar Digital',
    icon: Disc3, 
    values: [0, 0, 0.5, -1.5, -1.0]
  },
  { 
    name: 'Voiceover / Podcast', 
    nameES: 'Locución / Podcast',
    icon: MessageSquare, 
    values: [-6.0, -2.5, 2.0, 2.5, -1.5]
  }
];

export const AdvancedEQPresetsWithCompensation = memo(({ 
  onEQBandChange 
}: AdvancedEQPresetsWithCompensationProps) => {
  const { t, language } = useLanguage();
  
  const applyPreset = useCallback((preset: typeof EQ_PRESETS[0]) => {
    // Apply preset values with staggered animation for smooth visual effect
    preset.values.forEach((value, index) => {
      setTimeout(() => {
        onEQBandChange(index, value);
      }, index * 40); // Stagger each slider update by 40ms
    });
  }, [onEQBandChange]);

  return (
    <div className="w-full">
      <div className="text-sm font-bold text-center mb-3 bg-gradient-to-r from-cyan-200 via-purple-200 to-pink-200 bg-clip-text text-transparent animate-pulse">
        {language === 'ES' ? '✨ Preajustes Profesionales ✨' : '✨ Professional Presets ✨'}
      </div>
      <div className="grid grid-cols-5 gap-3">
        {EQ_PRESETS.map((preset, index) => {
          const Icon = preset.icon;
          const displayName = language === 'ES' ? preset.nameES : preset.name;
          
          // Vibrant gradient colors for each preset
          const gradients = [
            'from-cyan-500 to-blue-600',
            'from-purple-500 to-pink-600',
            'from-orange-500 to-red-600',
            'from-green-500 to-emerald-600',
            'from-yellow-500 to-orange-600',
            'from-pink-500 to-rose-600',
            'from-indigo-500 to-purple-600',
            'from-teal-500 to-cyan-600',
            'from-fuchsia-500 to-pink-600',
            'from-lime-500 to-green-600'
          ];
          const gradient = gradients[index % gradients.length];
          
          return (
            <Button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={`
                relative flex flex-col items-center gap-2 h-auto py-4 
                bg-gradient-to-br ${gradient}
                hover:scale-110 active:scale-95
                border-2 border-white/30 hover:border-white/60
                shadow-lg hover:shadow-2xl
                transition-all duration-300
                animate-pulse hover:animate-none
                group
              `}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-white/20 rounded-md opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />
              
              <Icon className="h-6 w-6 text-white drop-shadow-lg group-hover:scale-125 transition-transform" />
              <span className="text-xs font-bold text-white drop-shadow-md text-center leading-tight">
                {displayName}
              </span>
            </Button>
          );
        })}
      </div>
      <p className="text-[10px] text-purple-300 mt-2 italic text-center">
        {language === 'ES' 
          ? '⚡ Mueve los sliders en tiempo real' 
          : '⚡ Moves sliders in real-time'}
      </p>
    </div>
  );
});

AdvancedEQPresetsWithCompensation.displayName = 'AdvancedEQPresetsWithCompensation';
