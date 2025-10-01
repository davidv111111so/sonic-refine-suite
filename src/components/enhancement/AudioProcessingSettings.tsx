
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { AudioSettingsTooltip } from '@/components/AudioSettingsTooltip';

interface AudioProcessingSettingsProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
}

export const AudioProcessingSettings = ({ settings, onSettingChange }: AudioProcessingSettingsProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <label className="text-sm font-medium text-white">Noise Reduction</label>
            <AudioSettingsTooltip setting="noiseReduction" />
          </div>
          <Switch
            checked={settings.noiseReductionEnabled}
            onCheckedChange={(checked) => onSettingChange('noiseReductionEnabled', checked)}
          />
        </div>
        {settings.noiseReductionEnabled && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Intensity</span>
              <span className="text-xs text-slate-400">{settings.noiseReduction}%</span>
            </div>
            <Slider
              value={[settings.noiseReduction]}
              onValueChange={([value]) => onSettingChange('noiseReduction', value)}
              min={0}
              max={100}
              step={5}
            />
          </div>
        )}
      </div>

      <Separator className="bg-slate-600" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <label className="text-sm font-medium text-white">Audio Normalization</label>
            <AudioSettingsTooltip setting="normalization" />
          </div>
          <Switch
            checked={settings.normalize}
            onCheckedChange={(checked) => onSettingChange('normalize', checked)}
          />
        </div>
        {settings.normalize && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Target Level</span>
              <span className="text-xs text-slate-400">{settings.normalizeLevel} dB</span>
            </div>
            <Slider
              value={[settings.normalizeLevel]}
              onValueChange={([value]) => onSettingChange('normalizeLevel', value)}
              min={-12}
              max={0}
              step={1}
            />
          </div>
        )}
      </div>

      <Separator className="bg-slate-600" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <label className="text-sm font-medium text-white">Dynamic Compression</label>
            <AudioSettingsTooltip setting="compression" />
          </div>
          <Switch
            checked={settings.compressionEnabled}
            onCheckedChange={(checked) => onSettingChange('compressionEnabled', checked)}
          />
        </div>
        {settings.compressionEnabled && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Ratio</span>
              <span className="text-xs text-slate-400">{settings.compression}:1</span>
            </div>
            <Slider
              value={[settings.compression]}
              onValueChange={([value]) => onSettingChange('compression', value)}
              min={1}
              max={10}
              step={0.5}
            />
          </div>
        )}
      </div>

      <Separator className="bg-slate-600" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <label className="text-sm font-medium text-white">Stereo Widening</label>
            <AudioSettingsTooltip setting="stereoWidening" />
          </div>
          <Switch
            checked={settings.stereoWideningEnabled}
            onCheckedChange={(checked) => onSettingChange('stereoWideningEnabled', checked)}
          />
        </div>
        {settings.stereoWideningEnabled && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Width</span>
              <span className="text-xs text-slate-400">{settings.stereoWidening}%</span>
            </div>
            <Slider
              value={[settings.stereoWidening]}
              onValueChange={([value]) => onSettingChange('stereoWidening', value)}
              min={0}
              max={100}
              step={5}
            />
          </div>
        )}
      </div>
    </div>
  );
};
