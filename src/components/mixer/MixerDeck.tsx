import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Repeat, Music2, RotateCw, ZoomIn, ZoomOut, Save, Power, Activity, Disc, ChevronDown, Headphones, Mic2, Disc3, Zap, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
        trackName = meta?.title || "Unknown Track";
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

                // Robust Title Fallback
                const titleToUse = data.title || (url ? url.split('/').pop().replace(/\.[^/.]+$/, "") : "Unknown Track");
                const artistToUse = data.artist || "Unknown Artist";

                if (url) {
                    setIsLoading(true);
                    try {
                        await controls.loadTrack(
                            url,
                            data.bpm,
                            data.indicator || data.harmonicKey || data.key,
                            { title: titleToUse, artist: artistToUse }
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
                await controls.loadTrack(file, undefined, undefined, {
                    title: file.name.replace(/\.[^/.]+$/, "") // Clean extension
                });
                console.log("MixerDeck: Load track completed successfully");
            } catch (err) {
                console.error("MixerDeck: Load track failed", err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log("MixerDeck: File selected via input", file.name);
            setIsLoading(true);
            try {
                await controls.loadTrack(file, undefined, undefined, {
                    title: file.name.replace(/\.[^/.]+$/, "") // Clean extension
                });
                console.log("MixerDeck: Load input track completed");
            } catch (err) {
                console.error("MixerDeck: Load input track failed", err);
            } finally {
                setIsLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const getPhaseOffset = () => {
        // Visualize Pitch Bend Action
        // Map 0.5 (Center) to 0 offset
        // Scale up for visibility
        return (controls.state.tempoBend - 0.5) * 4;
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

            {/* 1. Header & Transport (Compacted h-[60px]) */}
            <div className="h-[60px] px-2 pt-1 flex items-center justify-between border-b border-[#27272a] bg-[#18181b] gap-2">

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
                                "font-bold text-xs truncate max-w-[200px] tracking-wide",
                                trackName ? "text-white" : "text-neutral-500"
                            )}
                            title={trackName || "No Track Loaded"}
                            style={{ textShadow: trackName ? (isCyan ? '0 0 8px rgba(34,211,238,0.6)' : '0 0 8px rgba(192,132,252,0.6)') : 'none' }}
                        >
                            {trackName || "NO TRACK LOADED"}
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
                    playbackRate={controls.state.playbackRate}
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

            {/* 2.5 Overview Waveform (Improved Definition) */}
            <div className="h-10 bg-[#09090b] border-b border-[#27272a] relative">
                <StripeOverview
                    buffer={controls.state.buffer}
                    currentTime={controls.state.currentTime}
                    duration={controls.state.duration}
                    onSeek={controls.seek}
                    color={color as 'cyan' | 'purple'}
                    height={40}
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
                            "active:scale-95",
                            controls.state.isSynced && (isCyan
                                ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] hover:bg-cyan-400"
                                : "bg-purple-500 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.8)] hover:bg-purple-400")
                        )}
                        onClick={onSync}
                    >
                        <span className={cn("text-[9px] font-bold", controls.state.isSynced ? (isCyan ? "text-black" : "text-white") : "text-neutral-400")}>SYNC</span>
                    </Button>
                </div>
            </div>

            {/* 4. Loops & FX Panels (Increased height to 210px to accommodate new buttons) */}
            <div className="flex-none flex bg-[#121212] h-[210px]">
                {/* Loops Panel (w-36) */}
                <div className="w-36 border-r border-[#27272a] p-2 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 mb-0.5">
                        <div className="flex items-center gap-1"><Repeat className="w-3 h-3" /> LOOPS</div>
                        <button
                            className={cn(
                                "text-[9px] px-2 py-[2px] rounded border border-[#3f3f46] transition-all font-bold",
                                controls.state.loop.active
                                    ? "bg-[#39ff14] border-[#39ff14] text-black shadow-[0_0_10px_#39ff14]"
                                    : "bg-[#27272a] text-neutral-400 hover:text-white"
                            )}
                            onClick={controls.toggleLoop}
                        >
                            ACTIVE
                        </button>
                    </div>

                    {/* Loop Resizing Controls (Half/Double) */}
                    <div className="flex gap-1 h-8">
                        <button
                            onClick={controls.loopHalf}
                            className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-sm text-[11px] font-black text-neutral-300 hover:text-white hover:bg-[#3f3f46] flex items-center justify-center transition-all active:scale-95"
                            title="Half Loop Length"
                        >
                            &lt;
                        </button>
                        <button
                            onClick={controls.loopDouble}
                            className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-sm text-[11px] font-black text-neutral-300 hover:text-white hover:bg-[#3f3f46] flex items-center justify-center transition-all active:scale-95"
                            title="Double Loop Length"
                        >
                            &gt;
                        </button>
                    </div>

                    {/* Fractional Loop Buttons (1/16, 1/32) */}
                    <div className="flex gap-1 h-6">
                        <button
                            onClick={() => controls.quantizedLoop(1 / 16)}
                            className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-sm text-[9px] font-black text-neutral-400 hover:text-white hover:bg-[#3f3f46] flex items-center justify-center transition-all"
                        >
                            1/16
                        </button>
                        <button
                            onClick={() => controls.quantizedLoop(1 / 32)}
                            className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-sm text-[9px] font-black text-neutral-400 hover:text-white hover:bg-[#3f3f46] flex items-center justify-center transition-all"
                        >
                            1/32
                        </button>
                    </div>

                    {/* Auto Loop Grid (Larger buttons) */}
                    <div className="grid grid-cols-2 gap-1 flex-1 min-h-0">
                        {['1/4', '1/2', '1', '2', '4', '8', '16', '32'].map(val => (
                            <button
                                key={val}
                                className={cn(
                                    "bg-[#27272a] border border-[#3f3f46] rounded-sm text-[10px] font-black text-neutral-400 hover:text-white hover:bg-[#3f3f46] flex items-center justify-center transition-colors h-full",
                                    controls.state.loop.active &&
                                        (Math.abs((controls.state.loop.end - controls.state.loop.start) - (parseFloat(eval(val)) * (60 / (controls.state.bpm || 120)))) < 0.1)
                                        ? "border-[#39ff14] text-[#39ff14]"
                                        : ""
                                )}
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

                    {/* Loop Move / Shift (Newly Added) */}
                    <div className="flex gap-1 h-8">
                        <button
                            onClick={() => controls.loopShift('back')}
                            className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-sm text-[10px] font-bold text-neutral-500 hover:text-white hover:bg-[#222] flex items-center justify-center gap-1 transition-all"
                            title="Shift Loop Back"
                        >
                            <ChevronsLeft className="w-3 h-3" /> <span className="text-[8px] mt-[1px]">MOVE</span>
                        </button>
                        <button
                            onClick={() => controls.loopShift('fwd')}
                            className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-sm text-[10px] font-bold text-neutral-500 hover:text-white hover:bg-[#222] flex items-center justify-center gap-1 transition-all"
                            title="Shift Loop Forward"
                        >
                            <span className="text-[8px] mt-[1px]">MOVE</span> <ChevronsRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* FX Panel */}
                <div className="flex-1 min-w-0 h-full border-r border-[#27272a]">
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

                {/* Brain Stems Panel (w-28) */}
                <div className="w-28 bg-[#18181b] p-2 flex flex-col gap-2 border-l border-[#27272a]">
                    <div className="text-[10px] font-black text-neutral-500 uppercase tracking-tighter flex items-center gap-1 mb-1">
                        <Zap className="w-3 h-3 text-cyan-500" /> STEMS
                    </div>
                    {/* Stem Buttons */}
                    {[
                        { label: 'DRUMS', key: 'drums' as const, color: 'text-cyan-400' },
                        { label: 'BASS', key: 'bass' as const, color: 'text-blue-400' },
                        { label: 'VOCALS', key: 'vocals' as const, color: 'text-yellow-400' },
                        { label: 'OTHER', key: 'other' as const, color: 'text-purple-400' }
                    ].map(stem => (
                        <button
                            key={stem.key}
                            className={cn(
                                "flex-1 rounded-sm border text-[10px] font-black transition-all uppercase px-1",
                                (controls.state as any).stemVolumes[stem.key] > 0.1
                                    ? "bg-white/10 border-white/20 text-white shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]"
                                    : "bg-black/40 border-black/20 text-neutral-600 grayscale"
                            )}
                            onClick={() => {
                                const current = (controls.state as any).stemVolumes[stem.key];
                                controls.setStemVolume(stem.key, current > 0.1 ? 0 : 1);
                            }}
                        >
                            {stem.label}
                        </button>
                    ))}
                    <button
                        className={cn(
                            "h-8 rounded-sm border text-[10px] font-black uppercase transition-all mt-1",
                            (controls.state as any).isStemsActive
                                ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                                : "bg-neutral-800 text-neutral-500 border-neutral-700"
                        )}
                        onClick={(controls as any).toggleStems}
                    >
                        {(controls.state as any).isStemsActive ? "AI ON" : "AI OFF"}
                    </button>
                </div>
            </div>
        </div >
    );
};
