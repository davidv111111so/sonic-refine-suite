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
    | 'sphere3d'
    | 'cybergrid'
    | 'galaxy'
    | 'matrix'
    | 'random';

interface VisualizerDisplayProps {
    analyserNode: AnalyserNode | null;
    isPlaying: boolean;
    mode: VisualizerMode;
    onModeChange?: (mode: VisualizerMode) => void;
}

export const VisualizerDisplay = ({
    analyserNode,
    isPlaying,
    mode = 'bars',
    onModeChange
}: VisualizerDisplayProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const particlesRef = useRef<any[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Core active mode (handles random cycling)
    const [activeMode, setActiveMode] = useState<VisualizerMode>(mode === 'random' ? 'cybergrid' : mode);

    const is3DMode = activeMode.startsWith('3d');

    useEffect(() => {
        console.log("🎬 VisualizerDisplay mounted (v3.3 - Random & Galaxy Update)");
    }, []);

    // Random Mode Cycler
    useEffect(() => {
        if (mode === 'random') {
            const available2DModes: VisualizerMode[] = [
                'bars', 'wave', 'circular', 'particles', 'spectrogram',
                'cybergrid', 'galaxy', 'matrix'
            ];
            const interval = setInterval(() => {
                const nextMode = available2DModes[Math.floor(Math.random() * available2DModes.length)];
                setActiveMode(nextMode);
            }, 8000); // cycle every 8 seconds
            return () => clearInterval(interval);
        } else {
            setActiveMode(mode);
        }
    }, [mode]);

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

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const displayWidth = Math.floor(canvas.clientWidth * dpr);
            const displayHeight = Math.floor(canvas.clientHeight * dpr);

            if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
                canvas.width = displayWidth;
                canvas.height = displayHeight;
                ctx.scale(dpr, dpr);
            }
        };

        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Initialize particles if needed
        if ((activeMode === 'particles' || activeMode === 'galaxy' || activeMode === 'matrix') && particlesRef.current.length === 0) {
            for (let i = 0; i < 150; i++) {
                particlesRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: Math.random() * 3 + 1,
                    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                    angle: Math.random() * Math.PI * 2,
                    distance: Math.random() * (canvas.width / 2)
                });
            }
        }

        const draw = () => {
            if (!ctx || !analyserNode || !canvas) return;

            resizeCanvas();

            const width = Math.max(1, canvas.clientWidth);
            const height = Math.max(1, canvas.clientHeight);

            ctx.clearRect(0, 0, width, height);

            if (!isPlaying) {
                animationRef.current = requestAnimationFrame(draw);
                return;
            }

            if (activeMode === 'bars') {
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
            } else if (activeMode === 'wave') {
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
            } else if (activeMode === 'circular') {
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
            } else if (activeMode === 'particles') {
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
            } else if (activeMode === 'galaxy') {
                analyserNode.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                const boost = average / 255;
                const centerX = width / 2;
                const centerY = height / 2;

                // Dark trailing effect
                ctx.fillStyle = `rgba(0, 0, 0, ${0.1 - boost * 0.05})`;
                ctx.fillRect(0, 0, width, height);

                particlesRef.current.forEach((p, i) => {
                    const audioVal = dataArray[i % bufferLength] / 255;
                    p.angle += (p.size * 0.005) + (audioVal * 0.05); // Orbit speed

                    // Spiral effect based on bass
                    const bassBoost = (dataArray[1] / 255) * 50;
                    const targetDist = p.distance + (Math.sin(p.angle) * bassBoost);

                    const x = centerX + Math.cos(p.angle) * targetDist;
                    const y = centerY + Math.sin(p.angle) * targetDist;

                    const drawSize = p.size * (1 + audioVal * 3);

                    ctx.beginPath();
                    ctx.arc(x, y, drawSize, 0, Math.PI * 2);
                    ctx.fillStyle = `hsl(${(p.angle * 180 / Math.PI) + (audioVal * 360)}, 100%, ${50 + audioVal * 50}%)`;
                    ctx.globalAlpha = 0.5 + audioVal * 0.5;
                    ctx.fill();

                    // Connect lines for the inner core
                    if (targetDist < 100 && i % 3 === 0) {
                        ctx.beginPath();
                        ctx.moveTo(centerX, centerY);
                        ctx.lineTo(x, y);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${audioVal * 0.2})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                });
                ctx.globalAlpha = 1;
            } else if (activeMode === 'matrix') {
                analyserNode.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

                ctx.fillStyle = `rgba(0, 0, 0, 0.15)`;
                ctx.fillRect(0, 0, width, height);

                ctx.font = '14px monospace';
                ctx.textAlign = 'center';

                particlesRef.current.forEach((p, i) => {
                    // Y axis falls down
                    const speed = p.size + (dataArray[i % bufferLength] / 255) * 10;
                    p.y += speed;

                    if (p.y > height) {
                        p.y = 0;
                        p.x = Math.random() * width;
                    }

                    const val = dataArray[i % bufferLength];
                    const char = String.fromCharCode(0x30A0 + Math.random() * 96); // Katakana

                    const isLoud = val > 150;
                    ctx.fillStyle = isLoud ? '#fff' : `rgba(16, 185, 129, ${val / 255 + 0.2})`; // Emerald green

                    // If bass is hitting hard, add text shadow glow
                    if (isLoud) {
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = '#10b981';
                    } else {
                        ctx.shadowBlur = 0;
                    }

                    ctx.fillText(char, p.x, p.y);
                });
                ctx.shadowBlur = 0;
            } else if (activeMode === 'spectrogram') {
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
            } else if (activeMode === 'cybergrid') {
                analyserNode.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                const intensity = average / 255;

                // Draw pulsing background grid
                ctx.strokeStyle = `rgba(6, 182, 212, ${0.1 + intensity * 0.2})`;
                ctx.lineWidth = 1;

                const gridSize = 40;
                const offset = (Date.now() / 20) % gridSize;

                // Vertical lines
                for (let x = offset; x < width; x += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, height);
                    ctx.stroke();
                }

                // Horizontal lines
                for (let y = offset; y < height; y += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                    ctx.stroke();
                }

                // Draw "Power Peaks" from the center
                const bars = 32;
                const barWidth = width / bars;
                for (let i = 0; i < bars; i++) {
                    const value = dataArray[i * 8];
                    const h = (value / 255) * height * 0.7;

                    const x = i * barWidth;
                    const gradient = ctx.createLinearGradient(x, height, x, height - h);
                    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
                    gradient.addColorStop(1, 'rgba(168, 85, 247, 0)'); // Fade to purple trans

                    ctx.fillStyle = gradient;
                    ctx.fillRect(x, height - h, barWidth - 2, h);

                    // Add a glowing cap
                    if (h > 10) {
                        ctx.fillStyle = '#fff';
                        ctx.fillRect(x, height - h, barWidth - 2, 2);
                    }
                }
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [analyserNode, isPlaying, activeMode, is3DMode]);

    return (
        <Card
            ref={containerRef}
            className={`bg-black/90 border-slate-800 p-0 overflow-hidden relative group ${isFullscreen ? 'rounded-none border-0' : 'aspect-square w-full'}`}
        >
            {is3DMode ? (
                <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-cyan-500">Loading 3D Engine...</div>}>

                    <Visualizer3D
                        mode={activeMode.replace('3d', '') as any}
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
                            <option value="random">🌀 RANDOM CYCLE</option>
                            <option value="bars">Bars</option>
                            <option value="wave">Wave</option>
                            <option value="circular">Circular</option>
                            <option value="particles">Particles</option>
                            <option value="galaxy">Galaxy</option>
                            <option value="matrix">Matrix Rain</option>
                            <option value="spectrogram">Spectrogram</option>
                            <option value="terrain3d">3D Terrain</option>
                            <option value="particles3d">3D Particles</option>
                            <option value="tunnel3d">3D Tunnel</option>
                            <option value="sphere3d">3D Sphere</option>
                            <option value="cybergrid">Cyber Grid</option>
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
