import React, { useEffect, useState } from 'react';
import { DeckControls } from '@/hooks/useWebAudio';
import { TempoControl } from './TempoControl';

interface DeckPitchFaderProps {
    deck: DeckControls;
    color: 'cyan' | 'purple';
}

export const DeckPitchFader = ({ deck, color }: DeckPitchFaderProps) => {
    // Pitch Fader State (Visual 0-1, maps to +/-8%)
    // Center 0.5 = 0% Bend
    const [pitchFader, setPitchFader] = useState(0.5);

    useEffect(() => {
        // Sync fader to deck state (e.g. if Sync resets it)
        // If deck.state.tempoBend is defined, use it. Default 0.5.
        // We use slightly loose comparison or fallback for safety
        const currentBend = deck.state.tempoBend ?? 0.5;
        setPitchFader(currentBend);
    }, [deck.state.tempoBend]);

    const handlePitchChange = (val: number) => {
        setPitchFader(val);
        deck.setTempoBend(val);
    };

    const handleNudge = (dir: 'left' | 'right', active: boolean) => {
        if (!active) {
            // Return to fader position
            deck.setTempoBend(pitchFader);
        } else {
            // Apply Bend (Nudge)
            const delta = dir === 'left' ? -0.02 : 0.02; // Small nudge
            // We apply it to the underlying bend state
            // Logic: current bend + delta.
            // Note: This changes the effective rate but not the base rate.
            deck.setTempoBend(pitchFader + delta);
        }
    };

    // Nudge/Step buttons on the UI (Fine Tune)
    const handleStep = (dir: 1 | -1) => {
        // Move fader by 0.5%
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
