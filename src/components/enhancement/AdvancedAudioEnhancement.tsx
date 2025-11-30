import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Settings } from 'lucide-react';
import { AudioFile } from '@/types/audio';
import { ProcessingSettings } from '@/utils/audioProcessor';
import { cn } from '@/lib/utils';

interface AdvancedAudioEnhancementProps {
    audioFiles: AudioFile[];
    processingSettings: ProcessingSettings;
    estimatedTotalSize: number;
    onEnhance: () => void;
    isProcessing?: boolean;
}

export const AdvancedAudioEnhancement = ({
    audioFiles,
    processingSettings,
    estimatedTotalSize,
    onEnhance,
    isProcessing = false
}: AdvancedAudioEnhancementProps) => {

    // Calculate total input size
    const totalInputSize = audioFiles.reduce((acc, file) => acc + file.size, 0);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0MB';
        return `${Math.round(bytes / 1024 / 1024)}MB`;
    };

    const getInputFormat = () => {
        if (audioFiles.length === 0) return '-';
        // Check if all files have the same extension
        const firstExt = audioFiles[0].name.split('.').pop()?.toUpperCase();
        const allSame = audioFiles.every(f => f.name.split('.').pop()?.toUpperCase() === firstExt);
        return allSame ? firstExt : 'MIX';
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center gap-2 text-slate-200">
                <Settings className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold">Advanced Audio Enhancement</h2>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-stretch">
                {/* LEVEL Button */}
                <button
                    onClick={onEnhance}
                    disabled={audioFiles.length === 0 || isProcessing}
                    className={cn(
                        "relative group overflow-hidden rounded-lg px-6 py-2 min-w-[120px] transition-all duration-300",
                        "bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600",
                        "hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-105",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                    )}
                >
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    <div className="relative z-10 flex items-center justify-center gap-2 font-bold tracking-wider text-white text-sm uppercase">
                        <Zap className={cn("w-4 h-4 fill-white", isProcessing && "animate-pulse")} />
                        {audioFiles.length > 1 ? `Level (${audioFiles.length})` : 'Level'}
                    </div>
                </button>

                {/* Stats Bar */}
                <div className="flex-1 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-slate-700/50 p-4 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

                    {/* Input */}
                    <div className="flex items-center gap-3 z-10">
                        <span className="text-slate-400 font-medium text-sm">Input:</span>
                        <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-600 px-3 py-1 min-w-[60px] justify-center">
                            {getInputFormat()}
                        </Badge>
                    </div>

                    <span className="text-slate-600 hidden sm:block">→</span>

                    {/* Output */}
                    <div className="flex items-center gap-3 z-10">
                        <span className="text-slate-400 font-medium text-sm">Output:</span>
                        <Badge className="bg-pink-600 hover:bg-pink-500 text-white border-0 px-3 py-1 font-bold shadow-[0_0_10px_rgba(219,39,119,0.3)]">
                            {processingSettings.outputFormat.toUpperCase()}
                        </Badge>
                    </div>

                    {/* Quality */}
                    <div className="flex items-center gap-3 z-10">
                        <span className="text-slate-400 font-medium text-sm">Quality:</span>
                        <Badge className="bg-blue-600 hover:bg-blue-500 text-white border-0 px-3 py-1 font-bold shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                            {processingSettings.outputFormat === 'mp3'
                                ? `${processingSettings.bitrate}kbps`
                                : `${(processingSettings.sampleRate / 1000).toFixed(1)}kHz ${processingSettings.bitDepth}bit`}
                        </Badge>
                    </div>

                    {/* Size Comparison */}
                    <div className="flex items-center gap-3 ml-auto z-10 bg-slate-950/30 rounded-lg px-3 py-1 border border-slate-700/30">
                        <span className="text-slate-400 font-medium text-sm">Before:</span>
                        <span className="font-mono text-slate-300 font-bold">{formatSize(totalInputSize)}</span>
                        <span className="text-slate-600">→</span>
                        <span className="text-slate-400 font-medium text-sm">After:</span>
                        <span className="font-mono text-emerald-400 font-bold">{formatSize(estimatedTotalSize)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
