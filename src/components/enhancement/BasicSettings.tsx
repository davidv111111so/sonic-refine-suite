
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AudioSettingsTooltip } from '@/components/AudioSettingsTooltip';

interface BasicSettingsProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
  estimatedFileSize: { size: string; quality: string; improvement: string };
}

export const BasicSettings = ({ settings, onSettingChange, estimatedFileSize }: BasicSettingsProps) => {
  const sampleRateOptions = [
    { value: 44100, label: '44.1 kHz', description: 'CD Quality' },
    { value: 48000, label: '48 kHz', description: 'Professional' },
    { value: 96000, label: '96 kHz', description: 'Hi-Res Audio' }
  ];

  const getBitrateOptions = () => {
    switch (settings.outputFormat) {
      case 'mp3':
        return { min: 128, max: 320, step: 32 };
      case 'ogg':
        return { min: 128, max: 500, step: 32 };
      case 'flac':
      case 'wav':
        return { min: 500, max: 2000, step: 100 };
      default:
        return { min: 128, max: 320, step: 32 };
    }
  };

  const bitrateOptions = getBitrateOptions();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-white flex items-center">
          Output Format
          <AudioSettingsTooltip setting="outputFormat" />
        </label>
        <Select
          value={settings.outputFormat}
          onValueChange={(value) => onSettingChange('outputFormat', value)}
        >
          <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600">
            <SelectItem value="mp3">MP3</SelectItem>
            <SelectItem value="flac">FLAC (Lossless)</SelectItem>
            <SelectItem value="wav">WAV (Uncompressed)</SelectItem>
            <SelectItem value="ogg">OGG</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-sm font-medium text-white flex items-center">
            Target Bitrate
            <AudioSettingsTooltip setting="targetBitrate" />
          </label>
          <span className="text-sm text-slate-400">
            {settings.outputFormat === 'flac' || settings.outputFormat === 'wav' 
              ? `${settings.targetBitrate} kbps (Lossless)`
              : `${settings.targetBitrate} kbps`
            }
          </span>
        </div>
        <Slider
          value={[settings.targetBitrate]}
          onValueChange={([value]) => onSettingChange('targetBitrate', value)}
          min={bitrateOptions.min}
          max={bitrateOptions.max}
          step={bitrateOptions.step}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-white flex items-center">
          Sample Rate
          <AudioSettingsTooltip setting="sampleRate" />
        </label>
        <RadioGroup
          value={settings.sampleRate.toString()}
          onValueChange={(value) => onSettingChange('sampleRate', parseInt(value))}
          className="grid grid-cols-1 gap-3"
        >
          {sampleRateOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/50 border border-slate-600 hover:bg-slate-700 transition-colors">
              <RadioGroupItem
                value={option.value.toString()}
                id={`rate-${option.value}`}
                className="border-slate-400 text-blue-400"
              />
              <label 
                htmlFor={`rate-${option.value}`} 
                className="flex-1 cursor-pointer"
              >
                <div className="text-sm font-medium text-slate-200">{option.label}</div>
                <div className="text-xs text-slate-400">{option.description}</div>
              </label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-500/40 rounded-lg shadow-lg">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-xs text-blue-300 mb-1">Format</div>
            <div className="text-sm font-bold text-blue-100">{settings.outputFormat.toUpperCase()}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-purple-300 mb-1">Quality</div>
            <div className="text-sm font-bold text-purple-100">{estimatedFileSize.quality}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-green-300 mb-1">Est. Size</div>
            <div className="text-sm font-bold text-green-100">{estimatedFileSize.size} MB</div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-white/10 text-center">
          <span className="text-xs text-slate-300">Size increase: </span>
          <span className="text-xs font-semibold text-green-300">{estimatedFileSize.improvement}x</span>
          <span className="text-xs text-slate-400"> (per 4-min track)</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-sm font-medium text-white flex items-center">
            Gain Adjustment
            <AudioSettingsTooltip setting="gainAdjustment" />
          </label>
          <span className="text-sm text-slate-400">{settings.gainAdjustment > 0 ? '+' : ''}{settings.gainAdjustment} dB</span>
        </div>
        <Slider
          value={[settings.gainAdjustment]}
          onValueChange={([value]) => onSettingChange('gainAdjustment', value)}
          min={-12}
          max={12}
          step={0.5}
          className="w-full"
        />
      </div>
    </div>
  );
};
