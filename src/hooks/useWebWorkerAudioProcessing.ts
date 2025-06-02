import { useCallback, useState } from 'react';
import { AudioFile } from '@/types/audio';

export const useWebWorkerAudioProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{[key: string]: {progress: number, stage: string}}>({});

  const processAudioFile = useCallback(async (
    file: AudioFile, 
    settings: any,
    onProgressUpdate?: (progress: number, stage: string) => void
  ): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Starting Web Worker audio processing for:', file.name);
        
        // Create Web Worker
        const worker = new Worker(
          new URL('../workers/audioEnhancement.worker.ts', import.meta.url),
          { type: 'module' }
        );
        
        // Read file data
        const arrayBuffer = await file.originalFile.arrayBuffer();
        
        // Set up worker message handler
        worker.onmessage = (e) => {
          const { type, fileId, progress, stage, result, error } = e.data;
          
          if (type === 'progress') {
            if (onProgressUpdate) {
              onProgressUpdate(progress, stage);
            }
            setProcessingProgress(prev => ({
              ...prev,
              [fileId]: { progress, stage }
            }));
          } else if (type === 'complete') {
            worker.terminate();
            const enhancedBlob = new Blob([result], { 
              type: getOutputMimeType(settings.outputFormat) 
            });
            resolve(enhancedBlob);
          } else if (type === 'error') {
            worker.terminate();
            console.error('Worker error:', error);
            // Fallback: return original file
            resolve(new Blob([arrayBuffer], { 
              type: getOutputMimeType(settings.outputFormat) 
            }));
          }
        };
        
        worker.onerror = (error) => {
          console.error('Worker error:', error);
          worker.terminate();
          // Fallback: return original file
          resolve(new Blob([arrayBuffer], { 
            type: getOutputMimeType(settings.outputFormat) 
          }));
        };
        
        // Send data to worker
        worker.postMessage({
          fileData: arrayBuffer,
          settings,
          fileId: file.id
        });
        
      } catch (error) {
        console.error('Audio processing error:', error);
        reject(error);
      }
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
