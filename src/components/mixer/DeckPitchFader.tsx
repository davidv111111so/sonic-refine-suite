import React, { useEffect, useState, useRef } from 'react';
import { DeckControls } from '@/hooks/useWebAudio';
import { TempoControl } from './TempoControl';

interface DeckPitchFaderProps {
    deck: DeckControls;
    color: 'cyan' | 'purple';
}

export const DeckPitchFader = ({ deck, color }: DeckPitchFaderProps) => {
    // Persistent Slider Position
    const [sliderPos, setSliderPos] = useState(0.5);

    useEffect(() => {
        // Sync visual fader to deck state if changed externally (e.g. initial load)
        if (deck.state.tempoBend !== undefined) {
            setSliderPos(deck.state.tempoBend);
        }
    }, []);

    const handleSliderChange = (val: number) => {
        setSliderPos(val);
        deck.setTempoBend(val);
    };

    // Momentary Nudge (Arrows)
    const handleNudgeDown = (dir: 1 | -1) => {
        // Apply temporary offset to the current fader position
        const nudgeAmount = dir * 0.02;
        deck.setTempoBend(sliderPos + nudgeAmount);
    };

    const handleNudgeUp = () => {
        // Return to the persistent fader position
        deck.setTempoBend(sliderPos);
    };

    return (
        <TempoControl
            pitch={sliderPos}
            setPitch={handleSliderChange}
            onNudge={() => { }} // Not used by TempoControl directly
            keyLock={deck.state.keyLock}
            setKeyLock={deck.setKeyLock}
            color={color}
            onStepDown={handleNudgeDown}
            onStepUp={handleNudgeUp}
        />
    );
};
