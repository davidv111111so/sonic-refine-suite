
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
          <label className="text-sm font-medium text-white flex items-center">
            Noise Reduction
            <AudioSettingsTooltip setting="noiseReduction" />
          </label>
          <Switch
            checked={settings.noiseReduction}
            onCheckedChange={(checked) => onSettingChange('noiseReduction', checked)}
          />
        </div>
        {settings.noiseReduction && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Intensity</span>
              <span className="text-xs text-slate-400">{settings.noiseReductionLevel}%</span>
            </div>
            <Slider
              value={[settings.noiseReductionLevel]}
              onValueChange={([value]) => onSettingChange('noiseReductionLevel', value)}
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
          <label className="text-sm font-medium text-white flex items-center">
            Audio Normalization
            <AudioSettingsTooltip setting="normalization" />
          </label>
          <Switch
            checked={settings.normalization}
            onCheckedChange={(checked) => onSettingChange('normalization', checked)}
          />
        </div>
        {settings.normalization && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Target Level</span>
              <span className="text-xs text-slate-400">{settings.normalizationLevel} dB</span>
            </div>
            <Slider
              value={[settings.normalizationLevel]}
              onValueChange={([value]) => onSettingChange('normalizationLevel', value)}
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
          <label className="text-sm font-medium text-white flex items-center">
            Dynamic Compression
            <AudioSettingsTooltip setting="compression" />
          </label>
          <Switch
            checked={settings.compression}
            onCheckedChange={(checked) => onSettingChange('compression', checked)}
          />
        </div>
        {settings.compression && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Ratio</span>
              <span className="text-xs text-slate-400">{settings.compressionRatio}:1</span>
            </div>
            <Slider
              value={[settings.compressionRatio]}
              onValueChange={([value]) => onSettingChange('compressionRatio', value)}
              min={1}
              max={10}
              step={0.5}
            />
          </div>
        )}
      </div>
    </div>
  );
};
