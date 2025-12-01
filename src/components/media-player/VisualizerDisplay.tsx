import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize, Minimize, Activity } from 'lucide-react';

// Lazy load the 3D visualizer to avoid bundle bloat and potential crashes affecting the main thread
const Visualizer3D = React.lazy(() => import('../visualizer-3d/Visualizer3D'));

export type VisualizerMode =
    | 'bars'
    | 'wave'
    | 'circular'
    | 'particles'
    | 'spectrogram'
    | 'terrain3d'
    | 'particles3d'
    | 'tunnel3d'
    | 'sphere3d';

interface VisualizerDisplayProps {
    analyserNode: AnalyserNode | null;
    isPlaying: boolean;
    mode: VisualizerMode;
    onModeChange?: (mode: VisualizerMode) => void;
}

export const VisualizerDisplay: React.FC<VisualizerDisplayProps> = ({
    analyserNode,
    isPlaying,
    mode,
    onModeChange
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const particlesRef = useRef<any[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const is3DMode = mode.endsWith('3d');

    // Handle fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // 2D Canvas Logic
    useEffect(() => {
        if (is3DMode || !canvasRef.current || !analyserNode) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = canvas.clientWidth * window.devicePixelRatio;
            canvas.height = canvas.clientHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Initialize particles if needed
        if (mode === 'particles' && particlesRef.current.length === 0) {
            for (let i = 0; i < 100; i++) {
                particlesRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: Math.random() * 3 + 1,
                    color: `hsl(${Math.random() * 360}, 100%, 50%)`
                });
            }
        }

        const draw = () => {
            if (!ctx || !analyserNode) return;

            const width = canvas.width / window.devicePixelRatio;
            const height = canvas.height / window.devicePixelRatio;

            ctx.clearRect(0, 0, width, height);

            if (!isPlaying) {
                animationRef.current = requestAnimationFrame(draw);
                return;
            }

            if (mode === 'bars') {
                analyserNode.getByteFrequencyData(dataArray);
                const barWidth = (width / bufferLength) * 2.5;
                let barHeight;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = (dataArray[i] / 255) * height;

                    const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
                    gradient.addColorStop(0, '#06b6d4'); // Cyan
                    gradient.addColorStop(1, '#3b82f6'); // Blue

                    ctx.fillStyle = gradient;
                    ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                    x += barWidth + 1;
                }
            } else if (mode === 'wave') {
                analyserNode.getByteTimeDomainData(dataArray);
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#06b6d4';
                ctx.beginPath();

                const sliceWidth = width / bufferLength;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = (v * height) / 2;

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }

                    x += sliceWidth;
                }

                ctx.lineTo(width, height / 2);
                ctx.stroke();
            } else if (mode === 'circular') {
                analyserNode.getByteFrequencyData(dataArray);
                const centerX = width / 2;
                const centerY = height / 2;
                const radius = Math.min(width, height) / 4;

                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.strokeStyle = '#334155';
                ctx.stroke();

                const bars = 64;
                const step = (Math.PI * 2) / bars;

                for (let i = 0; i < bars; i++) {
                    const value = dataArray[i * 4]; // Sample fewer points
                    const barHeight = (value / 255) * (radius / 2);
                    const angle = i * step;

                    const x1 = centerX + Math.cos(angle) * radius;
                    const y1 = centerY + Math.sin(angle) * radius;
                    const x2 = centerX + Math.cos(angle) * (radius + barHeight);
                    const y2 = centerY + Math.sin(angle) * (radius + barHeight);

                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.strokeStyle = `hsl(${i * (360 / bars)}, 100%, 50%)`;
                    ctx.lineWidth = 4;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                }
            } else if (mode === 'particles') {
                analyserNode.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                const boost = average / 255; // 0 to 1

                particlesRef.current.forEach((p, i) => {
                    p.x += p.vx * (1 + boost * 5);
                    p.y += p.vy * (1 + boost * 5);

                    // Wrap around
                    if (p.x < 0) p.x = width;
                    if (p.x > width) p.x = 0;
                    if (p.y < 0) p.y = height;
                    if (p.y > height) p.y = 0;

                    const size = p.size * (1 + (dataArray[i % bufferLength] / 255) * 2);

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = 0.6 + boost * 0.4;
                    ctx.fill();
                    ctx.globalAlpha = 1;
                });
            } else if (mode === 'spectrogram') {
                analyserNode.getByteFrequencyData(dataArray);
                const barWidth = (width / bufferLength) * 2;

                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * (height / 2);
                    const hue = (i / bufferLength) * 360;
                    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

                    // Right side
                    ctx.fillRect(width / 2 + i * barWidth, height / 2 - barHeight / 2, barWidth, barHeight);
                    // Left side
                    ctx.fillRect(width / 2 - i * barWidth, height / 2 - barHeight / 2, barWidth, barHeight);
                }
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [analyserNode, isPlaying, mode, is3DMode]);

    return (
        <Card
            ref={containerRef}
            className={`bg-black/90 border-slate-800 p-0 overflow-hidden relative group ${isFullscreen ? 'rounded-none border-0' : 'aspect-square w-full'}`}
        >
            {is3DMode ? (
                <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-cyan-500">Loading 3D Engine...</div>}>
                    <Visualizer3D
                        mode={mode.replace('3d', '') as any}
                        analyser={analyserNode}
                    />
                </Suspense>
            ) : (
                <canvas
                    ref={canvasRef}
                    className="w-full h-full block"
                    style={{ width: '100%', height: '100%' }}
                />
            )}

            {/* Overlay Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                {/* Visualizer Selector */}
                {onModeChange && (
                    <div className="flex items-center gap-2 bg-black/60 px-3 py-2 rounded-lg backdrop-blur-sm border border-cyan-500/30 pointer-events-auto">
                        <Activity className="h-4 w-4 text-cyan-400" />
                        <select
                            value={mode}
                            onChange={(e) => onModeChange(e.target.value as VisualizerMode)}
                            className="h-7 text-xs bg-slate-800/80 border border-purple-500/30 text-slate-300 shadow-lg rounded-md px-2 py-0 focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none cursor-pointer"
                            style={{ width: '130px' }}
                        >
                            <option value="bars">Bars</option>
                            <option value="wave">Wave</option>
                            <option value="circular">Circular</option>
                            <option value="particles">Particles</option>
                            <option value="spectrogram">Spectrogram</option>
                            <option value="terrain3d">3D Terrain</option>
                            <option value="particles3d">3D Particles</option>
                            <option value="tunnel3d">3D Tunnel</option>
                            <option value="sphere3d">3D Sphere</option>
                        </select>
                    </div>
                )}

                {/* Fullscreen Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20 bg-black/40 h-8 w-8 backdrop-blur-sm border border-white/10 pointer-events-auto"
                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
            </div>
        </Card>
    );
};
