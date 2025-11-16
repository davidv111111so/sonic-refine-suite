import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Download, Trash2, Music } from "lucide-react";
import { AudioFile } from "@/types/audio";

interface AudioFileCardProps {
  file: AudioFile;
  onRemove: (id: string) => void;
  onPlay?: () => void;
  isPlaying?: boolean;
}

export const AudioFileCard = ({
  file,
  onRemove,
  onPlay,
  isPlaying,
}: AudioFileCardProps) => {
  const getStatusBadge = () => {
    switch (file.status) {
      case "uploaded":
        return <Badge variant="secondary">Ready</Badge>;
      case "processing":
        return <Badge variant="default">Processing</Badge>;
      case "enhanced":
        return (
          <Badge variant="outline" className="border-green-500 text-green-400">
            Enhanced
          </Badge>
        );
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* File info without thumbnail */}
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex-shrink-0">
              <Music className="h-8 w-8 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-white truncate">
                  {file.title || file.name}
                </h3>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{file.artist || "Unknown Artist"}</span>
                <span>•</span>
                <span>{formatFileSize(file.size)} MB</span>
                {file.duration && (
                  <>
                    <span>•</span>
                    <span>{formatDuration(file.duration)}</span>
                  </>
                )}
              </div>

              {/* Processing progress */}
              {file.status === "processing" && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">
                      {file.processingStage || "Processing..."}
                    </span>
                    <span className="text-blue-400">{file.progress || 0}%</span>
                  </div>
                  <Progress value={file.progress || 0} className="h-1" />
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {onPlay && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPlay}
                className="text-slate-400 hover:text-white"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}

            {file.status === "enhanced" && file.enhancedUrl && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-green-400 hover:text-green-300"
              >
                <a
                  href={file.enhancedUrl}
                  download={`${file.name}_enhanced.wav`}
                >
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(file.id)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
