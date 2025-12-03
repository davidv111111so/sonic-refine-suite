import React from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { Button } from '@/components/ui/button';
import { Play, Pause, X, Maximize2, SkipForward, SkipBack } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface MiniPlayerProps {
    onExpand: () => void;
    onClose: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onExpand, onClose }) => {
    const { currentTrack, isPlaying, playPause, volume, setVolume, playNext, playPrevious } = usePlayer();

    if (!currentTrack) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.2)] p-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-sm font-medium text-white truncate max-w-[180px]">
                        {currentTrack.name}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-white"
                        onClick={onExpand}
                    >
                        <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-red-400"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-center gap-4 mb-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-300 hover:text-white"
                    onClick={playPrevious}
                >
                    <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                    variant="default"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/20"
                    onClick={playPause}
                >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-300 hover:text-white"
                    onClick={playNext}
                >
                    <SkipForward className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <Slider
                    value={[volume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(v) => setVolume(v[0])}
                    className="h-1.5"
                />
            </div>
        </div>
    );
};
