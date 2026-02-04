import React, { useEffect, useRef, useState } from 'react';

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
    onSeek?: (time: number) => void;
    loop?: { active: boolean; start: number; end: number };
    cuePoint?: number | null;
    onPlay?: () => void;
    onPause?: () => void;
    isPlaying?: boolean;
    playbackRate?: number;
}

export const SpectralWaveform = ({ buffer, currentTime, zoom, setZoom, color, height = 150, showGrid = true, bpm = 128, onSeek, loop, cuePoint, onPlay, onPause, isPlaying, playbackRate = 1 }: SpectralWaveformProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const [peaks, setPeaks] = useState<Float32Array | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const lastMouseX = useRef<number>(0);

    // 1. Analyze Audio
    useEffect(() => {
        if (!buffer) {
            setPeaks(null);
            return;
        }

        const worker = new Worker(new URL('../../workers/waveformAnalysis.worker.ts', import.meta.url), { type: 'module' });
        workerRef.current = worker;

        const channelData = buffer.getChannelData(0);
        // Copy for transfer (mandatory unless SharedArrayBuffer)
        const transferBuffer = new Float32Array(channelData);

        worker.postMessage({
            channelData: transferBuffer,
            sampleRate: buffer.sampleRate,
            samplesPerPixel: 512 // High Res
        }, [transferBuffer.buffer]);

        worker.onmessage = (e) => {
            if (e.data.peaks && e.data.peaks instanceof Float32Array) {
                setPeaks(e.data.peaks);
            } else if (e.data.peaks) {
                // Legacy fallback or error (shouldn't happen with new worker)
                console.warn("Worker returned non-Float32Array", e.data.peaks);
            }
        };

        return () => worker.terminate();
    }, [buffer]);

    // 2. Rendering Loop
    useEffect(() => {
        if (!canvasRef.current || !peaks || !buffer) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        // DPI & Sizing
        const dpr = window.devicePixelRatio || 1;
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            canvas.width = rect.width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        }
        const width = rect?.width || canvas.width;
        const center = height / 2;

        let animationFrame: number;

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Background
            ctx.fillStyle = '#121212';
            ctx.fillRect(0, 0, width, height);

            // Grid
            if (showGrid && bpm > 0) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                const beatDuration = 60 / (bpm * playbackRate);
                const pixelsPerBeat = beatDuration * zoom;
                const offsetTime = currentTime % beatDuration;
                const offsetPixels = offsetTime * zoom;

                // Draw Grid lines relative to center
                // Center is currentTime. 
                const startX = (width / 2) - offsetPixels;

                // Left side
                for (let x = startX; x > 0; x -= pixelsPerBeat) {
                    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
                }
                // Right side
                for (let x = startX; x < width; x += pixelsPerBeat) {
                    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
                }
            }

            // Waveform
            // Viewport: [currTime - width/2/zoom, currTime + width/2/zoom]
            // We need to map pixels 0..width to peak indices

            const samplesPerPixel = 512; // Must match worker
            const samplesPerSecond = buffer.sampleRate;
            const pixelsPerSecond_Data = samplesPerSecond / samplesPerPixel; // ~86 peaks/sec at 44.1k

            // Render logic: Iterate mainly through canvas X pixels to draw lines
            // Map x -> time -> peakIndex

            const halfWidth = width / 2;
            const startTime = currentTime - (halfWidth / zoom);

            ctx.lineWidth = 2; // Thicker lines for spectral look

            // Optimization: Only iterate visible range
            const step = 2; // Skip pixels for style/perf

            for (let x = 0; x < width; x += step) {
                const time = startTime + (x / zoom);
                if (time < 0 || time > buffer.duration) continue;

                const peakIndex = Math.floor(time * pixelsPerSecond_Data);
                const offset = peakIndex * 5;

                // Ensure bounds
                if (offset + 4 < peaks.length) {
                    // Unpack: [min, max, rms, low, midHigh]
                    const lowVal = peaks[offset + 3];
                    const midHighVal = peaks[offset + 4];
                    const rmsVal = peaks[offset + 2];

                    // Calculations
                    const lowH = lowVal * (height * 0.85);
                    const highH = midHighVal * (height * 0.65);
                    const midH = rmsVal * (height * 0.4);

                    const highIntensity = Math.min(1, midHighVal * 1.8);
                    const lowIntensity = Math.min(1, lowVal * 2.2);

                    // 1. Draw Bass (Blue/Indigo)
                    ctx.strokeStyle = color === 'cyan' ? '#1e40af' : '#4c1d95'; // Darker base for contrast
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(x, center - lowH);
                    ctx.lineTo(x, center + lowH);
                    ctx.stroke();

                    // 2. Draw Mid Range (Cyan/Green or Purple/Lavender)
                    ctx.strokeStyle = color === 'cyan' ? '#06b6d4' : '#a855f7';
                    ctx.lineWidth = 1.5;
                    ctx.globalAlpha = 0.7;
                    ctx.beginPath();
                    ctx.moveTo(x, center - midH);
                    ctx.lineTo(x, center + midH);
                    ctx.stroke();

                    // 3. Draw High Frequencies / Transients (Bright Orange/Red for Cyan, Pink/Yellow for Purple)
                    // This makes the SNAPHOT/HATS pop
                    ctx.strokeStyle = color === 'cyan'
                        ? `rgba(255, ${150 + highIntensity * 105}, 0, ${highIntensity * 0.9 + 0.1})`
                        : `rgba(255, 0, ${255 - highIntensity * 155}, ${highIntensity * 0.9 + 0.1})`;

                    ctx.lineWidth = 1;
                    const hDisp = highH + (rmsVal * 4);
                    ctx.beginPath();
                    ctx.moveTo(x, center - hDisp);
                    ctx.lineTo(x, center + hDisp);
                    ctx.stroke();

                    ctx.globalAlpha = 1.0;
                }
            }
            ctx.globalAlpha = 1.0;

            // Markers

            // Loop Region
            // Loop Region
            if (loop) {
                const loopStartX = halfWidth + (loop.start - currentTime) * zoom;
                const loopEndX = halfWidth + (loop.end - currentTime) * zoom;

                // 1. In Marker (Always show if start is defined/non-zero contextually, or checking active loop)
                // For 'Manual Loop IN' visualization: we usually want to see the marker if 'loop.start' was just set.
                // Assuming loop.start defaults to 0, checks if it's > 0 or if likely intentional. 
                // However, simpler to just draw it if it exists inside view.

                if (loop.active) {
                    // Active Overlay
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'; // Green Overlay
                    ctx.fillRect(loopStartX, 0, Math.max(1, loopEndX - loopStartX), height);

                    // Out Marker (Red)
                    ctx.strokeStyle = '#ff003c';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(loopEndX, 0);
                    ctx.lineTo(loopEndX, height);
                    ctx.stroke();
                    // Label
                    ctx.fillStyle = '#ff003c';
                    ctx.font = '9px sans-serif';
                    ctx.fillText("OUT", loopEndX + 2, height - 5);
                }

                // In Marker (Green) - Show if Active OR just "Start set" (user pressed IN)
                // To distinguish "fresh" start vs default 0, we rely on usage. 
                // Using loop.start > 0 check as basic filter
                if (loop.active || loop.start > 0) {
                    ctx.strokeStyle = '#39ff14'; // Neon Green
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(loopStartX, 0);
                    ctx.lineTo(loopStartX, height);
                    ctx.stroke();
                    // Label
                    ctx.fillStyle = '#39ff14';
                    ctx.font = '9px sans-serif';
                    ctx.fillText("IN", loopStartX + 2, 10);
                }
            }

            // Cue Point
            if (cuePoint !== null && cuePoint !== undefined) {
                const cueX = halfWidth + (cuePoint - currentTime) * zoom;
                if (cueX >= 0 && cueX <= width) {
                    ctx.fillStyle = '#f43f5e'; // Rose-500
                    ctx.beginPath();
                    ctx.moveTo(cueX, 10);
                    ctx.lineTo(cueX - 6, 0);
                    ctx.lineTo(cueX + 6, 0);
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

            animationFrame = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrame);
    }, [buffer, peaks, currentTime, zoom, height, showGrid, bpm, color, loop, cuePoint, playbackRate]);

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
        // Only left click
        if (e.button !== 0) return;

        setIsDragging(true);
        startX.current = e.clientX;
        startSeekTime.current = currentTime;
        document.body.style.cursor = 'grabbing';

        // Hold to Pause Logic
        wasPlayingRef.current = !!isPlaying;
        if (isPlaying && onPause) {
            onPause();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !onSeek || !buffer) return;

        e.preventDefault();

        // Scrub Logic
        // Dragging Left (Delta < 0) -> Pulling record Left -> Audio moves Left -> Head over Future -> Time Increases
        // Formula: DeltaPx / Zoom(Px/Sec) = DeltaSec

        const deltaPx = startX.current - e.clientX; // Postive if dragged Left
        const deltaSec = deltaPx / zoom;

        const newTime = Math.max(0, Math.min(buffer.duration, startSeekTime.current + deltaSec));

        // Throttling could be useful but standard setTargetAtTime in engine handles smooth updates usually.
        // We'll call onSeek immediately for responsiveness.
        onSeek(newTime);
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            document.body.style.cursor = '';

            // Resume if was playing
            if (wasPlayingRef.current && onPlay) {
                onPlay();
            }
            wasPlayingRef.current = false;
        }
    };

    const handleMouseLeave = () => {
        if (isDragging) {
            setIsDragging(false);
            document.body.style.cursor = '';

            // Resume if was playing (and left window)
            if (wasPlayingRef.current && onPlay) {
                onPlay();
            }
            wasPlayingRef.current = false;
        }
    };

    return (
        <div
            ref={containerRef}
            className={`w-full h-full relative overflow-hidden bg-[#121212] group ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
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
