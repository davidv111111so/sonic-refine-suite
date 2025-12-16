import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface FaderProps {
    value: number; // 0 to 1
    onChange: (value: number) => void;
    orientation?: 'vertical' | 'horizontal';
    className?: string;
    thumbColor?: string; // Hex or tailwind class
}

export const Fader = ({ value, onChange, orientation = 'vertical', className, thumbColor = '#e5e5e5' }: FaderProps) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        updateValue(e);
    };

    const updateValue = (e: MouseEvent | React.MouseEvent) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        let newValue = 0;

        if (orientation === 'vertical') {
            // Vertical: Bottom is 0, Top is 1
            const clientY = e.clientY;
            const height = rect.height;
            const y = Math.max(0, Math.min(height, rect.bottom - clientY));
            newValue = y / height;
        } else {
            // Horizontal: Left is 0, Right is 1
            const clientX = e.clientX;
            const width = rect.width;
            const x = Math.max(0, Math.min(width, clientX - rect.left));
            newValue = x / width;
        }

        onChange(Math.max(0, Math.min(1, newValue)));
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                e.preventDefault();
                updateValue(e);
            }
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
    }, [isDragging, orientation]);

    // Calculate thumb position as percentage
    const percent = value * 100;

    return (
        <div
            className={cn(
                "relative select-none touch-none flex items-center justify-center cursor-pointer group",
                orientation === 'vertical' ? "h-full w-12 py-4" : "w-full h-12 px-4",
                className
            )}
            onMouseDown={handleMouseDown}
            ref={trackRef}
        >
            {/* Track Background */}
            <div
                className={cn(
                    "bg-[#050505] border border-[#222] rounded-full shadow-inner relative overflow-hidden",
                    orientation === 'vertical' ? "w-2 h-full" : "h-2 w-full"
                )}
            >
                {/* Center Line / Tick Marks */}
                <div className="absolute inset-0 opacity-20 bg-repeat-space flex items-center justify-center">
                    {/* Simple center line */}
                    <div className={cn("bg-white/50", orientation === 'vertical' ? "w-full h-[1px]" : "h-full w-[1px]")} style={{ [orientation === 'vertical' ? 'top' : 'left']: '50%', position: 'absolute' }} />
                </div>
            </div>

            {/* Fader Cap (Thumb) */}
            <div
                className={cn(
                    "absolute bg-gradient-to-b from-[#444] to-[#111] border border-[#555] rounded-sm shadow-[0_4px_6px_rgba(0,0,0,0.5)] flex items-center justify-center z-10 hover:border-[#777] active:border-white transition-colors",
                    orientation === 'vertical' ? "w-10 h-6 left-1/2 -translate-x-1/2" : "h-10 w-6 top-1/2 -translate-y-1/2"
                )}
                style={{
                    [orientation === 'vertical' ? 'bottom' : 'left']: `${percent}%`,
                    transform: orientation === 'vertical' ? 'translate(-50%, 50%)' : 'translate(-50%, -50%)'
                }}
            >
                {/* Cap Detail (Grip Lines) */}
                <div className={cn(
                    "bg-black/50",
                    orientation === 'vertical' ? "w-full h-[1px]" : "h-full w-[1px]"
                )} />

                {/* Indicator Line */}
                <div
                    className={cn("absolute bg-white", orientation === 'vertical' ? "w-full h-[2px]" : "h-[2px] w-full")}
                    style={{ backgroundColor: thumbColor }}
                />
            </div>
        </div>
    );
};
