import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Wand2,
  Volume2,
  Filter,
  Zap,
  Settings,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Download,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SimpleAudioEnhancerProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
  onEnhance: () => void;
  isProcessing: boolean;
  hasFiles: boolean;
}

export const SimpleAudioEnhancer = ({
  settings,
  onSettingChange,
  onEnhance,
  isProcessing,
  hasFiles,
}: SimpleAudioEnhancerProps) => {
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const presets = [
    {
      id: "vocal",
      name: "Vocal Enhancement",
      description: "Perfect for podcasts, voice recordings, and interviews",
      icon: "🎤",
      settings: {
        noiseReduction: true,
        noiseReductionLevel: 70,
        normalization: true,
        normalizationLevel: -3,
        compression: true,
        compressionRatio: 4,
        bassBoost: false,
        trebleEnhancement: true,
        trebleLevel: 25,
      },
    },
    {
      id: "music",
      name: "Music Mastering",
      description: "Enhanced clarity and punch for music tracks",
      icon: "🎵",
      settings: {
        noiseReduction: true,
        noiseReductionLevel: 30,
        normalization: true,
        normalizationLevel: -6,
        compression: true,
        compressionRatio: 3,
        bassBoost: true,
        bassBoostLevel: 20,
        trebleEnhancement: true,
        trebleLevel: 15,
      },
    },
    {
      id: "cleanup",
      name: "Audio Cleanup",
      description: "Remove noise and improve old recordings",
      icon: "🧹",
      settings: {
        noiseReduction: true,
        noiseReductionLevel: 80,
        normalization: true,
        normalizationLevel: -3,
        compression: false,
        bassBoost: false,
        trebleEnhancement: false,
      },
    },
  ];

  const applyPreset = (preset: any) => {
    Object.entries(preset.settings).forEach(([key, value]) => {
      onSettingChange(key, value);
    });
    setActivePreset(preset.id);
  };

  const ParameterTooltip = ({
    children,
    content,
  }: {
    children: React.ReactNode;
    content: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-xs bg-slate-800 text-white border-slate-600">
        <p className="text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="space-y-6">
      {/* Main Enhancement Header */}
      <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl text-white">
            <Wand2 className="h-8 w-8 text-blue-400" />
            Enhance Your Audio
          </CardTitle>
          <p className="text-blue-100 text-lg">
            Make your audio sound clearer and more professional with one-click
            enhancement
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-medium text-white">
                {hasFiles
                  ? "Ready to enhance your audio"
                  : "Upload audio files to get started"}
              </h3>
              <p className="text-slate-300 text-sm">
                {hasFiles
                  ? "Your files will be processed with professional-grade audio enhancement"
                  : "Drag and drop your audio files in the Upload tab"}
              </p>
            </div>
            <Button
              onClick={onEnhance}
              disabled={!hasFiles || isProcessing}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
            >
              {isProcessing ? (
                <>
                  <Zap className="h-5 w-5 mr-3 animate-pulse" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-3" />
                  Enhance Audio
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Presets */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5" />
            Quick Enhancement Presets
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Choose a preset that matches your audio type
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {presets.map((preset) => (
              <Button
                key={preset.id}
                variant={activePreset === preset.id ? "default" : "outline"}
                className={`h-auto p-4 flex flex-col items-start space-y-2 ${
                  activePreset === preset.id
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
                }`}
                onClick={() => applyPreset(preset)}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="text-2xl">{preset.icon}</span>
                  <span className="font-medium">{preset.name}</span>
                  {activePreset === preset.id && (
                    <Badge variant="secondary" className="ml-auto">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-left opacity-80">
                  {preset.description}
                </p>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interactive Audio Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="h-5 w-5" />
            Audio Enhancement Controls
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Fine-tune your audio enhancement settings
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Noise Reduction */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ParameterTooltip content="Removes background noise, hiss, and unwanted sounds from your audio">
                  <div className="flex items-center gap-2 cursor-help">
                    <span className="text-sm font-medium text-white">
                      🧹 Noise Reduction
                    </span>
                    <HelpCircle className="h-4 w-4 text-slate-400" />
                  </div>
                </ParameterTooltip>
              </div>
              <Switch
                checked={settings.noiseReduction}
                onCheckedChange={(checked) =>
                  onSettingChange("noiseReduction", checked)
                }
              />
            </div>
            {settings.noiseReduction && (
              <div className="space-y-2 pl-6">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Intensity</span>
                  <span className="text-blue-400 font-medium">
                    {settings.noiseReductionLevel <= 30
                      ? "Light"
                      : settings.noiseReductionLevel <= 60
                        ? "Medium"
                        : "Heavy"}
                  </span>
                </div>
                <Slider
                  value={[settings.noiseReductionLevel]}
                  onValueChange={([value]) =>
                    onSettingChange("noiseReductionLevel", value)
                  }
                  min={10}
                  max={90}
                  step={5}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Volume Normalization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <ParameterTooltip content="Automatically adjusts volume levels for consistent loudness across your audio">
                <div className="flex items-center gap-2 cursor-help">
                  <span className="text-sm font-medium text-white">
                    📊 Volume Normalization
                  </span>
                  <HelpCircle className="h-4 w-4 text-slate-400" />
                </div>
              </ParameterTooltip>
              <Switch
                checked={settings.normalization}
                onCheckedChange={(checked) =>
                  onSettingChange("normalization", checked)
                }
              />
            </div>
            {settings.normalization && (
              <div className="space-y-2 pl-6">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Target Level</span>
                  <span className="text-blue-400 font-medium">
                    {settings.normalizationLevel} dB
                  </span>
                </div>
                <Slider
                  value={[settings.normalizationLevel]}
                  onValueChange={([value]) =>
                    onSettingChange("normalizationLevel", value)
                  }
                  min={-12}
                  max={0}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Bass Boost */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <ParameterTooltip content="Enhances low-frequency sounds to add warmth and depth to your audio">
                <div className="flex items-center gap-2 cursor-help">
                  <span className="text-sm font-medium text-white">
                    🔊 Bass Boost
                  </span>
                  <HelpCircle className="h-4 w-4 text-slate-400" />
                </div>
              </ParameterTooltip>
              <Switch
                checked={settings.bassBoost}
                onCheckedChange={(checked) =>
                  onSettingChange("bassBoost", checked)
                }
              />
            </div>
            {settings.bassBoost && (
              <div className="space-y-2 pl-6">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Boost Level</span>
                  <span className="text-blue-400 font-medium">
                    {settings.bassBoostLevel}%
                  </span>
                </div>
                <Slider
                  value={[settings.bassBoostLevel]}
                  onValueChange={([value]) =>
                    onSettingChange("bassBoostLevel", value)
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Treble Enhancement */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <ParameterTooltip content="Brightens high-frequency sounds to improve clarity and detail">
                <div className="flex items-center gap-2 cursor-help">
                  <span className="text-sm font-medium text-white">
                    ✨ Treble Enhancement
                  </span>
                  <HelpCircle className="h-4 w-4 text-slate-400" />
                </div>
              </ParameterTooltip>
              <Switch
                checked={settings.trebleEnhancement}
                onCheckedChange={(checked) =>
                  onSettingChange("trebleEnhancement", checked)
                }
              />
            </div>
            {settings.trebleEnhancement && (
              <div className="space-y-2 pl-6">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Enhancement Level</span>
                  <span className="text-blue-400 font-medium">
                    {settings.trebleLevel}%
                  </span>
                </div>
                <Slider
                  value={[settings.trebleLevel]}
                  onValueChange={([value]) =>
                    onSettingChange("trebleLevel", value)
                  }
                  min={0}
                  max={50}
                  step={5}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Dynamic Compression */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <ParameterTooltip content="Balances loud and quiet parts of your audio for more consistent volume">
                <div className="flex items-center gap-2 cursor-help">
                  <span className="text-sm font-medium text-white">
                    ⚖️ Dynamic Compression
                  </span>
                  <HelpCircle className="h-4 w-4 text-slate-400" />
                </div>
              </ParameterTooltip>
              <Switch
                checked={settings.compression}
                onCheckedChange={(checked) =>
                  onSettingChange("compression", checked)
                }
              />
            </div>
            {settings.compression && (
              <div className="space-y-2 pl-6">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Compression Ratio</span>
                  <span className="text-blue-400 font-medium">
                    {settings.compressionRatio <= 2
                      ? "2:1 (Light)"
                      : settings.compressionRatio <= 4
                        ? "4:1 (Medium)"
                        : "8:1 (Heavy)"}
                  </span>
                </div>
                <Slider
                  value={[settings.compressionRatio]}
                  onValueChange={([value]) =>
                    onSettingChange("compressionRatio", value)
                  }
                  min={1}
                  max={8}
                  step={0.5}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Installation Guide (Collapsible) */}
      <Collapsible open={showInstallGuide} onOpenChange={setShowInstallGuide}>
        <Card className="bg-slate-800/50 border-slate-700">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Download className="h-5 w-5" />
                  Advanced: FFmpeg Installation Guide
                </CardTitle>
                {showInstallGuide ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
              <p className="text-slate-400 text-sm">
                For advanced users who want to use FFmpeg directly on their
                computer
              </p>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                      🪟 Windows
                    </h4>
                    <div className="space-y-2 text-sm text-slate-300">
                      <p>
                        Option 1: Download from{" "}
                        <code className="bg-slate-700 px-1 rounded">
                          ffmpeg.org
                        </code>
                      </p>
                      <p>
                        Option 2:{" "}
                        <code className="bg-slate-700 px-1 rounded">
                          winget install FFmpeg
                        </code>
                      </p>
                      <p>
                        Option 3:{" "}
                        <code className="bg-slate-700 px-1 rounded">
                          choco install ffmpeg
                        </code>
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                      🍎 macOS
                    </h4>
                    <div className="space-y-2 text-sm text-slate-300">
                      <p>
                        <code className="bg-slate-700 px-1 rounded">
                          brew install ffmpeg
                        </code>
                      </p>
                      <p>
                        Or download from{" "}
                        <code className="bg-slate-700 px-1 rounded">
                          ffmpeg.org
                        </code>
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                      🐧 Linux
                    </h4>
                    <div className="space-y-2 text-sm text-slate-300">
                      <p>
                        Ubuntu/Debian:{" "}
                        <code className="bg-slate-700 px-1 rounded">
                          sudo apt install ffmpeg
                        </code>
                      </p>
                      <p>
                        CentOS/RHEL:{" "}
                        <code className="bg-slate-700 px-1 rounded">
                          sudo yum install ffmpeg
                        </code>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-300 mb-2">
                    💡 Pro Tip
                  </h4>
                  <p className="text-xs text-slate-300">
                    This web application handles all the processing for you - no
                    need to install FFmpeg unless you want to use command-line
                    tools directly.
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
