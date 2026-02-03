import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface FaderProps {
    value: number; // 0 to 1
    onChange: (value: number) => void;
    orientation?: 'vertical' | 'horizontal';
    className?: string;
    thumbClassName?: string;
    thumbColor?: string; // Hex or tailwind class
    onDragEnd?: () => void;
}

export const Fader = ({ value, onChange, orientation = 'vertical', className, thumbClassName, thumbColor = '#e5e5e5', onDragEnd }: FaderProps) => {
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
            if (onDragEnd) onDragEnd();
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

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // 5% per click - smoother faster jumps
        const delta = -Math.sign(e.deltaY);
        const step = 0.05;
        const newValue = Math.max(0, Math.min(1, value + delta * step));

        onChange(newValue);
    };

    return (
        <div
            className={cn(
                "relative select-none touch-none flex items-center justify-center cursor-pointer group",
                orientation === 'vertical' ? "h-full w-10 py-4 px-0" : "w-full h-12 px-4",
                className
            )}
            onMouseDown={handleMouseDown}
            onWheel={handleWheel}
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
                    "absolute bg-gradient-to-b from-[#555] to-[#0a0a0a] border border-[#666] rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.8)] flex items-center justify-center z-10 transition-all",
                    orientation === 'vertical' ? "w-11 h-7 left-1/2 -translate-x-1/2" : "h-11 w-7 top-1/2 -translate-y-1/2",
                    isDragging ? "border-white brightness-125" : "hover:border-neutral-400 hover:brightness-110",
                    thumbClassName
                )}
                style={{
                    [orientation === 'vertical' ? 'bottom' : 'left']: `${percent}%`,
                    transform: orientation === 'vertical' ? 'translate(-50%, 50%)' : 'translate(-50%, -50%)'
                }}
            >
                {/* Cap Detail (Grip Lines) */}
                <div className="flex flex-col gap-[2px]">
                    <div className={cn("bg-white/10", orientation === 'vertical' ? "w-6 h-[1px]" : "h-6 w-[1px]")} />
                    <div className={cn("bg-white/10", orientation === 'vertical' ? "w-6 h-[1px]" : "h-6 w-[1px]")} />
                </div>

                {/* Indicator Line */}
                <div
                    className={cn("absolute bg-white shadow-[0_0_8px_white]", orientation === 'vertical' ? "w-full h-[2px]" : "h-[2px] w-full")}
                    style={{ backgroundColor: thumbColor, boxShadow: `0 0 10px ${thumbColor}` }}
                />
            </div>
        </div>
    );
};
