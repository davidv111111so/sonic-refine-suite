import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface KnobProps {
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
    label: string;
    color?: string;
    size?: number;
}

export const Knob = ({ value, min, max, onChange, label, color = "cyan", size = 60 }: KnobProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef<number>(0);
    const startValue = useRef<number>(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        startY.current = e.clientY;
        startValue.current = value;
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const deltaY = startY.current - e.clientY;
            const range = max - min;
            const sensitivity = 200; // Pixels for full range
            const deltaValue = (deltaY / sensitivity) * range;

            let newValue = startValue.current + deltaValue;
            newValue = Math.max(min, Math.min(max, newValue));

            onChange(newValue);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, min, max, onChange]);

    const handleWheel = (e: React.WheelEvent) => {
        // Only prevent default if we're actually hovering/interacting to avoid scrolling the whole page
        e.preventDefault();
        e.stopPropagation();

        const range = max - min;
        // Fine tune step: 2% per click
        const step = range * 0.05; // 5% for faster knob rotation

        const delta = -Math.sign(e.deltaY);
        const newValue = Math.max(min, Math.min(max, value + delta * step));

        onChange(newValue);
    };

    // Calculate rotation
    // Map value to angle: -135deg to +135deg
    const percentage = (value - min) / (max - min);
    const angle = -135 + (percentage * 270);

    return (
        <div
            className="flex flex-col items-center gap-1 group/knob"
            onWheel={handleWheel}
        >
            <div
                className="relative cursor-ns-resize group"
                style={{ width: size, height: size }}
                onMouseDown={handleMouseDown}
            >
                {/* Background Track */}
                <svg width={size} height={size} viewBox="0 0 100 100">
                    <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#333"
                        strokeWidth="8"
                        strokeDasharray="200" // Approx 75% of circle
                        strokeDashoffset="50" // Rotate to start at bottom left
                        transform="rotate(135 50 50)"
                    />
                    {/* Center Mark */}
                    <line x1="50" y1="5" x2="50" y2="15" stroke="#444" strokeWidth="2" />
                    {/* Active Track */}
                    <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke={isDragging ? (color === "cyan" ? "#06b6d4" : (color === "white" ? "#ffffff" : "#a855f7")) : (color === "white" ? "#a1a1aa" : "#666")}
                        strokeWidth="8"
                        strokeDasharray={`${percentage * 200} 251`}
                        transform="rotate(135 50 50)"
                        className="transition-colors"
                    />
                </svg>

                {/* Indicator Line */}
                <div
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ transform: `rotate(${angle}deg)` }}
                >
                    <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-1 h-[20%] bg-white rounded-full shadow-md" />
                </div>
            </div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{label}</span>
        </div>
    );
};
