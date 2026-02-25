import { useState } from 'react';
import { AudioFile } from '@/types/audio';
import { toast } from 'sonner';

interface UseFileAnalysisProps {
    onFilesUploaded: (files: AudioFile[]) => void;
    addToPlaylist: (files: AudioFile[]) => void;
    language: string;
}

export const useFileAnalysis = ({ onFilesUploaded, addToPlaylist, language }: UseFileAnalysisProps) => {
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleFilesUploaded = async (files: AudioFile[]) => {
        if (files.length > 5) {
            toast.error('Please upload maximum 5 files at a time for optimal performance');
            return;
        }

        setIsAnalyzing(true);
        setAnalysisProgress(0);

        const progressInterval = setInterval(() => {
            setAnalysisProgress(prev => {
                if (prev >= 90) return prev;
                const increment = prev < 50 ? 2 : prev < 80 ? 1 : 0.5;
                return Math.min(prev + increment, 90);
            });
        }, 100);

        const toastId = toast.loading(`Analyzing ${files.length} file${files.length > 1 ? 's' : ''}...`, {
            description: 'Detecting BPM and key signatures',
        });

        try {
            const { detectKeyFromFile } = await import('@/utils/keyDetector');
            const { detectBPMFromFile } = await import('@/utils/bpmDetector');

            const filesWithAnalysis = await Promise.all(
                files.map(async (file) => {
                    let harmonicKey = 'N/A';
                    let bpm: number | undefined = undefined;

                    const [keyResult, bpmResult] = await Promise.allSettled([
                        Promise.race([
                            detectKeyFromFile(file.originalFile),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Key timeout')), 5000))
                        ]),
                        Promise.race([
                            detectBPMFromFile(file.originalFile),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('BPM timeout')), 5000))
                        ])
                    ]);

                    if (keyResult.status === 'fulfilled') harmonicKey = (keyResult.value as any).camelot;
                    if (bpmResult.status === 'fulfilled') bpm = (bpmResult.value as any).bpm;

                    return { ...file, harmonicKey, bpm };
                })
            );

            clearInterval(progressInterval);
            setAnalysisProgress(100);

            const detectedBPM = filesWithAnalysis.filter(f => f.bpm).length;
            const detectedKey = filesWithAnalysis.filter(f => f.harmonicKey && f.harmonicKey !== 'N/A').length;

            if (detectedKey === 0 && detectedBPM === 0) {
                toast.error('Analysis failed', { id: toastId, description: 'Could not detect BPM or Key.' });
            } else {
                toast.success('Analysis complete!', { id: toastId, description: `BPM: ${detectedBPM}/${files.length} • Key: ${detectedKey}/${files.length}` });
            }

            setTimeout(() => {
                setIsAnalyzing(false);
                setAnalysisProgress(0);
                onFilesUploaded(filesWithAnalysis);
                addToPlaylist(filesWithAnalysis);
            }, 500);

        } catch (error) {
            clearInterval(progressInterval);
            setIsAnalyzing(false);
            setAnalysisProgress(0);
            toast.error('Analysis error', { id: toastId, description: 'An unexpected error occurred.' });
        }
    };

    return {
        isAnalyzing,
        analysisProgress,
        handleFilesUploaded
    };
};
