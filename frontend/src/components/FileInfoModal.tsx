import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AudioFile } from "@/types/audio";
import { Music, Clock, HardDrive, Headphones, Settings } from "lucide-react";

interface FileInfoModalProps {
  file: AudioFile | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDuration = (seconds: number) => {
  if (!seconds) return "Unknown";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const getFileType = (filename: string): string => {
  const ext = filename.toLowerCase().split(".").pop();
  return ext ? ext.toUpperCase() : "UNKNOWN";
};

export const FileInfoModal = ({
  file,
  isOpen,
  onClose,
}: FileInfoModalProps) => {
  if (!file) return null;

  const fileType = getFileType(file.name);
  const statusColor = {
    uploaded: "bg-blue-500",
    processing: "bg-orange-500",
    enhanced: "bg-green-500",
    error: "bg-red-500",
  }[file.status];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-600 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-cyan-400">
            <Music className="h-5 w-5" />
            File Information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Name */}
          <div>
            <label className="text-sm text-slate-400 mb-1 block">
              File Name
            </label>
            <p className="text-white font-medium break-words">{file.name}</p>
          </div>

          {/* Artist & Title */}
          {(file.artist || file.title) && (
            <div className="grid grid-cols-2 gap-4">
              {file.artist && (
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">
                    Artist
                  </label>
                  <p className="text-white">{file.artist}</p>
                </div>
              )}
              {file.title && (
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">
                    Title
                  </label>
                  <p className="text-white">{file.title}</p>
                </div>
              )}
            </div>
          )}

          {/* File Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-sm text-slate-400 mb-1">
                <HardDrive className="h-3 w-3" />
                File Size
              </label>
              <div>
                <p className="text-white font-mono">
                  {formatFileSize(file.size)}
                </p>
                {file.enhancedSize && file.status === "enhanced" && (
                  <p className="text-green-400 font-mono text-sm">
                    Enhanced: {formatFileSize(file.enhancedSize)}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1 text-sm text-slate-400 mb-1">
                <Settings className="h-3 w-3" />
                Format
              </label>
              <Badge
                variant="outline"
                className="bg-slate-700 text-white border-slate-500"
              >
                {fileType}
              </Badge>
            </div>
          </div>

          {/* Audio Properties */}
          <div className="grid grid-cols-2 gap-4">
            {file.duration && (
              <div>
                <label className="flex items-center gap-1 text-sm text-slate-400 mb-1">
                  <Clock className="h-3 w-3" />
                  Duration
                </label>
                <p className="text-white font-mono">
                  {formatDuration(file.duration)}
                </p>
              </div>
            )}

            {file.bitrate && (
              <div>
                <label className="flex items-center gap-1 text-sm text-slate-400 mb-1">
                  <Headphones className="h-3 w-3" />
                  Bitrate
                </label>
                <p className="text-white font-mono">{file.bitrate} kbps</p>
              </div>
            )}
          </div>

          {file.sampleRate && (
            <div>
              <label className="text-sm text-slate-400 mb-1 block">
                Sample Rate
              </label>
              <p className="text-white font-mono">{file.sampleRate} Hz</p>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Status</label>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
              <span className="text-white capitalize">{file.status}</span>
              {file.progress !== undefined && file.status === "processing" && (
                <span className="text-slate-400 text-sm">
                  ({file.progress}%)
                </span>
              )}
            </div>
            {file.processingStage && (
              <p className="text-slate-400 text-sm mt-1">
                {file.processingStage}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
