import React from 'react';
import { Fader } from './Fader';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Lock, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TempoControlProps {
    pitch: number; // Current pitch/rate adjustment (e.g., 1.0 = normal)
    setPitch: (val: number) => void;
    onStep?: (dir: 1 | -1) => void;
    onNudge: (dir: 'left' | 'right', active: boolean) => void;
    keyLock: boolean;
    setKeyLock: (lock: boolean) => void;
    color: string;
}

export const TempoControl = ({
    pitch, setPitch, onNudge, keyLock, setKeyLock, color, onStep
}: TempoControlProps) => {
    const isCyan = color === 'cyan';
    const accentColor = isCyan ? 'text-cyan-500' : 'text-purple-500';
    const borderColor = isCyan ? 'border-cyan-500' : 'border-purple-500';

    const [showMenu, setShowMenu] = React.useState(false);
    const [menuPos, setMenuPos] = React.useState({ x: 0, y: 0 });

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setMenuPos({ x: e.clientX, y: e.clientY });
        setShowMenu(true);
    };

    React.useEffect(() => {
        const close = () => setShowMenu(false);
        if (showMenu) window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
    }, [showMenu]);

    return (
        <div className="flex flex-col h-full w-12 bg-[#121212] border-l border-[#27272a] items-center py-2 gap-2 relative">
            {/* Key Lock */}
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "w-8 h-8 rounded-full border transition-all",
                    keyLock
                        ? `${borderColor} ${accentColor} bg-opacity-20 bg-white`
                        : "border-[#3f3f46] text-neutral-500"
                )}
                onClick={() => setKeyLock(!keyLock)}
                title="Key Lock (Master Tempo)"
            >
                <Lock className="w-3 h-3" />
            </Button>

            {/* Pitch Fader */}
            <div
                className="flex-1 w-full flex flex-col items-center justify-center py-2 relative gap-1"
                onContextMenu={handleContextMenu}
            >
                {/* Up Arrow (Fast/Increase) */}
                <button
                    className="text-neutral-500 hover:text-white active:scale-90 transition-transform"
                    onClick={() => onStep?.(1)}
                >
                    <ChevronUp className="w-3 h-3" />
                </button>

                <div
                    className="h-full w-8"
                    onMouseUp={() => setPitch(0.5)}
                    onMouseLeave={() => setPitch(0.5)}
                    onTouchEnd={() => setPitch(0.5)}
                >
                    <Fader
                        orientation="vertical"
                        value={pitch}
                        onChange={setPitch}
                        className="h-full w-full"
                        thumbColor={isCyan ? "#06b6d4" : "#a855f7"}
                    />
                </div>

                {/* Down Arrow (Slow/Decrease) */}
                <button
                    className="text-neutral-500 hover:text-white active:scale-90 transition-transform"
                    onClick={() => onStep?.(-1)}
                >
                    <ChevronDown className="w-3 h-3" />
                </button>

                {/* Center Detent Marker */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20 pointer-events-none" />
            </div>

            {/* Context Menu */}
            {showMenu && (
                <div
                    className="fixed z-50 bg-[#18181b] border border-[#3f3f46] rounded-md shadow-xl p-1 flex flex-col gap-1 min-w-[100px]"
                    style={{ top: menuPos.y, left: menuPos.x }}
                >
                    <button className="text-[10px] text-left px-2 py-1 hover:bg-[#27272a] text-white rounded-sm" onClick={() => setPitch(0.5)}>Reset (0%)</button>
                    <button className="text-[10px] text-left px-2 py-1 hover:bg-[#27272a] text-white rounded-sm" onClick={() => setPitch(Math.min(1, pitch + 0.01))}>+1%</button>
                    <button className="text-[10px] text-left px-2 py-1 hover:bg-[#27272a] text-white rounded-sm" onClick={() => setPitch(Math.max(0, pitch - 0.01))}>-1%</button>
                </div>
            )}
        </div>
    );
};
