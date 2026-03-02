import React, { useEffect, useState } from 'react';
import { DeckControls } from '@/hooks/useWebAudio';
import { TempoControl } from './TempoControl';
import { cn } from '@/lib/utils';

interface DeckPitchFaderProps {
    deck: DeckControls;
    color: 'cyan' | 'purple';
}

const PITCH_RANGES = [
    { label: '±4', value: 0.04 },
    { label: '±8', value: 0.08 },
    { label: '±16', value: 0.16 },
    { label: '±50', value: 0.50 },
];

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

    // Momentary Nudge (Arrows) — Traktor-style spring-back
    // Apply a temporary ±3% bump, snap back on release
    const handleNudgeDown = (dir: 1 | -1) => {
        const nudgeAmount = dir * 0.03;
        deck.setTempoBend(Math.max(0, Math.min(1, sliderPos + nudgeAmount)));
    };

    const handleNudgeUp = () => {
        // Return to the persistent fader position (spring-back)
        deck.setTempoBend(sliderPos);
    };

    // Effective BPM display
    const effectiveBPM = deck.state.bpm
        ? (deck.state.bpm * deck.state.playbackRate).toFixed(1)
        : '--';

    const accentColor = color === 'cyan' ? 'cyan' : 'purple';

    return (
        <div className="flex flex-col items-center gap-0.5 w-12 py-1">
            {/* Pitch Range Selector */}
            <div className="flex flex-col gap-0.5 w-full px-0.5">
                {PITCH_RANGES.map((r) => (
                    <button
                        key={r.value}
                        className={cn(
                            "h-3 rounded-[1px] text-[10px] font-bold transition-all border leading-none",
                            deck.state.pitchRange === r.value
                                ? `bg-${accentColor}-500/20 text-${accentColor}-400 border-${accentColor}-500/60`
                                : "bg-black/40 text-neutral-600 border-neutral-800 hover:border-neutral-600"
                        )}
                        style={
                            deck.state.pitchRange === r.value
                                ? {
                                    backgroundColor: color === 'cyan' ? 'rgba(6,182,212,0.15)' : 'rgba(168,85,247,0.15)',
                                    color: color === 'cyan' ? '#22d3ee' : '#a855f7',
                                    borderColor: color === 'cyan' ? 'rgba(6,182,212,0.5)' : 'rgba(168,85,247,0.5)',
                                }
                                : undefined
                        }
                        onClick={() => deck.setPitchRange(r.value)}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {/* Pitch Fader */}
            <TempoControl
                pitch={sliderPos}
                setPitch={handleSliderChange}
                onNudge={() => { }}
                keyLock={deck.state.keyLock}
                setKeyLock={deck.setKeyLock}
                color={color}
                onStepDown={handleNudgeDown}
                onStepUp={handleNudgeUp}
            />

            {/* Effective BPM Display */}
            <div className="flex flex-col items-center leading-none">
                <span className="font-mono text-[9px] font-bold tabular-nums"
                    style={{ color: color === 'cyan' ? '#22d3ee' : '#a855f7' }}
                >
                    {effectiveBPM}
                </span>
                <span className="text-[6px] text-neutral-600 font-bold">BPM</span>
            </div>
        </div>
    );
};
