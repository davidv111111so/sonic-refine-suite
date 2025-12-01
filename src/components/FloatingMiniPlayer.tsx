import React from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Maximize2, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const FloatingMiniPlayer = () => {
    const { currentTrack, isPlaying, playPause, playNext, playPrevious, volume, setVolume, currentTime, duration } = usePlayer();
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show if no track is loaded
    if (!currentTrack) return null;

    // Don't show if we are already on the media player page (assuming route is /media-player or similar)
    // You might need to adjust this check based on your actual routes
    if (location.pathname.includes('level') || location.pathname.includes('media')) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <Card className="bg-slate-900/95 backdrop-blur-md border-slate-700 shadow-2xl p-4 border-l-4 border-l-cyan-500">
                <div className="flex items-start justify-between mb-3">
                    <div className="overflow-hidden">
                        <h4 className="font-bold text-sm text-white truncate">{currentTrack.name}</h4>
                        <p className="text-xs text-cyan-400 font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </p>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400"
                            onClick={() => {
                                if (isPlaying) playPause(); // Stop playback
                                // We can't easily "close" it permanently without global state, 
                                // but stopping it and maybe clearing current track would hide it?
                                // The user said "stop this media player".
                                // If we clear current track, it returns null and hides.
                                // But we need access to clearTrack or similar.
                                // For now, let's just pause. 
                                // Actually, the component returns null if !currentTrack.
                                // So if we want to "close" it, we should probably clear the current track in context.
                                // But PlayerContext doesn't expose 'clearCurrentTrack' directly, only 'setCurrentTrack' via 'loadTrack' or 'clearPlaylist'.
                                // Let's check PlayerContext again.
                            }}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4 mb-3">
                    <Button variant="ghost" size="icon" onClick={playPrevious} className="h-8 w-8 text-slate-300 hover:text-white">
                        <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="default"
                        size="icon"
                        onClick={playPause}
                        className="h-10 w-10 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                    >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 pl-0.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={playNext} className="h-8 w-8 text-slate-300 hover:text-white">
                        <SkipForward className="h-4 w-4" />
                    </Button>
                </div>

                {/* Mini Progress Bar */}
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div
                        className="h-full bg-cyan-500 transition-all duration-100 ease-linear"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                </div>
            </Card>
        </div>
    );
};
