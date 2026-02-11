import React from 'react';
import { DeckControls } from '@/hooks/useWebAudio';
import { Knob } from './Knob';
import { Fader } from './Fader';
import { cn } from '@/lib/utils';
import { Headphones, ChevronLeft, ChevronRight } from 'lucide-react';

interface MixerControlsProps {
    deckA: DeckControls;
    deckB: DeckControls;
    crossfader: number;
    setCrossfader: (val: number) => void;
    nudgeCrossfader?: (direction: 'left' | 'right') => void;
    autoFade?: (target: 0 | 1) => void;
    headphoneMix: number;
    setHeadphoneMix: (val: number) => void;
    headphoneVol: number;
    setHeadphoneVol: (val: number) => void;
    cueA: boolean;
    setCueA: (val: boolean) => void;
    cueB: boolean;
    setCueB: (val: boolean) => void;
    routingMode: 'stereo' | 'split' | 'multichannel';
    setRoutingMode: (mode: 'stereo' | 'split' | 'multichannel') => void;
    analysers: { A: AnalyserNode | null; B: AnalyserNode | null };
}

import { ChannelStrip } from './ChannelStrip';
import { Meter } from './Meter';
import { DeckPitchFader } from './DeckPitchFader';

// ... imports preservation

export const MixerControls = ({
    deckA, deckB,
    crossfader, setCrossfader,
    nudgeCrossfader, autoFade,
    headphoneMix, setHeadphoneMix,
    headphoneVol, setHeadphoneVol,
    cueA, setCueA, cueB, setCueB,
    routingMode, setRoutingMode,
    analysers
}: MixerControlsProps) => {
    return (
        <div className="flex flex-col h-full bg-[#09090b] border border-[#27272a] rounded-sm p-[1px] relative w-full max-w-[500px] mx-auto">
            <div className="flex-1 flex justify-center gap-[2px] min-h-0 relative">
                {/* Deck A Pitch */}
                <DeckPitchFader deck={deckA} color="cyan" />

                <ChannelStrip deck={deckA} color="cyan" label="A" side="left" cue={cueA} onToggleCue={() => setCueA(!cueA)} />

                {/* Center Section */}
                <div className="w-24 bg-[#121212] flex flex-col items-center py-0 gap-0.5 border-x border-[#27272a]">

                    {/* GAIN Knobs (Moved to Center) */}
                    <div className="flex gap-2 mt-1 mb-0">
                        <Knob
                            label="GAIN A"
                            value={deckA.state.trim || 1}
                            min={0}
                            max={2}
                            onChange={(v) => deckA.setTrim(v)}
                            color="cyan"
                            size={24}
                        />
                        <Knob
                            label="GAIN B"
                            value={deckB.state.trim || 1}
                            min={0}
                            max={2}
                            onChange={(v) => deckB.setTrim(v)}
                            color="purple"
                            size={24}
                        />
                    </div>

                    <div className="w-full h-px bg-[#27272a]" />

                    {/* Meters */}
                    <div className="flex gap-1 h-20 px-[2px] w-full justify-center">
                        <Meter active={deckA.state.isPlaying} analyser={analysers.A} />
                        <Meter active={deckB.state.isPlaying} analyser={analysers.B} />
                    </div>

                    <div className="w-full h-px bg-[#27272a]" />

                    {/* Headphone Controls */}
                    <div className="flex flex-col gap-2 items-center">
                        <Knob
                            label="MIX"
                            value={headphoneMix}
                            min={0}
                            max={1}
                            onChange={setHeadphoneMix}
                            color="white"
                            size={24}
                        />
                        <Knob
                            label="VOL"
                            value={headphoneVol}
                            min={0}
                            max={1}
                            onChange={setHeadphoneVol}
                            color="white"
                            size={24}
                        />
                        <Headphones className="w-4 h-4 text-neutral-500" />
                    </div>

                    <div className="w-full h-px bg-[#27272a]" />

                    {/* Routing Selector */}
                    <div className="flex flex-col items-center gap-1 w-full px-1">
                        <span className="text-[7px] font-bold text-neutral-500 uppercase tracking-tighter">Output Mode</span>
                        <div className="grid grid-cols-1 gap-1 w-full">
                            {(['stereo', 'split', 'multichannel'] as const).map(mode => (
                                <button
                                    key={mode}
                                    className={cn(
                                        "h-4 rounded-[1px] text-[7px] font-bold uppercase transition-all border",
                                        routingMode === mode
                                            ? "bg-cyan-500/20 text-cyan-400 border-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.3)]"
                                            : "bg-black/40 text-neutral-600 border-neutral-800 hover:border-neutral-700"
                                    )}
                                    onClick={() => setRoutingMode(mode)}
                                >
                                    {mode === 'multichannel' ? 'MULTI' : mode}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <ChannelStrip deck={deckB} color="purple" label="B" side="right" cue={cueB} onToggleCue={() => setCueB(!cueB)} />

                {/* Deck B Pitch */}
                <DeckPitchFader deck={deckB} color="purple" />
            </div>

            {/* Crossfader Section (Reduced Height) */}
            <div className="flex-none h-10 bg-[#121212] border-t border-[#27272a] flex items-center justify-between px-2 z-10 mx-1 rounded-sm gap-1 mb-1">

                {/* Auto Fade Left */}
                <button
                    className="h-6 px-1 bg-[#27272a] border border-[#3f3f46] rounded-sm text-[8px] text-neutral-400 hover:text-white hover:bg-[#3f3f46] flex items-center justify-center"
                    onClick={() => autoFade?.(0)}
                    title="Auto Fade to A (4s)"
                >
                    AUTO
                </button>

                {/* Nudge Left */}
                <button
                    className="w-6 h-full flex items-center justify-center text-neutral-500 hover:text-white active:scale-95 transition-transform"
                    onClick={() => nudgeCrossfader?.('left')}
                    title="Nudge Left"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex-1 h-full relative flex flex-col justify-center px-2">
                    <Fader
                        orientation="horizontal"
                        value={crossfader}
                        onChange={setCrossfader}
                        className="w-full h-full"
                        thumbColor="#fff"
                    />
                    <div className="flex justify-between w-full px-2 absolute bottom-0 pointer-events-none left-0">
                        <span className="text-[8px] font-bold text-neutral-600">A</span>
                        <span className="text-[8px] font-bold text-neutral-600">B</span>
                    </div>
                </div>

                {/* Nudge Right */}
                <button
                    className="w-6 h-full flex items-center justify-center text-neutral-500 hover:text-white active:scale-95 transition-transform"
                    onClick={() => nudgeCrossfader?.('right')}
                    title="Nudge Right"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                {/* Auto Fade Right */}
                <button
                    className="h-6 px-1 bg-[#27272a] border border-[#3f3f46] rounded-sm text-[8px] text-neutral-400 hover:text-white hover:bg-[#3f3f46] flex items-center justify-center"
                    onClick={() => autoFade?.(1)}
                    title="Auto Fade to B (4s)"
                >
                    AUTO
                </button>
            </div>
        </div>
    );
};
