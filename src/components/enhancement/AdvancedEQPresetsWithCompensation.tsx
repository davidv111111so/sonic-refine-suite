import React, { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Music2,
  Mic,
  Guitar,
  Lightbulb,
  Volume2,
  Waves,
  Music,
  Disc3,
  MessageSquare,
  Headphones,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
interface AdvancedEQPresetsWithCompensationProps {
  onEQBandChange: (bandIndex: number, value: number) => void;
}

// Professional EQ Presets with Real dB Values
// Band frequencies: 60Hz, 250Hz, 1kHz, 4kHz, 12kHz
const EQ_PRESETS = [
  {
    name: "Modern Punch",
    nameES: "Modern Punch",
    desc: "Increases low-end punch and high-end clarity.",
    descES: "Aumenta la fuerza de graves y claridad de agudos.",
    icon: Volume2,
    values: [1.5, 1.0, -2.0, 0.5, 2.0],
  },
  {
    name: "Vocal Presence",
    nameES: "Presencia Vocal",
    desc: "Boosts vocal frequencies for better intelligibility.",
    descES: "Destaca las frecuencias vocales para mayor inteligibilidad.",
    icon: Mic,
    values: [-1.5, -2.0, 1.5, 2.0, 0.5],
  },
  {
    name: "Bass Foundation",
    nameES: "Fundamento de Graves",
    desc: "Enhances deep bass and sub frequencies.",
    descES: "Mejora los graves profundos y subfrecuencias.",
    icon: Music,
    values: [2.0, 1.0, -1.0, 0.0, -0.5],
  },
  {
    name: "Clarity & Air",
    nameES: "Claridad y Aire",
    desc: "Adds high-end shimmer and openness.",
    descES: "Añade brillo y apertura en las frecuencias altas.",
    icon: Waves,
    values: [-0.5, 0.0, -1.0, 1.5, 2.5],
  },
  {
    name: "De-Box / Clean Mid",
    nameES: "De-Box / Medio Limpio",
    desc: "Removes muddy and boxy mid frequencies.",
    descES: "Elimina las frecuencias medias fangosas y opacas.",
    icon: Disc3,
    values: [-1.0, -1.5, -2.5, 1.0, 0.5],
  },
  {
    name: "Warmth & Body",
    nameES: "Calidez y Cuerpo",
    desc: "Adds fullness and warmth to thin tracks.",
    descES: "Agrega plenitud y calidez a pistas delgadas.",
    icon: Music2,
    values: [0.5, 1.5, 1.0, -1.0, -1.5],
  },
  {
    name: "Live Energy (Subtle V)",
    nameES: "Energía en Vivo (V Sutil)",
    desc: "A slight V-curve for energetic, live-sounding mixes.",
    descES: "Una ligera curva en V para mezclas con sonido en vivo.",
    icon: Guitar,
    values: [1.0, 0.5, -1.5, 0.5, 1.5],
  },
  {
    name: "Acoustic / Orchestral",
    nameES: "Acústica / Orquestal",
    desc: "Balanced EQ tailored for acoustic instruments.",
    descES: "Ecualización equilibrada para instrumentos acústicos.",
    icon: Headphones,
    values: [0.5, -1.0, 0.0, 0.5, 1.0],
  },
  {
    name: "Digital De-Harsh",
    nameES: "Digital De-Harsh",
    desc: "Tames harsh upper-mid digital glare.",
    descES: "Suaviza el brillo digital áspero en medios altos.",
    icon: Lightbulb,
    values: [0.0, 0.0, 0.5, -1.5, -1.0],
  },
  {
    name: "Voiceover / Podcast",
    nameES: "Locución / Podcast",
    desc: "Optimized for speech intelligibility and podcasting.",
    descES: "Optimizado para inteligibilidad de voz y podcasts.",
    icon: MessageSquare,
    values: [-6.0, -2.5, 2.0, 2.5, -1.5],
  },
];

// Map 5 visual bands to all 8 bands in the EQ array (now 8 bands after removing 32Hz and 16000Hz)
// Interpolate values for smooth transitions across all bands
const BAND_INDICES = [0, 1, 2, 3, 4, 5, 6, 7]; // All 8 bands: 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz
const VISUAL_BAND_INDICES = [0, 1, 2, 3, 4]; // 5 visual bands from preset

export const AdvancedEQPresetsWithCompensation = memo(
  ({ onEQBandChange }: AdvancedEQPresetsWithCompensationProps) => {
    const { t, language } = useLanguage();

    const applyPreset = useCallback(
      (preset: (typeof EQ_PRESETS)[0]) => {
        // Map 5 preset values to the 8-band array directly
        // Visual bands: 0, 1, 3, 5, 7
        // Preset values: [v0, v1, v2, v3, v4]

        const values = preset.values;

        // Band 0 (Low) -> Value 0
        onEQBandChange(0, values[0]);

        // Band 1 (Mid Low) -> Value 1
        onEQBandChange(1, values[1]);

        // Band 2 (Gap) -> Average of Value 1 and 2
        onEQBandChange(2, (values[1] + values[2]) / 2);

        // Band 3 (Mid) -> Value 2
        onEQBandChange(3, values[2]);

        // Band 4 (Gap) -> Average of Value 2 and 3
        onEQBandChange(4, (values[2] + values[3]) / 2);

        // Band 5 (Mid High) -> Value 3
        onEQBandChange(5, values[3]);

        // Band 6 (Gap) -> Average of Value 3 and 4
        onEQBandChange(6, (values[3] + values[4]) / 2);

        // Band 7 (High) -> Value 4
        onEQBandChange(7, values[4]);
      },
      [onEQBandChange]
    );
    return (
      <div className="w-full">
        <div className="text-sm font-bold text-center mb-3 bg-gradient-to-r from-cyan-200 via-purple-200 to-pink-200 bg-clip-text text-transparent mx-0 my-0 bg-blue-600">
          {language === "ES"
            ? "✨ Preajustes Profesionales ✨"
            : "✨ Professional Presets ✨"}
        </div>
        <div className="grid grid-cols-5 gap-3">
          {EQ_PRESETS.map((preset, index) => {
            const Icon = preset.icon;
            const displayName = language === "ES" ? preset.nameES : preset.name;

            // Vibrant gradient colors for each preset
            const gradients = [
              "from-cyan-500 to-blue-600",
              "from-purple-500 to-pink-600",
              "from-orange-500 to-red-600",
              "from-green-500 to-emerald-600",
              "from-yellow-500 to-orange-600",
              "from-pink-500 to-rose-600",
              "from-indigo-500 to-purple-600",
              "from-teal-500 to-cyan-600",
              "from-fuchsia-500 to-pink-600",
              "from-lime-500 to-green-600",
            ];
            const gradient = gradients[index % gradients.length];
            return (
              <TooltipProvider key={preset.name} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => applyPreset(preset)}
                      className={`
                      relative flex flex-col items-center gap-1.5 h-auto py-2 px-1
                      bg-slate-900/40 backdrop-blur-xl border border-white/5
                      hover:bg-slate-800/60 hover:border-cyan-500/30 hover:scale-105 active:scale-95
                      shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(34,211,238,0.15)]
                      transition-all duration-500 rounded-xl
                      group
                      min-h-[60px]
                      overflow-hidden
                    `}
                    >
                      {/* Smooth animated glow background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-20 transition-opacity duration-500 -z-10`} />
                      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 -z-10" />

                      <Icon className="h-4 w-4 text-slate-300 group-hover:text-cyan-400 transition-colors duration-300" />
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors duration-300 text-center leading-tight line-clamp-2">
                        {displayName}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs bg-slate-900 border-slate-700 max-w-[200px] text-center">
                    <p>{language === "ES" ? preset.descES : preset.desc}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        <p className="text-[10px] text-purple-300 mt-2 italic text-center">
          {language === "ES"
            ? "⚡ Mueve los sliders en tiempo real"
            : "⚡ Moves sliders in real-time"}
        </p>
      </div>
    );
  }
);
AdvancedEQPresetsWithCompensation.displayName =
  "AdvancedEQPresetsWithCompensation";
