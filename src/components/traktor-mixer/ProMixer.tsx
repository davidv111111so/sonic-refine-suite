import React, { useRef, useState } from 'react';
import { useWebAudio } from '@/hooks/useWebAudio';
import { MixerDeck } from './MixerDeck';
import { MixerControls } from './MixerControls';
import { ListMusic, FolderOpen, History, Upload, Search, Music } from 'lucide-react';
import { LevelLogo } from '@/components/LevelLogo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TransportProvider } from '@/contexts/TransportContext';
import { toast } from 'sonner';

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

export const ProMixer = () => {
    const {
        deckA, deckB, crossfader, setCrossfader, nudgeCrossfader, autoFade,
        headphoneMix, setHeadphoneMix, headphoneVol, setHeadphoneVol,
        analysers, handleSync, masterDeckId, setMaster, cueA, setCueA, cueB, setCueB
    } = useWebAudio();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'local' | 'playlists' | 'history'>('local');

    // Sample tracks (Direct with CORS Proxy)
    // using corsproxy.io to bypass Access-Control-Allow-Origin issues with SoundHelix
    const CORS_PROXY = "https://corsproxy.io/?";

    const [tracks, setTracks] = useState<Track[]>([
        { id: '1', title: "Ghost Kiss", artist: "Adam Beyer", bpm: 137, key: "8A", time: "04:30", url: `${CORS_PROXY}${encodeURIComponent("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3")}` },
        { id: '2', title: "Overdose Of Bass", artist: "Eli Brown", bpm: 134, key: "4A", time: "03:53", url: `${CORS_PROXY}${encodeURIComponent("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3")}` },
        { id: '3', title: "Hypnotic", artist: "HNTR", bpm: 128, key: "5A", time: "05:12", url: `${CORS_PROXY}${encodeURIComponent("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3")}` },
        { id: '4', title: "Rave", artist: "Sam Paganini", bpm: 130, key: "2A", time: "06:45", url: `${CORS_PROXY}${encodeURIComponent("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3")}` },
        { id: '5', title: "Consciousness", artist: "Anyma", bpm: 126, key: "6A", time: "04:20", url: `${CORS_PROXY}${encodeURIComponent("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3")}` },
        { id: '6', title: "Metro", artist: "Kevin de Vries", bpm: 124, key: "9A", time: "05:50", url: `${CORS_PROXY}${encodeURIComponent("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3")}` },
        { id: '7', title: "Miracle", artist: "Calvin Harris", bpm: 143, key: "1A", time: "03:15", url: `${CORS_PROXY}${encodeURIComponent("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3")}` },
        { id: '8', title: "Push Up", artist: "Creeds", bpm: 160, key: "12A", time: "04:00", url: `${CORS_PROXY}${encodeURIComponent("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3")}` },
    ]);

    const handleUploadClick = () => folderInputRef.current?.click();

    const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const newTracks: Track[] = [];
        Array.from(files).forEach((file, index) => {
            if (file.type.startsWith('audio/')) {
                newTracks.push({
                    id: `local-${Date.now()}-${index}`,
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    artist: "Unknown Artist",
                    bpm: 0,
                    key: "?",
                    time: "00:00",
                    url: URL.createObjectURL(file), // Local files don't need proxy
                    file: file
                });
            }
        });
        if (newTracks.length > 0) setTracks(prev => [...prev, ...newTracks]);
    };

    const loadTrackToDeck = async (track: Track) => {
        const fileOrUrl = track.file || track.url;
        const targetDeck = !deckA.state.buffer ? deckA : (!deckB.state.buffer ? deckB : deckA);
        const deckName = targetDeck === deckA ? 'Deck A' : 'Deck B';

        try {
            toast.loading(`Loading ${track.title} into ${deckName}...`, { id: 'load-track' });
            await targetDeck.loadTrack(fileOrUrl);
            toast.success(`Loaded ${track.title} into ${deckName}`, { id: 'load-track' });
        } catch (error) {
            console.error("Load failed:", error);
            toast.error(`Failed to load ${track.title}. Check connection.`, { id: 'load-track' });
        }
    };

    const handleDragStart = (e: React.DragEvent, track: Track) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'track', title: track.title, url: track.url }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <TransportProvider>
            <div className="flex flex-col h-screen bg-[#0d0d0d] text-[#e0e0e0] overflow-hidden select-none font-sans">
                {/* Header / Top Bar - Slim Traktor Style */}
                <div className="h-10 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between px-4 shrink-0 z-20">
                    <div className="flex items-center gap-3">
                        <LevelLogo size="sm" />
                        <span className="text-xs font-bold text-[#666] uppercase tracking-widest">Mixer<span className="text-[#00deea]"> Lab</span></span>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="file" ref={folderInputRef} onChange={handleFolderSelect} hidden multiple accept="audio/*" />
                        <Button
                            className="bg-[#262626] hover:bg-[#333] text-[#e0e0e0] border border-[#444] rounded-none h-6 text-[10px] font-bold uppercase disabled:opacity-50"
                            onClick={handleUploadClick}
                        >
                            <FolderOpen className="w-3 h-3 mr-1 text-[#00deea]" />
                            Import Folder/Files
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-0 bg-[#0d0d0d]">

                    {/* Mixer / Decks Section - Fixed Height */}
                    <div className="flex-none h-[600px] grid grid-cols-[1fr_320px_1fr] border-b border-[#333]">
                        {/* Deck A */}
                        <div className="border-r border-[#333] bg-[#121212] relative">
                            {/* Placeholder or component for Deck A */}
                            <div className="absolute top-2 left-2 text-[10px] font-bold text-[#00deea] uppercase bg-[#00deea]/10 px-1 border border-[#00deea]/30">Deck A</div>
                            {deckA && (
                                <MixerDeck
                                    id="A"
                                    controls={deckA}
                                    analyser={analysers.A}
                                    color="cyan"
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
                                    controls={deckB}
                                    analyser={analysers.B}
                                    color="purple"
                                    onSync={() => handleSync('B')}
                                    isMaster={masterDeckId === 'B'}
                                    onToggleMaster={() => setMaster('B')}
                                />
                            )}
                        </div>
                    </div>

                    {/* Browser / Track List Section - Flexible Height */}
                    <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e]">
                        {/* Browser Tabs */}
                        <div className="h-8 bg-[#262626] border-b border-[#333] flex items-center px-2 gap-1">
                            {['local', 'playlists', 'history'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={cn(
                                        "h-full px-4 text-[10px] font-bold uppercase tracking-wider transition-colors border-r border-[#333]",
                                        activeTab === tab ? "bg-[#333] text-[#e0e0e0] border-b-2 border-b-[#00deea]" : "text-[#888] hover:text-[#bbb] hover:bg-[#2a2a2a]"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                            <div className="ml-auto flex items-center bg-[#121212] border border-[#333] h-6 w-64 px-2">
                                <Search className="w-3 h-3 text-[#555] mr-2" />
                                <input className="bg-transparent border-none outline-none text-[10px] text-[#e0e0e0] w-full placeholder:text-[#444]" placeholder="SEARCH" />
                            </div>
                        </div>

                        {/* Browser Table */}
                        <div className="flex-1 overflow-auto bg-[#0d0d0d]">
                            <table className="w-full text-left border-collapse table-fixed">
                                <thead className="sticky top-0 bg-[#1a1a1a] z-10 text-[9px] font-bold text-[#888] uppercase">
                                    <tr>
                                        <th className="w-10 px-2 py-1 border-r border-[#333] border-b">#</th>
                                        <th className="px-2 py-1 border-r border-[#333] border-b">Title</th>
                                        <th className="px-2 py-1 border-r border-[#333] border-b">Artist</th>
                                        <th className="w-16 px-2 py-1 border-r border-[#333] border-b text-center">BPM</th>
                                        <th className="w-16 px-2 py-1 border-r border-[#333] border-b text-center">Key</th>
                                        <th className="w-16 px-2 py-1 border-b border-[#333] text-center">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px] font-medium text-[#ccc]">
                                    {tracks.map((track, idx) => (
                                        <tr
                                            key={track.id}
                                            onClick={() => loadTrackToDeck(track)}
                                            draggable onDragStart={(e) => handleDragStart(e, track)}
                                            className={cn(
                                                "group cursor-pointer border-b border-[#1a1a1a] hover:bg-[#222]",
                                                idx % 2 === 0 ? "bg-[#121212]" : "bg-[#0f0f0f]"
                                            )}
                                        >
                                            <td className="px-2 py-1 border-r border-[#1a1a1a] text-[#555] font-mono group-hover:text-[#888]">{idx + 1}</td>
                                            <td className="px-2 py-1 border-r border-[#1a1a1a] text-[#fff] truncate">{track.title}</td>
                                            <td className="px-2 py-1 border-r border-[#1a1a1a] text-[#888] truncate">{track.artist}</td>
                                            <td className="px-2 py-1 border-r border-[#1a1a1a] text-center font-mono text-[#00deea]">{track.bpm || '-'}</td>
                                            <td className="px-2 py-1 border-r border-[#1a1a1a] text-center font-mono text-[#a855f7]">{track.key}</td>
                                            <td className="px-2 py-1 text-center font-mono text-[#666]">{track.time}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </TransportProvider>
    );
};
