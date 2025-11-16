import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Settings, Upload, Download, Save, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Track {
  id: string;
  name: string;
  originalFile: File;
  audioBuffer?: AudioBuffer;
  status: "loading" | "ready" | "processing" | "error";
  metadata?: {
    duration: number;
    sampleRate: number;
    channels: number;
  };
}

interface AudioSettings {
  noiseReduction: number;
  normalization: boolean;
  compressionRatio: number;
  stereoWidth: number;
  bassBoost: number;
  trebleEnhancement: number;
  outputFormat: "mp3" | "wav";
  sampleRate: number;
  bitrate: number;
}

interface SettingsPanelProps {
  track?: Track;
  disabled?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  track,
  disabled = false,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<AudioSettings>({
    noiseReduction: 50,
    normalization: true,
    compressionRatio: 4,
    stereoWidth: 25,
    bassBoost: 0,
    trebleEnhancement: 0,
    outputFormat: "wav",
    sampleRate: 44100,
    bitrate: 320,
  });

  const handleSettingChange = <K extends keyof AudioSettings>(
    key: K,
    value: AudioSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Save current settings as JSON preset
  const handleSavePreset = () => {
    const presetData = {
      name: `Preset ${new Date().toLocaleDateString()}`,
      settings: settings,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(presetData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audio-preset-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Preset Saved",
      description: "Audio settings preset has been downloaded as JSON file.",
    });
  };

  // Load preset from JSON file
  const handleLoadPreset = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== "application/json") {
      toast({
        title: "Invalid File",
        description: "Please select a valid JSON preset file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const presetData = JSON.parse(result);

        if (presetData.settings) {
          setSettings(presetData.settings);
          toast({
            title: "Preset Loaded",
            description: `Successfully loaded preset: ${presetData.name || "Unnamed"}`,
          });
        } else {
          throw new Error("Invalid preset format");
        }
      } catch (error) {
        toast({
          title: "Load Failed",
          description:
            "Failed to parse preset file. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-400 text-lg">
            <Settings className="h-5 w-5" />
            Audio Settings
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSavePreset}
              className="bg-blue-700 border-blue-500 hover:bg-blue-600 text-white"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadPreset}
              className="bg-green-700 border-green-500 hover:bg-green-600 text-white"
            >
              <FolderOpen className="h-3 w-3 mr-1" />
              Load
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hidden file input for preset loading */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {/* Output Format */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white">Output Format</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 mb-1 block">
                Format
              </label>
              <select
                value={settings.outputFormat}
                onChange={(e) =>
                  handleSettingChange(
                    "outputFormat",
                    e.target.value as "mp3" | "wav",
                  )
                }
                disabled={disabled}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-2 py-1 text-sm disabled:opacity-50"
              >
                <option value="wav">WAV</option>
                <option value="mp3">MP3</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 mb-1 block">
                Sample Rate
              </label>
              <select
                value={settings.sampleRate}
                onChange={(e) =>
                  handleSettingChange("sampleRate", parseInt(e.target.value))
                }
                disabled={disabled}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-2 py-1 text-sm disabled:opacity-50"
              >
                <option value={44100}>44.1 kHz</option>
                <option value={48000}>48 kHz</option>
                <option value={96000}>96 kHz</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audio Enhancement */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">Audio Enhancement</h4>

          {/* Noise Reduction */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300">Noise Reduction</label>
              <span className="text-xs text-slate-400">
                {settings.noiseReduction}%
              </span>
            </div>
            <Slider
              value={[settings.noiseReduction]}
              onValueChange={([value]) =>
                handleSettingChange("noiseReduction", value)
              }
              max={100}
              step={1}
              disabled={disabled}
              className="w-full"
            />
          </div>

          {/* Normalization Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300">
              Audio Normalization
            </label>
            <Switch
              checked={settings.normalization}
              onCheckedChange={(checked) =>
                handleSettingChange("normalization", checked)
              }
              disabled={disabled}
            />
          </div>

          {/* Compression Ratio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300">
                Compression Ratio
              </label>
              <span className="text-xs text-slate-400">
                {settings.compressionRatio}:1
              </span>
            </div>
            <Slider
              value={[settings.compressionRatio]}
              onValueChange={([value]) =>
                handleSettingChange("compressionRatio", value)
              }
              min={1}
              max={10}
              step={0.5}
              disabled={disabled}
              className="w-full"
            />
          </div>

          {/* Stereo Width */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300">Stereo Width</label>
              <span className="text-xs text-slate-400">
                {settings.stereoWidth}%
              </span>
            </div>
            <Slider
              value={[settings.stereoWidth]}
              onValueChange={([value]) =>
                handleSettingChange("stereoWidth", value)
              }
              max={100}
              step={1}
              disabled={disabled}
              className="w-full"
            />
          </div>

          {/* Bass Boost */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300">Bass Boost</label>
              <span className="text-xs text-slate-400">
                {settings.bassBoost > 0 ? "+" : ""}
                {settings.bassBoost}dB
              </span>
            </div>
            <Slider
              value={[settings.bassBoost]}
              onValueChange={([value]) =>
                handleSettingChange("bassBoost", value)
              }
              min={-12}
              max={12}
              step={0.5}
              disabled={disabled}
              className="w-full"
            />
          </div>

          {/* Treble Enhancement */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300">
                Treble Enhancement
              </label>
              <span className="text-xs text-slate-400">
                {settings.trebleEnhancement > 0 ? "+" : ""}
                {settings.trebleEnhancement}dB
              </span>
            </div>
            <Slider
              value={[settings.trebleEnhancement]}
              onValueChange={([value]) =>
                handleSettingChange("trebleEnhancement", value)
              }
              min={-12}
              max={12}
              step={0.5}
              disabled={disabled}
              className="w-full"
            />
          </div>
        </div>

        {/* Track Info */}
        {track && (
          <div className="pt-4 border-t border-slate-600">
            <h4 className="text-sm font-medium text-white mb-2">
              Track Information
            </h4>
            <div className="space-y-1 text-xs text-slate-400">
              <div>
                Status: <span className="text-white">{track.status}</span>
              </div>
              {track.metadata && (
                <>
                  <div>
                    Duration:{" "}
                    <span className="text-white">
                      {Math.round(track.metadata.duration)}s
                    </span>
                  </div>
                  <div>
                    Sample Rate:{" "}
                    <span className="text-white">
                      {track.metadata.sampleRate}Hz
                    </span>
                  </div>
                  <div>
                    Channels:{" "}
                    <span className="text-white">
                      {track.metadata.channels}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
