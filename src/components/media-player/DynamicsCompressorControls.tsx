import React from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
export interface CompressorSettings {
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  knee: number;
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
      <h3 className="text-lg font-semibold text-purple-400 mb-6 flex items-center gap-2">
        <span className="text-2xl">🎛️</span>
        Dynamics Compressor
      </h3>

      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-orange-300">Threshold</label>
              <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                {settings.threshold.toFixed(1)}dB
              </span>
            </div>
            <Slider value={[settings.threshold]} min={-60} max={0} step={1} onValueChange={v => onSettingsChange({
            threshold: v[0]
          })} />
          </div>

          {/* Ratio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-white font-medium">Ratio</label>
              <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                {settings.ratio.toFixed(1)}:1
              </span>
            </div>
            <Slider value={[settings.ratio]} min={1} max={20} step={0.1} onValueChange={v => onSettingsChange({
            ratio: v[0]
          })} className="text-orange-300" />
          </div>

          {/* Attack */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-white font-medium">Attack</label>
              <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                {settings.attack.toFixed(1)}ms
              </span>
            </div>
            <Slider value={[settings.attack * 1000]} min={0} max={100} step={1} onValueChange={v => onSettingsChange({
            attack: v[0] / 1000
          })} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Release */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-orange-300">Release</label>
              <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                {settings.release.toFixed(0)}ms
              </span>
            </div>
            <Slider value={[settings.release * 1000]} min={0} max={1000} step={10} onValueChange={v => onSettingsChange({
            release: v[0] / 1000
          })} />
          </div>

          {/* Knee */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-orange-300">Knee</label>
              <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                {settings.knee.toFixed(1)}dB
              </span>
            </div>
            <Slider value={[settings.knee]} min={0} max={40} step={1} onValueChange={v => onSettingsChange({
            knee: v[0]
          })} />
          </div>

          {/* Gain Reduction Meter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-white font-medium">Gain Reduction</label>
              <span className="text-xs font-mono text-red-400 bg-slate-800/50 px-2 py-1 rounded">
                {gainReduction.toFixed(1)}dB
              </span>
            </div>
            <Progress value={Math.abs(gainReduction) * 2} className="h-3 bg-slate-700" />
          </div>
        </div>
      </div>
    </Card>;
};