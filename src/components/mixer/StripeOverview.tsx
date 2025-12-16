import React, { useEffect, useRef, useState } from 'react';
import { WaveformChunk } from '../../workers/waveformAnalysis.worker';

interface StripeOverviewProps {
    buffer: AudioBuffer | null;
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    color: 'cyan' | 'purple';
    height?: number;
    cuePoint?: number | null;
    loop?: { active: boolean; start: number; end: number };
}

export const StripeOverview = ({
    buffer,
    currentTime,
    duration,
    onSeek,
    color,
    height = 32,
    cuePoint,
    loop
}: StripeOverviewProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [peaks, setPeaks] = useState<WaveformChunk[] | null>(null);

    // 1. Generate Low-Res Peaks (Main Thread for simplicity/speed on load)
    useEffect(() => {
        if (!buffer) {
            setPeaks(null);
            return;
        }

        const channelData = buffer.getChannelData(0);
        const samples = 400; // Fixed number of bars
        const blockSize = Math.floor(channelData.length / samples);
        const calculatedPeaks: WaveformChunk[] = [];

        for (let i = 0; i < samples; i++) {
            let max = 0;
            const start = i * blockSize;
            // Scan for max amp
            for (let j = 0; j < blockSize; j += 10) { // Skip samples for speed
                const val = Math.abs(channelData[start + j]);
                if (val > max) max = val;
            }
            // For overview, we just need Max/Min (no spectral)
            calculatedPeaks.push({ min: -max, max, rms: max, low: 0, midHigh: 0 });
        }
        setPeaks(calculatedPeaks);
    }, [buffer]);

    // 2. Render
    useEffect(() => {
        if (!canvasRef.current || !peaks) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const h = canvas.height;
        const center = h / 2;

        // Background
        ctx.clearRect(0, 0, width, h);
        ctx.fillStyle = '#09090b'; // Darker bg
        ctx.fillRect(0, 0, width, h);

        // Draw Waveform Stripes
        ctx.fillStyle = color === 'cyan' ? '#0891b2' : '#7c3aed'; // Cyan-600 / Violet-600

        const barWidth = width / peaks.length;

        // Render bars
        ctx.beginPath();
        peaks.forEach((peak, i) => {
            const x = i * barWidth;
            const barHeight = Math.max(1, peak.max * (h * 0.8));
            // Draw Symmetric from center
            ctx.rect(x, center - barHeight / 2, barWidth, barHeight);
        });
        ctx.fill();

        // Overlays

        // Loop Region
        if (loop && loop.active && duration > 0) {
            const loopStartX = (loop.start / duration) * width;
            const loopEndX = (loop.end / duration) * width;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(loopStartX, 0, Math.max(1, loopEndX - loopStartX), h);
        }

        // Cue Point
        if (cuePoint !== null && cuePoint !== undefined && duration > 0) {
            const cueX = (cuePoint / duration) * width;
            ctx.fillStyle = '#f43f5e'; // Rose-500
            ctx.beginPath();
            ctx.moveTo(cueX, 0);
            ctx.lineTo(cueX - 4, 0);
            ctx.lineTo(cueX, 6);
            ctx.lineTo(cueX + 4, 0);
            ctx.fill();
        }

        // Playhead
        if (duration > 0) {
            const playheadX = (currentTime / duration) * width;
            ctx.fillStyle = '#fff';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 2;
            ctx.fillRect(playheadX, 0, 2, h);
            ctx.shadowBlur = 0;
        }

    }, [peaks, currentTime, duration, color, height, loop, cuePoint]);

    // Navigation Handler
    const handleUnseek = (e: React.MouseEvent) => {
        if (!duration || duration === 0) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = percentage * duration;

        onSeek(Math.min(duration, Math.max(0, newTime)));
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full cursor-pointer relative group"
            onMouseDown={handleUnseek}
        >
            <canvas ref={canvasRef} width={800} height={height} className="w-full h-full block" />
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
};
