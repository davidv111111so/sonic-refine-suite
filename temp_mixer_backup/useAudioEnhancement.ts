
import { useCallback, useState, useEffect } from 'react';
import { AudioFile } from '@/types/audio';
import { useWebWorkerAudioProcessing } from '@/hooks/useWebWorkerAudioProcessing';
import { useEnhancementHistory } from '@/hooks/useEnhancementHistory';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';

export const useAudioEnhancement = (
  audioFiles: AudioFile[],
  setAudioFiles: React.Dispatch<React.SetStateAction<AudioFile[]>>,
  notificationsEnabled: boolean
) => {
  // Persistent download folder using localStorage
  const [saveLocation, setSaveLocation] = useState<string | FileSystemDirectoryHandle>(() => {
    const savedPath = localStorage.getItem('spectrumDownloadPath');
    return savedPath || 'downloads';
  });
  const [bulkDownloadAuthorized, setBulkDownloadAuthorized] = useState(false);
  const { toast } = useToast();
  const { processAudioFile, isProcessing, setIsProcessing } = useWebWorkerAudioProcessing();
  const { addToHistory } = useEnhancementHistory();

  // Persist download location
  useEffect(() => {
    if (typeof saveLocation === 'string') {
      localStorage.setItem('spectrumDownloadPath', saveLocation);
    }
  }, [saveLocation]);

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

  // Download all enhanced files as ZIP
  const handleDownloadAllAsZip = useCallback(async () => {
    const enhancedFiles = audioFiles.filter(file => file.status === 'enhanced' && file.enhancedUrl);
    
    if (enhancedFiles.length < 2) {
      toast({
        title: "Not enough files",
        description: "You need at least 2 enhanced files to download as ZIP.",
        variant: "destructive"
      });
      return;
    }

    try {
      const zip = new JSZip();
      const folder = zip.folder(`Spectrum_Enhanced_${new Date().toISOString().slice(0, 10)}`);
      
      // Add each enhanced file to the ZIP
      for (const file of enhancedFiles) {
        if (file.enhancedUrl) {
          const response = await fetch(file.enhancedUrl);
          const blob = await response.blob();
          const extension = file.name.split('.').pop() || 'wav';
          const filename = `${file.name.replace(/\.[^.]+$/, '')}_enhanced.${extension}`;
          folder?.file(filename, blob);
        }
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Spectrum_Enhanced_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "ZIP Downloaded!",
        description: `${enhancedFiles.length} files downloaded successfully.`,
      });
    } catch (error) {
      console.error('ZIP download failed:', error);
      toast({
        title: "Download Failed",
        description: "Failed to create ZIP file. Please try downloading files individually.",
        variant: "destructive"
      });
    }
  }, [audioFiles, toast]);

  return {
    handleEnhanceFiles,
    handleDownloadAllAsZip,
    saveLocation,
    setSaveLocation,
    isProcessing
  };
};
