import React from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from 'lucide-react';
export interface CompressorSettings {
  threshold: number;  // Range: 0 to -60dB
  ratio: number;      // Range: 1 to 20:1
  attack: number;     // Range: 0 to 1s
  release: number;    // Range: 0 to 1s
  enabled: boolean;
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
  return (
    <TooltipProvider>
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
              <span className="text-2xl">🎛️</span>
              Dynamic Range Compressor
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Professional audio compression
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              {settings.enabled ? "ON" : "OFF"}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(v) => onSettingsChange({ enabled: v })}
                  className="data-[state=checked]:bg-purple-500"
                />
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                <p>Enable/Disable Compressor</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className={`transition-opacity duration-300 ${settings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="mb-4 flex justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSettingsChange({
                    threshold: -20,
                    ratio: 3.0,
                    attack: 0.003,
                    release: 0.25
                  })}
                  className="h-6 px-2 text-[10px]"
                >
                  Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                <p>Reset to default settings</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              {/* Threshold: -60dB to 0dB */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-orange-300 flex items-center gap-2 cursor-help">
                    Threshold
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs max-w-[200px]">
                        Signal level where compression begins. Lower values compress more sound.
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                    {settings.threshold.toFixed(1)}dB
                  </span>
                </div>
                <Slider
                  value={[settings.threshold]}
                  min={-60}
                  max={0}
                  step={0.1}
                  onValueChange={v => onSettingsChange({ threshold: v[0] })}
                />
              </div>

              {/* Ratio: 1:1 to 20:1 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-orange-300 flex items-center gap-2 cursor-help">
                    Ratio
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs max-w-[200px]">
                        How much compression is applied. Higher values squash the sound more.
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                    {settings.ratio.toFixed(1)}:1
                  </span>
                </div>
                <Slider
                  value={[settings.ratio]}
                  min={1}
                  max={20}
                  step={0.1}
                  onValueChange={v => onSettingsChange({ ratio: v[0] })}
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Attack: 0s to 1s */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-orange-300 flex items-center gap-2 cursor-help">
                    Attack
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs max-w-[200px]">
                        How quickly the compressor reacts to loud sounds.
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                    {(settings.attack * 1000).toFixed(0)}ms
                  </span>
                </div>
                <Slider
                  value={[settings.attack]}
                  min={0}
                  max={1}
                  step={0.001}
                  onValueChange={v => onSettingsChange({ attack: v[0] })}
                />
              </div>

              {/* Release: 0s to 1s */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-orange-300 flex items-center gap-2 cursor-help">
                    Release
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs max-w-[200px]">
                        How long it takes for the compressor to stop compressing after the sound gets quieter.
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                    {(settings.release * 1000).toFixed(0)}ms
                  </span>
                </div>
                <Slider
                  value={[settings.release]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={v => onSettingsChange({ release: v[0] })}
                />
              </div>

              {/* Gain Reduction Meter */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-amber-300 flex items-center gap-2">
                    Gain Reduction
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs max-w-[200px]">
                        Shows how much volume is being reduced by the compressor in real-time.
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <span className="text-xs font-mono text-red-400 bg-slate-800/50 px-2 py-1 rounded">
                    {gainReduction.toFixed(1)}dB
                  </span>
                </div>
                <Progress value={Math.abs(gainReduction) * 2} className="h-3 bg-slate-700" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};