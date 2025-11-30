import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music, Play, Trash2, Pause, Calendar, Radio, Activity, Disc } from 'lucide-react';
import { AudioFile } from '@/types/audio';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatFileSize, formatDuration } from '@/utils/formatters';

interface PlaylistPanelProps {
  files: AudioFile[];
  currentFileId: string | null;
  onFileSelect: (file: AudioFile) => void;
  onFileDelete?: (fileId: string) => void;
  onClearAll?: () => void;
}

const getKeyColor = (key: string | undefined) => {
  if (!key || key === 'N/A') return 'bg-slate-800 text-slate-400 border-slate-700';

  // Camelot wheel colors approximation
  const keyNum = parseInt(key);
  if (isNaN(keyNum)) return 'bg-slate-800 text-slate-400 border-slate-700';

  // Warm colors for major/minor mix
  if (key.includes('B')) {
    // Major keys - brighter/warmer
    if (keyNum <= 3) return 'bg-green-900/50 text-green-400 border-green-800'; // 1-3
    if (keyNum <= 6) return 'bg-cyan-900/50 text-cyan-400 border-cyan-800';   // 4-6
    if (keyNum <= 9) return 'bg-blue-900/50 text-blue-400 border-blue-800';    // 7-9
    return 'bg-purple-900/50 text-purple-400 border-purple-800';               // 10-12
  } else {
    // Minor keys - darker/cooler
    if (keyNum <= 3) return 'bg-emerald-950/50 text-emerald-500 border-emerald-900';
    if (keyNum <= 6) return 'bg-sky-950/50 text-sky-500 border-sky-900';
    if (keyNum <= 9) return 'bg-indigo-950/50 text-indigo-500 border-indigo-900';
    return 'bg-fuchsia-950/50 text-fuchsia-500 border-fuchsia-900';
  }
};

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
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
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
        <div className="text-center py-12">
          <Music className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-100">No tracks loaded</p>
          <p className="text-sm text-slate-500 mt-2">
            Upload audio files to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-950/50 rounded-lg border border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <div className="col-span-4">Track</div>
            <div className="col-span-1 text-center">Key</div>
            <div className="col-span-1 text-center">BPM</div>
            <div className="col-span-2 text-center">Quality</div>
            <div className="col-span-2 text-center">Added</div>
            <div className="col-span-1 text-center">Time</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          <ScrollArea className="h-[400px] pr-2">
            <div className="space-y-2">
              {files.map(file => {
                const isPlaying = file.id === currentFileId;
                // Mock data for new columns if missing
                const bitrate = file.bitrate || 320;
                const sampleRate = file.sampleRate || 44100;
                const genre = "Electronic"; // Placeholder

                return (
                  <div
                    key={file.id}
                    className={cn(
                      "grid grid-cols-12 gap-2 px-4 py-3 items-center rounded-lg border transition-all cursor-pointer group",
                      isPlaying
                        ? "bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                        : "bg-slate-900/40 border-slate-800/50 hover:bg-slate-800/60 hover:border-cyan-500/30"
                    )}
                    onClick={() => onFileSelect(file)}
                  >
                    {/* File Name & Icon */}
                    <div className="col-span-4 flex items-center gap-3 overflow-hidden">
                      <div className={cn(
                        "w-8 h-8 rounded flex items-center justify-center shrink-0 transition-colors border",
                        isPlaying
                          ? "bg-cyan-500 text-white border-cyan-400"
                          : "bg-slate-800 text-slate-400 border-slate-700 group-hover:text-cyan-400 group-hover:border-cyan-500/30"
                      )}>
                        {isPlaying ? <Activity className="w-4 h-4 animate-pulse" /> : <Music className="w-4 h-4" />}
                      </div>
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

                    {/* Key */}
                    <div className="col-span-1 flex justify-center">
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded border shadow-sm",
                        getKeyColor(file.harmonicKey)
                      )}>
                        {file.harmonicKey || 'N/A'}
                      </span>
                    </div>

                    {/* BPM */}
                    <div className="col-span-1 text-center text-xs font-bold text-slate-400 font-mono group-hover:text-cyan-400 transition-colors">
                      {file.bpm || '-'}
                    </div>

                    {/* Quality (Bitrate/SampleRate) */}
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