
import { useCallback, useState } from 'react';
import { AudioFile } from '@/types/audio';
import { useWebWorkerAudioProcessing } from '@/hooks/useWebWorkerAudioProcessing';
import { useEnhancementHistory } from '@/hooks/useEnhancementHistory';
import { useToast } from '@/hooks/use-toast';

export const useAudioEnhancement = (
  audioFiles: AudioFile[],
  setAudioFiles: React.Dispatch<React.SetStateAction<AudioFile[]>>,
  notificationsEnabled: boolean
) => {
  const [saveLocation, setSaveLocation] = useState<string | FileSystemDirectoryHandle>('downloads');
  const [bulkDownloadAuthorized, setBulkDownloadAuthorized] = useState(false);
  const { toast } = useToast();
  const { processAudioFile, isProcessing, setIsProcessing } = useWebWorkerAudioProcessing();
  const { addToHistory } = useEnhancementHistory();

  // Single authorization request for bulk downloads
  const requestBulkDownloadAuthorization = async (fileCount: number) => {
    if (typeof saveLocation === 'object' && saveLocation !== null) {
      // Already have directory handle
      setBulkDownloadAuthorized(true);
      return saveLocation;
    }
    
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        setSaveLocation(dirHandle);
        setBulkDownloadAuthorized(true);
        return dirHandle;
      } catch (error) {
        console.log('Directory picker cancelled or failed');
        return null;
      }
    }
    
    const confirmed = confirm(`Download ${fileCount} enhanced files? They will be saved to your Downloads folder.`);
    if (confirmed) {
      setBulkDownloadAuthorized(true);
    }
    return confirmed ? 'downloads' : null;
  };

  const downloadFile = async (blob: Blob, filename: string, folderName: string, dirHandle?: any) => {
    try {
      if (dirHandle && dirHandle !== 'downloads') {
        try {
          const folderHandle = await dirHandle.getDirectoryHandle(folderName, { create: true });
          const fileHandle = await folderHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          
          await writable.write(blob);
          await writable.close();
          
          return true;
        } catch (error) {
          console.log('Directory write failed, falling back to download');
        }
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return false;
    } catch (error) {
      console.error('Download failed:', error);
      return false;
    }
  };

  const handleEnhanceFiles = useCallback(async (settings: any) => {
    setIsProcessing(true);
    setBulkDownloadAuthorized(false);
    const filesToProcess = audioFiles.filter(file => file.status === 'uploaded');
    
    const folderName = `Enhanced_Audio_${new Date().toISOString().slice(0, 10)}`;
    
    let successfulDownloads = 0;
    const downloadQueue: { blob: Blob; filename: string }[] = [];
    let dirHandle: any = null;

    // Request authorization once for bulk downloads
    if (filesToProcess.length > 1) {
      dirHandle = await requestBulkDownloadAuthorization(filesToProcess.length);
      if (!dirHandle) {
        setIsProcessing(false);
        return;
      }
    }
    
    const startTime = Date.now();
    
    for (const file of filesToProcess) {
      setAudioFiles(prev => prev.map(f => 
        f.id === file.id ? { 
          ...f, 
          status: 'processing' as const, 
          progress: 0,
          processingStage: 'Starting...'
        } : f
      ));

      try {
        // Use the Web Worker audio processing with progress callbacks
        const enhancedBlob = await processAudioFile(file, settings, (progress, stage) => {
          setAudioFiles(prev => prev.map(f => 
            f.id === file.id ? { 
              ...f, 
              progress,
              processingStage: stage
            } : f
          ));
        });

        const enhancedUrl = URL.createObjectURL(enhancedBlob);
        const extension = settings.outputFormat || 'wav';
        const enhancedFilename = `${file.name.replace(/\.[^.]+$/, '')}_enhanced.${extension}`;
        
        downloadQueue.push({ blob: enhancedBlob, filename: enhancedFilename });
        
        // Add to enhancement history with correct structure
        const processingTime = Date.now() - startTime;
        addToHistory({
          fileName: file.name,
          settings,
          originalSize: file.size,
          enhancedSize: enhancedBlob.size,
          status: 'success'
        });
        
        setAudioFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'enhanced' as const, 
            progress: 100,
            processingStage: 'Complete',
            enhancedUrl,
            enhancedSize: enhancedBlob.size
          } : f
        ));
      } catch (error) {
        console.error('Error processing file:', error);
        
        addToHistory({
          fileName: file.name,
          settings,
          originalSize: file.size,
          enhancedSize: 0,
          status: 'error'
        });
        
        setAudioFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'error' as const,
            processingStage: 'Failed'
          } : f
        ));
      }
    }

    // Handle bulk downloads with single authorization
    if (downloadQueue.length > 1 && bulkDownloadAuthorized) {
      for (const item of downloadQueue) {
        const downloaded = await downloadFile(item.blob, item.filename, folderName, dirHandle);
        if (downloaded) successfulDownloads++;
      }
      
      toast({
        title: "Bulk download complete!",
        description: `${successfulDownloads} files saved to ${folderName} folder.`,
      });
    } else if (downloadQueue.length === 1) {
      const downloaded = await downloadFile(downloadQueue[0].blob, downloadQueue[0].filename, folderName, dirHandle);
      if (downloaded) successfulDownloads++;
    }

    setIsProcessing(false);
    
    if (notificationsEnabled && filesToProcess.length > 0) {
      new Notification('Audio Enhancement Complete', {
        body: `${filesToProcess.length} files enhanced with gain: ${settings.gainAdjustment || 0}dB`,
        icon: '/favicon.ico'
      });
    }
  }, [audioFiles, notificationsEnabled, toast, processAudioFile, addToHistory, setIsProcessing, bulkDownloadAuthorized, setAudioFiles]);

  return {
    handleEnhanceFiles,
    saveLocation,
    setSaveLocation,
    isProcessing
  };
};
