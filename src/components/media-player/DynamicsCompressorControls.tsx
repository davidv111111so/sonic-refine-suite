import React from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
export interface CompressorSettings {
  threshold: number;  // Range: 0 to -3dB
  ratio: number;      // Range: 1 to 4.0:1
  attack: number;     // Range: 0.0001 to 0.003s (0.1ms to 3ms)
  release: number;    // Range: 0 to 0.003s (0ms to 3ms)
}
interface DynamicsCompressorControlsProps {
  settings: CompressorSettings;
  gainReduction: number;
  onSettingsChange: (settings: Partial<CompressorSettings>) => void;
}
export const DynamicsCompressorControls: React.FC<DynamicsCompressorControlsProps> = ({
  settings,
  gainReduction,
  onSettingsChange
}) => {
  return <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
          <span className="text-2xl">🎛️</span>
          Dynamic Range Compressor (DRC)
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Professional audio compression with studio-grade precision controls
        </p>
      </div>

      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSettingsChange({
            threshold: -1.5,
            ratio: 2.0,
            attack: 0.003,
            release: 0.25
          })}
          className="text-xs"
        >
          Reset
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Threshold: Limited to 0 to -3dB */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-orange-300">
                Threshold
                <span className="text-xs text-slate-500 ml-2">(0 to -3dB)</span>
              </label>
              <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                {settings.threshold.toFixed(1)}dB
              </span>
            </div>
            <Slider 
              value={[settings.threshold]} 
              min={-3} 
              max={0} 
              step={0.1} 
              onValueChange={v => onSettingsChange({ threshold: v[0] })} 
            />
            <p className="text-xs text-slate-500 mt-1">
              Signal level where compression begins
            </p>
          </div>

          {/* Ratio: Limited to max 4.0:1 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-orange-300">
                Ratio
                <span className="text-xs text-slate-500 ml-2">(max 4:1)</span>
              </label>
              <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                {settings.ratio.toFixed(1)}:1
              </span>
            </div>
            <Slider 
              value={[settings.ratio]} 
              min={1} 
              max={4} 
              step={0.1} 
              onValueChange={v => onSettingsChange({ ratio: v[0] })} 
            />
            <p className="text-xs text-slate-500 mt-1">
              Amount of compression applied above threshold
            </p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Attack: 0.1ms to 3ms */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-orange-300">
                Attack
                <span className="text-xs text-slate-500 ml-2">(0.1-3ms)</span>
              </label>
              <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                {(settings.attack * 1000).toFixed(1)}ms
              </span>
            </div>
            <Slider 
              value={[settings.attack * 1000]} 
              min={0.1} 
              max={3} 
              step={0.1} 
              onValueChange={v => onSettingsChange({ attack: v[0] / 1000 })} 
            />
            <p className="text-xs text-slate-500 mt-1">
              How quickly compression responds
            </p>
          </div>

          {/* Release: 0ms to 3ms */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-orange-300">
                Release
                <span className="text-xs text-slate-500 ml-2">(0-3ms)</span>
              </label>
              <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                {(settings.release * 1000).toFixed(1)}ms
              </span>
            </div>
            <Slider 
              value={[settings.release * 1000]} 
              min={0} 
              max={3} 
              step={0.1} 
              onValueChange={v => onSettingsChange({ release: v[0] / 1000 })} 
            />
            <p className="text-xs text-slate-500 mt-1">
              How quickly compression stops after signal drops
            </p>
          </div>

          {/* Gain Reduction Meter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-amber-300">Gain Reduction</label>
              <span className="text-xs font-mono text-red-400 bg-slate-800/50 px-2 py-1 rounded">
                {gainReduction.toFixed(1)}dB
              </span>
            </div>
            <Progress value={Math.abs(gainReduction) * 2} className="h-3 bg-slate-700" />
            <p className="text-xs text-slate-500 mt-1">
              Real-time compression meter
            </p>
          </div>
        </div>
      </div>
    </Card>;
};