import React, { useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface FiveBandEqualizerProps {
  eqBands: number[];
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
  enabled: boolean;
  audioElement?: HTMLAudioElement | null;
}

export const FiveBandEqualizer = ({
  eqBands,
  onEQBandChange,
  onResetEQ,
  enabled,
  audioElement,
}: FiveBandEqualizerProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  // 5 band EQ frequencies
  const eqFrequencies = [60, 250, 1000, 4000, 12000];
  const bandLabels = ["Bass", "Low Mid", "Mid", "High Mid", "Treble"];

  const getEQColor = (index: number) => {
    const colors = ["#ff1744", "#ff6d00", "#ffc400", "#3d5afe", "#651fff"];
    return colors[index];
  };

  // Initialize Web Audio API when audio element is available
  useEffect(() => {
    if (!audioElement || !enabled) return;

    try {
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      // Create source node if it doesn't exist
      if (!sourceRef.current) {
        sourceRef.current = audioContext.createMediaElementSource(audioElement);
      }

      // Create 5 filters if they don't exist
      if (filtersRef.current.length === 0) {
        filtersRef.current = eqFrequencies.map((freq, index) => {
          const filter = audioContext.createBiquadFilter();
          filter.type = "peaking";
          filter.frequency.setValueAtTime(freq, audioContext.currentTime);
          filter.Q.setValueAtTime(1, audioContext.currentTime);
          filter.gain.setValueAtTime(
            eqBands[index] || 0,
            audioContext.currentTime,
          );
          return filter;
        });

        // Create gain node
        gainNodeRef.current = audioContext.createGain();

        // Connect the audio chain
        let currentNode: AudioNode = sourceRef.current;

        filtersRef.current.forEach((filter) => {
          currentNode.connect(filter);
          currentNode = filter;
        });

        currentNode.connect(gainNodeRef.current!);
        gainNodeRef.current.connect(audioContext.destination);
      }

      // Resume audio context if suspended
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
    } catch (error) {
      console.error("Error initializing Web Audio API:", error);
    }

    return () => {
      // Cleanup on unmount
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (e) {
          console.warn("Error disconnecting source:", e);
        }
      }
    };
  }, [audioElement, enabled]);

  // Update EQ bands when values change
  useEffect(() => {
    if (!enabled || filtersRef.current.length === 0 || !audioContextRef.current)
      return;

    try {
      filtersRef.current.forEach((filter, index) => {
        if (filter && audioContextRef.current && eqBands[index] !== undefined) {
          filter.gain.setValueAtTime(
            eqBands[index],
            audioContextRef.current.currentTime,
          );
        }
      });
    } catch (error) {
      console.error("Error updating EQ bands:", error);
    }
  }, [eqBands, enabled]);

  if (!enabled) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-6 border-2 border-slate-600 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-wide">
          5-Band Audio EQ
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
        <div className="flex justify-center items-end gap-6 py-4 px-4 border-2 border-slate-600 rounded-xl bg-gradient-to-t from-slate-800/60 to-slate-700/30 backdrop-blur-md shadow-inner">
          {eqFrequencies.map((freq, index) => (
            <div key={freq} className="flex flex-col items-center group">
              <div className="h-32 flex items-end justify-center mb-3 relative">
                <div
                  className="absolute inset-x-0 bottom-0 rounded-t-lg transition-all duration-500 ease-out"
                  style={{
                    background: `linear-gradient(180deg, 
                      ${getEQColor(index)}80 0%, 
                      ${getEQColor(index)}40 50%, 
                      transparent 100%)`,
                    boxShadow:
                      (eqBands[index] || 0) !== 0
                        ? `0 0 20px ${getEQColor(index)}60, inset 0 0 10px ${getEQColor(index)}20`
                        : "none",
                    borderRadius: "8px",
                    border: `1px solid ${getEQColor(index)}40`,
                  }}
                />
                <div className="relative z-10">
                  <Slider
                    orientation="vertical"
                    value={[eqBands[index] || 0]}
                    onValueChange={([value]) => onEQBandChange(index, value)}
                    min={-12}
                    max={12}
                    step={0.5}
                    className="h-28 w-6 group-hover:scale-110 transition-all duration-300"
                    style={
                      {
                        "--slider-track": getEQColor(index),
                        "--slider-range": getEQColor(index),
                        "--slider-thumb": "#ffffff",
                      } as React.CSSProperties
                    }
                  />
                </div>
              </div>

              <div className="text-xs text-center mb-2 font-bold tracking-wider bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {bandLabels[index]}
              </div>

              <div className="text-xs text-center mb-2 font-medium text-slate-300">
                {freq < 1000 ? `${freq}Hz` : `${freq / 1000}k`}
              </div>

              <div
                className="text-xs text-center min-w-12 font-mono bg-slate-900/90 rounded-full px-2 py-1 border-2 transition-all duration-300 shadow-lg"
                style={{
                  color:
                    (eqBands[index] || 0) !== 0 ? getEQColor(index) : "#94a3b8",
                  borderColor:
                    (eqBands[index] || 0) !== 0
                      ? getEQColor(index) + "60"
                      : "#475569",
                  boxShadow:
                    (eqBands[index] || 0) !== 0
                      ? `0 0 15px ${getEQColor(index)}40`
                      : "none",
                }}
              >
                {(eqBands[index] || 0) > 0 ? "+" : ""}
                {eqBands[index] || 0}dB
              </div>
            </div>
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-xl pointer-events-none animate-pulse"></div>
      </div>
    </div>
  );
};
