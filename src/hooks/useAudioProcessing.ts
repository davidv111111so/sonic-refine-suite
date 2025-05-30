
import { useCallback, useState } from 'react';
import { AudioFile } from '@/pages/Index';

export const useAudioProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{[key: string]: {progress: number, stage: string}}>({});

  const processAudioFile = useCallback(async (
    file: AudioFile, 
    settings: any,
    onProgressUpdate?: (progress: number, stage: string) => void
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // Create worker
      const worker = new Worker(
        new URL('../workers/audioProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      );

      const startTime = Date.now();

      worker.onmessage = (event) => {
        const { type, fileId, progress, stage, result, error, enhancedSize } = event.data;

        switch (type) {
          case 'PROGRESS_UPDATE':
            setProcessingProgress(prev => ({
              ...prev,
              [file.id]: { progress, stage }
            }));
            if (onProgressUpdate) {
              onProgressUpdate(progress, stage);
            }
            break;

          case 'PROCESSING_COMPLETE':
            const blob = new Blob([result], { type: getOutputMimeType(settings.outputFormat) });
            
            // Clean up progress tracking
            setProcessingProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[file.id];
              return newProgress;
            });
            
            worker.terminate();
            resolve(blob);
            break;

          case 'ERROR':
            worker.terminate();
            reject(new Error(error));
            break;
        }
      };

      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };

      // Start processing
      file.originalFile.arrayBuffer().then(arrayBuffer => {
        worker.postMessage({
          type: 'PROCESS_AUDIO',
          data: {
            arrayBuffer,
            settings,
            fileId: file.id,
            startTime
          }
        });
      }).catch(reject);
    });
  }, []);

  const getProgressInfo = useCallback((fileId: string) => {
    return processingProgress[fileId] || { progress: 0, stage: 'Preparing...' };
  }, [processingProgress]);

  return { 
    processAudioFile, 
    isProcessing, 
    setIsProcessing,
    getProgressInfo
  };
};

const getOutputMimeType = (format: string): string => {
  switch (format) {
    case 'mp3': return 'audio/mpeg';
    case 'flac': return 'audio/flac';
    case 'ogg': return 'audio/ogg';
    case 'wav': return 'audio/wav';
    default: return 'audio/wav';
  }
};
