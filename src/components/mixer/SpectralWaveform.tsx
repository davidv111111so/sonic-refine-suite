import React, { useEffect, useRef, useState } from 'react';
import { getCachedPeaks, setCachedPeaks, generateBufferKey } from '@/utils/audioCache';

interface WaveformChunk {
    min: number;
    max: number;
    rms: number;
    low: number;
    midHigh: number;
}

interface SpectralWaveformProps {
    buffer: AudioBuffer | null;
    currentTime: number;
    zoom: number; // Pixels per second
    setZoom: (z: number) => void;
    color: 'cyan' | 'purple';
    height?: number;
    showGrid?: boolean;
    bpm?: number;
    beatOffset?: number;
    grid?: number[];
    onSeek?: (time: number) => void;
    loop?: { active: boolean; start: number; end: number };
    cuePoint?: number | null;
    onPlay?: () => void;
    onPause?: () => void;
    onScrubStart?: () => void;
    onScrubEnd?: () => void;
    isPlaying?: boolean;
    playbackRate?: number;
}

export const SpectralWaveform = ({ buffer, currentTime, zoom, setZoom, color, height = 150, showGrid = true, bpm = 128, beatOffset = 0, grid = [], onSeek, loop, cuePoint, onPlay, onPause, onScrubStart, onScrubEnd, isPlaying, playbackRate = 1 }: SpectralWaveformProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const [peaks, setPeaks] = useState<Float32Array | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const lastMouseX = useRef<number>(0);

    // 1. Analyze Audio
    useEffect(() => {
        let isMounted = true;

        const loadPeaks = async () => {
            if (!buffer) {
                if (isMounted) setPeaks(null);
                return;
            }

            const cacheKey = generateBufferKey(buffer);
            const cached = await getCachedPeaks(cacheKey);

            if (cached && isMounted) {
                setPeaks(cached);
                return;
            }

            // Not in cache, compute using worker
            const worker = new Worker(new URL('../../workers/waveformAnalysis.worker.ts', import.meta.url), { type: 'module' });
            workerRef.current = worker;

            const channelData = buffer.getChannelData(0);
            const transferBuffer = new Float32Array(channelData);

            worker.postMessage({
                channelData: transferBuffer,
                sampleRate: buffer.sampleRate,
                samplesPerPixel: 512 // High Res
            }, [transferBuffer.buffer]);

            worker.onmessage = async (e) => {
                const generatedPeaks = e.data.peaks;
                if (generatedPeaks && generatedPeaks instanceof Float32Array) {
                    if (isMounted) setPeaks(generatedPeaks);
                    await setCachedPeaks(cacheKey, generatedPeaks);
                } else if (generatedPeaks) {
                    console.warn("Worker returned non-Float32Array", generatedPeaks);
                }
            };
        };

        loadPeaks();

        return () => {
            isMounted = false;
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, [buffer]);

    const currentTimeRef = useRef(currentTime);
    useEffect(() => {
        currentTimeRef.current = currentTime;
    }, [currentTime]);

    // 2. Rendering Loop
    useEffect(() => {
        if (!canvasRef.current || !peaks || !buffer) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for perf
        if (!ctx) return;

        // DPI & Sizing
        const dpr = window.devicePixelRatio || 1;
        const updateSize = () => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                canvas.width = rect.width * dpr;
                canvas.height = height * dpr;
                ctx.scale(dpr, dpr);
            }
        };
        updateSize();

        const width = canvas.width / dpr;
        const center = height / 2;

        let animationFrame: number;

        const render = () => {
            const time_now = currentTimeRef.current;
            ctx.clearRect(0, 0, width, height);

            // Background
            ctx.fillStyle = '#121212';
            ctx.fillRect(0, 0, width, height);

            // Grid
            if (showGrid && grid && grid.length > 0) {
                // Precise Array-Based Beatgrid rendering
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 1;

                ctx.beginPath();
                for (let i = 0; i < grid.length; i++) {
                    const beatTime = grid[i];
                    const x = (width / 2) + ((beatTime - time_now) * zoom);

                    // Only draw if within canvas bounds
                    if (x > -10 && x < width + 10) {
                        const beatDuration = 60 / bpm;
                        const absoluteBeatIndex = Math.round((beatTime - (beatOffset || grid[0])) / beatDuration);
                        const isBar = absoluteBeatIndex % 4 === 0;

                        if (isBar) {
                            ctx.stroke();
                            ctx.beginPath();
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                            ctx.lineWidth = 1.5;
                            ctx.moveTo(x, 0); ctx.lineTo(x, height);
                            ctx.stroke();

                            if (zoom > 100) {
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                                ctx.font = '10px Inter';
                                ctx.fillText(`${(absoluteBeatIndex / 4) + 1}`, x + 4, 12);
                            }

                            ctx.beginPath();
                            ctx.lineWidth = 1;
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                        } else {
                            ctx.moveTo(x, 0); ctx.lineTo(x, height);
                        }
                    }
                }
                ctx.stroke();
            } else if (showGrid && bpm > 0) {
                // Fallback math-based grid
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                const beatDuration = 60 / (bpm * playbackRate);
                const pixelsPerBeat = beatDuration * zoom;
                const startTimeOffset = (time_now - beatOffset) % beatDuration;
                const startX = (width / 2) - (startTimeOffset * zoom);

                // Draw visible beats
                for (let x = startX; x > -pixelsPerBeat; x -= pixelsPerBeat) {
                    const t = time_now + (x - width / 2) / zoom;
                    const beatIdx = Math.round((t - beatOffset) / beatDuration);
                    const isBar = beatIdx % 4 === 0;

                    if (isBar) {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.lineWidth = 1.5;
                    } else {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                        ctx.lineWidth = 1;
                    }

                    ctx.beginPath();
                    ctx.moveTo(x, 0); ctx.lineTo(x, height);
                    ctx.stroke();
                }
                for (let x = startX + pixelsPerBeat; x < width + pixelsPerBeat; x += pixelsPerBeat) {
                    const t = time_now + (x - width / 2) / zoom;
                    const beatIdx = Math.round((t - beatOffset) / beatDuration);
                    const isBar = beatIdx % 4 === 0;

                    if (isBar) {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.lineWidth = 1.5;
                    } else {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                        ctx.lineWidth = 1;
                    }

                    ctx.beginPath();
                    ctx.moveTo(x, 0); ctx.lineTo(x, height);
                    ctx.stroke();
                }
            }

            // Waveform
            const samplesPerPixel = 512;
            const samplesPerSecond = buffer.sampleRate;
            const pixelsPerSecond_Data = samplesPerSecond / samplesPerPixel;

            const halfWidth = width / 2;
            const startTime = time_now - (halfWidth / zoom);

            const step = 2; // Keep at 2 for performance
            const lineData: { x: number, lowH: number, midH: number, highH: number, rmsVal: number, highIntensity: number }[] = [];

            for (let x = 0; x < width; x += step) {
                const t = startTime + (x / zoom);
                if (t < 0 || t > buffer.duration) continue;

                const peakIndex = Math.floor(t * pixelsPerSecond_Data);
                const offset = peakIndex * 5;

                if (offset + 4 < peaks.length) {
                    const lowVal = peaks[offset + 3];
                    const midHighVal = peaks[offset + 4];
                    const rmsVal = peaks[offset + 2];

                    lineData.push({
                        x,
                        lowH: lowVal * (height * 0.85),
                        midH: rmsVal * (height * 0.4),
                        highH: midHighVal * (height * 0.65),
                        rmsVal,
                        highIntensity: Math.min(1, midHighVal * 1.8)
                    });
                }
            }

            // 1. Draw Bass (Blue/Indigo)
            ctx.strokeStyle = color === 'cyan' ? '#1e40af' : '#4c1d95';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (const d of lineData) {
                ctx.moveTo(d.x, center - d.lowH);
                ctx.lineTo(d.x, center + d.lowH);
            }
            ctx.stroke();

            // 2. Draw Mid Range (Cyan/Green or Purple/Lavender)
            ctx.strokeStyle = color === 'cyan' ? '#06b6d4' : '#a855f7';
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            for (const d of lineData) {
                ctx.moveTo(d.x, center - d.midH);
                ctx.lineTo(d.x, center + d.midH);
            }
            ctx.stroke();

            // 3. Draw High Frequencies / Transients (Batched by color/intensity levels)
            ctx.lineWidth = 1;
            ctx.globalAlpha = 1.0;

            // Group and batch transients to avoid many stroke() calls
            ctx.beginPath();
            ctx.strokeStyle = color === 'cyan' ? 'rgba(255, 180, 0, 0.6)' : 'rgba(255, 0, 200, 0.6)';
            for (const d of lineData) {
                if (d.highIntensity < 0.1) continue;
                const hDisp = d.highH + (d.rmsVal * 4);
                ctx.moveTo(d.x, center - hDisp);
                ctx.lineTo(d.x, center + hDisp);
            }
            ctx.stroke();

            // Hot transients (Extra bright)
            ctx.beginPath();
            ctx.strokeStyle = color === 'cyan' ? 'rgba(255, 255, 200, 1.0)' : 'rgba(255, 255, 255, 1.0)';
            for (const d of lineData) {
                if (d.highIntensity < 0.7) continue;
                const hDisp = d.highH * 0.5; // Only the tip
                ctx.moveTo(d.x, center - hDisp);
                ctx.lineTo(d.x, center + hDisp);
            }
            ctx.stroke();

            ctx.globalAlpha = 1.0;

            // Loop Region
            if (loop) {
                const loopStartX = halfWidth + (loop.start - time_now) * zoom;
                const loopEndX = halfWidth + (loop.end - time_now) * zoom;

                if (loop.active) {
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                    ctx.fillRect(loopStartX, 0, Math.max(1, loopEndX - loopStartX), height);

                    ctx.strokeStyle = '#ff003c';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(loopEndX, 0); ctx.lineTo(loopEndX, height);
                    ctx.stroke();
                    ctx.fillStyle = '#ff003c';
                    ctx.font = '9px sans-serif';
                    ctx.fillText("OUT", loopEndX + 2, height - 5);
                }

                if (loop.active || loop.start > 0) {
                    ctx.strokeStyle = '#39ff14';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(loopStartX, 0); ctx.lineTo(loopStartX, height);
                    ctx.stroke();
                    ctx.fillStyle = '#39ff14';
                    ctx.font = '9px sans-serif';
                    ctx.fillText("IN", loopStartX + 2, 10);
                }
            }

            // Cue Point
            if (cuePoint !== null && cuePoint !== undefined) {
                const cueX = halfWidth + (cuePoint - time_now) * zoom;
                if (cueX >= 0 && cueX <= width) {
                    ctx.fillStyle = '#f43f5e';
                    ctx.beginPath();
                    ctx.moveTo(cueX, 10); ctx.lineTo(cueX - 6, 0); ctx.lineTo(cueX + 6, 0);
                    ctx.fill();
                    ctx.fillRect(cueX - 1, 0, 2, height);
                    ctx.font = '10px sans-serif';
                    ctx.fillText("CUE", cueX + 4, 20);
                }
            }

            // Playhead (Center)
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#fff';
            ctx.fillRect(width / 2 - 1, 0, 2, height);
            ctx.shadowBlur = 0;

            if (isPlaying) {
                animationFrame = requestAnimationFrame(render);
            }
        };

        if (isPlaying || !animationFrame) {
            render();
        }
        return () => cancelAnimationFrame(animationFrame);
    }, [buffer, peaks, zoom, height, showGrid, bpm, color, loop, cuePoint, playbackRate, isPlaying]);

    // Zoom Handling (Wheel)
    const handleWheel = (e: React.WheelEvent) => {

        e.stopPropagation();
        // Determine direction
        const delta = -Math.sign(e.deltaY);
        const factor = 1.1;
        const newZoom = delta > 0 ? zoom * factor : zoom / factor;
        const clamped = Math.max(10, Math.min(newZoom, 2000));
        setZoom(clamped);
    };

    const startX = useRef(0);
    const startSeekTime = useRef(0);
    const wasPlayingRef = useRef(false);

    // Mouse Interaction Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        startX.current = e.clientX;
        startSeekTime.current = currentTimeRef.current;
        document.body.style.cursor = 'grabbing';

        wasPlayingRef.current = !!isPlaying;
        if (onScrubStart) {
            onScrubStart();
        } else if (isPlaying && onPause) {
            onPause();
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !onSeek || !buffer) return;
            e.preventDefault();
            const deltaPx = startX.current - e.clientX;
            // Shift + Drag for fine adjustment (10x slower)
            const speedMultiplier = e.shiftKey ? 0.1 : 1.0;
            const deltaSec = (deltaPx / zoom) * speedMultiplier;
            const newTime = Math.max(0, Math.min(buffer.duration, startSeekTime.current + deltaSec));
            onSeek(newTime);
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                document.body.style.cursor = '';
                if (onScrubEnd) {
                    onScrubEnd();
                }
                if (wasPlayingRef.current && onPlay) {
                    onPlay();
                }
                wasPlayingRef.current = false;
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, zoom, buffer, onSeek, onPlay]);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full relative overflow-hidden bg-[#121212] group ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
        >
            <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />

            {/* Hover Zoom Controls */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    className="bg-black/50 text-white w-6 h-6 flex items-center justify-center rounded border border-white/10 hover:bg-black/80"
                    onClick={() => setZoom(Math.min(zoom * 1.5, 2000))}
                >+</button>
                <button
                    className="bg-black/50 text-white w-6 h-6 flex items-center justify-center rounded border border-white/10 hover:bg-black/80"
                    onClick={() => setZoom(Math.max(zoom / 1.5, 10))}
                >-</button>
            </div>
        </div>
    );
};
