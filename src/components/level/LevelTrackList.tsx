import React from 'react';
import { Play, Download, Trash2, Music, CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AudioFile } from '@/types/audio';
import { formatFileSize, formatDuration } from '@/utils/formatters';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LevelTrackListProps {
    files: AudioFile[];
    onPlay: (file: AudioFile) => void;
    onDownload: (file: AudioFile) => void;
    onDelete: (fileId: string) => void;
    onClearAll: () => void;
    onConvert: (file: AudioFile, format: 'mp3' | 'wav' | 'flac') => void;
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

export const LevelTrackList = ({
    files,
    onPlay,
    onDownload,
    onDelete,
    onClearAll,
    onConvert
}: LevelTrackListProps) => {
    if (files.length === 0) return null;

    return (
        <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <div className="w-1 h-6 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                    Track List
                </h3>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400 font-medium">
                        {files.length} Files Processed
                    </span>
                    {files.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClearAll();
                            }}
                            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 h-8 border border-red-900/30"
                        >
                            Clear All
                        </Button>
                    )}
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-900/80 rounded-t-xl border-b border-cyan-900/30 text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm">
                <div className="col-span-3 text-cyan-300 drop-shadow-[0_0_5px_rgba(103,232,249,0.3)]">File Name</div>
                <div className="col-span-1 text-purple-300 drop-shadow-[0_0_5px_rgba(216,180,254,0.3)]">Key</div>
                <div className="col-span-1 text-blue-300 drop-shadow-[0_0_5px_rgba(147,197,253,0.3)]">BPM</div>
                <div className="col-span-1 text-slate-300">Size</div>
                <div className="col-span-1 text-slate-300">Duration</div>
                <div className="col-span-2 text-green-300 drop-shadow-[0_0_5px_rgba(134,239,172,0.3)]">Status</div>
                <div className="col-span-1 text-center text-pink-300 drop-shadow-[0_0_5px_rgba(249,168,212,0.3)]">Convert</div>
                <div className="col-span-2 text-right text-slate-300">Actions</div>
            </div>

            {/* Track List */}
            <div className="space-y-2">
                {files.map((file) => {
                    const fileExtension = file.name.split('.').pop()?.toLowerCase();
                    const isMp3 = fileExtension === 'mp3';
                    const isWav = fileExtension === 'wav';
                    const isFlac = fileExtension === 'flac';

                    return (
                        <div
                            key={file.id}
                            className={cn(
                                "grid grid-cols-12 gap-4 px-6 py-3 items-center",
                                "bg-slate-900/40 hover:bg-slate-800/60 transition-all duration-300",
                                "border border-slate-800/50 hover:border-cyan-500/30 rounded-xl",
                                "group hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                            )}
                        >
                            {/* File Name - Scrollable */}
                            <div className="col-span-3 flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-cyan-950/50 transition-colors border border-slate-700 group-hover:border-cyan-500/30">
                                    <Music className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                                </div>
                                <div className="relative overflow-hidden w-full mask-linear-fade">
                                    <div className="whitespace-nowrap animate-marquee hover:pause-animation">
                                        <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors inline-block pr-8">
                                            {file.name}
                                        </span>
                                        <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors inline-block pr-8">
                                            {file.name}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Key (Replaces Format) */}
                            <div className="col-span-1">
                                <span className={cn(
                                    "text-xs font-bold px-2 py-1 rounded border shadow-sm",
                                    getKeyColor(file.harmonicKey)
                                )}>
                                    {file.harmonicKey || 'N/A'}
                                </span>
                            </div>

                            {/* BPM */}
                            <div className="col-span-1 text-sm font-bold text-cyan-400/90 font-mono drop-shadow-[0_0_3px_rgba(34,211,238,0.3)]">
                                {file.bpm || '-'}
                            </div>

                            {/* Size */}
                            <div className="col-span-1 text-sm text-slate-400 font-mono">
                                {formatFileSize(file.size)}
                            </div>

                            {/* Duration */}
                            <div className="col-span-1 text-sm text-slate-400 font-mono">
                                {formatDuration(file.duration || 0)}
                            </div>

                            {/* Status */}
                            <div className="col-span-2">
                                {file.status === 'enhanced' ? (
                                    <div className="flex items-center gap-2 text-green-400 text-xs font-bold drop-shadow-[0_0_3px_rgba(74,222,128,0.3)]">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Complete
                                    </div>
                                ) : file.status === 'processing' ? (
                                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold animate-pulse">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing
                                    </div>
                                ) : file.status === 'error' ? (
                                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                                        <AlertCircle className="w-4 h-4" />
                                        Error
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                                        <div className="w-2 h-2 rounded-full bg-slate-600" />
                                        Ready
                                    </div>
                                )}
                            </div>

                            {/* Conversion Column */}
                            <div className="col-span-1 flex justify-center">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-pink-400 hover:bg-pink-950/20 transition-colors">
                                            <RefreshCw className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="center" className="bg-slate-900/95 border-slate-800 backdrop-blur-xl">
                                        {!isMp3 && (
                                            <DropdownMenuItem onClick={() => onConvert(file, 'mp3')} className="text-slate-300 focus:text-pink-400 focus:bg-pink-950/20 cursor-pointer font-medium">
                                                Convert to MP3
                                            </DropdownMenuItem>
                                        )}
                                        {!isWav && (
                                            <DropdownMenuItem onClick={() => onConvert(file, 'wav')} className="text-slate-300 focus:text-cyan-400 focus:bg-cyan-950/20 cursor-pointer font-medium">
                                                Convert to WAV
                                            </DropdownMenuItem>
                                        )}
                                        {!isFlac && (
                                            <DropdownMenuItem onClick={() => onConvert(file, 'flac')} className="text-slate-300 focus:text-purple-400 focus:bg-purple-950/20 cursor-pointer font-medium">
                                                Convert to FLAC
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Actions */}
                            <div className="col-span-2 flex items-center justify-end gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-8 h-8 rounded-full hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-400 transition-all duration-300"
                                    onClick={() => onPlay(file)}
                                    title="Play"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                </Button>

                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-8 h-8 rounded-full hover:bg-green-500/20 hover:text-green-400 text-slate-400 transition-all duration-300"
                                    onClick={() => onDownload(file)}
                                    disabled={!file.enhancedUrl}
                                    title="Download"
                                >
                                    <Download className="w-4 h-4" />
                                </Button>

                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-8 h-8 rounded-full hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-all duration-300"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(file.id);
                                    }}
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
