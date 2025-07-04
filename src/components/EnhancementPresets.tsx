
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Mic, Zap, Coffee, Volume2, Radio, Headphones, Guitar, Piano, Drum, Info, Heart, Star, Sparkles, Waves, Sun, Moon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Preset {
  name: string;
  icon: React.ReactNode;
  settings: {
    bassBoost: number;
    midBoost: number;
    trebleBoost: number;
    noiseReduction: number;
    compression: number;
    stereoWidening: number;
    eqBands: number[];
  };
}

interface EnhancementPresetsProps {
  onApplyPreset: (settings: any) => void;
}

export const EnhancementPresets = ({ onApplyPreset }: EnhancementPresetsProps) => {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const presets: Preset[] = [
    {
      name: 'Music',
      icon: <Music className="h-4 w-4" />,
      settings: {
        bassBoost: 2,
        midBoost: 0,
        trebleBoost: 3,
        noiseReduction: 20,
        compression: 30,
        stereoWidening: 25,
        eqBands: [1, 2, 1, 0, 0, 1, 2, 3, 2, 1]
      }
    },
    {
      name: 'Podcast',
      icon: <Mic className="h-4 w-4" />,
      settings: {
        bassBoost: -2,
        midBoost: 4,
        trebleBoost: 2,
        noiseReduction: 60,
        compression: 50,
        stereoWidening: 0,
        eqBands: [-2, -1, 2, 4, 3, 2, 1, 2, 1, 0]
      }
    },
    {
      name: 'Electronic',
      icon: <Zap className="h-4 w-4" />,
      settings: {
        bassBoost: 4,
        midBoost: -1,
        trebleBoost: 5,
        noiseReduction: 10,
        compression: 20,
        stereoWidening: 40,
        eqBands: [3, 4, 2, -1, -2, 0, 3, 5, 4, 3]
      }
    },
    {
      name: 'Jazz',
      icon: <Coffee className="h-4 w-4" />,
      settings: {
        bassBoost: 1,
        midBoost: 2,
        trebleBoost: 1,
        noiseReduction: 30,
        compression: 15,
        stereoWidening: 20,
        eqBands: [0, 1, 2, 3, 2, 1, 2, 1, 1, 0]
      }
    },
    {
      name: 'Latin',
      icon: <Volume2 className="h-4 w-4" />,
      settings: {
        bassBoost: 3,
        midBoost: 1,
        trebleBoost: 2,
        noiseReduction: 25,
        compression: 25,
        stereoWidening: 30,
        eqBands: [2, 3, 2, 1, 2, 3, 2, 2, 1, 1]
      }
    },
    {
      name: 'Radio',
      icon: <Radio className="h-4 w-4" />,
      settings: {
        bassBoost: 0,
        midBoost: 3,
        trebleBoost: 4,
        noiseReduction: 40,
        compression: 60,
        stereoWidening: 10,
        eqBands: [-1, 0, 2, 4, 3, 2, 3, 4, 2, 1]
      }
    },
    {
      name: 'Hip Hop',
      icon: <Headphones className="h-4 w-4" />,
      settings: {
        bassBoost: 5,
        midBoost: -1,
        trebleBoost: 2,
        noiseReduction: 15,
        compression: 35,
        stereoWidening: 25,
        eqBands: [4, 5, 3, 1, -1, 0, 1, 2, 2, 1]
      }
    },
    {
      name: 'Rock',
      icon: <Guitar className="h-4 w-4" />,
      settings: {
        bassBoost: 2,
        midBoost: 1,
        trebleBoost: 4,
        noiseReduction: 20,
        compression: 40,
        stereoWidening: 35,
        eqBands: [1, 2, 3, 2, 1, 2, 3, 4, 3, 2]
      }
    },
    {
      name: 'Classical',
      icon: <Piano className="h-4 w-4" />,
      settings: {
        bassBoost: 0,
        midBoost: 1,
        trebleBoost: 2,
        noiseReduction: 35,
        compression: 10,
        stereoWidening: 15,
        eqBands: [0, 0, 1, 2, 1, 1, 2, 2, 1, 1]
      }
    },
    {
      name: 'Pop',
      icon: <Drum className="h-4 w-4" />,
      settings: {
        bassBoost: 3,
        midBoost: 2,
        trebleBoost: 3,
        noiseReduction: 25,
        compression: 45,
        stereoWidening: 30,
        eqBands: [2, 3, 2, 2, 1, 2, 3, 3, 2, 2]
      }
    },
    {
      name: 'Acoustic',
      icon: <Heart className="h-4 w-4" />,
      settings: {
        bassBoost: 1,
        midBoost: 3,
        trebleBoost: 2,
        noiseReduction: 30,
        compression: 20,
        stereoWidening: 20,
        eqBands: [0, 1, 2, 3, 3, 2, 2, 2, 1, 0]
      }
    },
    {
      name: 'Blues',
      icon: <Star className="h-4 w-4" />,
      settings: {
        bassBoost: 2,
        midBoost: 2,
        trebleBoost: 1,
        noiseReduction: 25,
        compression: 25,
        stereoWidening: 25,
        eqBands: [1, 2, 2, 3, 2, 2, 2, 1, 1, 0]
      }
    },
    {
      name: 'Ambient',
      icon: <Sparkles className="h-4 w-4" />,
      settings: {
        bassBoost: 0,
        midBoost: 0,
        trebleBoost: 3,
        noiseReduction: 40,
        compression: 10,
        stereoWidening: 50,
        eqBands: [0, 0, 0, 1, 1, 2, 3, 3, 2, 1]
      }
    },
    {
      name: 'Lofi',
      icon: <Waves className="h-4 w-4" />,
      settings: {
        bassBoost: 2,
        midBoost: 1,
        trebleBoost: -2,
        noiseReduction: 10,
        compression: 30,
        stereoWidening: 15,
        eqBands: [2, 2, 1, 1, 0, -1, -2, -1, 0, 0]
      }
    },
    {
      name: 'Vocal',
      icon: <Sun className="h-4 w-4" />,
      settings: {
        bassBoost: -1,
        midBoost: 4,
        trebleBoost: 3,
        noiseReduction: 50,
        compression: 40,
        stereoWidening: 10,
        eqBands: [-1, 0, 2, 4, 4, 3, 3, 2, 1, 0]
      }
    },
    {
      name: 'Dance',
      icon: <Moon className="h-4 w-4" />,
      settings: {
        bassBoost: 4,
        midBoost: 0,
        trebleBoost: 4,
        noiseReduction: 15,
        compression: 50,
        stereoWidening: 40,
        eqBands: [4, 4, 3, 1, 0, 1, 2, 4, 3, 2]
      }
    }
  ];

  const getPresetDescription = (preset: Preset) => {
    const desc = [];
    if (preset.settings.bassBoost > 0) desc.push(`+${preset.settings.bassBoost}dB Bass`);
    if (preset.settings.midBoost > 0) desc.push(`+${preset.settings.midBoost}dB Mid`);
    if (preset.settings.trebleBoost > 0) desc.push(`+${preset.settings.trebleBoost}dB Treble`);
    if (preset.settings.noiseReduction > 0) desc.push(`${preset.settings.noiseReduction}% Noise Reduction`);
    if (preset.settings.compression > 0) desc.push(`${preset.settings.compression}% Compression`);
    if (preset.settings.stereoWidening > 0) desc.push(`${preset.settings.stereoWidening}% Stereo Width`);
    return desc.join(', ');
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          Enhancement Presets
          <Info className="h-4 w-4 text-slate-400" />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <Popover key={preset.name}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onApplyPreset(preset.settings);
                    setSelectedPreset(preset.name);
                  }}
                  className={`bg-slate-700 border-slate-600 hover:bg-slate-600 text-white h-8 text-xs flex items-center gap-2 ${
                    selectedPreset === preset.name ? 'ring-2 ring-blue-400' : ''
                  }`}
                >
                  {preset.icon}
                  {preset.name}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-slate-800 border-slate-700 text-white">
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-400">{preset.name} Preset</h4>
                  <p className="text-xs text-slate-300">
                    {getPresetDescription(preset)}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
