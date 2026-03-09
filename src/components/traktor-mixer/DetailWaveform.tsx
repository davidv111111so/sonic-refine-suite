
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { WaveformChunk } from '@/workers/waveformAnalysis.worker';

interface DetailWaveformProps {
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
    isPlaying?: boolean;
    onPlay?: () => void;
    onPause?: () => void;
}

export const DetailWaveform = ({ buffer, currentTime, zoom, setZoom, color, height = 150, showGrid = true, bpm = 128, beatOffset = 0, grid = [], onSeek, isPlaying, onPlay, onPause }: DetailWaveformProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const [peaks, setPeaks] = useState<Float32Array | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const lastMouseX = useRef<number>(0);
    const wasPlayingRef = useRef<boolean>(false);

    // 1. Analyze Audio (Worker)
    useEffect(() => {
        if (!buffer) {
            setPeaks(null);
            return;
        }

        setIsAnalyzing(true);

        // Initialize Worker
        const worker = new Worker(new URL('@/workers/waveformAnalysis.worker.ts', import.meta.url), { type: 'module' });
        workerRef.current = worker;

        const channelData = buffer.getChannelData(0);
        const transferBuffer = new Float32Array(channelData);

        worker.postMessage({
            channelData: transferBuffer,
            sampleRate: buffer.sampleRate,
            samplesPerPixel: 512 // Resolution
        }, [transferBuffer.buffer]);

        worker.onmessage = (e) => {
            if (e.data.peaks) {
                setPeaks(e.data.peaks);
                setIsAnalyzing(false);
            }
        };

        return () => {
            worker.terminate();
        };
    }, [buffer]);

    // 2. Rendering Loop
    useEffect(() => {
        if (!canvasRef.current || !peaks || !buffer) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let animationFrame: number;

        const render = () => {
            const width = canvas.width;
            const h = canvas.height;
            const center = h / 2;

            // Clear
            ctx.clearRect(0, 0, width, h);

            // Draw Grid (Traktor Style)
            if (showGrid && (grid.length > 0 || bpm > 0)) {
                let beatTimes: number[] = [];
                const halfWindowSeconds = (width / 2) / zoom;
                const startTime = currentTime - halfWindowSeconds;
                const endTime = currentTime + halfWindowSeconds;

                if (grid && grid.length > 0) {
                    beatTimes = grid.filter(t => t >= startTime - 1 && t <= endTime + 1);
                } else {
                    const beatDuration = 60 / bpm;
                    // Adjust based on beatOffset
                    const firstBeatIndex = Math.floor((startTime - beatOffset) / beatDuration);
                    const lastBeatIndex = Math.ceil((endTime - beatOffset) / beatDuration);
                    for (let i = firstBeatIndex; i <= lastBeatIndex; i++) {
                        beatTimes.push(beatOffset + (i * beatDuration));
                    }
                }

                ctx.save();
                beatTimes.forEach((beatTime, i) => {
                    const timeDiff = beatTime - currentTime;
                    const x = (width / 2) + (timeDiff * zoom);

                    // Traktor logic: 1st beat of bar is brighter/thicker
                    // If we use mt.beats (grid), we might not know the exact bar start easily without metadata,
                    // but we can assume index 0 is a downbeat or check modulo 4 if the grid is regular.
                    const isDownbeat = (grid.length > 0) ? (grid.indexOf(beatTime) % 4 === 0) : true;
                    // Actually, if it's from bpm/offset, we can use the loop index 'i' relative to start.
                    // But 'i' in beatTimes depends on the visible window.

                    // Let's calculate the absolute beat index
                    const beatDuration = 60 / bpm;
                    const absoluteBeatIndex = Math.round((beatTime - beatOffset) / beatDuration);
                    const isBar = absoluteBeatIndex % 4 === 0;

                    if (isBar) {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                        ctx.lineWidth = 1.5;
                    } else {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                        ctx.lineWidth = 0.5;
                    }

                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, h);
                    ctx.stroke();

                    // Optional: Beat numbers for bars
                    if (isBar && zoom > 100) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.font = '10px Inter';
                        ctx.fillText(`${(absoluteBeatIndex / 4) + 1}`, x + 4, 12);
                    }
                });
                ctx.restore();
            }

            // Draw Waveform
            const halfWindowSeconds = (width / 2) / zoom;
            const startTime = currentTime - halfWindowSeconds;
            const endTime = currentTime + halfWindowSeconds;

            const totalPeaks = peaks.length / 5;
            const duration = buffer.duration;

            // Indices
            let startIndex = Math.floor((startTime / duration) * totalPeaks);
            let endIndex = Math.ceil((endTime / duration) * totalPeaks);

            // Clamp
            startIndex = Math.max(0, startIndex);
            endIndex = Math.min(totalPeaks - 1, endIndex);

            const pixelsPerSecond = zoom;
            const peakDuration = duration / totalPeaks;
            const peakWidth = peakDuration * pixelsPerSecond;

            // Optimize: Draw wider bars if zoomed out? 
            // For now, draw simple lines.

            ctx.lineWidth = Math.max(1, peakWidth);

            // Base Color
            const baseColor = color === 'cyan' ? '0, 255, 255' : '168, 85, 247';

            for (let i = startIndex; i <= endIndex; i++) {
                const offset = i * 5;
                const min = peaks[offset];
                const max = peaks[offset + 1];
                const peakTime = i * peakDuration;
                const timeDiff = peakTime - currentTime;
                const x = (width / 2) + (timeDiff * pixelsPerSecond);

                // Height scaling
                const amplitude = Math.max(Math.abs(min), Math.abs(max));
                const barHeight = amplitude * (h * 0.8); // 80% height max

                // Color Logic
                // Note: isBass and lowSum was used in worker previously
                const lowIntensity = peaks[offset + 3];
                if (lowIntensity > 0.6) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'; // White for bass
                    ctx.shadowBlur = 0;
                } else {
                    // Spectral coloring based on intensity?
                    // Or just standard color
                    const alpha = Math.min(1, (peaks[offset + 2] ?? 0.5) * 2 + 0.5);
                    ctx.strokeStyle = `rgba(${baseColor}, ${alpha})`;
                    ctx.shadowBlur = 0;
                }

                ctx.beginPath();
                ctx.moveTo(x, center - barHeight / 2);
                ctx.lineTo(x, center + barHeight / 2);
                ctx.stroke();
            }

            // Center Playhead Line
            ctx.strokeStyle = '#ef4444'; // Red
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(width / 2, 0);
            ctx.lineTo(width / 2, h);
            ctx.stroke();

            animationFrame = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrame);
    }, [peaks, buffer, currentTime, zoom, color, showGrid, bpm]);

    // 3. Zoom Interaction
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = -e.deltaY * 0.5;
        const newZoom = Math.max(10, Math.min(2000, zoom + delta));
        setZoom(newZoom);
    };

    // 4. Improved Drag Interaction (Pointer Events for Cross-Device Support)
    useEffect(() => {
        const handleGlobalPointerMove = (e: PointerEvent) => {
            if (!isDragging || !onSeek || !buffer) return;

            // Track movement
            const deltaX = e.clientX - lastMouseX.current;
            lastMouseX.current = e.clientX;

            // Vinyl-style scrubbing: move time based on pixels dragged
            // Map pixels to seconds based on zoom Level
            const deltaSeconds = -deltaX / zoom;
            const newTime = Math.max(0, Math.min(buffer.duration, currentTime + deltaSeconds));

            onSeek(newTime);
        };

        const handleGlobalPointerUp = () => {
            if (isDragging) {
                setIsDragging(false);
            }
        };

        if (isDragging) {
            window.addEventListener('pointermove', handleGlobalPointerMove);
            window.addEventListener('pointerup', handleGlobalPointerUp);
            window.addEventListener('pointercancel', handleGlobalPointerUp);
        }

        return () => {
            window.removeEventListener('pointermove', handleGlobalPointerMove);
            window.removeEventListener('pointerup', handleGlobalPointerUp);
            window.removeEventListener('pointercancel', handleGlobalPointerUp);
        };
    }, [isDragging, onSeek, zoom, buffer, currentTime, onPlay]);

    const handlePointerDown = (e: React.PointerEvent) => {
        // Only left click or primary touch
        if (e.button !== 0) return;

        setIsDragging(true);
        lastMouseX.current = e.clientX;
        wasPlayingRef.current = !!isPlaying;

        // Prevent text selection during drag
        e.preventDefault();
    };

    // Resize Observer
    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;
        const resize = () => {
            if (canvasRef.current && containerRef.current) {
                canvasRef.current.width = containerRef.current.clientWidth;
                canvasRef.current.height = containerRef.current.clientHeight;
            }
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    return (
        <div
            ref={containerRef}
            className={`w-full relative bg-[#09090b] overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ height }}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
        >
            <canvas ref={canvasRef} className="block w-full h-full" />

            {isAnalyzing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white font-mono pointer-events-none">
                    ANALYZING WAVEFORM...
                </div>
            )}
        </div>
    );
};
