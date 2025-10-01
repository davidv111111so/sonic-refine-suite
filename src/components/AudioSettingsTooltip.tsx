
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AudioSettingsTooltipProps {
  setting: string;
}

export const AudioSettingsTooltip = ({ setting }: AudioSettingsTooltipProps) => {
  const getTooltipContent = (setting: string) => {
    switch (setting) {
      case 'targetBitrate':
        return 'Higher bitrate = better quality but larger file size. 320kbps is CD quality, 128kbps is standard, lossless formats use variable rates.';
      case 'sampleRate':
        return 'How many times per second audio is sampled. 44.1kHz is CD quality, 48kHz is professional, 96kHz+ is high-resolution audio.';
      case 'noiseReduction':
        return 'Removes background noise, hiss, and unwanted artifacts from your audio recordings. Higher values = more aggressive noise removal.';
      case 'normalization':
        return 'Adjusts the overall volume to a consistent level. -3dB leaves headroom, -6dB is conservative, 0dB is maximum.';
      case 'compression':
        return 'Reduces the difference between loud and quiet parts. Higher ratios make audio more consistent but less dynamic.';
      case 'gainAdjustment':
        return 'Overall volume boost or reduction. Positive values make audio louder, negative values make it quieter. Use carefully to avoid distortion.';
      case 'eq':
        return 'Equalizer adjusts frequency response. Low frequencies (bass) on left, high frequencies (treble) on right. Boost (+) or cut (-) specific ranges.';
      case 'outputFormat':
        return 'MP3: Small files, good quality. FLAC: Lossless compression. WAV: Uncompressed, largest files. OGG: Open source alternative to MP3.';
      case 'stereoWidening':
        return 'Enhances stereo image by widening the soundstage. Makes audio feel more spacious and immersive. Use sparingly to avoid phase issues.';
      default:
        return 'Audio enhancement setting - hover for more information.';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="ml-1 text-slate-400 hover:text-white transition-colors">
            <HelpCircle className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-slate-800 border-slate-700 text-white">
          <p className="text-sm">{getTooltipContent(setting)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
