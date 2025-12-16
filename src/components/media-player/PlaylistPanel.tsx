import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music, Play, Trash2, Calendar, Activity, Disc } from 'lucide-react';
import { AudioFile } from '@/types/audio';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/utils/formatters';

interface PlaylistPanelProps {
  files: AudioFile[];
  currentFileId: string | null;
  onFileSelect: (file: AudioFile) => void;
  onFileDelete?: (fileId: string) => void;
  onClearAll?: () => void;
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
  files,
  currentFileId,
  onFileSelect,
  onFileDelete,
  onClearAll
}) => {

  const handleDelete = (e: React.MouseEvent, fileId: string, fileName: string) => {
    e.stopPropagation(); // Prevent triggering file selection

    if (window.confirm(`Delete "${fileName}" from playlist?`)) {
      if (onFileDelete) {
        onFileDelete(fileId);
        toast.success(`Deleted: ${fileName}`);
      }
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return new Date().toLocaleDateString();
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
          <Music className="h-5 w-5" />
          Playlist ({files.length})
        </h3>
        {files.length > 0 && onClearAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 px-2"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12 flex-1 flex flex-col items-center justify-center">
          <Music className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-100">No tracks loaded</p>
          <p className="text-sm text-slate-500 mt-2">
            Upload audio files to get started
          </p>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-950/50 rounded-lg border border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            <div className="col-span-6">Track</div>
            <div className="col-span-2 text-center">Quality</div>
            <div className="col-span-2 text-center">Added</div>
            <div className="col-span-1 text-center">Time</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          <ScrollArea className="flex-1 mt-2">
            <div className="space-y-2 pr-3 pb-2">
              {files.map(file => {
                const isPlaying = file.id === currentFileId;
                const bitrate = file.bitrate || 320;
                const sampleRate = file.sampleRate || 44100;
                const genre = "Electronic";

                return (
                  <div
                    key={file.id}
                    draggable
                    onDragStart={(e) => {
                      let title = file.title || file.name.replace(/\.[^/.]+$/, "");
                      let artist = file.artist || "Unknown Artist";

                      if (!file.artist && !file.title && file.name.includes(' - ')) {
                        const parts = file.name.replace(/\.[^/.]+$/, "").split(' - ');
                        if (parts.length >= 2) {
                          artist = parts[0].trim();
                          title = parts.slice(1).join(' - ').trim();
                        }
                      }

                      const dragData = {
                        ...file,
                        title,
                        artist,
                        // Ensure essential fields for MixerDeck
                        url: file.enhancedUrl || file.originalUrl,
                        key: file.harmonicKey
                      };

                      e.dataTransfer.setData("application/json", JSON.stringify(dragData));
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className={cn(
                      "grid grid-cols-12 gap-2 px-4 py-3 items-center rounded-lg border transition-all cursor-pointer group hover:bg-slate-800/60",
                      isPlaying
                        ? "bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                        : "bg-slate-900/40 border-slate-800/50 hover:border-cyan-500/30"
                    )}
                    onClick={() => onFileSelect(file)}
                  >
                    {/* File Name & Icon */}
                    <div className="col-span-6 flex items-center gap-3 overflow-hidden">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "w-8 h-8 rounded flex items-center justify-center shrink-0 transition-colors border hover:scale-105",
                          isPlaying
                            ? "bg-cyan-500 text-white border-cyan-400 hover:bg-cyan-400"
                            : "bg-slate-800 text-slate-400 border-slate-700 group-hover:text-cyan-400 group-hover:border-cyan-500/30 hover:bg-slate-700"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onFileSelect(file);
                        }}
                      >
                        {isPlaying ? <Activity className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </Button>
                      <div className="min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate transition-colors",
                          isPlaying ? "text-cyan-300" : "text-slate-200 group-hover:text-white"
                        )}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Disc className="w-3 h-3" /> {genre}
                        </p>
                      </div>
                    </div>

                    {/* Quality */}
                    <div className="col-span-2 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-mono text-slate-400">{bitrate}kbps</span>
                      <span className="text-[10px] font-mono text-slate-500">{sampleRate / 1000}kHz</span>
                    </div>

                    {/* Date Added */}
                    <div className="col-span-2 flex items-center justify-center gap-1 text-[10px] text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(file.lastModified)}
                    </div>

                    {/* Duration */}
                    <div className="col-span-1 text-center text-xs text-slate-400 font-mono">
                      {formatDuration(file.duration || 0)}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex justify-end">
                      {onFileDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(e, file.id, file.name)}
                          className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </Card>
  );
};