import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Repeat, Music2, RotateCw, ZoomIn, ZoomOut, Save, Power, Activity, Disc, ChevronDown, Headphones, Mic2, Disc3 } from 'lucide-react';
import { useDJDeck, DeckControls } from '../../hooks/useDJDeck';
import { cn } from '@/lib/utils';
import { SpectralWaveform } from './SpectralWaveform';
import { StripeOverview } from './StripeOverview';
import { Knob } from './Knob';
import { FXUnitGroup } from './FXUnitGroup';
import { PhaseMeter } from './PhaseMeter';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import { useCueLogic } from '../../hooks/useCueLogic';

interface MixerDeckProps {
    id: string;
    deck?: any; // Using any for now to avoid complexity in this fix, ideally explicit type
    controls: DeckControls;
    isMaster?: boolean;
    onToggleMaster?: () => void;
    isDeckMaster?: boolean;
    handleSync?: () => void;
    onSync?: () => void;
    handleMaster?: () => void;
    showGrid?: boolean;
    color?: string;
    accentColor?: string;
    analyser?: AnalyserNode;
}

export const MixerDeck = ({ id, deck, controls, isMaster, onToggleMaster, isDeckMaster, handleSync, onSync, handleMaster, showGrid = true, color = 'cyan', accentColor = 'text-cyan-400', analyser }: MixerDeckProps) => {
    const isCyan = color === 'cyan';
    const [zoom, setZoom] = useState(100);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Cue Logic
    const cueLogic = useCueLogic({
        currentTime: controls.state.currentTime,
        duration: controls.state.duration,
        isPlaying: controls.state.isPlaying,
        bpm: controls.state.bpm || 120,
        onSeek: controls.seek,
        onPlay: controls.play,
        onPause: controls.pause
    });

    // Track Name
    const meta = controls.state.meta;
    let trackName = null;
    if (meta?.title) {
        // Only show artist if known
        const artist = (meta.artist && meta.artist !== 'Unknown Artist' && meta.artist !== 'Unknown') ? meta.artist : null;
        trackName = artist ? `${artist} - ${meta.title}` : meta.title;
    } else if (controls.state.buffer) {
        trackName = "Unknown Track"; // Fallback if buffer loaded but no meta
    }

    // Handle File Drop
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Ensure event doesn't bubble
        setIsHovering(false);

        // 1. Try Internal Drag (JSON)
        const jsonData = e.dataTransfer.getData('application/json');
        if (jsonData) {
            try {
                const data = JSON.parse(jsonData);
                console.log("MixerDeck: Internal drop detected", data);
                const url = data.enhancedUrl || data.url;
                if (url) {
                    setIsLoading(true);
                    try {
                        await controls.loadTrack(
                            url,
                            data.bpm,
                            data.indicator || data.harmonicKey || data.key,
                            { title: data.title, artist: data.artist }
                        );
                        console.log("MixerDeck: Internal track loaded successfully");
                    } catch (err) {
                        console.error("MixerDeck: Internal track load failed", err);
                    } finally {
                        setIsLoading(false);
                    }
                    return;
                }
            } catch (err) {
                console.warn("MixerDeck: JSON parse failed", err);
            }
        }

        // 2. Try OS File Drag
        console.log("MixerDeck: Drop event detected", e.dataTransfer.files);
        const file = e.dataTransfer.files[0];
        if (file) {
            console.log("MixerDeck: File found, attempting to load", file.name);
            setIsLoading(true);
            try {
                await controls.loadTrack(file);
                console.log("MixerDeck: Load track completed successfully");
            } catch (err) {
                console.error("MixerDeck: Load track failed", err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const getPhaseOffset = () => {
        // Mock phase offset logic or link to sync logic
        return 0;
    };

    return (
        <div className="flex flex-col h-full bg-[#121212] rounded-md border border-[#27272a] overflow-hidden shadow-sm relative">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="audio/*"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        setIsLoading(true);
                        try {
                            await controls.loadTrack(file);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }}
            />

            {/* 1. Header & Transport (Compacted h-14 -> h-[60px]) */}
            <div className="h-[60px] px-2 flex items-center justify-between border-b border-[#27272a] bg-[#18181b] gap-2">

                {/* Deck ID */}
                <div className="flex flex-col gap-1 w-12 shrink-0 h-full justify-center">
                    <div className={cn(
                        "w-full h-6 flex items-center justify-center font-bold text-black text-xs rounded-[2px]",
                        isCyan ? "bg-cyan-500" : "bg-purple-500"
                    )}>
                        {id}
                    </div>
                </div>

                {/* Info Display */}
                <div className="flex-1 flex flex-col min-w-0 gap-1 justify-center h-full pr-2">
                    {/* Track Info */}
                    <div className="flex items-center justify-between">
                        <span
                            className={cn(
                                "font-bold text-xs truncate max-w-[150px] tracking-wide",
                                trackName ? "text-white" : "text-neutral-500"
                            )}
                            title={trackName || ""}
                            style={{ textShadow: trackName ? (isCyan ? '0 0 8px rgba(34,211,238,0.6)' : '0 0 8px rgba(192,132,252,0.6)') : 'none' }}
                        >
                            {trackName || "NO TRACK"}
                        </span>

                        {/* BPM */}
                        <div className="flex items-center gap-2">
                            <button
                                className="w-4 h-4 bg-[#27272a] border border-[#3f3f46] rounded-sm flex items-center justify-center text-neutral-400 hover:text-white"
                                onClick={() => {
                                    if (controls.state.bpm) {
                                        const currentBPM = controls.state.bpm * controls.state.playbackRate;
                                        const targetBPM = currentBPM - 0.1;
                                        controls.setRate(targetBPM / controls.state.bpm);
                                    } else {
                                        controls.setRate(controls.state.playbackRate - 0.001);
                                    }
                                }}
                            >
                                -
                            </button>
                            <span
                                className={cn("text-lg font-black tracking-tighter leading-none w-16 text-center font-mono", accentColor)}
                                style={{ textShadow: isCyan ? '0 0 10px rgba(34,211,238,0.5)' : '0 0 10px rgba(192,132,252,0.5)' }}
                            >
                                {controls.state.bpm ? (controls.state.bpm * controls.state.playbackRate).toFixed(2) : "0.00"}
                            </span>
                            <button
                                className="w-4 h-4 bg-[#27272a] border border-[#3f3f46] rounded-sm flex items-center justify-center text-neutral-400 hover:text-white"
                                onClick={() => {
                                    if (controls.state.bpm) {
                                        const currentBPM = controls.state.bpm * controls.state.playbackRate;
                                        const targetBPM = currentBPM + 0.1;
                                        controls.setRate(targetBPM / controls.state.bpm);
                                    } else {
                                        controls.setRate(controls.state.playbackRate + 0.001);
                                    }
                                }}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Phase Meter */}
                    <PhaseMeter active={controls.state.isPlaying} offset={getPhaseOffset()} />

                    {/* Time & Key */}
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-400 uppercase tracking-widest leading-none">
                        <span className="font-mono text-sm">{controls.state.buffer ? (controls.state.duration / 60).toFixed(2).replace('.', ':') : "00:00"}</span>
                        <span className={cn(isCyan ? "text-cyan-200" : "text-purple-200", "font-mono")}>{controls.state.key || "--"}</span>
                    </div>
                </div>
            </div>

            {/* 2. Detail Waveform Area (Flexible, max-h-150) */}
            <div
                ref={containerRef}
                className="flex-1 relative bg-[#09090b] group min-h-[40px] max-h-[150px] border-b border-[#27272a]"
                onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
                onDragLeave={() => setIsHovering(false)}
                onDrop={handleDrop}
            >
                <SpectralWaveform
                    buffer={controls.state.buffer}
                    currentTime={controls.state.currentTime}
                    zoom={zoom}
                    setZoom={setZoom}
                    color={color as 'cyan' | 'purple'}
                    height={containerRef.current?.clientHeight || 120}
                    showGrid={showGrid}
                    bpm={controls.state.bpm || 128}
                    onSeek={controls.seek}
                    loop={controls.state.loop}
                    cuePoint={cueLogic.cuePoint}
                    onPlay={controls.play}
                    onPause={controls.pause}
                    isPlaying={controls.state.isPlaying}
                />

                {/* Zoom Controls Overlay */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="pointer-events-auto flex flex-col gap-1">
                        <Button variant="secondary" size="icon" className="h-6 w-6 bg-black/50 hover:bg-black/80 text-white border border-white/10" onClick={(e) => { e.stopPropagation(); setZoom(Math.min(zoom * 1.5, 2000)); }}>
                            <ZoomIn className="w-3 h-3" />
                        </Button>
                        <Button variant="secondary" size="icon" className="h-6 w-6 bg-black/50 hover:bg-black/80 text-white border border-white/10" onClick={(e) => { e.stopPropagation(); setZoom(Math.max(zoom / 1.5, 10)); }}>
                            <ZoomOut className="w-3 h-3" />
                        </Button>
                    </div>
                </div>

                {(!controls.state.buffer || isHovering || isLoading) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-[1px] z-10 pointer-events-none">
                        <div className="text-center pointer-events-auto">
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className={cn("w-6 h-6 animate-spin", accentColor)} />
                                    <span className="text-[10px] font-medium text-neutral-400">DECODING</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-neutral-600 cursor-pointer hover:text-neutral-400 transition-colors" onClick={() => fileInputRef.current?.click()}>
                                    <Disc className="w-8 h-8 opacity-40" />
                                    <span className="text-[10px] font-medium tracking-wide">DROP TRACK</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 2.5 Overview Waveform (Compacted h-6) */}
            <div className="h-6 bg-[#09090b] border-b border-[#27272a] relative">
                <StripeOverview
                    buffer={controls.state.buffer}
                    currentTime={controls.state.currentTime}
                    duration={controls.state.duration}
                    onSeek={controls.seek}
                    color={color as 'cyan' | 'purple'}
                    height={24}
                    cuePoint={cueLogic.cuePoint}
                    loop={controls.state.loop}
                />
            </div>

            {/* 3. Transport Strip (Compacted h-10) */}
            <div className="h-10 bg-[#18181b] border-b border-[#27272a] flex items-center px-3 gap-3 justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        className={cn(
                            "h-9 w-12 rounded-sm border border-[#3f3f46] bg-[#27272a] hover:bg-[#3f3f46] flex flex-col items-center justify-center p-0 transition-all active:scale-95",
                            "active:border-white/50"
                        )}
                        onMouseDown={(e) => { e.preventDefault(); cueLogic.handleCue(true); }}
                        onMouseUp={(e) => { e.preventDefault(); cueLogic.handleCue(false); }}
                        onMouseLeave={(e) => { e.preventDefault(); cueLogic.handleCue(false); }}
                    >
                        <Disc3 className="w-4 h-4 text-neutral-400 mb-[1px]" />
                        <span className="text-[9px] font-bold text-neutral-400 leading-none">CUE</span>
                    </Button>

                    <Button
                        variant="ghost"
                        className={cn(
                            "h-9 w-12 rounded-sm border border-[#3f3f46] bg-[#27272a] hover:bg-[#3f3f46] flex items-center justify-center p-0 transition-all",
                            controls.state.isPlaying && (isCyan ? "bg-cyan-500/20 border-cyan-500 text-cyan-500" : "bg-purple-500/20 border-purple-500 text-purple-500")
                        )}
                        onClick={controls.state.isPlaying ? controls.pause : controls.play}
                    >
                        {controls.state.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    </Button>

                    <Button
                        variant="ghost"
                        className={cn(
                            "h-9 w-12 rounded-sm border border-[#3f3f46] bg-[#27272a] hover:bg-[#3f3f46] flex flex-col items-center justify-center gap-0 p-0 transition-all",
                            (isMaster || isDeckMaster) && "bg-yellow-500/20 border-yellow-500 text-yellow-500"
                        )}
                        onClick={() => {
                            if (handleMaster) handleMaster();
                            if (onToggleMaster) onToggleMaster();
                        }}
                    >
                        <span className="text-[9px] font-bold">MASTER</span>
                    </Button>

                    <Button
                        variant="ghost"
                        className={cn(
                            "h-9 w-12 rounded-sm border border-[#3f3f46] bg-[#27272a] hover:bg-[#3f3f46] flex flex-col items-center justify-center gap-0 p-0 transition-all",
                            "active:scale-95"
                        )}
                        onClick={() => {
                            if (handleSync) handleSync();
                            if (onSync) onSync();
                        }}
                    >
                        <span className="text-[9px] font-bold text-neutral-400">SYNC</span>
                    </Button>
                </div>
            </div>

            {/* 4. Loops & FX Panels (Fixed Height 160px) */}
            <div className="flex-none flex bg-[#121212] h-[160px]">
                {/* Loops Panel (w-32, restored content) */}
                <div className="w-32 border-r border-[#27272a] p-2 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 mb-1">
                        <div className="flex items-center gap-1"><Repeat className="w-3 h-3" /> LOOPS</div>
                        <div
                            className={cn("w-3 h-3 rounded-full border border-[#444] cursor-pointer transition-all", controls.state.loop.active && "bg-green-500 border-green-500")}
                            onClick={controls.toggleLoop}
                        />
                    </div>

                    {/* Loop Controls */}
                    <div className="flex gap-1 mb-1">
                        <button onClick={controls.loopIn} className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-sm text-[9px] text-neutral-400 hover:text-white hover:bg-[#3f3f46] h-7 flex items-center justify-center">IN</button>
                        <button onClick={controls.loopOut} className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-sm text-[9px] text-neutral-400 hover:text-white hover:bg-[#3f3f46] h-7 flex items-center justify-center">OUT</button>
                    </div>

                    <div className="flex gap-1 mb-[2px] px-2">
                        <button onClick={() => controls.loopShift('back')} className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-sm text-[9px] text-neutral-400 hover:text-white hover:bg-[#3f3f46] h-5 flex items-center justify-center">&lt;</button>
                        <button onClick={() => controls.loopShift('fwd')} className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-sm text-[9px] text-neutral-400 hover:text-white hover:bg-[#3f3f46] h-5 flex items-center justify-center">&gt;</button>
                    </div>

                    <div className="grid grid-cols-2 gap-1 flex-1 min-h-0">
                        {['1/16', '1/8', '1/4', '1/2', '1', '2', '4', '8'].map(val => (
                            <button
                                key={val}
                                className="bg-[#27272a] border border-[#3f3f46] rounded-sm text-[9px] font-bold text-neutral-400 hover:text-white hover:bg-[#3f3f46] flex items-center justify-center transition-colors h-full"
                                onClick={() => {
                                    let beats = 4;
                                    if (val.includes('/')) {
                                        const [n, d] = val.split('/');
                                        beats = parseInt(n) / parseInt(d);
                                    } else {
                                        beats = parseInt(val);
                                    }
                                    controls.quantizedLoop(beats);
                                }}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* FX Panel (Flexible, full props) */}
                <div className="flex-1 min-w-0 h-full">
                    <FXUnitGroup
                        label={`FX UNIT ${id}`}
                        masterMix={controls.fx.masterMix}
                        setMasterMix={controls.fx.setMasterMix}
                        masterOn={controls.fx.masterOn}
                        setMasterOn={controls.fx.setMasterOn}
                        slots={controls.fx.slots}
                        setSlotType={controls.fx.setSlotType}
                        setSlotAmount={controls.fx.setSlotAmount}
                        setSlotOn={controls.fx.setSlotOn}
                    />
                </div>
            </div>
        </div>
    );
};
