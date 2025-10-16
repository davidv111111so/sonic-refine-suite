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
    // Apply the EQ values to the bands immediately for real-time visual feedback
    preset.values.forEach((value, index) => {
      onEQBandChange(index, value);
    });
  }, [onEQBandChange]);

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 dark:from-purple-950/60 dark:to-blue-950/60 rounded-lg p-3 border border-purple-700/50 dark:border-purple-800/70">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-purple-300 dark:text-purple-200 tracking-wide">
          {language === 'ES' ? 'Preajustes Profesionales' : 'Professional Presets'}
        </h4>
        <span className="text-[10px] text-purple-400/70 dark:text-purple-300/60">
          {language === 'ES' ? '10 Preajustes' : '10 Presets'}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {EQ_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const displayName = language === 'ES' ? preset.nameES : preset.name;
          return (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
              className="bg-slate-800/90 dark:bg-black/80 border-slate-600 dark:border-slate-700 hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 hover:border-purple-500 text-white h-auto py-1.5 px-1.5 flex flex-col items-center gap-0.5 transition-all duration-300"
              title={displayName}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-[8px] leading-tight text-center">
                {displayName}
              </span>
            </Button>
          );
        })}
      </div>
      <p className="text-[9px] text-purple-300/60 mt-2 italic">
        {language === 'ES' 
          ? 'Los valores se aplican instantáneamente a los controles deslizantes del ecualizador' 
          : 'Values apply instantly to the equalizer sliders'}
      </p>
    </div>
  );
});

AdvancedEQPresetsWithCompensation.displayName = 'AdvancedEQPresetsWithCompensation';
