import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFiles = useMemo(() => {
        const allFiles = [...audioFiles, ...enhancedHistory];
        if (!searchQuery.trim()) return allFiles;

        const query = searchQuery.toLowerCase();
        return allFiles.filter(file => {
            const nameMatch = file.name?.toLowerCase().includes(query);
            const artistMatch = file.artist?.toLowerCase().includes(query);
            return nameMatch || artistMatch;
        });
    }, [audioFiles, enhancedHistory, searchQuery]);

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
                {/* Search Bar */}
                {([...audioFiles, ...enhancedHistory].length > 0) && (
                    <div className="relative mb-4 w-full max-w-md">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-4 h-4 text-slate-400" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Find tracks by name or artist..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-900/50 border-slate-700 text-white pl-10 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-500"
                        />
                    </div>
                )}

                <LevelTrackList
                    files={filteredFiles}
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
