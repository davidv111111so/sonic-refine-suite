import React from 'react';
import { X } from 'lucide-react';
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
                    <div key={index} className="relative group">
                        <button
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
                        {isSet && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteCue(index);
                                }}
                                className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-neutral-900 border border-[#3f3f46] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-neutral-800 transition-opacity z-10 hover:border-red-500"
                                title="Delete Hot Cue"
                            >
                                <X className="w-2.5 h-2.5 text-neutral-400 hover:text-red-400" />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
