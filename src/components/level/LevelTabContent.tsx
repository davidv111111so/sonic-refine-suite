import React from 'react';
import { LevelUpload } from './LevelUpload';
import { LevelTrackList } from './LevelTrackList';
import { Progress } from '@/components/ui/progress';
import { AudioFile } from '@/types/audio';

interface LevelTabContentProps {
    audioFiles: AudioFile[];
    enhancedHistory: AudioFile[];
    isAnalyzing: boolean;
    analysisProgress: number;
    handleFilesUploaded: (files: AudioFile[]) => Promise<void>;
    handlePlayInMediaPlayer: (file: AudioFile) => void;
    onDownload: (file: AudioFile) => void;
    onDelete: (fileId: string) => void;
    onClearAll: () => void;
    onConvert: (file: AudioFile, targetFormat: 'mp3' | 'wav' | 'flac') => void;
}

export const LevelTabContent: React.FC<LevelTabContentProps> = ({
    audioFiles,
    enhancedHistory,
    isAnalyzing,
    analysisProgress,
    handleFilesUploaded,
    handlePlayInMediaPlayer,
    onDownload,
    onDelete,
    onClearAll,
    onConvert,
}) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-5xl mx-auto">
            <div className="w-full mb-8 space-y-4">
                <LevelUpload onFilesUploaded={handleFilesUploaded} />
                {isAnalyzing && (
                    <div className="w-full max-w-md mx-auto space-y-2 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>Analyzing audio...</span>
                            <span>{analysisProgress}%</span>
                        </div>
                        <Progress value={analysisProgress} className="h-2" />
                    </div>
                )}
            </div>
            <div className="w-full">
                <LevelTrackList
                    files={[...audioFiles, ...enhancedHistory]}
                    onPlay={handlePlayInMediaPlayer}
                    onDownload={onDownload}
                    onDelete={onDelete}
                    onClearAll={onClearAll}
                    onConvert={onConvert}
                />
            </div>
        </div>
    );
};
