import React, { useEffect, useState, useRef } from 'react';
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
    const decayRef = useRef<number>();

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

    // Spring-Back Logic for Arrows
    const handleArrowDown = (dir: 1 | -1) => {
        if (decayRef.current) cancelAnimationFrame(decayRef.current);
        // Step size: 5% visual change to be noticeable
        const current = deck.state.tempoBend ?? 0.5;
        const newVal = Math.max(0, Math.min(1, current + (dir * 0.05)));
        handlePitchChange(newVal);
    };

    const handleArrowUp = () => {
        if (decayRef.current) cancelAnimationFrame(decayRef.current);
        // Instant visual snap (Audio engine handles smoothing)
        handlePitchChange(0.5);
    };

    return (
        <TempoControl
            pitch={pitchFader}
            setPitch={handlePitchChange}
            onNudge={handleNudge}
            keyLock={deck.state.keyLock}
            setKeyLock={deck.setKeyLock}
            color={color}
            onStepDown={handleArrowDown}
            onStepUp={handleArrowUp}
        />
    );
};
