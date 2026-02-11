import React, { useRef, useEffect } from 'react';

interface MeterProps {
    active?: boolean;
    analyser?: AnalyserNode | null;
}

export const Meter = ({ active, analyser }: MeterProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastLevelRef = useRef(0);
    const peakLevelRef = useRef(0);
    const peakHoldTimeRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!analyser || !active) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Draw dimmed background segments
            const segments = 24;
            const gap = 2;
            const segH = (canvas.height - (segments * gap)) / segments;
            for (let i = 0; i < segments; i++) {
                ctx.fillStyle = '#111';
                ctx.fillRect(0, canvas.height - ((i + 1) * (segH + gap)), canvas.width, segH);
            }
            return;
        }

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);

        let animationId: number;

        const draw = () => {
            animationId = requestAnimationFrame(draw);
            analyser.getFloatTimeDomainData(dataArray);

            // Calculate Peak Level (0 to 1)
            let peak = 0;
            for (let i = 0; i < bufferLength; i++) {
                const abs = Math.abs(dataArray[i]);
                if (abs > peak) peak = abs;
            }

            // Convert to dB-like scale for more natural movement
            // 0.0 to 1.0 mapped to 0 to 24 segments
            // We use a log-like scale: level = log10(peak * 10 + 1) normalized or similar
            // For DJ mixer look, we want it to move fast up and slow down
            const targetLevel = peak * 24;

            // Smooth the level (Attack/Release)
            const attack = 0.95;
            const release = 0.15;
            let currentLevel;
            if (targetLevel > lastLevelRef.current) {
                currentLevel = lastLevelRef.current + (targetLevel - lastLevelRef.current) * attack;
            } else {
                currentLevel = lastLevelRef.current - (lastLevelRef.current - targetLevel) * release;
            }
            lastLevelRef.current = currentLevel;

            // Peak Hold logic
            if (currentLevel > peakLevelRef.current) {
                peakLevelRef.current = currentLevel;
                peakHoldTimeRef.current = Date.now() + 1000; // Hold for 1 second
            } else if (Date.now() > peakHoldTimeRef.current) {
                peakLevelRef.current *= 0.95; // Decay peak
            }

            // Rendering
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const segments = 24;
            const gap = 2;
            const segH = (canvas.height - (segments * gap)) / segments;

            for (let i = 0; i < segments; i++) {
                const isActive = i <= currentLevel;
                const isPeak = Math.floor(peakLevelRef.current) === i;

                // Colors
                let color = '#111'; // Off
                if (isActive || isPeak) {
                    if (i < 16) color = '#00f2ff'; // Cyan (Safe)
                    else if (i < 21) color = '#ffdf00'; // Yellow (Caution)
                    else color = '#ff0040'; // Red (Clip)
                }

                // Add glass/glow effect for active segments
                if (isActive) {
                    ctx.shadowBlur = 4;
                    ctx.shadowColor = color;
                } else if (isPeak) {
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = color;
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.fillStyle = color;
                ctx.fillRect(0, canvas.height - ((i + 1) * (segH + gap)), canvas.width, segH);
            }

            // Draw a subtle overlay for "professional" look
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(0, 0, canvas.width / 2, canvas.height);
        };

        draw();
        return () => cancelAnimationFrame(animationId);
    }, [active, analyser]);

    return (
        <div className="flex-1 w-2.5 bg-black/60 rounded-[1px] p-[1.5px] relative overflow-hidden ring-1 ring-white/5 shadow-inner">
            <canvas ref={canvasRef} width={10} height={150} className="w-full h-full" />

            {/* Legend/Ticks */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-1 px-[0.5px]">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full h-[1px] bg-white/10" />
                ))}
            </div>
        </div>
    );
};
