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
    const [deleteMode, setDeleteMode] = React.useState(false);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">Hot Cues</span>
                <button
                    onClick={() => setDeleteMode(!deleteMode)}
                    className={cn(
                        "text-[8px] font-bold px-1.5 py-0.5 rounded border transition-all",
                        deleteMode
                            ? "bg-red-500/20 text-red-500 border-red-500 shadow-[0_0_5px_rgba(239,68,68,0.3)]"
                            : "bg-[#27272a] text-neutral-500 border-[#3f3f46] hover:text-white"
                    )}
                >
                    {deleteMode ? "DONE" : "DELETE"}
                </button>
            </div>
            <div className="flex gap-[3px] items-center">
                {cues.map((cue, index) => {
                    const color = HOT_CUE_COLORS[index % HOT_CUE_COLORS.length];
                    const isSet = cue !== null;

                    return (
                        <div key={index} className="relative group flex-1">
                            <button
                                className={cn(
                                    "h-7 w-full rounded-[2px] text-[10px] font-black flex items-center justify-center transition-all duration-100 active:scale-90 border",
                                    isSet
                                        ? "border-transparent shadow-[0_0_6px_var(--cue-color)]"
                                        : "border-[#3f3f46] bg-[#1a1a1a] text-neutral-600 hover:border-neutral-500 hover:text-neutral-400"
                                )}
                                style={isSet ? {
                                    backgroundColor: color + '33',
                                    color: color,
                                    ['--cue-color' as any]: color + '44',
                                    borderColor: deleteMode ? '#ef4444' : color + '80',
                                } : undefined}
                                onClick={() => {
                                    if (deleteMode) {
                                        if (isSet) onDeleteCue(index);
                                    } else {
                                        if (isSet) {
                                            onJumpToCue(index);
                                        } else {
                                            onSetCue(index, currentTime);
                                        }
                                    }
                                }}
                                title={isSet
                                    ? `Hot Cue ${index + 1}${deleteMode ? ' (Click to DELETE)' : ''}`
                                    : `Set Hot Cue ${index + 1}`
                                }
                            >
                                {deleteMode && isSet ? <X className="w-3 h-3 text-red-500" /> : index + 1}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
