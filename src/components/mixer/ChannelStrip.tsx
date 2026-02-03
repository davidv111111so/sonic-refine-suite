import React from 'react';
import { DeckControls } from '@/hooks/useWebAudio';
import { Fader } from './Fader';
import { Knob } from './Knob';
import { cn } from '@/lib/utils';
import { Headphones } from 'lucide-react';
import { EQKnobWithKill } from './EQKnobWithKill';

interface ChannelStripProps {
    deck: DeckControls;
    color: string;
    label: string;
    side: 'left' | 'right';
    cue: boolean;
    onToggleCue: () => void;
}

export const ChannelStrip = ({ deck, color, label, side, cue, onToggleCue }: ChannelStripProps) => {
    const isCyan = color === 'cyan';
    const knobColor = isCyan ? 'cyan' : 'purple';
    const labelColor = isCyan ? 'text-cyan-500' : 'text-purple-500';

    return (
        <div className={cn(
            "flex flex-col h-full bg-[#121212] px-1 py-1 relative gap-1 items-center min-w-[50px] w-[50px]",
            side === 'left' ? "border-r border-[#27272a]" : "border-l border-[#27272a]"
        )}>
            {/* EQ Section with Kills */}
            <div className="flex flex-col gap-1 mt-1">
                <EQKnobWithKill
                    label="HIGH"
                    value={deck.state.eq?.high || 0}
                    onChange={(v) => deck.setEQ('high', v)}
                    kill={deck.state.eqKills?.high || false}
                    onToggleKill={() => deck.toggleEQKill('high')}
                    color={knobColor}
                    size={36}
                />
                <EQKnobWithKill
                    label="MID"
                    value={deck.state.eq?.mid || 0}
                    onChange={(v) => deck.setEQ('mid', v)}
                    kill={deck.state.eqKills?.mid || false}
                    onToggleKill={() => deck.toggleEQKill('mid')}
                    color={knobColor}
                    size={36}
                />
                <EQKnobWithKill
                    label="LOW"
                    value={deck.state.eq?.low || 0}
                    onChange={(v) => deck.setEQ('low', v)}
                    kill={deck.state.eqKills?.low || false}
                    onToggleKill={() => deck.toggleEQKill('low')}
                    color={knobColor}
                    size={36}
                />
            </div>

            <div className="w-8 h-px bg-[#27272a] my-0" />

            {/* CUE Button */}
            <button
                className={cn(
                    "w-8 h-5 rounded-sm border flex items-center justify-center transition-all mt-0",
                    cue
                        ? "border-yellow-500 bg-yellow-500/20 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]"
                        : "border-[#3f3f46] bg-[#18181b] text-[#71717a] hover:border-[#52525b] hover:text-[#a1a1aa]"
                )}
                onClick={onToggleCue}
            >
                <Headphones className="w-3 h-3" />
            </button>

            {/* Filter Knob */}
            <div className="mt-1 mb-2">
                <Knob
                    label="FILTER"
                    value={deck.state.filter !== undefined ? deck.state.filter : 0.5}
                    min={0}
                    max={1}
                    onChange={(v) => deck.setFilter(v)}
                    color={knobColor}
                    size={36}
                />
            </div>

            {/* Volume Fader (Flexible) */}
            <div className="flex-1 w-full flex justify-center relative min-h-[100px] pt-4">
                <Fader
                    orientation="vertical"
                    value={deck.state.volume}
                    onChange={(v) => deck.setVolume(v)}
                    className="h-full w-10 px-0"
                    thumbColor="#fff"
                />
            </div>

            <div className={cn("font-bold text-[9px] tracking-widest text-center mt-0 mb-1", labelColor)}>
                {label}
            </div>
        </div>
    );
};
