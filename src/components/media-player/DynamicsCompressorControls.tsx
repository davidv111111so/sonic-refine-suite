import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { Lock, Crown } from 'lucide-react';

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
  const { isPremium, isAdmin, loading } = useUserSubscription();
  
  // Admins bypass premium check
  const hasAccess = isAdmin || isPremium;

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
          <span className="text-2xl">🎛️</span>
          Dynamics Compressor
        </h3>
        {!hasAccess && !loading && (
          <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-400 flex items-center gap-1">
            <Crown className="h-3 w-3" />
            Premium
          </Badge>
        )}
        {isAdmin && (
          <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-400">
            Admin
          </Badge>
        )}
      </div>
      
      {!hasAccess && !loading ? (
        <div className="text-center py-8 space-y-4">
          <Lock className="h-12 w-12 text-slate-500 mx-auto" />
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Premium Feature</h4>
            <p className="text-slate-400 text-sm">
              Upgrade to Premium to access professional dynamics compression tools
            </p>
          </div>
          <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all">
            Upgrade to Premium
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Threshold */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-orange-300">Threshold</Label>
                <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                  {settings.threshold.toFixed(1)}dB
                </span>
              </div>
              <Slider
                value={[settings.threshold]}
                min={-60}
                max={0}
                step={1}
                onValueChange={(v) => onSettingsChange({ threshold: v[0] })}
              />
            </div>

            {/* Ratio */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-orange-300">Ratio</Label>
                <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                  {settings.ratio.toFixed(1)}:1
                </span>
              </div>
              <Slider
                value={[settings.ratio]}
                min={1}
                max={20}
                step={0.1}
                onValueChange={(v) => onSettingsChange({ ratio: v[0] })}
                className="text-orange-300"
              />
            </div>

            {/* Attack */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-orange-300">Attack</Label>
                <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                  {settings.attack.toFixed(1)}ms
                </span>
              </div>
              <Slider
                value={[settings.attack * 1000]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => onSettingsChange({ attack: v[0] / 1000 })}
              />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Release */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-orange-300">Release</Label>
                <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                  {settings.release.toFixed(0)}ms
                </span>
              </div>
              <Slider
                value={[settings.release * 1000]}
                min={0}
                max={1000}
                step={10}
                onValueChange={(v) => onSettingsChange({ release: v[0] / 1000 })}
              />
            </div>

            {/* Knee */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-orange-300">Knee</Label>
                <span className="text-xs font-mono text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                  {settings.knee.toFixed(1)}dB
                </span>
              </div>
              <Slider
                value={[settings.knee]}
                min={0}
                max={40}
                step={1}
                onValueChange={(v) => onSettingsChange({ knee: v[0] })}
              />
            </div>

            {/* Gain Reduction Meter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-amber-300">Gain Reduction</Label>
                <span className="text-xs font-mono text-red-400 bg-slate-800/50 px-2 py-1 rounded">
                  {gainReduction.toFixed(1)}dB
                </span>
              </div>
              <Progress value={Math.abs(gainReduction) * 2} className="h-3 bg-slate-700" />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};