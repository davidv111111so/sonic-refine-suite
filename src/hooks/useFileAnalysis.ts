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
        if (files.length > 10) {
            toast.error('For optimal performance and reliable analysis, please limit simultaneous uploads to a maximum of 10 files at a time.', { duration: 5000 });
            return;
        }

        setIsAnalyzing(true);
        setAnalysisProgress(0);

        const toastId = toast.loading(`Analyzing ${files.length} file${files.length > 1 ? 's' : ''}...`, {
            description: 'Detecting BPM and key signatures',
        });

        const simulateProcessing = async () => {
            // Stage 1: Reading (0-20%)
            for (let i = 0; i <= 20; i += 2) {
                setAnalysisProgress(i);
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            try {
                const { detectKeyFromFile } = await import('@/utils/keyDetector');
                const { detectBPMFromFile } = await import('@/utils/bpmDetector');

                let completedFiles = 0;
                // Stage 2: Feature Extraction (20-70%)
                const filesWithAnalysis = await Promise.all(
                    files.map(async (file, index) => {
                        let harmonicKey = 'N/A';
                        let bpm: number | undefined = undefined;

                        // Parallel detection
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

                        // Update progress per file smoothly
                        completedFiles++;
                        const fileProgress = (completedFiles / files.length) * 50;
                        setAnalysisProgress(20 + fileProgress);

                        return { ...file, harmonicKey, bpm };
                    })
                );

                // Stage 3: Finalizing (70-100%)
                for (let i = 70; i <= 100; i += 5) {
                    setAnalysisProgress(i);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                const detectedBPM = filesWithAnalysis.filter(f => f.bpm).length;
                const detectedKey = filesWithAnalysis.filter(f => f.harmonicKey && f.harmonicKey !== 'N/A').length;

                if (detectedKey === 0 && detectedBPM === 0) {
                    toast.error('Analysis failed', { id: toastId, description: 'Could not detect BPM or Key.' });
                } else {
                    toast.success('Analysis complete!', { id: toastId, description: `BPM: ${detectedBPM}/${files.length} • Key: ${detectedKey}/${files.length}` });
                }

                setIsAnalyzing(false);
                setAnalysisProgress(0);
                onFilesUploaded(filesWithAnalysis);
                addToPlaylist(filesWithAnalysis);

            } catch (error) {
                setIsAnalyzing(false);
                setAnalysisProgress(0);
                toast.error('Analysis error', { id: toastId, description: 'An unexpected error occurred.' });
            }
        };

        simulateProcessing();
    };

    return {
        isAnalyzing,
        analysisProgress,
        handleFilesUploaded
    };
};
