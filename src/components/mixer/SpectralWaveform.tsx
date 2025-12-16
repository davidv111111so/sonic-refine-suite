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
}

export const SpectralWaveform = ({ buffer, currentTime, zoom, setZoom, color, height = 150, showGrid = true, bpm = 128, onSeek, loop, cuePoint }: SpectralWaveformProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const [peaks, setPeaks] = useState<WaveformChunk[] | null>(null);
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
        const transferBuffer = new Float32Array(channelData);

        worker.postMessage({
            channelData: transferBuffer,
            sampleRate: buffer.sampleRate,
            samplesPerPixel: 512 // High Res
        }, [transferBuffer.buffer]);

        worker.onmessage = (e) => {
            if (e.data.peaks) {
                setPeaks(e.data.peaks);
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
                const beatDuration = 60 / bpm;
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
                const peak = peaks[peakIndex];

                if (peak) {
                    // Spectral Logic
                    // Base: Low frequency (Dark)
                    const lowH = peak.low * (height * 0.8);

                    // Detail: High frequency (Bright)
                    const highH = peak.midHigh * (height * 0.6);

                    // Draw Low (Bass) Layer
                    ctx.strokeStyle = color === 'cyan' ? '#155e75' : '#581c87'; // Dark Cyan / Purple
                    ctx.globalAlpha = 1.0;
                    ctx.beginPath();
                    ctx.moveTo(x, center - lowH);
                    ctx.lineTo(x, center + lowH);
                    ctx.stroke();

                    // Draw High (Treble) Layer (Overlaid, smaller)
                    ctx.strokeStyle = color === 'cyan' ? '#22d3ee' : '#d8b4fe'; // Bright Cyan / Lavender
                    ctx.globalAlpha = 0.8;
                    const hDisp = highH + (peak.rms * 5); // Add some "pop"
                    ctx.beginPath();
                    ctx.moveTo(x, center - hDisp);
                    ctx.lineTo(x, center + hDisp);
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1.0;

            // Markers

            // Loop Region
            if (loop && loop.active) {
                const loopStartX = halfWidth + (loop.start - currentTime) * zoom;
                const loopEndX = halfWidth + (loop.end - currentTime) * zoom;

                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.fillRect(loopStartX, 0, Math.max(1, loopEndX - loopStartX), height);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(loopStartX, 0, Math.max(1, loopEndX - loopStartX), height);
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
    }, [buffer, peaks, currentTime, zoom, height, showGrid, bpm, color, loop, cuePoint]);

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

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden bg-[#121212] cursor-crosshair group"
            onWheel={handleWheel}
        >
            <canvas ref={canvasRef} className="block w-full h-full" />

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
