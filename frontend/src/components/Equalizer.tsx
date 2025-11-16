import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { BarChart3, RotateCcw } from "lucide-react";

interface Track {
  id: string;
  name: string;
  originalFile: File;
  audioBuffer?: AudioBuffer;
  status: "loading" | "ready" | "processing" | "error";
  metadata?: {
    duration: number;
    sampleRate: number;
    channels: number;
  };
}

interface EqualizerProps {
  track?: Track;
  disabled?: boolean;
}

export const Equalizer: React.FC<EqualizerProps> = ({
  track,
  disabled = false,
}) => {
  const [enabled, setEnabled] = useState(true);
  const [bands, setBands] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]); // 10-band EQ

  const frequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

  const handleBandChange = (bandIndex: number, value: number) => {
    const newBands = [...bands];
    newBands[bandIndex] = value;
    setBands(newBands);
  };

  const resetEQ = () => {
    setBands([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  };

  const formatFrequency = (freq: number): string => {
    if (freq < 1000) return `${freq}Hz`;
    return `${freq / 1000}kHz`;
  };

  return (
    <Card className="bg-slate-800/50 border-slate-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-cyan-400 text-lg">
            <BarChart3 className="h-5 w-5" />
            10-Band Equalizer
          </CardTitle>
          <div className="flex items-center gap-3">
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={disabled}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={resetEQ}
              disabled={disabled}
              className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {enabled && (
          <div className="relative bg-slate-900/50 rounded-lg p-6">
            <div className="flex justify-center items-end gap-2 py-4">
              {frequencies.map((freq, index) => (
                <div key={freq} className="flex flex-col items-center">
                  <div className="h-40 flex items-end justify-center mb-3 relative">
                    <Slider
                      orientation="vertical"
                      value={[bands[index]]}
                      onValueChange={([value]) =>
                        handleBandChange(index, value)
                      }
                      min={-12}
                      max={12}
                      step={0.5}
                      disabled={disabled}
                      className="h-36 w-4"
                    />
                  </div>
                  <div className="text-xs font-medium text-blue-400 mb-1">
                    {formatFrequency(freq)}
                  </div>
                  <div className="text-xs text-slate-300">
                    {bands[index] > 0 ? "+" : ""}
                    {bands[index]}dB
                  </div>
                </div>
              ))}
            </div>

            {/* EQ Presets */}
            <div className="mt-6 pt-4 border-t border-slate-700">
              <h4 className="text-sm font-medium text-white mb-3">
                Quick Presets
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBands([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])}
                  disabled={disabled}
                  className="text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
                >
                  Flat
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBands([6, 4, 2, 1, 0, -1, -2, -1, 2, 4])}
                  disabled={disabled}
                  className="text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
                >
                  Bass Boost
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBands([-2, -1, 0, 1, 2, 4, 6, 6, 4, 2])}
                  disabled={disabled}
                  className="text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
                >
                  Treble Boost
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBands([4, 2, 0, -2, -4, -4, -2, 0, 2, 4])}
                  disabled={disabled}
                  className="text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
                >
                  V-Shape
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBands([-4, -2, 0, 2, 4, 4, 2, 0, -2, -4])}
                  disabled={disabled}
                  className="text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
                >
                  Vocal Boost
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBands([2, 1, 0, -1, -2, -1, 0, 1, 2, 3])}
                  disabled={disabled}
                  className="text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
                >
                  Warmth
                </Button>
              </div>
            </div>
          </div>
        )}

        {!enabled && (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">Equalizer is disabled</p>
            <p className="text-sm text-slate-500 mt-2">
              Enable the equalizer to adjust frequency bands
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
