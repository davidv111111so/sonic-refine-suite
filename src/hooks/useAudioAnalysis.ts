import { useState, useCallback } from 'react';
import { detectBPMFromFile } from '@/utils/bpmDetector';
import { AudioFile } from '@/types/audio';
import { toast } from 'sonner';

export interface AudioAnalysisResult {
  bpm: number | null;
  key?: string;
}

export const useAudioAnalysis = () => {
  const [analyzingFiles, setAnalyzingFiles] = useState<Set<string>>(new Set());

  const analyzeFile = useCallback(async (file: AudioFile): Promise<AudioAnalysisResult> => {
    setAnalyzingFiles(prev => new Set(prev).add(file.id));

    try {
      // Detect BPM
      const bpmAnalysis = await detectBPMFromFile(file.originalFile);
      
      if (bpmAnalysis.bpm) {
        console.log(`BPM detected for ${file.name}: ${bpmAnalysis.bpm}`);
      }

      return {
        bpm: bpmAnalysis.bpm,
        key: file.harmonicKey
      };
    } catch (error) {
      console.error(`Failed to analyze ${file.name}:`, error);
      return {
        bpm: null,
        key: file.harmonicKey
      };
    } finally {
      setAnalyzingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  }, []);

  const analyzeBatch = useCallback(async (files: AudioFile[]): Promise<Map<string, AudioAnalysisResult>> => {
    const results = new Map<string, AudioAnalysisResult>();
    
    // Show toast for batch analysis
    if (files.length > 1) {
      toast.info(`Analyzing ${files.length} files...`, {
        duration: 3000,
      });
    }

    // Analyze files in parallel (but limit concurrency)
    const BATCH_SIZE = 3; // Analyze 3 files at a time
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (file) => {
          const result = await analyzeFile(file);
          return { fileId: file.id, result };
        })
      );

      batchResults.forEach(({ fileId, result }) => {
        results.set(fileId, result);
      });
    }

    // Show completion toast
    const successCount = Array.from(results.values()).filter(r => r.bpm !== null).length;
    if (files.length > 1) {
      toast.success(`Analysis complete! BPM detected for ${successCount}/${files.length} files`);
    }

    return results;
  }, [analyzeFile]);

  const isAnalyzing = useCallback((fileId: string) => {
    return analyzingFiles.has(fileId);
  }, [analyzingFiles]);

  return {
    analyzeFile,
    analyzeBatch,
    isAnalyzing,
    analyzingFiles,
  };
};
