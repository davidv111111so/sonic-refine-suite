import React, { useRef, useState } from 'react';
import { useWebAudio } from '@/hooks/useWebAudio';
import { MixerDeck } from './MixerDeck';
import { MixerControls } from './MixerControls';
import { ListMusic, FolderOpen, History, Upload, Search, Music } from 'lucide-react';
import { LevelLogo } from '@/components/LevelLogo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TransportProvider, useTransport } from '@/contexts/TransportContext';
import { toast } from 'sonner';
import { LibraryProvider } from '@/contexts/LibraryContext';
import { LibraryBrowser } from './library/LibraryBrowser';
import { SyncProvider, useSync } from '@/contexts/SyncContext';
import { Settings2, RefreshCw } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

// ... imports preservation

const SyncSettingsButton = () => {
    const { syncMode, setSyncMode } = useSync();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 gap-2 text-[#666] hover:text-white border border-transparent hover:border-[#333]">
                    <RefreshCw className={cn("w-3 h-3", syncMode === 'beat' ? "text-cyan-500" : "text-amber-500")} />
                    <span className="text-[10px] font-bold uppercase">{syncMode} Sync</span>
                    <Settings2 className="w-3 h-3 ml-1 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-[#1a1a1a] border-[#333] text-white">
                <DropdownMenuLabel>Sync Mode</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#333]" />
                <DropdownMenuItem
                    className="focus:bg-[#333] cursor-pointer flex flex-col items-start gap-1"
                    onClick={() => setSyncMode('beat')}
                >
                    <div className="flex items-center gap-2 font-bold text-cyan-500">
                        <RefreshCw className="w-3 h-3" /> BeatSync
                    </div>
                    <p className="text-[10px] text-[#888]">
                        Locks Tempo & Phase. Snaps to Grid. Best for generic mixing.
                    </p>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#333]" />
                <DropdownMenuItem
                    className="focus:bg-[#333] cursor-pointer flex flex-col items-start gap-1"
                    onClick={() => setSyncMode('tempo')}
                >
                    <div className="flex items-center gap-2 font-bold text-amber-500">
                        <RefreshCw className="w-3 h-3" /> TempoSync
                    </div>
                    <p className="text-[10px] text-[#888]">
                        Locks Tempo only. Phase is free. Allows manual nudging/scratching.
                    </p>
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
        analysers, handleSync, masterDeckId, setMaster, cueA, setCueA, cueB, setCueB
    } = useWebAudio();

    // CORS Proxy for potential external loads if we add them back later
    // const CORS_PROXY = "https://corsproxy.io/?";

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
        // TransportProvider removed from here
        <div className="flex flex-col h-screen bg-[#0d0d0d] text-[#e0e0e0] overflow-hidden select-none font-sans">
            {/* Header / Top Bar - Slim Traktor Style */}
            <div className="h-10 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between px-4 shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <LevelLogo size="sm" />
                    <span className="text-xs font-bold text-[#666] uppercase tracking-widest">Mixer<span className="text-[#00deea]"> Lab</span></span>
                </div>

                {/* Master Clock / Auto Panel */}
                <div className="flex items-center gap-4 bg-[#121212] px-3 py-1 rounded-full border border-[#333]">
                    <div className="flex flex-col items-center leading-none">
                        <span className="text-[8px] font-bold text-[#666] uppercase">Master</span>
                        <span className="text-sm font-mono font-bold text-[#00deea]">
                            {transportState.masterBpm.toFixed(2)}
                        </span>
                    </div>
                    <div className="h-6 w-px bg-[#333]" />
                    <button
                        className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded border transition-all",
                            transportState.autoMasterMode
                                ? "bg-[#00deea] text-black border-[#00deea] shadow-[0_0_10px_rgba(0,222,234,0.4)]"
                                : "bg-[#222] text-[#666] border-[#444] hover:text-white"
                        )}
                        onClick={toggleAutoMaster}
                    >
                        AUTO
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <SyncSettingsButton />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#0d0d0d]">

                {/* Mixer / Decks Section - Fixed Height (Responsive) */}
                <div className="flex-none h-[50vh] min-h-[450px] grid grid-cols-[1fr_320px_1fr] border-b border-[#333] overflow-hidden">
                    {/* Deck A */}
                    <div className="border-r border-[#333] bg-[#121212] relative">
                        {/* Placeholder or component for Deck A */}
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
                    <div className="bg-[#1a1a1a] flex flex-col border-r border-[#333]">
                        <MixerControls
                            deckA={deckA} deckB={deckB} crossfader={crossfader} setCrossfader={setCrossfader}
                            nudgeCrossfader={nudgeCrossfader} autoFade={autoFade} headphoneMix={headphoneMix}
                            setHeadphoneMix={setHeadphoneMix} headphoneVol={headphoneVol} setHeadphoneVol={setHeadphoneVol}
                            cueA={cueA} setCueA={setCueA} cueB={cueB} setCueB={setCueB} analysers={analysers}
                        />
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

                {/* Browser / Library Section - New Implementation */}
                <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e]">
                    <LibraryProvider>
                        <LibraryBrowser onLoadTrack={loadTrackToDeck} />
                    </LibraryProvider>
                </div>
            </div>
        </div>
        // TransportProvider removed from here
    );
};

export const ProMixer = () => (
    <TransportProvider>
        <SyncProvider>
            <ProMixerContent />
        </SyncProvider>
    </TransportProvider>
);
