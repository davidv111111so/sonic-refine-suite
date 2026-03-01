import { useState, useCallback } from 'react';

export interface HotCue {
    time: number;     // Position in seconds
    label: string;    // Display label (1-8)
    color: string;    // CSS color
}

// Standard DJ hot cue colors (Pioneer/Rekordbox standard)
export const HOT_CUE_COLORS = [
    '#e53e3e', // Red
    '#ed8936', // Orange
    '#ecc94b', // Yellow
    '#48bb78', // Green
    '#38b2ac', // Teal
    '#4299e1', // Blue
    '#9f7aea', // Purple
    '#ed64a6', // Pink
] as const;

export const useHotCues = (maxCues: number = 8) => {
    const [cues, setCues] = useState<(HotCue | null)[]>(
        Array(maxCues).fill(null)
    );

    // Set a hot cue at a specific pad index
    const setCue = useCallback((index: number, time: number) => {
        if (index < 0 || index >= maxCues) return;
        setCues(prev => {
            const next = [...prev];
            next[index] = {
                time,
                label: `${index + 1}`,
                color: HOT_CUE_COLORS[index % HOT_CUE_COLORS.length],
            };
            return next;
        });
    }, [maxCues]);

    // Delete a hot cue
    const deleteCue = useCallback((index: number) => {
        if (index < 0 || index >= maxCues) return;
        setCues(prev => {
            const next = [...prev];
            next[index] = null;
            return next;
        });
    }, [maxCues]);

    // Jump to cue (returns the time to seek to, or null)
    const getCueTime = useCallback((index: number): number | null => {
        if (index < 0 || index >= maxCues) return null;
        return cues[index]?.time ?? null;
    }, [cues, maxCues]);

    // Clear all cues
    const clearAll = useCallback(() => {
        setCues(Array(maxCues).fill(null));
    }, [maxCues]);

    return {
        cues,
        setCue,
        deleteCue,
        getCueTime,
        clearAll,
    };
};
