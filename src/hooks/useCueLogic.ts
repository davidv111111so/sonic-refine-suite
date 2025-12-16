import { useState, useCallback, useRef } from 'react';

interface CueLogicProps {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    bpm: number;
    onSeek: (time: number) => void;
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

    // Main CUE Button Handler (Traktor Logic)
    const handleCue = useCallback((isDown: boolean) => {
        if (isDown) {
            // PRESS
            if (isPlaying) {
                // If Playing: Stop and Jump to last Cue Point
                onPause();
                const target = cuePointRef.current !== null ? cuePointRef.current : 0;
                onSeek(target);
            } else {
                // If Paused: Set new Cue Point at current location
                // Traditionally, pressing CUE while paused sets the point AND plays while held (Cue Play)
                // But simplified "set" logic is often preferred for web.

                // Let's implement standard Pioneer/Traktor:
                // If paused, it sets the CUE point to NOW (if not already at cue).
                // If already at CUE, it plays while held.

                // Simplified Logic Phase 1:
                // Paused -> Set Cue.

                const newCue = getQuantizedTime(currentTime);
                setCuePoint(newCue);
                onSeek(newCue); // Snap playhead to it visually
            }
        }
        // RELEASE (Optional Cue Play logic would go here)
    }, [isPlaying, currentTime, onPause, onSeek, getQuantizedTime, setCuePoint]);

    // Jump / HotCue
    const jumpToCue = useCallback(() => {
        const target = cuePointRef.current !== null ? cuePointRef.current : 0;
        onSeek(target);
    }, [onSeek]);

    return {
        cuePoint,
        setCuePoint,
        handleCue,
        jumpToCue
    };
};
