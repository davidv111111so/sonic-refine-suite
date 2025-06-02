import { useState, useCallback, useEffect } from 'react';
import { Upload, Music, Settings, Download, FileAudio, History, Radio, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadZone } from '@/components/UploadZone';
import { AudioFileCard } from '@/components/AudioFileCard';
import { EnhancementSettings } from '@/components/EnhancementSettings';
import { ProcessingQueue } from '@/components/ProcessingQueue';
import { BatchPresets } from '@/components/BatchPresets';
import { ExportHistory } from '@/components/ExportHistory';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MediaPlayer } from '@/components/MediaPlayer';
import { AudioEnhancementBanner } from '@/components/AudioEnhancementBanner';
import { useToast } from '@/hooks/use-toast';
import { useAudioProcessing } from '@/hooks/useAudioProcessing';
import { useEnhancementHistory } from '@/hooks/useEnhancementHistory';
import { useWebWorkerAudioProcessing } from '@/hooks/useWebWorkerAudioProcessing';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export interface AudioFile {
  id: string;
  name: string;
  size: number;
  enhancedSize?: number;
  type: string;
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  status: 'uploaded' | 'processing' | 'enhanced' | 'error';
  progress?: number;
  processingStage?: string;
  originalFile: File;
  enhancedUrl?: string;
  originalUrl?: string;
  artist?: string;
  title?: string;
  artworkUrl?: string;
}

const STORAGE_KEY = 'audioEnhancer_files';

