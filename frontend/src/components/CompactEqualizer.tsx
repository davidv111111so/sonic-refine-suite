import React from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface CompactEqualizerProps {
  eqBands: number[];
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
  enabled: boolean;
}

export const CompactEqualizer = ({
  eqBands,
  onEQBandChange,
  onResetEQ,
  enabled,
}: CompactEqualizerProps) => {
  const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

  const getEQColor = (index: number, value: number) => {
    const colors = [
      "#ff1744",
      "#ff6d00",
      "#ffc400",
      "#76ff03",
      "#00e676",
      "#00e5ff",
      "#3d5afe",
      "#651fff",
      "#e91e63",
      "#ff3d00",
    ];
    return colors[index];
  };

  const getSliderBackground = (index: number, value: number) => {
    const color = getEQColor(index, value);
    const intensity = Math.abs(value) / 12;
    const opacity = 0.3 + intensity * 0.7;

    return {
      background: `linear-gradient(180deg, 
        ${color}${Math.floor(opacity * 255)
          .toString(16)
          .padStart(2, "0")} 0%, 
        ${color}40 50%, 
        transparent 100%)`,
      boxShadow:
        value !== 0 ? `0 0 20px ${color}60, inset 0 0 10px ${color}20` : "none",
      borderRadius: "8px",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      border: `1px solid ${color}40`,
    };
  };

  if (!enabled) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-6 border-2 border-slate-600 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-wide">
          Perfect Audio 10-Band EQ
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetEQ}
          className="h-8 text-xs bg-slate-800 border-slate-500 hover:bg-slate-700 text-white font-medium px-4 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25"
        >
          Reset
        </Button>
      </div>

      <div className="relative">
        {/* Futuristic EQ with neon sliders */}
        <div className="flex justify-center items-end gap-4 py-4 px-4 border-2 border-slate-600 rounded-xl bg-gradient-to-t from-slate-800/60 to-slate-700/30 backdrop-blur-md shadow-inner">
          {eqFrequencies.map((freq, index) => (
            <div key={freq} className="flex flex-col items-center group">
              <div className="h-24 flex items-end justify-center mb-3 relative">
                <div
                  className="absolute inset-x-0 bottom-0 rounded-t-lg transition-all duration-500 ease-out"
                  style={getSliderBackground(index, eqBands[index])}
                />
                <div className="relative z-10">
                  <Slider
                    orientation="vertical"
                    value={[eqBands[index]]}
                    onValueChange={([value]) => onEQBandChange(index, value)}
                    min={-12}
                    max={12}
                    step={0.5}
                    className="h-20 w-6 group-hover:scale-110 transition-all duration-300"
                    style={
                      {
                        "--slider-track": getEQColor(index, eqBands[index]),
                        "--slider-range": getEQColor(index, eqBands[index]),
                        "--slider-thumb": "#ffffff",
                      } as React.CSSProperties
                    }
                  />
                </div>
              </div>

              <div className="text-xs text-center mb-2 font-bold tracking-wider bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {freq < 1000 ? `${freq}Hz` : `${freq / 1000}k`}
              </div>

              <div
                className="text-xs text-center min-w-10 font-mono bg-slate-900/90 rounded-full px-2 py-1 border-2 transition-all duration-300 shadow-lg"
                style={{
                  color:
                    eqBands[index] !== 0
                      ? getEQColor(index, eqBands[index])
                      : "#94a3b8",
                  borderColor:
                    eqBands[index] !== 0
                      ? getEQColor(index, eqBands[index]) + "60"
                      : "#475569",
                  boxShadow:
                    eqBands[index] !== 0
                      ? `0 0 15px ${getEQColor(index, eqBands[index])}40`
                      : "none",
                }}
              >
                {eqBands[index] > 0 ? "+" : ""}
                {eqBands[index]}dB
              </div>
            </div>
          ))}
        </div>

        {/* Futuristic glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-xl pointer-events-none animate-pulse"></div>
      </div>
    </div>
  );
};
