import React, { useEffect, useRef, useState } from 'react';
import { DeckControls } from '@/hooks/useWebAudio';
import { Play, Pause, Upload, Disc, Loader2, Repeat, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FXUnitGroup } from './FXUnitGroup';
import { DetailWaveform } from './DetailWaveform';
import { OverviewBar } from './OverviewBar';
import { useSyncLogic } from '@/hooks/useSyncLogic';
import { PhaseMeter } from './PhaseMeter';

interface MixerDeckProps {
    id: 'A' | 'B';
    controls: DeckControls;
    analyser: AnalyserNode | null;
    color: 'cyan' | 'purple';
    onSync?: () => void;
    isMaster?: boolean;
    onToggleMaster?: () => void;
}

export const MixerDeck = ({ id, controls, analyser, color, onSync, isMaster, onToggleMaster }: MixerDeckProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [trackName, setTrackName] = useState<string | null>(null);
    const [zoom, setZoom] = useState(100); // Pixels per second (Default ~100)
    const [showGrid, setShowGrid] = useState(true);
    const [quantize, setQuantize] = useState(true);

    const loadFile = async (file: File | string, name?: string) => {
        if (isLoading) return;
        setIsLoading(true);
        setTrackName(name || (typeof file === 'string' ? 'Stream' : file.name));

        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Loading timed out")), 30000)
        );

        try {
            // @ts-ignore
            await Promise.race([controls.loadTrack(file), timeout]);
            toast.success(`Loaded ${name || 'Track'}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load track.");
            setTrackName(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(false);

        const jsonData = e.dataTransfer.getData('application/json');
        if (jsonData) {
            try {
                const data = JSON.parse(jsonData);
                if (data.type === 'track' && data.url) {
                    await loadFile(data.url, data.title);
                    return;
                }
            } catch (err) { }
        }

        const file = e.dataTransfer.files[0];
        if (file) await loadFile(file);
    };

    const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) loadFile(file);
    };

    const isCyan = color === 'cyan';
    const accentColor = isCyan ? 'text-cyan-400' : 'text-purple-400';
    const neonShadow = isCyan ? 'drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' : 'drop-shadow-[0_0_5px_rgba(192,132,252,0.8)]';


    const { handleSync, handleMaster, isMaster: isDeckMaster, getPhaseOffset } = useSyncLogic(id, controls, controls.state.bpm);

    return (
        <div className="flex flex-col h-full bg-[#121212] rounded-md border border-[#27272a] overflow-hidden shadow-sm relative">
            {/* 1. Header & Transport */}
            <div className="h-20 px-2 flex items-center justify-between border-b border-[#27272a] bg-[#18181b] gap-2">

                {/* Deck ID */}
                <div className="flex flex-col gap-1 w-12 shrink-0 h-full justify-center">
                    <div className={cn(
                        "w-full h-8 flex items-center justify-center font-bold text-black text-xs rounded-[2px]",
                        isCyan ? "bg-cyan-500" : "bg-purple-500"
                    )}>
                        {id}
                    </div>
                </div>

                {/* Info Display & Phase Meter */}
                <div className="flex-1 flex flex-col min-w-0 gap-1 justify-center h-full pr-2">
                    {/* Track Info (Neon Level Style) */}
                    <div className="flex items-center justify-between">
                        <span
                            className={cn(
                                "font-bold text-sm truncate max-w-[150px] tracking-wide",
                                trackName ? "text-white" : "text-neutral-500"
                            )}
                            title={trackName || ""}
                            style={{ textShadow: trackName ? (isCyan ? '0 0 8px rgba(34,211,238,0.6)' : '0 0 8px rgba(192,132,252,0.6)') : 'none' }}
                        >
                            {trackName || "NO TRACK"}
                        </span>

                        {/* Manual Tempo Buttons & BPM (Precision Control) */}
                        <div className="flex items-center gap-2">
                            <button
                                className="w-5 h-5 bg-[#27272a] border border-[#3f3f46] rounded-sm flex items-center justify-center text-neutral-400 hover:text-white"
                                onClick={() => {
                                    if (controls.state.bpm) {
                                        const currentBPM = controls.state.bpm * controls.state.playbackRate;
                                        const targetBPM = currentBPM - 0.1;
                                        controls.setSpeed(targetBPM / controls.state.bpm);
                                    } else {
                                        controls.setSpeed(controls.state.playbackRate - 0.001);
                                    }
                                }}
                            >
                                -
                            </button>
                            <span
                                className={cn("text-xl font-black tracking-tighter leading-none w-20 text-center font-mono", accentColor)}
                                style={{ textShadow: isCyan ? '0 0 10px rgba(34,211,238,0.5)' : '0 0 10px rgba(192,132,252,0.5)' }}
                            >
                                {controls.state.bpm ? (controls.state.bpm * controls.state.playbackRate).toFixed(2) : "0.00"}
                            </span>
                            <button
                                className="w-5 h-5 bg-[#27272a] border border-[#3f3f46] rounded-sm flex items-center justify-center text-neutral-400 hover:text-white"
                                onClick={() => {
                                    if (controls.state.bpm) {
                                        const currentBPM = controls.state.bpm * controls.state.playbackRate;
                                        const targetBPM = currentBPM + 0.1;
                                        controls.setSpeed(targetBPM / controls.state.bpm);
                                    } else {
                                        controls.setSpeed(controls.state.playbackRate + 0.001);
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
                    <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                        <span className="font-mono">{controls.state.buffer ? (controls.state.duration / 60).toFixed(2).replace('.', ':') : "00:00"}</span>
                        <span className={cn(isCyan ? "text-cyan-200" : "text-purple-200", "font-mono")}>8A</span>
                    </div>
                </div>
            </div>

            {/* 2. Detail Waveform Area */}
            <div
                ref={containerRef}
                className="flex-1 relative bg-[#09090b] group min-h-[40px] max-h-[150px] border-b border-[#27272a]"
                onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
                onDragLeave={() => setIsHovering(false)}
                onDrop={handleDrop}
            >
                <DetailWaveform
                    buffer={controls.state.buffer}
                    currentTime={controls.state.currentTime}
                    zoom={zoom}
                    setZoom={setZoom}
                    color={color}
                    height={containerRef.current?.clientHeight || 150}
                    showGrid={showGrid}
                    bpm={controls.state.bpm || 128}
                    onSeek={controls.seek}
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

            {/* 2.5 Overview Waveform (Progress Bar) */}
            <div className="h-8 bg-[#09090b] border-b border-[#27272a] relative">
                <OverviewBar
                    buffer={controls.state.buffer}
                    currentTime={controls.state.currentTime}
                    duration={controls.state.duration}
                    onSeek={controls.seek}
                    color={color}
                    height={32}
                    zoom={zoom}
                    canvasWidth={containerRef.current?.clientWidth || 500}
                />
            </div>

            {/* 3. Transport Strip */}
            <div className="h-12 bg-[#18181b] border-b border-[#27272a] flex items-center px-3 gap-3 justify-between">
                <div className="flex items-center gap-2">
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
                            isMaster && "bg-yellow-500/20 border-yellow-500 text-yellow-500"
                        )}
                        onClick={onToggleMaster}
                    >
                        <span className="text-[9px] font-bold">MASTER</span>
                    </Button>

                    <Button
                        variant="ghost"
                        className={cn(
                            "h-9 w-12 rounded-sm border border-[#3f3f46] bg-[#27272a] hover:bg-[#3f3f46] flex flex-col items-center justify-center gap-0 p-0 transition-all",
                            "active:scale-95"
                        )}
                        onClick={onSync}
                    >
                        <span className="text-[9px] font-bold text-neutral-400">SYNC</span>
                    </Button>
                </div>
            </div>

            {/* 4. Loops & FX Panels */}
            <div className="flex-1 flex bg-[#121212] min-h-0">
                {/* Loops Panel */}
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
                        <button onClick={controls.loopIn} className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-sm text-[8px] text-neutral-400 hover:text-white hover:bg-[#3f3f46] h-6 flex items-center justify-center">IN</button>
                        <button onClick={controls.loopOut} className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-sm text-[8px] text-neutral-400 hover:text-white hover:bg-[#3f3f46] h-6 flex items-center justify-center">OUT</button>
                    </div>

                    <div className="flex gap-1 mb-1">
                        <button onClick={() => controls.loopShift('back')} className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-sm text-[8px] text-neutral-400 hover:text-white hover:bg-[#3f3f46] h-6 flex items-center justify-center">&lt;</button>
                        <button onClick={() => controls.loopShift('fwd')} className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-sm text-[8px] text-neutral-400 hover:text-white hover:bg-[#3f3f46] h-6 flex items-center justify-center">&gt;</button>
                    </div>

                    <div className="grid grid-cols-2 gap-1 flex-1 min-h-0">
                        {['1/16', '1/8', '1/4', '1/2', '1', '2', '4', '8'].map(val => (
                            <button key={val} className="bg-[#27272a] border border-[#3f3f46] rounded-sm text-[7px] text-neutral-400 hover:text-white hover:bg-[#3f3f46] flex items-center justify-center transition-colors h-full">
                                {val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* FX Panel */}
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
