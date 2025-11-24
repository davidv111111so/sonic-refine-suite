import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, ArrowUpRight } from "lucide-react";

interface MiniPlayerProps {
    currentFile: {
        id: string;
        name: string;
    } | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    onPlayPause: () => void;
    onClose: () => void;
    onNavigateToPlayer: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
    currentFile,
    isPlaying,
    currentTime,
    duration,
    onPlayPause,
    onClose,
    onNavigateToPlayer,
}) => {
    if (!currentFile) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <Card className="fixed bottom-6 right-6 z-50 w-80 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-cyan-500/30 shadow-2xl shadow-cyan-500/20 animate-in slide-in-from-bottom-5">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700/50 rounded-t-lg overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="p-4 pt-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 mr-2">
                        <p className="text-sm font-semibold text-cyan-400 truncate">
                            {currentFile.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </p>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onNavigateToPlayer}
                            className="h-7 w-7 text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                            title="Go to Media Player"
                        >
                            <ArrowUpRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-slate-800"
                            title="Stop playback"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center">
                    <Button
                        variant="default"
                        size="icon"
                        onClick={onPlayPause}
                        className="h-12 w-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/30"
                    >
                        {isPlaying ? (
                            <Pause className="h-5 w-5" />
                        ) : (
                            <Play className="h-5 w-5 ml-0.5" />
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
};
