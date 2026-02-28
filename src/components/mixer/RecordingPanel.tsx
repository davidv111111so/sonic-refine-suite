import React from 'react';
import { cn } from '@/lib/utils';
import { Square, Download, Loader2 } from 'lucide-react';

interface RecordingPanelProps {
    elapsedSeconds: number;
    maxDuration: number;
    isConverting: boolean;
    onStop: () => void;
}

const formatTime = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const RecordingPanel = ({ elapsedSeconds, maxDuration, isConverting, onStop }: RecordingPanelProps) => {
    const progress = Math.min(100, (elapsedSeconds / maxDuration) * 100);

    return (
        <div className="absolute top-12 right-4 z-[60] animate-in slide-in-from-top-2 duration-300">
            <div className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-red-500/30 rounded-lg px-4 py-3 shadow-[0_0_30px_rgba(239,68,68,0.15)] min-w-[220px]">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Recording</span>
                    <span className="text-[9px] text-red-500/50 ml-auto">.WAV</span>
                </div>

                {/* Time Display */}
                <div className="font-mono text-2xl font-black text-white tracking-wider text-center mb-2 tabular-nums">
                    {formatTime(elapsedSeconds)}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-[#333] rounded-full overflow-hidden mb-3">
                    <div
                        className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Max Duration Label */}
                <div className="flex justify-between text-[8px] text-[#666] font-mono mb-3">
                    <span>0:00:00</span>
                    <span>MAX 2:00:00</span>
                </div>

                {/* Stop / Converting Button */}
                {isConverting ? (
                    <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-2 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider"
                    >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Converting to WAV...
                    </button>
                ) : (
                    <button
                        onClick={onStop}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/60 transition-all text-[10px] font-bold uppercase tracking-wider group"
                    >
                        <Square className="w-3 h-3 group-hover:scale-110 transition-transform" />
                        Stop & Download
                        <Download className="w-3 h-3 opacity-50" />
                    </button>
                )}
            </div>
        </div>
    );
};
