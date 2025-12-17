import React, { useEffect, useRef, useState } from 'react';

interface WaveformChunk {
    min: number;
    max: number;
}

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
    loop?: { active: boolean; start: number; end: number };
    audioElement?: HTMLAudioElement | null;
}

export const DetailWaveform = ({ buffer, currentTime, zoom, setZoom, color, height = 150, showGrid = true, bpm = 128, onSeek, audioElement, loop }: DetailWaveformProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const [peaks, setPeaks] = useState<WaveformChunk[] | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Refs for Loop
    const currentTimeRef = useRef(currentTime);
    const zoomRef = useRef(zoom);
    const isDraggingRef = useRef(isDragging);
    const lastMouseX = useRef<number>(0);

    // Sync Refs
    useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);
    useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);

    // 1. Analyze Audio (Worker)
    useEffect(() => {
        if (!buffer) {
            setPeaks(null);
            return;
        }

        setIsAnalyzing(true);

        // Initialize Worker
        const worker = new Worker(new URL('../../workers/waveformAnalysis.worker.ts', import.meta.url), { type: 'module' });

        worker.onerror = (err) => {
            console.error("Waveform Worker Error:", err);
            setIsAnalyzing(false);
        };

        workerRef.current = worker;

        const channelData = buffer.getChannelData(0);
        // Create a copy to transfer to worker
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

        // DPI Correction
        const dpr = window.devicePixelRatio || 1;
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            canvas.width = rect.width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        }

        let animationFrame: number;

        const render = () => {
            // Get effective time
            let renderTime = currentTimeRef.current;
            if (audioElement && !audioElement.paused && !isDraggingRef.current) {
                renderTime = audioElement.currentTime;
            }

            const width = (rect ? rect.width : canvas.width / dpr);
            const h = height;
            const center = h / 2;
            const currentZoom = zoomRef.current;

            // Clear
            ctx.clearRect(0, 0, width, h);

            // Draw Grid
            if (showGrid && bpm > 0) {
                const beatDuration = 60 / bpm;
                const halfWindowSeconds = (width / 2) / currentZoom;
                const startTime = renderTime - halfWindowSeconds;
                const endTime = renderTime + halfWindowSeconds;

                const firstBeatIndex = Math.floor(startTime / beatDuration);
                const lastBeatIndex = Math.ceil(endTime / beatDuration);

                ctx.lineWidth = 1;
                for (let i = firstBeatIndex; i <= lastBeatIndex; i++) {
                    const beatTime = i * beatDuration;
                    const x = (width / 2) + ((beatTime - renderTime) * currentZoom);

                    if (i % 4 === 0) {
                        ctx.beginPath();
                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, h);
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.stroke();
                    } else {
                        ctx.beginPath();
                        ctx.moveTo(x, h * 0.2);
                        ctx.lineTo(x, h * 0.8);
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                        ctx.stroke();
                    }
                }
            }

            // Draw Loop Region
            if (loop && loop.active) {
                const loopStartX = (width / 2) + ((loop.start - renderTime) * currentZoom);
                const loopEndX = (width / 2) + ((loop.end - renderTime) * currentZoom);

                // Region Overlay (Flashing)
                const now = Date.now();
                const alpha = 0.2 + 0.15 * Math.sin(now / 150);
                ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
                ctx.fillRect(loopStartX, 0, loopEndX - loopStartX, h);

                // Loop Markers
                ctx.strokeStyle = '#22c55e';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 2]);

                // In
                ctx.beginPath();
                ctx.moveTo(loopStartX, 0);
                ctx.lineTo(loopStartX, h);
                ctx.stroke();

                // Out
                ctx.beginPath();
                ctx.moveTo(loopEndX, 0);
                ctx.lineTo(loopEndX, h);
                ctx.stroke();

                ctx.setLineDash([]); // Reset
            }

            // Draw Waveform
            if (peaks) {
                const halfWindow = (width / 2) / currentZoom;
                const startT = renderTime - halfWindow;
                const endT = renderTime + halfWindow;

                const totalPeaks = peaks.length;
                const duration = buffer.duration;

                if (duration > 0) {
                    let startIdx = Math.floor((startT / duration) * totalPeaks);
                    let endIdx = Math.ceil((endT / duration) * totalPeaks);
                    startIdx = Math.max(0, startIdx);
                    endIdx = Math.min(totalPeaks - 1, endIdx);

                    const peakDuration = duration / totalPeaks;

                    ctx.beginPath();
                    for (let i = startIdx; i <= endIdx; i++) {
                        const peak = peaks[i];
                        const x = (width / 2) + (((i * peakDuration) - renderTime) * currentZoom);

                        const amplitude = Math.max(Math.abs(peak.min), Math.abs(peak.max));
                        const barHeight = amplitude * (h * 0.8);

                        ctx.moveTo(x, center - barHeight / 2);
                        ctx.lineTo(x, center + barHeight / 2);
                    }

                    // Gradient
                    const gradient = ctx.createLinearGradient(0, center - h / 2, 0, center + h / 2);
                    if (color === 'cyan') {
                        gradient.addColorStop(0, "rgba(34, 211, 238, 0.2)");
                        gradient.addColorStop(0.5, "rgba(56, 189, 248, 1)");
                        gradient.addColorStop(1, "rgba(34, 211, 238, 0.2)");
                        ctx.shadowColor = "rgba(34, 211, 238, 0.5)";
                    } else {
                        gradient.addColorStop(0, "rgba(168, 85, 247, 0.2)");
                        gradient.addColorStop(0.5, "rgba(168, 85, 247, 1)");
                        gradient.addColorStop(1, "rgba(168, 85, 247, 0.2)");
                        ctx.shadowColor = "rgba(168, 85, 247, 0.5)";
                    }

                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = Math.max(2, (currentZoom / 100) * 2);
                    ctx.lineCap = "round";
                    ctx.shadowBlur = 4;
                    ctx.stroke();
                    ctx.shadowBlur = 0; // Reset
                }
            }

            // Playhead
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(width / 2, 0);
            ctx.lineTo(width / 2, h);
            ctx.stroke();

            animationFrame = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrame);

    }, [peaks, buffer, color, showGrid, bpm, audioElement, height]); // Only heavy dependency changes trigger restart

    // 3. Interactions
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = -e.deltaY * 0.5;
        const newZoom = Math.max(10, Math.min(2000, zoom + delta));
        setZoom(newZoom);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        lastMouseX.current = e.clientX;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !onSeek) return;

        const deltaX = e.clientX - lastMouseX.current;
        lastMouseX.current = e.clientX;

        const deltaSeconds = -deltaX / zoom;
        const newTime = Math.max(0, Math.min(buffer?.duration || 0, currentTime + deltaSeconds));

        onSeek(newTime);
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleMouseLeave = () => setIsDragging(false);

    // Resize
    useEffect(() => {
        const handleResize = () => {
            // Force re-render via state or just let the loop handle it reading layout
            // Since we use getBoundingClientRect in loop, we just need to ensure canvas matches container occasionally
            if (containerRef.current && canvasRef.current) {
                // DPI handled in render loop? No, canvas width/height needs setting.
                // We'll trust the loop's check or just let React width=100% handle css
                // Actually, canvas internal resolution needs to match
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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
