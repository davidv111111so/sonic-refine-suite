import React, { useEffect, useState } from 'react';
import { DeckControls } from '@/hooks/useWebAudio';
import { TempoControl } from './TempoControl';

interface DeckPitchFaderProps {
    deck: DeckControls;
    color: 'cyan' | 'purple';
}

export const DeckPitchFader = ({ deck, color }: DeckPitchFaderProps) => {
    // Pitch Fader State (Visual 0-1, maps to rate)
    // Rate = 1 + (pitch - 0.5) * 0.16 (±8%)
    // So Pitch 0.5 = Rate 1.0
    const [pitchFader, setPitchFader] = useState(0.5);

    useEffect(() => {
        // Sync fader to actual playback rate if changed externally (e.g. Sync)
        const p = (deck.state.playbackRate - 1) / 0.16 + 0.5;
        setPitchFader(Math.max(0, Math.min(1, p)));
    }, [deck.state.playbackRate]);

    const handlePitchChange = (val: number) => {
        setPitchFader(val);
        const newRate = 1 + (val - 0.5) * 0.16;
        deck.setSpeed(newRate);
    };

    const handleNudge = (dir: 'left' | 'right', active: boolean) => {
        if (!active) {
            // Return to fader rate
            const targetRate = 1 + (pitchFader - 0.5) * 0.16;
            deck.setSpeed(targetRate);
        } else {
            const currentRate = deck.state.playbackRate;
            const delta = dir === 'left' ? -0.05 : 0.05;
            deck.setSpeed(currentRate + delta);
        }
    };

    // Nudge/Step buttons
    const handleStep = (dir: 1 | -1) => {
        // Move fader by 1% roughly
        // 1% speed change? Or 1% fader movement?
        // Let's do small fader step 0.01 (1%)
        const newVal = Math.max(0, Math.min(1, pitchFader + (dir * 0.005)));
        handlePitchChange(newVal);
    };

    return (
        <TempoControl
            pitch={pitchFader}
            setPitch={handlePitchChange}
            onNudge={handleNudge}
            keyLock={deck.state.keyLock}
            setKeyLock={deck.setKeyLock}
            color={color}
            onStep={handleStep}
        />
    );
};
