import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Disc, Mic, Wand2, FileAudio, Music4, Music2 } from "lucide-react";

interface BatchPresetsProps {
  onSelectPreset: (preset: any) => void;
}

export const BatchPresets = ({ onSelectPreset }: BatchPresetsProps) => {
  const presets = [
    {
      name: "Vinyl Restoration",
      icon: Disc,
      settings: {
        targetBitrate: 320,
        sampleRate: 48000,
        noiseReduction: true,
        noiseReductionLevel: 70,
        normalization: true,
        normalizationLevel: -3,
        bassBoost: true,
        bassBoostLevel: 15,
        trebleEnhancement: true,
        trebleLevel: 20,
        compression: true,
        compressionRatio: 3,
        outputFormat: "flac",
        smartFolder: "Vinyl",
      },
    },
    {
      name: "Podcast Enhancement",
      icon: Mic,
      settings: {
        targetBitrate: 192,
        sampleRate: 44100,
        noiseReduction: true,
        noiseReductionLevel: 80,
        normalization: true,
        normalizationLevel: -2,
        bassBoost: false,
        trebleEnhancement: true,
        trebleLevel: 25,
        compression: true,
        compressionRatio: 6,
        outputFormat: "mp3",
        smartFolder: "Podcasts",
      },
    },
    {
      name: "Lo-Fi Tapes",
      icon: Music2,
      settings: {
        targetBitrate: 320,
        sampleRate: 48000,
        noiseReduction: true,
        noiseReductionLevel: 60,
        normalization: true,
        normalizationLevel: -4,
        bassBoost: true,
        bassBoostLevel: 30,
        trebleEnhancement: false,
        compression: true,
        compressionRatio: 2,
        outputFormat: "mp3",
        smartFolder: "LoFi",
      },
    },
    {
      name: "Classical Music",
      icon: Music4,
      settings: {
        targetBitrate: 320,
        sampleRate: 96000,
        noiseReduction: true,
        noiseReductionLevel: 30,
        normalization: true,
        normalizationLevel: -6,
        bassBoost: false,
        trebleEnhancement: false,
        compression: false,
        outputFormat: "flac",
        smartFolder: "Classical",
      },
    },
    {
      name: "Live Recordings",
      icon: FileAudio,
      settings: {
        targetBitrate: 320,
        sampleRate: 48000,
        noiseReduction: true,
        noiseReductionLevel: 40,
        normalization: true,
        normalizationLevel: -3,
        bassBoost: true,
        bassBoostLevel: 10,
        trebleEnhancement: true,
        trebleLevel: 15,
        compression: true,
        compressionRatio: 3,
        outputFormat: "flac",
        smartFolder: "Live",
      },
    },
    {
      name: "Voice Memo",
      icon: Mic,
      settings: {
        targetBitrate: 192,
        sampleRate: 44100,
        noiseReduction: true,
        noiseReductionLevel: 90,
        normalization: true,
        normalizationLevel: -1,
        bassBoost: false,
        trebleEnhancement: true,
        trebleLevel: 30,
        compression: true,
        compressionRatio: 8,
        outputFormat: "mp3",
        smartFolder: "Voice",
      },
    },
  ];

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Wand2 className="h-5 w-5" />
          Specialized Presets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {presets.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white flex items-center h-auto py-4"
              onClick={() => onSelectPreset(preset.settings)}
            >
              <div className="flex flex-col items-center gap-2">
                <preset.icon className="h-6 w-6" />
                <span>{preset.name}</span>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
