import { useState, useCallback, useRef } from 'react';

interface CueLogicProps {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    bpm: number;
    onSeek: (time: number, forcePause?: boolean) => void;
    onPlay: () => void;
    onPause: () => void;
    quantize?: boolean; // Snap to grid
}

export const useCueLogic = ({
    currentTime,
    duration,
    isPlaying,
    bpm,
    onSeek,
    onPlay,
    onPause,
    quantize = true
}: CueLogicProps) => {
    // Persistent Cue Point (in seconds)
    // In a real app, this might come from a DB, but locally state is fine per session.
    const [cuePoint, setCuePointState] = useState<number | null>(null);
    const cuePointRef = useRef<number | null>(null);

    // Helper to snap to nearest beat
    const getQuantizedTime = useCallback((time: number) => {
        if (!quantize || !bpm) return time;
        const beatDuration = 60 / bpm;
        const beatIndex = Math.round(time / beatDuration);
        return beatIndex * beatDuration;
    }, [bpm, quantize]);

    const setCuePoint = useCallback((time: number) => {
        const t = getQuantizedTime(time);
        // Clamp to duration
        const safeT = Math.max(0, Math.min(t, duration));
        setCuePointState(safeT);
        cuePointRef.current = safeT;
    }, [duration, getQuantizedTime]);

    const isHoldingRef = useRef(false);

    // Main CUE Button Handler (Traktor Logic)
    const handleCue = useCallback((isDown: boolean) => {
        if (isDown) {
            isHoldingRef.current = true;
            if (isPlaying) {
                // If Playing: Stop and Jump to last Cue Point
                onPause();
                const target = cuePointRef.current !== null ? cuePointRef.current : 0;
                onSeek(target, true);
            } else {
                // If Paused:
                const currentT = currentTime;
                const cueT = cuePointRef.current !== null ? cuePointRef.current : 0;

                // If we are already at the cue point, start playing while held (Cue Play)
                if (Math.abs(currentT - cueT) < 0.1) {
                    onPlay();
                } else {
                    // Set new Cue Point at current location
                    const newCue = getQuantizedTime(currentT);
                    setCuePoint(newCue);
                    onSeek(newCue, true);
                }
            }
        } else {
            // RELEASE
            if (isHoldingRef.current) {
                isHoldingRef.current = false;
                onPause();
                const target = cuePointRef.current !== null ? cuePointRef.current : 0;
                onSeek(target, true);
            }
        }
    }, [isPlaying, currentTime, onPause, onPlay, onSeek, getQuantizedTime, setCuePoint]);

    // Jump / HotCue
    const jumpToCue = useCallback(() => {
        const target = cuePointRef.current !== null ? cuePointRef.current : 0;
        onSeek(target);
    }, [onSeek]);

    const clearCuePoint = useCallback(() => {
        setCuePointState(null);
        cuePointRef.current = null;
    }, []);

    return {
        cuePoint,
        setCuePoint,
        handleCue,
        jumpToCue,
        clearCuePoint
    };
};
