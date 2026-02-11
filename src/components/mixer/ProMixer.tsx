import React, { useRef, useState } from 'react';
import { useWebAudio } from '@/hooks/useWebAudio';
import { MixerDeck } from './MixerDeck';
import { MixerControls } from './MixerControls';
import { MIDIHandler } from '@/utils/MIDIHandler';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2, RefreshCw, Cpu, ListMusic, FolderOpen, History, Upload, Search, Music, Zap } from 'lucide-react';
import { LevelLogo } from '@/components/LevelLogo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TransportProvider, useTransport } from '@/contexts/TransportContext';
import { toast } from 'sonner';
import { LibraryProvider } from '@/contexts/LibraryContext';
import { LibraryBrowser } from './library/LibraryBrowser';
import { SyncProvider, useSync } from '@/contexts/SyncContext';

interface Track {
    id: string;
    title: string;
    artist: string;
    bpm: number;
    key: string;
    time: string;
    url: string;
    file?: File;
}

const SyncSettingsButton = () => {
    const { syncMode, setSyncMode } = useSync();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-white">
                    <Settings2 className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#1e1e1e] border-[#333] text-white">
                <div className="p-2 text-[10px] font-bold text-neutral-500 uppercase">Sync Mode</div>
                <DropdownMenuItem onClick={() => setSyncMode('tempo')} className={cn(syncMode === 'tempo' && "text-cyan-400")}>
                    Tempo Only (Vinyl)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSyncMode('beat')} className={cn(syncMode === 'beat' && "text-cyan-400")}>
                    Beat Sync (Quantized)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const ProMixerContent = () => {
    const { state: transportState, toggleAutoMaster } = useTransport();
    const {
        deckA, deckB, crossfader, setCrossfader, nudgeCrossfader, autoFade,
        headphoneMix, setHeadphoneMix, headphoneVol, setHeadphoneVol,
        analysers, handleSync, masterDeckId, setMaster, cueA, setCueA, cueB, setCueB,
        routingMode, setRoutingMode
    } = useWebAudio();

    // MIDI Initialization
    React.useEffect(() => {
        if (deckA && deckB) {
            const midi = MIDIHandler.getInstance();
            midi.setDecks({ A: deckA, B: deckB });
            midi.init();
        }
    }, [deckA, deckB]);

    const loadTrackToDeck = async (track: Track) => {
        const fileOrUrl = track.file || track.url;
        const targetDeck = !deckA.state.buffer ? deckA : (!deckB.state.buffer ? deckB : deckA);
        const deckName = targetDeck === deckA ? 'Deck A' : 'Deck B';

        try {
            toast.loading(`Loading ${track.title} into ${deckName}...`, { id: 'load-track' });
            await targetDeck.loadTrack(
                fileOrUrl,
                track.bpm,
                track.key,
                { title: track.title, artist: track.artist }
            );
            toast.success(`Loaded ${track.title} into ${deckName}`, { id: 'load-track' });
        } catch (error) {
            console.error("Load failed:", error);
            toast.error(`Failed to load ${track.title}. Check connection.`, { id: 'load-track' });
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#0d0d0d] text-[#e0e0e0] overflow-hidden select-none font-sans">
            {/* Header / Top Bar (Reduced to h-12) */}
            <div className="h-12 flex-none bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between px-6 z-50 relative">
                <div className="flex items-center gap-4">
                    <LevelLogo size="sm" />
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-white uppercase tracking-[0.2em] leading-none">Mixer<span className="text-[#00deea]"> Lab</span></span>
                        <span className="text-[7px] font-bold text-[#666] uppercase tracking-widest mt-1">Sonic Refine Suite v2.0</span>
                    </div>
                </div>

                {/* Master Clock / Auto Panel */}
                <div className="flex items-center gap-4 bg-[#121212] px-3 py-1 rounded-full border border-[#333]">
                    <div className="flex flex-col items-center leading-none">
                        <span className="text-[7px] font-bold text-[#666] uppercase">Master</span>
                        <span className="text-xs font-mono font-bold text-[#00deea]">
                            {transportState.masterBpm.toFixed(2)}
                        </span>
                    </div>
                    <div className="h-5 w-px bg-[#333]" />
                    <button
                        className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded border transition-all",
                            transportState.autoMasterMode
                                ? "bg-[#00deea] text-black border-[#00deea] shadow-[0_0_10px_rgba(0,222,234,0.4)]"
                                : "bg-[#222] text-[#666] border-[#444] hover:text-white"
                        )}
                        onClick={toggleAutoMaster}
                    >
                        AUTO
                    </button>
                </div>

                {/* Cloud Sync Status */}
                <div className="flex items-center gap-2 text-[9px] text-[#666] font-mono">
                    <Cpu className="w-2.5 h-2.5 text-cyan-500 animate-pulse" />
                    <span>CLOUD SYNC ACTIVE</span>
                </div>

                <div className="flex items-center gap-2">
                    <SyncSettingsButton />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#0d0d0d] relative pt-0 gap-0">
                {/* Mixer / Decks Section - Height tuned for perfect fit and no overlaps (49vh / 480px min) */}
                <div className="flex-none h-[49vh] min-h-[480px] grid grid-cols-[1fr_320px_1fr] border-b border-[#333] overflow-hidden bg-[#0d0d0d]">
                    {/* Deck A */}
                    <div className="border-r border-[#333] bg-[#121212] relative">
                        <div className="absolute top-2 left-2 text-[10px] font-bold text-[#00deea] uppercase bg-[#00deea]/10 px-1 border border-[#00deea]/30">Deck A</div>
                        {deckA && (
                            <MixerDeck
                                id="A"
                                deck={deckA.state}
                                controls={deckA}
                                analyser={analysers.A}
                                color="cyan"
                                accentColor="text-cyan-500"
                                showGrid={true}
                                onSync={() => handleSync('A')}
                                isMaster={masterDeckId === 'A'}
                                onToggleMaster={() => setMaster('A')}
                            />
                        )}
                    </div>

                    {/* Center Mixer */}
                    <div className="bg-[#121212] flex flex-col border-r border-[#333] relative">
                        <div className="flex-1 overflow-hidden">
                            <MixerControls
                                deckA={deckA} deckB={deckB} crossfader={crossfader} setCrossfader={setCrossfader}
                                nudgeCrossfader={nudgeCrossfader} autoFade={autoFade} headphoneMix={headphoneMix}
                                setHeadphoneMix={setHeadphoneMix} headphoneVol={headphoneVol} setHeadphoneVol={setHeadphoneVol}
                                cueA={cueA} setCueA={setCueA} cueB={cueB} setCueB={setCueB} analysers={analysers}
                                routingMode={routingMode} setRoutingMode={setRoutingMode}
                            />
                        </div>
                    </div>

                    {/* Deck B */}
                    <div className="bg-[#121212] relative">
                        <div className="absolute top-2 right-2 text-[10px] font-bold text-[#ff9c00] uppercase bg-[#ff9c00]/10 px-1 border border-[#ff9c00]/30">Deck B</div>
                        {deckB && (
                            <MixerDeck
                                id="B"
                                deck={deckB.state}
                                controls={deckB}
                                analyser={analysers.B}
                                color="purple"
                                accentColor="text-purple-500"
                                showGrid={true}
                                onSync={() => handleSync('B')}
                                isMaster={masterDeckId === 'B'}
                                onToggleMaster={() => setMaster('B')}
                            />
                        )}
                    </div>
                </div>

                {/* Library Section */}
                <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e]">
                    <LibraryProvider>
                        <LibraryBrowser onLoadTrack={loadTrackToDeck} />
                    </LibraryProvider>
                </div>
            </div>
        </div>
    );
};

export const ProMixer = () => (
    <TransportProvider>
        <SyncProvider>
            <ProMixerContent />
        </SyncProvider>
    </TransportProvider>
);
