import React, { useEffect, useRef } from 'react';

interface PhaseMeterProps {
    active: boolean;
    offset: number; // -0.5 to 0.5 (0 is synced)
}

export const PhaseMeter = ({ active, offset }: PhaseMeterProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const center = width / 2;

        // Clear
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, width, height);

        if (!active) return;

        // Draw Center Marker
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(center - 1, 0, 2, height);

        // Draw Phase Indicator
        // Map offset (-0.5 to 0.5) to position
        // -0.5 -> 0, 0 -> center, 0.5 -> width
        const position = center + (offset * width);

        // Color based on sync tightness
        const tightness = 1 - Math.abs(offset * 2); // 1 = perfect, 0 = off
        const color = Math.abs(offset) < 0.05 ? '#22c55e' : '#f97316'; // Green if tight, Orange if loose

        ctx.fillStyle = color;
        ctx.fillRect(position - 2, 2, 4, height - 4);

        // Glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillRect(position - 2, 2, 4, height - 4);
        ctx.shadowBlur = 0;

    }, [active, offset]);

    return (
        <canvas
            ref={canvasRef}
            width={200}
            height={16}
            className="w-full h-4 bg-[#18181b] rounded-sm border border-[#27272a]"
        />
    );
};
