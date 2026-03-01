import React from 'react';
import { cn } from '@/lib/utils';
import { HotCue, HOT_CUE_COLORS } from '@/hooks/useHotCues';

interface HotCuePadProps {
    cues: (HotCue | null)[];
    currentTime: number;
    onSetCue: (index: number, time: number) => void;
    onJumpToCue: (index: number) => void;
    onDeleteCue: (index: number) => void;
    accentColor?: string;
}

export const HotCuePad: React.FC<HotCuePadProps> = ({
    cues,
    currentTime,
    onSetCue,
    onJumpToCue,
    onDeleteCue,
    accentColor = 'cyan',
}) => {
    return (
        <div className="flex gap-[3px] items-center">
            {cues.map((cue, index) => {
                const color = HOT_CUE_COLORS[index % HOT_CUE_COLORS.length];
                const isSet = cue !== null;

                return (
                    <button
                        key={index}
                        className={cn(
                            "h-6 w-6 rounded-[3px] text-[9px] font-black flex items-center justify-center transition-all duration-100 active:scale-90 border",
                            isSet
                                ? "border-transparent shadow-[0_0_6px_var(--cue-color)]"
                                : "border-[#3f3f46] bg-[#1a1a1a] text-neutral-600 hover:border-neutral-500 hover:text-neutral-400"
                        )}
                        style={isSet ? {
                            backgroundColor: color + '33', // 20% alpha
                            color: color,
                            ['--cue-color' as any]: color + '66',
                            borderColor: color + '80',
                        } : undefined}
                        onClick={() => {
                            if (isSet) {
                                onJumpToCue(index);
                            } else {
                                onSetCue(index, currentTime);
                            }
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            if (isSet) {
                                onDeleteCue(index);
                            }
                        }}
                        title={isSet
                            ? `Hot Cue ${index + 1}: ${cue!.time.toFixed(2)}s (right-click to delete)`
                            : `Set Hot Cue ${index + 1}`
                        }
                    >
                        {index + 1}
                    </button>
                );
            })}
        </div>
    );
};
