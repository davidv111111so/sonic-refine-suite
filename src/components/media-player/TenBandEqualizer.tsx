import React, { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw, Save, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface EQBand {
  frequency: number;
  gain: number;
}

interface TenBandEqualizerProps {
  bands: EQBand[];
  onBandChange: (index: number, gain: number) => void;
  onReset: () => void;
}

const FREQUENCIES = [64, 125, 250, 500, 1000, 2000, 4000, 8000];

const PRESETS = {
  "Flat": [0, 0, 0, 0, 0, 0, 0, 0],
  "Bass Boost": [5, 4, 3, 1, 0, 0, 0, 0],
  "Treble Boost": [0, 0, 0, 0, 1, 3, 4, 5],
  "Vocal": [-2, -1, 0, 3, 4, 3, 1, 0],
  "Rock": [3, 2, -1, -2, -1, 1, 3, 4],
  "Pop": [2, 1, 2, 1, 0, -1, 2, 3],
  "Jazz": [2, 1, 0, 2, 2, 1, 0, 1],
  "Classical": [3, 2, 1, 1, 1, 1, 2, 3],
};

export const TenBandEqualizer: React.FC<TenBandEqualizerProps> = ({
  bands,
  onBandChange,
  onReset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPreset, setSelectedPreset] = useState("Flat");

  const formatFrequency = (freq: number) => {
    if (freq >= 1000) {
      return `${freq / 1000}k`;
    }
    return `${freq}`;
  };

  // Draw frequency response curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Horizontal center line (0dB)
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    // Vertical lines for bands
    const bandWidth = width / (bands.length - 1);
    bands.forEach((_, i) => {
      const x = i * bandWidth;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    });
    ctx.stroke();

    // Draw curve
    ctx.strokeStyle = "#06b6d4"; // Cyan
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "#06b6d4";
    ctx.shadowBlur = 10;

    ctx.beginPath();

    // Map gains to Y coordinates
    // Gain range is -12 to +12. Canvas height maps to this range.
    // 0dB is at height/2.
    // +12dB is at 0 (top).
    // -12dB is at height (bottom).
    const getY = (gain: number) => {
      const normalizedGain = Math.max(-12, Math.min(12, gain)); // Clamp
      const percent = (normalizedGain + 12) / 24; // 0 to 1
      return height - (percent * height);
    };

    // Draw smooth curve using Catmull-Rom spline or simple cubic bezier
    // For simplicity, we'll use simple line segments first, then smooth it
    // Actually, let's use quadratic curves for smoothing
    if (bands.length > 0) {
      ctx.moveTo(0, getY(bands[0].gain));

      for (let i = 0; i < bands.length - 1; i++) {
        const x1 = i * bandWidth;
        const y1 = getY(bands[i].gain);
        const x2 = (i + 1) * bandWidth;
        const y2 = getY(bands[i + 1].gain);

        // Control points for smoothing
        const xc = (x1 + x2) / 2;
        const yc = (y1 + y2) / 2;

        // First point is special
        if (i === 0) {
          ctx.lineTo(xc, yc);
        } else {
          ctx.quadraticCurveTo(x1, y1, xc, yc);
        }
      }
      // Last point
      const lastIdx = bands.length - 1;
      ctx.lineTo(lastIdx * bandWidth, getY(bands[lastIdx].gain));
    }

    ctx.stroke();

    // Fill area under curve
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(6, 182, 212, 0.2)");
    gradient.addColorStop(1, "rgba(6, 182, 212, 0.0)");
    ctx.fillStyle = gradient;
    ctx.fill();

  }, [bands]);

  const applyPreset = (name: string, values: number[]) => {
    setSelectedPreset(name);
    values.forEach((gain, index) => {
      if (index < bands.length) {
        onBandChange(index, gain);
      }
    });
  };

  return (
    <TooltipProvider>
      <Card className="bg-slate-950 border-slate-800 p-6 shadow-2xl relative overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <span className="text-cyan-500">EQ</span>
              <span className="text-slate-600">|</span>
              <span className="text-sm font-medium text-slate-400">MASTERING GRADE</span>
            </h3>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs bg-slate-900 border-slate-700 text-slate-300 hover:text-white">
                      {selectedPreset} <ChevronDown className="ml-2 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                  <p>Select EQ Preset</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent className="bg-slate-900 border-slate-700">
                {Object.entries(PRESETS).map(([name, values]) => (
                  <DropdownMenuItem
                    key={name}
                    onClick={() => applyPreset(name, values)}
                    className="text-slate-300 focus:bg-slate-800 focus:text-white cursor-pointer"
                  >
                    {name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onReset();
                  setSelectedPreset("Flat");
                }}
                className="text-xs text-slate-500 hover:text-cyan-400 hover:bg-transparent"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                RESET
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
              <p>Reset to Flat EQ</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Visualization Canvas */}
        <div className="h-24 w-full mb-6 bg-slate-900/50 rounded-lg border border-slate-800/50 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={100}
            className="w-full h-full"
          />
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-8 gap-2 relative z-10">
          {bands.map((band, index) => (
            <div key={index} className="flex flex-col items-center gap-3 group">
              {/* Gain Value */}
              <div className={`
              text-[10px] font-mono font-medium px-1.5 py-0.5 rounded
              ${band.gain !== 0 ? 'text-cyan-400 bg-cyan-950/30' : 'text-slate-500'}
            `}>
                {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)}
              </div>

              {/* Slider Track */}
              <div className="h-40 relative w-full flex justify-center">
                {/* Center Line */}
                <div className="absolute top-0 bottom-0 w-px bg-slate-800 z-0"></div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="h-full z-10 block w-full flex justify-center cursor-ns-resize">
                      {/* Wrapped Slider in a span to attach tooltip, keeping slider functional */}
                      <Slider
                        orientation="vertical"
                        value={[band.gain]}
                        min={-12}
                        max={12}
                        step={0.1}
                        onValueChange={(values) => {
                          onBandChange(index, values[0]);
                          if (selectedPreset !== "Custom") setSelectedPreset("Custom");
                        }}
                        className="h-full [&>.relative>.absolute]:bg-slate-700 [&>.relative>.bg-primary]:bg-cyan-500 [&_span]:border-cyan-400 [&_span]:bg-slate-950 [&_span]:ring-offset-slate-950"
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs">
                    <p>Adjust {formatFrequency(FREQUENCIES[index] || band.frequency)}Hz ({band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)}dB)</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Frequency Label */}
              <div className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 transition-colors">
                {formatFrequency(FREQUENCIES[index] || band.frequency)}
              </div>
            </div>
          ))}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -z-0 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -z-0 pointer-events-none"></div>
      </Card>
    </TooltipProvider>
  );
};
