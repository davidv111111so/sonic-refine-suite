
import { useCallback, useState } from 'react';
import { AudioFile } from '@/types/audio';
import { AdvancedAudioProcessor } from '@/utils/advancedAudioProcessor';
import { BackendAudioService, getBackendConfig, isBackendAvailable } from '@/services/backendIntegration';

export const useAdvancedAudioProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{[key: string]: {progress: number, stage: string}}>({});
  const [useBackend, setUseBackend] = useState(false);

  // Check if backend is available on initialization
  const checkBackendAvailability = useCallback(async () => {
    const available = await isBackendAvailable();
    setUseBackend(available);
    return available;
  }, []);

  const processAudioFile = useCallback(async (
    file: AudioFile, 
    settings: any,
    onProgressUpdate?: (progress: number, stage: string) => void
  ): Promise<Blob> => {
    
    setIsProcessing(true);
    
    try {
      // Check if backend is available for processing
      const backendAvailable = await checkBackendAvailability();
      
      if (backendAvailable) {
        // Use backend processing for best quality
        return await processWithBackend(file, settings, onProgressUpdate);
      } else {
        // Fallback to advanced client-side processing
        return await processWithAdvancedClient(file, settings, onProgressUpdate);
      }
      
    } catch (error) {
      console.error('Audio processing error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [checkBackendAvailability]);

  const processWithBackend = async (
    file: AudioFile,
    settings: any,
    onProgressUpdate?: (progress: number, stage: string) => void
  ): Promise<Blob> => {
    
    const config = getBackendConfig();
    const backendService = new BackendAudioService(config);
    
    try {
      if (onProgressUpdate) onProgressUpdate(5, 'Uploading to processing server...');
      
      // Upload file to backend
      const { fileId } = await backendService.uploadFile(file.originalFile);
      
      if (onProgressUpdate) onProgressUpdate(15, 'Starting professional enhancement...');
      
      // Start backend processing
      const { jobId } = await backendService.enhanceAudio(fileId, settings);
      
      // Connect to real-time progress updates
      backendService.connectProgressUpdates((update) => {
        if (update.jobId === jobId && onProgressUpdate) {
          onProgressUpdate(update.progress, update.stage);
          setProcessingProgress(prev => ({
            ...prev,
            [file.id]: { progress: update.progress, stage: update.stage }
          }));
        }
      });
      
      // Poll for completion
      let job;
      do {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Check every 2 seconds
        job = await backendService.getJobStatus(jobId);
      } while (job.status === 'processing' || job.status === 'pending');
      
      if (job.status === 'failed') {
        throw new Error(job.error || 'Backend processing failed');
      }
      
      if (onProgressUpdate) onProgressUpdate(95, 'Downloading enhanced file...');
      
      // Download the enhanced file
      const enhancedBlob = await backendService.downloadEnhanced(jobId);
      
      backendService.disconnect();
      
      return enhancedBlob;
      
    } catch (error) {
      console.warn('Backend processing failed, falling back to client-side:', error);
      return await processWithAdvancedClient(file, settings, onProgressUpdate);
    }
  };

  const processWithAdvancedClient = async (
    file: AudioFile,
    settings: any,
    onProgressUpdate?: (progress: number, stage: string) => void
  ): Promise<Blob> => {
    
    const processor = new AdvancedAudioProcessor();
    
    try {
      if (onProgressUpdate) {
        onProgressUpdate(5, 'Initializing advanced client-side processing...');
      }
      
      const { blob } = await processor.processAudioFile(
        file.originalFile,
        settings,
        (progress, stage) => {
          if (onProgressUpdate) {
            onProgressUpdate(progress, `[Client-Side] ${stage}`);
          }
          setProcessingProgress(prev => ({
            ...prev,
            [file.id]: { progress, stage: `[Client-Side] ${stage}` }
          }));
        }
      );
      
      return blob;
      
    } finally {
      await processor.close();
    }
  };

  const getProgressInfo = useCallback((fileId: string) => {
    return processingProgress[fileId] || { progress: 0, stage: 'Preparing...' };
  }, [processingProgress]);

  return { 
    processAudioFile, 
    isProcessing, 
    setIsProcessing,
    getProgressInfo,
    useBackend,
    checkBackendAvailability
  };
};
