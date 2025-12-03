import React, { memo, useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RotateCcw, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AdvancedEQPresetsWithCompensation } from "./AdvancedEQPresetsWithCompensation";
import { AdjustableFrequencyBand } from "./AdjustableFrequencyBand";
interface FiveBandEqualizerProps {
  eqBands: number[];
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}
export const FiveBandEqualizer = memo(
  ({
    eqBands,
    onEQBandChange,
    onResetEQ,
    enabled,
    onEnabledChange,
  }: FiveBandEqualizerProps) => {
    const { t, language } = useLanguage();

    // State for adjustable frequencies
    const [frequencies, setFrequencies] = useState([50, 145, 874, 5560, 17200]);

    // Frequency ranges for each band
    const frequencyRanges = [
      {
        min: 20,
        max: 85,
      },
      // Low / Sub
      {
        min: 85,
        max: 356,
      },
      // Mid Low / Punch
      {
        min: 356,
        max: 2200,
      },
      // Mid
      {
        min: 2200,
        max: 9800,
      },
      // Mid High / Presence
      {
        min: 9800,
        max: 20000,
      }, // High / Air
    ];
    const bandLabels =
      language === "ES"
        ? [
          "Graves / Sub",
          "Medio-Grave / Punch",
          "Medio",
          "Medio-Agudo / Presencia",
          "Agudos / Air",
        ]
        : [
          "Low / Sub",
          "Mid Low / Punch",
          "Mid",
          "Mid High / Presence",
          "High / Air",
        ];
    const getEQColor = (index: number) => {
      const colors = [
        "#ff1744",
        // Red for Bass
        "#ff6d00",
        // Orange for Low Mid
        "#ffc400",
        // Yellow for Mid
        "#3d5afe",
        // Blue for High Mid
        "#651fff", // Purple for Treble
      ];
      return colors[index];
    };
    const getTickMarks = () => {
      const marks = [];
      for (let i = -12; i <= 12; i += 3) {
        marks.push(i);
      }
      return marks;
    };
    const handleFrequencyChange = (bandIndex: number, newFrequency: number) => {
      const newFrequencies = [...frequencies];
      newFrequencies[bandIndex] = newFrequency;
      setFrequencies(newFrequencies);
    };
    const handleReset = () => {
      setFrequencies([50, 145, 874, 5560, 17200]);
      onResetEQ();
    };

    // Map 5 bands to the 8-band array (after removing 32Hz and 16000Hz)
    const bandIndices = [0, 1, 3, 5, 7]; // 64Hz, 125Hz, 500Hz, 2kHz, 8kHz
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="pb-3 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEnabledChange(!enabled)}
                className={`w-8 h-8 p-0 transition-all duration-300 ${enabled
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                  : "bg-slate-800 border-slate-700 hover:bg-slate-700"
                  }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${enabled ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "bg-slate-500"
                    }`}
                ></div>
              </Button>
              <CardTitle className="text-base text-slate-200 mx-[4px] my-[6px] py-0 px-px font-bold">
                {language === "ES" ? "Ecualizador" : "Equalizer"}
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-slate-500 hover:text-cyan-400 cursor-help transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm bg-slate-900 border-slate-700 text-slate-300 p-4 shadow-xl">
                    <p className="text-sm">
                      {language === "ES"
                        ? "El rango predeterminado ha seleccionado frecuencias que son psicoacústicamente agradables para el oído humano, resaltando naturalmente los tonos más embellecedores en el audio."
                        : "The default range has selected frequencies that are psychoacoustically pleasing to the human ear, naturally highlighting the most embellishing tones in the audio."}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-7 text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 bg-slate-950/30">
          {enabled ? (
            <div className="relative space-y-4">
              {/* Professional Presets Section */}
              <div className="mb-4">
                <AdvancedEQPresetsWithCompensation
                  onEQBandChange={onEQBandChange}
                />
              </div>

              {/* 5-Band EQ - Professional & Colorful */}
              <div className="relative bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-inner">
                {/* EQ Background Grid */}
                <div className="absolute left-6 right-6 top-6 bottom-6 bg-slate-950/50 rounded-lg border border-slate-800/50">
                  {/* Horizontal grid lines with glow */}
                  {getTickMarks().map((mark) => (
                    <div
                      key={mark}
                      className="absolute left-0 right-0 border-t border-slate-800"
                      style={{
                        top: `${((12 - mark) / 24) * 100}%`,
                      }}
                    />
                  ))}
                </div>

                <div className="flex justify-center items-end gap-4 sm:gap-6 py-4 relative z-10">
                  {bandIndices.map((bandIndex, visualIndex) => (
                    <AdjustableFrequencyBand
                      key={bandIndex}
                      bandLabel={bandLabels[visualIndex]}
                      frequency={frequencies[visualIndex]}
                      value={eqBands[bandIndex] || 0}
                      minFreq={frequencyRanges[visualIndex].min}
                      maxFreq={frequencyRanges[visualIndex].max}
                      color={getEQColor(visualIndex)}
                      onFrequencyChange={(freq) =>
                        handleFrequencyChange(visualIndex, freq)
                      }
                      onValueChange={(value) =>
                        onEQBandChange(bandIndex, value)
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
              <div className="text-4xl mb-3 opacity-50 grayscale">🎚️</div>
              <p className="text-slate-500 text-sm font-medium">
                Enable Audio EQ to access the equalizer
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
FiveBandEqualizer.displayName = "FiveBandEqualizer";
