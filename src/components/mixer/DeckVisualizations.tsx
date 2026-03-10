import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export type VisualizationType = 'none' | 'circular' | 'neon' | 'cybernetic';

interface DeckVisualizationsProps {
    analyser?: AnalyserNode;
    isPlaying: boolean;
    type: VisualizationType;
    color: 'cyan' | 'purple';
    className?: string;
}

export const DeckVisualizations: React.FC<DeckVisualizationsProps> = ({ analyser, isPlaying, type, color, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const particlesRef = useRef<any[]>([]);

    useEffect(() => {
        if (!canvasRef.current || !analyser || type === 'none') return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Internal buffer lengths
        analyser.fftSize = type === 'neon' ? 2048 : 512;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Colors
        const isCyan = color === 'cyan';
        const primaryColor = isCyan ? 'rgba(34, 211, 238, 1)' : 'rgba(192, 132, 252, 1)';
        const glowColor = isCyan ? 'rgba(34, 211, 238, 0.5)' : 'rgba(192, 132, 252, 0.5)';
        
        // Initialize particles for Cybernetic
        if (type === 'cybernetic' && particlesRef.current.length === 0) {
            particlesRef.current = Array.from({ length: 50 }, () => ({
                x: Math.random() * canvas.width,
                y: canvas.height, // Start from bottom
                speed: Math.random() * 2 + 1,
                size: Math.random() * 3 + 1,
                alpha: Math.random() * 0.5 + 0.5,
                angle: Math.random() * Math.PI * 2
            }));
        }

        const renderFrame = () => {
            const width = canvas.width;
            const height = canvas.height;
            
            if (type !== 'cybernetic') {
                ctx.clearRect(0, 0, width, height);
            } else {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(0, 0, width, height);
            }
            
            if (!isPlaying && type !== 'cybernetic') {
                requestRef.current = requestAnimationFrame(renderFrame);
                return;
            }

            if (type === 'circular') {
                analyser.getByteFrequencyData(dataArray);
                const centerX = width / 2;
                const centerY = height / 2;
                const radius = Math.min(width, height) / 3;
                
                ctx.lineWidth = 2;
                
                // Draw circular bars
                const bars = 60;
                const step = (Math.PI * 2) / bars;
                
                for (let i = 0; i < bars; i++) {
                    const value = dataArray[i * Math.floor(bufferLength / bars)];
                    const barHeight = (value / 255) * (radius * 0.8);
                    
                    const angle = i * step;
                    
                    const innerX = centerX + Math.cos(angle) * radius;
                    const innerY = centerY + Math.sin(angle) * radius;
                    
                    const outerX = centerX + Math.cos(angle) * (radius + barHeight);
                    const outerY = centerY + Math.sin(angle) * (radius + barHeight);
                    
                    ctx.beginPath();
                    ctx.moveTo(innerX, innerY);
                    ctx.lineTo(outerX, outerY);
                    ctx.strokeStyle = primaryColor;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = glowColor;
                    ctx.stroke();
                }

                // Draw central circle pulsating
                const bassValue = dataArray.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
                const innerGlow = (bassValue / 255) * 20;
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255,255,255, ${0.1 + (bassValue/500)})`;
                ctx.lineWidth = 1 + innerGlow / 5;
                ctx.shadowBlur = innerGlow;
                ctx.shadowColor = glowColor;
                ctx.stroke();
                
            } else if (type === 'neon') {
                analyser.getByteTimeDomainData(dataArray);
                
                ctx.lineWidth = 3;
                ctx.strokeStyle = primaryColor;
                ctx.shadowBlur = 15;
                ctx.shadowColor = glowColor;
                
                ctx.beginPath();
                const sliceWidth = width / bufferLength;
                let x = 0;
                
                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = (v * height / 2);
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                    
                    x += sliceWidth;
                }
                
                ctx.lineTo(width, height / 2);
                ctx.stroke();
                
            } else if (type === 'cybernetic') {
                analyser.getByteFrequencyData(dataArray);
                // Get general bass intensity for particle explosiveness
                const bassValue = dataArray.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
                const intensity = (bassValue / 255);
                
                // Move and draw particles
                particlesRef.current.forEach((p, i) => {
                    // Wobbly vertical movement based on intensity
                    p.y -= p.speed * (1 + intensity * 3);
                    p.x += Math.sin(p.angle) * 2;
                    p.angle += 0.1;
                    
                    // Alpha pulsing
                    p.alpha = Math.max(0.2, intensity);
                    
                    ctx.globalAlpha = p.alpha;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = glowColor;
                    ctx.fillStyle = primaryColor;
                    
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * (1 + intensity * 2), 0, Math.PI * 2);
                    ctx.fill();

                    // Connect particles that are close
                    particlesRef.current.forEach((otherP, j) => {
                        if (i === j) return;
                        const dx = p.x - otherP.x;
                        const dy = p.y - otherP.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < 60 + (intensity * 40)) {
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(otherP.x, otherP.y);
                            ctx.strokeStyle = isCyan 
                                ? `rgba(34, 211, 238, ${0.1 + (intensity * 0.3)})` 
                                : `rgba(192, 132, 252, ${0.1 + (intensity * 0.3)})`;
                            ctx.lineWidth = 1;
                            ctx.stroke();
                        }
                    });

                    // Reset if out of bounds
                    if (p.y < -10) {
                        p.y = height + 10;
                        p.x = Math.random() * width;
                    }
                });
                ctx.globalAlpha = 1.0;
            }

            requestRef.current = requestAnimationFrame(renderFrame);
        };

        renderFrame();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            ctx.clearRect(0, 0, canvas.width, canvas.height); // cleanup
        };
    }, [analyser, isPlaying, type, color]);

    if (type === 'none') return null;

    return (
        <canvas 
            ref={canvasRef} 
            className={cn("pointer-events-none absolute inset-0 w-full h-full mix-blend-screen opacity-70", className)} 
            width={800} 
            height={400} 
        />
    );
};
