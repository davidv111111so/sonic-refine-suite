import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';

export interface EQBand {
  frequency: number;
  gain: number;
}

interface TenBandEqualizerProps {
  bands: EQBand[];
  onBandChange: (index: number, gain: number) => void;
  onReset: () => void;
}

const FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const TenBandEqualizer: React.FC<TenBandEqualizerProps> = ({
  bands,
  onBandChange,
  onReset,
}) => {
  const formatFrequency = (freq: number) => {
    if (freq >= 1000) {
      return `${freq / 1000}kHz`;
    }
    return `${freq}Hz`;
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
          <span className="text-2xl">🎚️</span>
          10-Band Equalizer
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-10 gap-2">
        {bands.map((band, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            {/* Gain value display */}
            <div className="text-xs font-mono text-white bg-slate-800/50 px-2 py-1 rounded min-w-[60px] text-center">
              {band.gain >= 0 ? '+' : ''}{band.gain.toFixed(1)}dB
            </div>

            {/* Vertical slider */}
            <div className="h-48 flex items-center justify-center">
              <Slider
                orientation="vertical"
                value={[band.gain]}
                min={-12}
                max={12}
                step={0.1}
                onValueChange={(values) => onBandChange(index, values[0])}
                className="h-full"
              />
            </div>

            {/* Frequency label */}
            <div className="text-xs text-slate-400 font-medium text-center w-full">
              {formatFrequency(FREQUENCIES[index])}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
