import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music, Play, Trash2, Calendar, Activity, Disc, Zap, Target } from 'lucide-react';
import { AudioFile } from '@/types/audio';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/utils/formatters';
import { getKeyCompatibility, getBpmCompatibility, CompatibilityResult } from '@/utils/harmonicMixing';

interface PlaylistPanelProps {
  files: AudioFile[];
  currentFileId: string | null;
  onFileSelect: (file: AudioFile) => void;
  onFileDelete?: (fileId: string) => void;
  onClearAll?: () => void;
  onLoadToDeck?: (file: AudioFile, deck: 'A' | 'B') => void;
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
  files,
  currentFileId,
  onFileSelect,
  onFileDelete,
  onClearAll,
  onLoadToDeck
}) => {
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: AudioFile } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Get the currently playing file for AI recommendations
  const currentFile = files.find(f => f.id === currentFileId);

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

  const handleContextMenu = (e: React.MouseEvent, file: AudioFile) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
          <Music className="h-5 w-5" />
          Playlist ({files.length})
          {currentFile && (
            <span className="text-[10px] text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/30 ml-2 flex items-center gap-1">
              <Zap className="w-3 h-3" /> AI Matching Active
            </span>
          )}
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
            <div className="col-span-5">Track</div>
            <div className="col-span-2 text-center">Key / BPM</div>
            <div className="col-span-2 text-center">Match</div>
            <div className="col-span-1 text-center">Time</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          <ScrollArea className="flex-1 mt-2">
            <div className="space-y-2 pr-3 pb-2">
              {files.map(file => {
                const isPlaying = file.id === currentFileId;

                // AI Compatibility Analysis
                let keyCompat: CompatibilityResult = { isCompatible: false, matchType: 'none', label: '', color: '' };
                let bpmScore = 0;
                if (currentFile && !isPlaying) {
                  keyCompat = getKeyCompatibility(currentFile.harmonicKey, file.harmonicKey);
                  bpmScore = getBpmCompatibility(currentFile.bpm, file.bpm);
                }
                const isRecommended = keyCompat.isCompatible && bpmScore > 0.5;

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
                        url: file.enhancedUrl || file.originalUrl,
                        key: file.harmonicKey
                      };

                      e.dataTransfer.setData("application/json", JSON.stringify(dragData));
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                    className={cn(
                      "grid grid-cols-12 gap-2 px-4 py-3 items-center rounded-lg border transition-all cursor-pointer group hover:bg-slate-800/60 relative",
                      isPlaying
                        ? "bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                        : isRecommended
                          ? "bg-emerald-950/15 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                          : "bg-slate-900/40 border-slate-800/50 hover:border-cyan-500/30"
                    )}
                    onClick={() => onFileSelect(file)}
                  >
                    {/* AI Recommended Badge */}
                    {isRecommended && !isPlaying && (
                      <div className="absolute -top-1.5 left-3 px-1.5 py-0.5 bg-emerald-500 text-black text-[7px] font-black rounded-sm uppercase tracking-widest shadow-lg">
                        AI PICK
                      </div>
                    )}

                    {/* File Name & Icon */}
                    <div className="col-span-5 flex items-center gap-3 overflow-hidden">
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
                          <Disc className="w-3 h-3" /> {file.artist || 'Unknown Artist'}
                        </p>
                      </div>
                    </div>

                    {/* Key & BPM */}
                    <div className="col-span-2 flex flex-col items-center justify-center gap-1">
                      {file.harmonicKey && (
                        <span className="text-[10px] font-bold text-purple-400 bg-purple-950/30 px-1.5 py-0.5 rounded border border-purple-500/20">
                          {file.harmonicKey}
                        </span>
                      )}
                      {file.bpm && (
                        <span className="text-[10px] font-mono text-slate-400">{Math.round(file.bpm)} BPM</span>
                      )}
                    </div>

                    {/* Compatibility Badge */}
                    <div className="col-span-2 flex flex-col items-center justify-center">
                      {isPlaying ? (
                        <span className="text-[9px] font-bold text-cyan-400">NOW PLAYING</span>
                      ) : keyCompat.isCompatible ? (
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            color: keyCompat.color,
                            borderColor: keyCompat.color + '40',
                            backgroundColor: keyCompat.color + '15'
                          }}
                        >
                          {keyCompat.matchType === 'perfect' && '🎯 '}
                          {keyCompat.matchType === 'harmonic' && '🔗 '}
                          {keyCompat.matchType === 'energy_boost' && '⚡ '}
                          {keyCompat.label}
                        </span>
                      ) : currentFile ? (
                        <span className="text-[9px] text-slate-600">—</span>
                      ) : null}
                    </div>

                    {/* Duration */}
                    <div className="col-span-1 text-center text-xs text-slate-400 font-mono">
                      {formatDuration(file.duration || 0)}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex justify-end gap-1">
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

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-[100] bg-[#1e1e1e] border border-[#444] rounded-lg shadow-2xl py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-150"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 flex items-center gap-2 transition-colors"
            onClick={() => {
              onFileSelect(contextMenu.file);
              setContextMenu(null);
            }}
          >
            <Play className="w-3 h-3" /> Play Track
          </button>
          {onLoadToDeck && (
            <>
              <div className="h-px bg-[#333] my-1" />
              <button
                className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 flex items-center gap-2 transition-colors"
                onClick={() => {
                  onLoadToDeck(contextMenu.file, 'A');
                  setContextMenu(null);
                  toast.success(`Loaded to Deck A: ${contextMenu.file.name}`);
                }}
              >
                <Target className="w-3 h-3 text-cyan-400" /> Load to Deck A
              </button>
              <button
                className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-purple-500/20 hover:text-purple-300 flex items-center gap-2 transition-colors"
                onClick={() => {
                  onLoadToDeck(contextMenu.file, 'B');
                  setContextMenu(null);
                  toast.success(`Loaded to Deck B: ${contextMenu.file.name}`);
                }}
              >
                <Target className="w-3 h-3 text-purple-400" /> Load to Deck B
              </button>
            </>
          )}
          {onFileDelete && (
            <>
              <div className="h-px bg-[#333] my-1" />
              <button
                className="w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-red-500/20 flex items-center gap-2 transition-colors"
                onClick={() => {
                  if (window.confirm(`Delete "${contextMenu.file.name}"?`)) {
                    onFileDelete(contextMenu.file.id);
                    toast.success(`Deleted: ${contextMenu.file.name}`);
                  }
                  setContextMenu(null);
                }}
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </>
          )}
        </div>
      )}
    </Card>
  );
};
