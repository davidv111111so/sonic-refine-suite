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
    height = 48,
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
        const samples = 300; // Fixed number of bars
        const blockSize = Math.floor(channelData.length / samples);
        const calculatedPeaks: WaveformChunk[] = [];

        for (let i = 0; i < samples; i++) {
            let max = 0;
            const start = i * blockSize;
            // Scan for max amp
            for (let j = 0; j < blockSize; j += 4) { // Higher fidelity scan
                const val = Math.abs(channelData[start + j]);
                if (val > max) max = val;
            }
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

        // Render bars
        const barWidth = width / peaks.length;
        peaks.forEach((peak, i) => {
            const x = i * barWidth;
            const barHeight = Math.max(4, peak.max * (h * 0.95));
            // Draw Symmetric from center with rounding or crisp lines
            ctx.fillStyle = color === 'cyan' ? '#0891b2' : '#7c3aed';
            ctx.fillRect(x, center - barHeight / 2, barWidth - 1, barHeight);
        });

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
            ctx.shadowColor = (color === 'cyan' ? 'rgba(34,211,238,1)' : 'rgba(168,85,247,1)');
            ctx.shadowBlur = 12;
            ctx.fillRect(playheadX - 1.5, 0, 3, h);
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
