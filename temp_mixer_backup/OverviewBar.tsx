
import React, { useEffect, useRef, useState } from 'react';
import { WaveformChunk } from '@/workers/waveformAnalysis.worker';

interface OverviewBarProps {
    buffer: AudioBuffer | null;
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    color: 'cyan' | 'purple';
    height?: number;
    zoom: number; // To calculate viewport width
    canvasWidth: number; // Width of the DetailWaveform canvas (approx)
}

export const OverviewBar = ({ buffer, currentTime, duration, onSeek, color, height = 32, zoom, canvasWidth }: OverviewBarProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [peaks, setPeaks] = useState<WaveformChunk[] | null>(null);

    // 1. Analyze Audio (Simple Main Thread or Reuse Worker?)
    // For Overview, we need very low resolution. 
    // Let's just downsample the buffer directly here or use the same worker?
    // Using the same worker is cleaner but might be overkill if we just want 300 peaks.
    // Let's do a quick main-thread downsample for the overview since it runs once per load.

    useEffect(() => {
        if (!buffer) {
            setPeaks(null);
            return;
        }

        const channelData = buffer.getChannelData(0);
        const samples = 300; // Fixed width resolution
        const blockSize = Math.floor(channelData.length / samples);
        const calculatedPeaks: WaveformChunk[] = [];

        for (let i = 0; i < samples; i++) {
            let max = 0;
            const start = i * blockSize;
            for (let j = 0; j < blockSize; j++) {
                const val = Math.abs(channelData[start + j]);
                if (val > max) max = val;
            }
            calculatedPeaks.push({ min: -max, max, rms: max, isBass: false });
        }
        setPeaks(calculatedPeaks);

    }, [buffer]);

    // 2. Rendering
    useEffect(() => {
        if (!canvasRef.current || !peaks) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const h = canvas.height;
        const center = h / 2;

        // Clear
        ctx.clearRect(0, 0, width, h);
        ctx.fillStyle = '#18181b'; // Zinc-900
        ctx.fillRect(0, 0, width, h);

        // Draw Waveform
        ctx.fillStyle = color === 'cyan' ? '#0e7490' : '#7e22ce'; // Darker shade

        const barWidth = width / peaks.length;

        peaks.forEach((peak, i) => {
            const x = i * barWidth;
            const barHeight = peak.max * (h / 2);
            ctx.fillRect(x, center - barHeight, Math.max(1, barWidth), barHeight * 2);
        });

        // Draw Viewport Window
        // Viewport width in seconds = canvasWidth / zoom
        // Viewport width in pixels (on overview) = (viewportSeconds / duration) * width

        const viewportSeconds = canvasWidth / zoom;
        const viewportWidthPx = (viewportSeconds / duration) * width;
        const playheadX = (currentTime / duration) * width;

        // The viewport is centered around the playhead in the Detail view?
        // In Detail view, playhead is at center. So viewport starts at currentTime - halfWindow.

        const viewportStartX = playheadX - (viewportWidthPx / 2);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;

        ctx.fillRect(viewportStartX, 0, viewportWidthPx, h);
        ctx.strokeRect(viewportStartX, 0, viewportWidthPx, h);

        // Playhead Line
        ctx.fillStyle = '#fff';
        ctx.fillRect(playheadX, 0, 1, h);

    }, [peaks, currentTime, duration, zoom, canvasWidth, color]);

    // 3. Interaction
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || !duration) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        onSeek(percentage * duration);
    };

    // Resize
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
            className="w-full h-full relative cursor-pointer group"
            onClick={handleClick}
            style={{ height }}
        >
            <canvas ref={canvasRef} className="block w-full h-full" />
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
};
