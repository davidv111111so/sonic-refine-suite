
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
    onSeek?: (time: number) => void;
}

export const DetailWaveform = ({ buffer, currentTime, zoom, setZoom, color, height = 150, showGrid = true, bpm = 128, onSeek }: DetailWaveformProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const [peaks, setPeaks] = useState<WaveformChunk[] | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const lastMouseX = useRef<number>(0);

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
            if (showGrid && bpm > 0) {
                const beatDuration = 60 / bpm;
                const pixelsPerSecond = zoom;

                // Calculate visible time range
                const halfWindowSeconds = (width / 2) / zoom;
                const startTime = currentTime - halfWindowSeconds;
                const endTime = currentTime + halfWindowSeconds;

                // Find first beat in visible range
                const firstBeatIndex = Math.floor(startTime / beatDuration);
                const lastBeatIndex = Math.ceil(endTime / beatDuration);

                ctx.save();
                ctx.lineWidth = 1;

                for (let i = firstBeatIndex; i <= lastBeatIndex; i++) {
                    const beatTime = i * beatDuration;
                    const timeDiff = beatTime - currentTime;
                    const x = (width / 2) + (timeDiff * pixelsPerSecond);

                    const isBar = i % 4 === 0;

                    if (isBar) {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.lineWidth = 2;
                    } else {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                        ctx.lineWidth = 1;
                    }

                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, h);
                    ctx.stroke();
                }
                ctx.restore();
            }

            // Draw Waveform
            const halfWindowSeconds = (width / 2) / zoom;
            const startTime = currentTime - halfWindowSeconds;
            const endTime = currentTime + halfWindowSeconds;

            const totalPeaks = peaks.length;
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
                const peak = peaks[i];
                const peakTime = i * peakDuration;
                const timeDiff = peakTime - currentTime;
                const x = (width / 2) + (timeDiff * pixelsPerSecond);

                // Height scaling
                const amplitude = Math.max(Math.abs(peak.min), Math.abs(peak.max));
                const barHeight = amplitude * (h * 0.8); // 80% height max

                // Color Logic
                if (peak.isBass) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'; // White for bass
                    ctx.shadowBlur = 0;
                } else {
                    // Spectral coloring based on intensity?
                    // Or just standard color
                    const alpha = Math.min(1, (peak.rms ?? 0.5) * 2 + 0.5);
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

    // 4. Drag Interaction
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        lastMouseX.current = e.clientX;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !onSeek) return;

        const deltaX = e.clientX - lastMouseX.current;
        lastMouseX.current = e.clientX;

        // Calculate time delta
        // deltaX pixels / zoom (pixels/sec) = deltaSeconds
        // Dragging LEFT (negative delta) should move time FORWARD (positive time) -> Standard "grabbing the waveform" feel
        // Wait, if I grab and pull LEFT, I am pulling future audio into view. So time increases.
        // So deltaX < 0 -> Time increases.

        const deltaSeconds = -deltaX / zoom;
        const newTime = Math.max(0, Math.min(buffer?.duration || 0, currentTime + deltaSeconds));

        onSeek(newTime);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    // Resize Observer
    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;
        const resize = () => {
            canvasRef.current!.width = containerRef.current!.clientWidth;
            canvasRef.current!.height = containerRef.current!.clientHeight;
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
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
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