const Index = () => {
  console.log('Index component render started');
  
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [saveLocation, setSaveLocation] = useState<string | FileSystemDirectoryHandle>('downloads');
  const [bulkDownloadAuthorized, setBulkDownloadAuthorized] = useState(false);
  const { toast } = useToast();
  const { processAudioFile, isProcessing, setIsProcessing, getProgressInfo } = useWebWorkerAudioProcessing();
  const { history, addToHistory, clearHistory } = useEnhancementHistory();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Load saved files from localStorage on component mount
  useEffect(() => {
    const savedFiles = localStorage.getItem(STORAGE_KEY);
    if (savedFiles) {
      try {
        const parsedFiles: AudioFile[] = JSON.parse(savedFiles);
        // Filter out enhanced and error files, keep only uploaded ones
        const uploadedFiles = parsedFiles.filter(file => file.status === 'uploaded');
        
        // Recreate file objects and URLs for uploaded files
        const restoredFiles = uploadedFiles.map(file => {
          // Note: We can't restore the actual File object from localStorage
          // but we keep the metadata for display purposes
          return {
            ...file,
            originalFile: new File([], file.name, { type: file.type }),
            originalUrl: undefined // Will need to be re-uploaded for processing
          };
        });
        
        setAudioFiles(restoredFiles);
        
        if (restoredFiles.length > 0) {
          toast({
            title: "Files restored",
            description: `${restoredFiles.length} uploaded files restored from previous session`,
          });
        }
      } catch (error) {
        console.error('Error loading saved files:', error);
      }
    }
  }, [toast]);

  // Save files to localStorage whenever audioFiles changes
  useEffect(() => {
    // Only save files that are uploaded (not processed ones)
    const filesToSave = audioFiles.filter(file => file.status === 'uploaded').map(file => ({
      ...file,
      originalFile: undefined, // Can't serialize File objects
      originalUrl: undefined, // Can't serialize blob URLs
      enhancedUrl: undefined
    }));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filesToSave));
  }, [audioFiles]);

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationsEnabled(permission === 'granted');
      });
    }
  }, []);

  const handleFilesUploaded = useCallback((files: AudioFile[]) => {
    const processedFiles = files.map(file => {
      const originalUrl = URL.createObjectURL(file.originalFile);
      
      let artist = "Unknown Artist";
      let title = file.name;
      
      // Enhanced filename parsing for better song name extraction
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
      
      // Try different patterns for artist - title separation
      const patterns = [
        /^(.*?)\s*-\s*(.*)$/, // Artist - Title
        /^(.*?)\s*–\s*(.*)$/, // Artist – Title (em dash)
        /^(.*?)\s*—\s*(.*)$/, // Artist — Title (em dash)
        /^(\d+\.?\s*)?(.*?)\s*-\s*(.*)$/, // Track number. Artist - Title
        /^(\d+[\.\s]+)(.*)$/ // Just track number prefix
      ];
      
      for (const pattern of patterns) {
        const match = nameWithoutExt.match(pattern);
        if (match) {
          if (match.length === 3) {
            artist = match[1].trim();
            title = match[2].trim();
            break;
          } else if (match.length === 4) {
            artist = match[2].trim();
            title = match[3].trim();
            break;
          }
        }
      }
      
      // If no pattern matched, use the filename as title
      if (artist === "Unknown Artist") {
        title = nameWithoutExt;
      }
      
      return {
        ...file,
        originalUrl,
        artist,
        title
      };
    });
    
    setAudioFiles(prev => [...prev, ...processedFiles]);
    toast({
      title: "Files uploaded successfully",
      description: `${files.length} audio files added to your collection`,
    });
  }, [toast]);

  const handleRemoveFile = useCallback((fileId: string) => {
    setAudioFiles(prev => {
      const fileToRemove = prev.find(file => file.id === fileId);
      
      if (fileToRemove?.originalUrl) {
        URL.revokeObjectURL(fileToRemove.originalUrl);
      }
      if (fileToRemove?.enhancedUrl) {
        URL.revokeObjectURL(fileToRemove.enhancedUrl);
      }
      
      return prev.filter(file => file.id !== fileId);
    });
  }, []);

  const handleUpdateFile = useCallback((fileId: string, updates: Partial<AudioFile>) => {
    setAudioFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, ...updates } : file
    ));
    
    toast({
      title: "File updated",
      description: "The file information has been updated",
    });
  }, [toast]);

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
  }, [audioFiles, notificationsEnabled, toast, processAudioFile, addToHistory, setIsProcessing, bulkDownloadAuthorized]);

  const handleBulkDownload = async (downloadQueue: { blob: Blob; filename: string }[], folderName: string) => {
    let successfulDownloads = 0;
    
    for (const item of downloadQueue) {
      const downloaded = await downloadFile(item.blob, item.filename, folderName);
      if (downloaded) successfulDownloads++;
    }
    
    toast({
      title: "Bulk download complete!",
      description: `${successfulDownloads} files saved to ${folderName} folder.`,
    });
  };

  const handleSelectPreset = useCallback((preset: any) => {
    setActiveTab('enhance');
    toast({
      title: "Preset selected",
      description: `${preset.smartFolder} preset has been applied to the settings`,
    });
  }, [toast]);

  const stats = {
    total: audioFiles.length,
    uploaded: audioFiles.filter(f => f.status === 'uploaded').length,
    processing: audioFiles.filter(f => f.status === 'processing').length,
    enhanced: audioFiles.filter(f => f.status === 'enhanced').length,
  };

  console.log('Index component render - activeTab:', activeTab);
  console.log('Index component render - stats:', stats);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header with Banner */}
        <div className="flex items-center justify-end mb-4">
          <ThemeToggle />
        </div>
        <AudioEnhancementBanner />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <FileAudio className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-slate-400 text-sm">Total Files</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Upload className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.uploaded}</p>
                  <p className="text-slate-400 text-sm">Ready to Process</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Settings className="h-8 w-8 text-yellow-400 animate-spin" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.processing}</p>
                  <p className="text-slate-400 text-sm">Processing</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Download className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.enhanced}</p>
                  <p className="text-slate-400 text-sm">Enhanced</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-slate-800 border-slate-700 h-9">
            <TabsTrigger value="upload" className="data-[state=active]:bg-blue-600 text-xs">
              <Upload className="h-3 w-3 mr-1" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-blue-600 text-xs">
              <Music className="h-3 w-3 mr-1" />
              Library
            </TabsTrigger>
            <TabsTrigger value="enhance" className="data-[state=active]:bg-blue-600 text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Enhance
            </TabsTrigger>
            <TabsTrigger value="queue" className="data-[state=active]:bg-blue-600 text-xs">
              <Download className="h-3 w-3 mr-1" />
              Queue
            </TabsTrigger>
            <TabsTrigger value="player" className="data-[state=active]:bg-blue-600 text-xs">
              <Radio className="h-3 w-3 mr-1" />
              Player
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 text-xs">
              <History className="h-3 w-3 mr-1" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <ErrorBoundary>
              <UploadZone onFilesUploaded={handleFilesUploaded} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <ErrorBoundary>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {audioFiles.map((file) => (
                  <AudioFileCard
                    key={file.id}
                    file={file}
                    onRemove={handleRemoveFile}
                    onUpdate={handleUpdateFile}
                  />
                ))}
                {audioFiles.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Music className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No audio files uploaded yet</p>
                    <p className="text-slate-500">Upload some files to get started</p>
                  </div>
                )}
              </div>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="enhance" className="mt-6 space-y-6">
            <ErrorBoundary 
              fallback={
                <Card className="bg-red-900/20 border-red-500/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-8 w-8 text-red-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-red-300">Enhancement Settings Error</h3>
                        <p className="text-red-200 text-sm">
                          There was an error loading the enhancement settings. Please refresh the page.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              }
            >
              {(() => {
                console.log('Rendering enhance tab');
                try {
                  console.log('About to render EnhancementSettings with:', { isProcessing, hasFiles: stats.uploaded > 0 });
                  return (
                    <EnhancementSettings
                      onEnhance={handleEnhanceFiles}
                      isProcessing={isProcessing}
                      hasFiles={stats.uploaded > 0}
                      onSaveLocationChange={setSaveLocation}
                    />
                  );
                } catch (error) {
                  console.error('EnhancementSettings render error:', error);
                  return (
                    <Card className="bg-red-900/20 border-red-500/50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-8 w-8 text-red-400" />
                          <div>
                            <h3 className="text-lg font-semibold text-red-300">Enhancement Settings Failed</h3>
                            <p className="text-red-200 text-sm">
                              Component failed to load: {error instanceof Error ? error.message : 'Unknown error'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              })()}
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="queue" className="mt-6">
            <ErrorBoundary>
              <ProcessingQueue files={audioFiles} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="player" className="mt-6">
            <ErrorBoundary>
              <MediaPlayer />
            </ErrorBoundary>
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <ErrorBoundary>
              <ExportHistory 
                history={history} 
                onClearHistory={() => {
                  clearHistory();
                  toast({
                    title: "History cleared",
                    description: "Your enhancement history has been cleared"
                  });
                }} 
              />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
