import React, { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Music2, Mic, Guitar, Lightbulb, Volume2, Waves, Music, Disc3, MessageSquare, Headphones } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
interface AdvancedEQPresetsWithCompensationProps {
  onEQBandChange: (bandIndex: number, value: number) => void;
}

// Professional EQ Presets with Real dB Values
// Band frequencies: 60Hz, 250Hz, 1kHz, 4kHz, 12kHz
const EQ_PRESETS = [{
  name: 'Modern Punch',
  nameES: 'Modern Punch',
  icon: Volume2,
  values: [3.0, 1.5, -2.0, 0.5, 2.5] // Powerful sub-bass, scooped mids, bright top
}, {
  name: 'Vocal Presence',
  nameES: 'Presencia Vocal',
  icon: Mic,
  values: [-4.0, -1.5, 2.5, 2.0, -1.0] // Cut low rumble, boost presence
}, {
  name: 'Bass Foundation',
  nameES: 'Fundamento de Graves',
  icon: Music,
  values: [2.5, 0.5, -1.5, 1.0, 2.0] // Warm bass, clean mids, smooth highs
}, {
  name: 'Clarity & Air',
  nameES: 'Claridad y Aire',
  icon: Waves,
  values: [1.5, -0.5, 0.5, 2.0, 3.0] // Balanced low, open highs for pads
}, {
  name: 'De-Box / Clean Mid',
  nameES: 'De-Box / Medio Limpio',
  icon: Disc3,
  values: [4.0, 2.0, -1.0, 1.5, 2.5] // Massive sub-bass, punch, crisp
}, {
  name: 'Warmth & Body',
  nameES: 'Calidez y Cuerpo',
  icon: Music2,
  values: [3.5, 1.0, -2.0, 0.5, 1.5] // Heavy bass, scooped mids, smooth top
}, {
  name: 'Live Energy (Subtle V)',
  nameES: 'Energía en Vivo (V Sutil)',
  icon: Guitar,
  values: [2.0, 1.5, 2.0, 1.5, 0.5] // Tight bass, aggressive mids, controlled high
}, {
  name: 'Acoustic / Orchestral',
  nameES: 'Acústica / Orquestal',
  icon: Headphones,
  values: [0.5, 0.0, 0.5, 1.0, 1.5] // Natural, slight air boost
}, {
  name: 'Digital De-Harsh',
  nameES: 'Digital De-Harsh',
  icon: Lightbulb,
  values: [1.5, 0.5, -0.5, 2.0, 2.5] // Balanced with bright top
}, {
  name: 'Voiceover / Podcast',
  nameES: 'Locución / Podcast',
  icon: MessageSquare,
  values: [4.0, 2.0, -1.5, 0.0, 0.5] // Maximum low-end enhancement
}];
export const AdvancedEQPresetsWithCompensation = memo(({
  onEQBandChange
}: AdvancedEQPresetsWithCompensationProps) => {
  const {
    t,
    language
  } = useLanguage();

  // Map visual bands to actual band indices in 10-band array
  const bandIndices = [0, 2, 4, 7, 9];
  const applyPreset = useCallback((preset: typeof EQ_PRESETS[0]) => {
    // Apply preset values with staggered animation for smooth visual effect
    // Use correct band indices to match FiveBandEqualizer mapping
    preset.values.forEach((value, visualIndex) => {
      setTimeout(() => {
        const actualBandIndex = bandIndices[visualIndex];
        onEQBandChange(actualBandIndex, value);
      }, visualIndex * 40); // Stagger each slider update by 40ms
    });
  }, [onEQBandChange]);
  return <div className="w-full">
      <div className="text-sm font-bold text-center mb-3 bg-gradient-to-r from-cyan-200 via-purple-200 to-pink-200 bg-clip-text text-transparent mx-0 my-0 bg-blue-600">
        {language === 'ES' ? '✨ Preajustes Profesionales ✨' : '✨ Professional Presets ✨'}
      </div>
      <div className="grid grid-cols-5 gap-3">
        {EQ_PRESETS.map((preset, index) => {
        const Icon = preset.icon;
        const displayName = language === 'ES' ? preset.nameES : preset.name;

        // Vibrant gradient colors for each preset
        const gradients = ['from-cyan-500 to-blue-600', 'from-purple-500 to-pink-600', 'from-orange-500 to-red-600', 'from-green-500 to-emerald-600', 'from-yellow-500 to-orange-600', 'from-pink-500 to-rose-600', 'from-indigo-500 to-purple-600', 'from-teal-500 to-cyan-600', 'from-fuchsia-500 to-pink-600', 'from-lime-500 to-green-600'];
        const gradient = gradients[index % gradients.length];
        return <Button key={preset.name} onClick={() => applyPreset(preset)} className={`
                relative flex flex-col items-center gap-2 h-auto py-4 
                bg-gradient-to-br ${gradient}
                hover:scale-110 active:scale-95
                border-2 border-white/30 hover:border-white/60
                shadow-lg hover:shadow-2xl
                transition-all duration-300
                group
              `}>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-white/20 rounded-md opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />
              
              <Icon className="h-6 w-6 text-white drop-shadow-lg group-hover:scale-125 transition-transform" />
              <span className="text-xs font-bold text-white drop-shadow-md text-center leading-tight">
                {displayName}
              </span>
            </Button>;
      })}
      </div>
      <p className="text-[10px] text-purple-300 mt-2 italic text-center">
        {language === 'ES' ? '⚡ Mueve los sliders en tiempo real' : '⚡ Moves sliders in real-time'}
      </p>
    </div>;
});
AdvancedEQPresetsWithCompensation.displayName = 'AdvancedEQPresetsWithCompensation';