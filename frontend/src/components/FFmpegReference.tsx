import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, Copy, ExternalLink } from "lucide-react";
import {
  generateFFmpegCommand,
  professionalPresets,
} from "@/utils/audioEnhancement";
import { useToast } from "@/hooks/use-toast";

interface FFmpegReferenceProps {
  settings: any;
  fileName?: string;
}

export const FFmpegReference = ({
  settings,
  fileName = "input.wav",
}: FFmpegReferenceProps) => {
  const [showCommands, setShowCommands] = useState(false);
  const { toast } = useToast();

  const outputFileName = `enhanced_${fileName.replace(/\.[^.]+$/, "")}.${settings.outputFormat}`;
  const ffmpegCommand = generateFFmpegCommand(
    fileName,
    outputFileName,
    settings,
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "FFmpeg command copied successfully",
    });
  };

  const professionalCommands = Object.entries(professionalPresets).map(
    ([name, preset]) => ({
      name,
      command: generateFFmpegCommand(
        fileName,
        `${name.toLowerCase().replace(/\s+/g, "_")}_${outputFileName}`,
        preset,
      ),
    }),
  );

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-lg">
          <Terminal className="h-4 w-4" />
          Professional Audio Enhancement Reference
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Use these FFmpeg commands for professional-grade audio enhancement
              on your local machine.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCommands(!showCommands)}
              className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
            >
              {showCommands ? "Hide" : "Show"} Commands
            </Button>
          </div>

          {showCommands && (
            <div className="space-y-4">
              {/* Current Settings Command */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white">
                    Current Settings
                  </h4>
                  <Badge
                    variant="outline"
                    className="text-blue-400 border-blue-400"
                  >
                    {settings.outputFormat.toUpperCase()} |{" "}
                    {settings.targetBitrate}kbps | {settings.sampleRate / 1000}
                    kHz
                  </Badge>
                </div>
                <div className="relative">
                  <pre className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs text-green-400 font-mono overflow-x-auto">
                    {ffmpegCommand}
                  </pre>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 h-6 w-6 hover:bg-slate-700"
                    onClick={() => copyToClipboard(ffmpegCommand)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Professional Presets */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">
                  Professional Presets
                </h4>
                {professionalCommands.map(({ name, command }) => (
                  <div key={name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs hover:bg-slate-700"
                        onClick={() => copyToClipboard(command)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <pre className="bg-slate-900/80 border border-slate-700 rounded p-2 text-xs text-slate-300 font-mono overflow-x-auto">
                      {command}
                    </pre>
                  </div>
                ))}
              </div>

              {/* Installation Instructions */}
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                <h4 className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  FFmpeg Installation
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <p>
                    <strong>Windows:</strong> Download from{" "}
                    <code>ffmpeg.org</code> or use{" "}
                    <code>winget install FFmpeg</code>
                  </p>
                  <p>
                    <strong>macOS:</strong> <code>brew install ffmpeg</code>
                  </p>
                  <p>
                    <strong>Linux:</strong> <code>sudo apt install ffmpeg</code>{" "}
                    (Ubuntu/Debian) or <code>sudo yum install ffmpeg</code>{" "}
                    (CentOS/RHEL)
                  </p>
                </div>
              </div>

              {/* Parameter Explanations */}
              <div className="mt-6 p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                <h4 className="text-sm font-medium text-purple-300 mb-2">
                  Key Parameters Explained
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div>
                    <code className="text-green-400">afftdn</code> - Advanced
                    FFT-based noise reduction
                  </div>
                  <div>
                    <code className="text-green-400">loudnorm</code> - EBU R128
                    loudness normalization
                  </div>
                  <div>
                    <code className="text-green-400">acompressor</code> -
                    Dynamic range compression
                  </div>
                  <div>
                    <code className="text-green-400">alimiter</code> -
                    Brick-wall limiting
                  </div>
                  <div>
                    <code className="text-green-400">equalizer</code> - Precise
                    frequency adjustment
                  </div>
                  <div>
                    <code className="text-green-400">-ar</code> - Audio sample
                    rate
                  </div>
                  <div>
                    <code className="text-green-400">-b:a</code> - Audio bitrate
                  </div>
                  <div>
                    <code className="text-green-400">-c:a</code> - Audio codec
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
