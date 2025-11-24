import React, { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';

export type VisualizerMode = 'bars' | 'wave' | 'circular' | 'particles' | 'spectrogram';

interface VisualizerDisplayProps {
    analyserNode: AnalyserNode | null;
    isPlaying: boolean;
    mode: VisualizerMode;
}

export const VisualizerDisplay: React.FC<VisualizerDisplayProps> = ({
    analyserNode,
    isPlaying,
    mode
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const particlesRef = useRef<any[]>([]);

    useEffect(() => {
        if (!canvasRef.current || !analyserNode) return;

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
                // Simple spectrogram effect (scrolling bars)
                // For simplicity in this canvas implementation, we'll just do a mirrored spectrum
                analyserNode.getByteFrequencyData(dataArray);
                const barWidth = (width / bufferLength) * 2;
                let x = width / 2;

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
    }, [analyserNode, isPlaying, mode]);

    return (
        <Card className="bg-black/90 border-slate-800 p-4 h-64 w-full overflow-hidden relative">
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
                style={{ width: '100%', height: '100%' }}
            />
            <div className="absolute top-2 right-2 text-xs text-slate-500 font-mono uppercase">
                {mode} Visualizer
            </div>
        </Card>
    );
};
