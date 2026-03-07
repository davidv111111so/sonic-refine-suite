import React, { useEffect, useRef, useState } from 'react';
import { WaveformChunk } from '../../workers/waveformAnalysis.worker';
import { calculateEnergyCurve } from '@/utils/harmonicMixing';

interface StripeOverviewProps {
    buffer: AudioBuffer | null;
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    color: 'cyan' | 'purple';
    height?: number;
    cuePoint?: number | null;
    loop?: { active: boolean; start: number; end: number };
    showEnergy?: boolean;
}

export const StripeOverview = ({
    buffer,
    currentTime,
    duration,
    onSeek,
    color,
    height = 48,
    cuePoint,
    loop,
    showEnergy = true
}: StripeOverviewProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [peaks, setPeaks] = useState<WaveformChunk[] | null>(null);
    const [energyCurve, setEnergyCurve] = useState<number[] | null>(null);

    // 1. Generate Low-Res Peaks and Energy Curve (Web Worker to prevent UI lockup)
    useEffect(() => {
        if (!buffer) {
            setPeaks(null);
            setEnergyCurve(null);
            return;
        }

        const channelData = buffer.getChannelData(0);
        const samples = 300; // Fixed number of bars
        const samplesPerPixel = Math.floor(channelData.length / samples);

        const workerURL = new URL('../../workers/waveformAnalysis.worker.ts', import.meta.url);
        const worker = new Worker(workerURL, { type: 'module' });

        worker.onmessage = (e: MessageEvent) => {
            if (e.data.error) {
                console.warn('Waveform worker error:', e.data.error);
                return;
            }

            const rawPeaks: Float32Array = e.data.peaks;
            const calculatedPeaks: WaveformChunk[] = [];
            const rawEnergyCurve: number[] = [];

            // Parse the interleaved format (min, max, rms, low, midHigh)
            // Note: The worker might return slightly more or fewer chunks depending on len / samplesPerPixel rounding, 
            // but it will be very close to 'samples' (300).
            const numChunks = rawPeaks.length / 5;
            let maxEnergy = 0.001;

            for (let i = 0; i < numChunks; i++) {
                const baseIndex = i * 5;
                const min = rawPeaks[baseIndex];
                const max = rawPeaks[baseIndex + 1];
                const rms = rawPeaks[baseIndex + 2];
                const low = rawPeaks[baseIndex + 3];
                const midHigh = rawPeaks[baseIndex + 4];

                // Worker uses low pass for low end, we can just use original max for drawing
                // To keep drawing same as before, we set peak to peak values.
                calculatedPeaks.push({ min, max, rms, low, midHigh });

                rawEnergyCurve.push(rms);
                if (rms > maxEnergy) maxEnergy = rms;
            }

            if (showEnergy) {
                // Normalize energy curve to 0-1 as calculateEnergyCurve did
                const normalizedCurve = rawEnergyCurve.map(v => v / maxEnergy);
                setEnergyCurve(normalizedCurve);
            }

            setPeaks(calculatedPeaks);
            worker.terminate();
        };

        worker.onerror = (e) => {
            console.error('Waveform worker failed', e);
            worker.terminate();
        };

        worker.postMessage({
            channelData,
            sampleRate: buffer.sampleRate,
            samplesPerPixel
        });

        return () => worker.terminate();
    }, [buffer, showEnergy]);

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

        // Energy Curve Overlay
        if (energyCurve && showEnergy) {
            const points = energyCurve.length;
            const segWidth = width / points;

            // Draw energy curve as a gradient line on top
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let i = 0; i < points; i++) {
                const x = i * segWidth;
                const y = h - (energyCurve[i] * h * 0.85); // Scale to 85% canvas height
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            // Stroke the energy curve
            ctx.strokeStyle = color === 'cyan' ? 'rgba(34, 211, 238, 0.6)' : 'rgba(168, 85, 247, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Fill under the curve with a gradient
            ctx.lineTo(width, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            const gradient = ctx.createLinearGradient(0, 0, 0, h);
            if (color === 'cyan') {
                gradient.addColorStop(0, 'rgba(34, 211, 238, 0.15)');
                gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.08)');
                gradient.addColorStop(1, 'rgba(34, 211, 238, 0.0)');
            } else {
                gradient.addColorStop(0, 'rgba(168, 85, 247, 0.15)');
                gradient.addColorStop(0.5, 'rgba(192, 132, 252, 0.08)');
                gradient.addColorStop(1, 'rgba(168, 85, 247, 0.0)');
            }
            ctx.fillStyle = gradient;
            ctx.fill();
        }

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

    }, [peaks, energyCurve, currentTime, duration, color, height, loop, cuePoint, showEnergy]);

    const [isScrubbing, setIsScrubbing] = useState(false);

    const updateSeek = (e: MouseEvent | React.MouseEvent) => {
        if (!duration || duration === 0) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = percentage * duration;
        onSeek(Math.min(duration, Math.max(0, newTime)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsScrubbing(true);
        updateSeek(e); // Seek immediately on click down
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isScrubbing) updateSeek(e);
        };
        const handleMouseUp = () => {
            if (isScrubbing) setIsScrubbing(false);
        };

        if (isScrubbing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isScrubbing, duration, onSeek]);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full cursor-pointer relative group ${isScrubbing ? 'cursor-grabbing' : ''}`}
            onMouseDown={handleMouseDown}
        >
            <canvas ref={canvasRef} width={800} height={height} className="w-full h-full block" />
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            {/* Energy Level Label */}
            {showEnergy && energyCurve && (
                <div className="absolute top-0.5 right-1 text-[7px] font-bold uppercase tracking-wider text-white/30 pointer-events-none">
                    ENERGY
                </div>
            )}
        </div>
    );
};
