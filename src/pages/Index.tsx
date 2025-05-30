import { useState, useCallback, useEffect } from 'react';
import { Upload, Music, Settings, Download, FileAudio, History, Radio } from 'lucide-react';
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
  originalFile: File;
  enhancedUrl?: string;
  originalUrl?: string;
  artist?: string;
  title?: string;
  artworkUrl?: string;
}

const Index = () => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [bulkDownloadPending, setBulkDownloadPending] = useState<string[]>([]);
  const [bulkDownloadAuthorized, setBulkDownloadAuthorized] = useState(false);
  const { toast } = useToast();
  const { processAudioFile, isProcessing, setIsProcessing } = useAudioProcessing();
  const { history, addToHistory, clearHistory } = useEnhancementHistory();
  const [smartFolderOrganization, setSmartFolderOrganization] = useState('artist');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

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
      
      const nameMatch = file.name.match(/^(.*?)\s-\s(.*)\.[\w\d]+$/);
      if (nameMatch) {
        artist = nameMatch[1].trim();
        title = nameMatch[2].trim();
      } else {
        title = file.name.replace(/\.[^.]+$/, '');
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

  // Improved bulk download with single authorization
  const requestBulkDownloadAuthorization = async (fileCount: number) => {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        setBulkDownloadAuthorized(true);
        return dirHandle;
      } catch (error) {
        console.log('Directory picker cancelled or failed');
        return null;
      }
    }
    
    // Fallback: ask for confirmation for regular downloads
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
    setBulkDownloadAuthorized(false); // Reset authorization
    const filesToProcess = audioFiles.filter(file => file.status === 'uploaded');
    
    const folderName = `Enhanced_Audio_${new Date().toISOString().slice(0, 10)}`;
    
    let successfulDownloads = 0;
    const downloadQueue: { blob: Blob; filename: string }[] = [];
    let dirHandle: any = null;

    // Request authorization once for bulk downloads if multiple files
    if (filesToProcess.length > 1) {
      dirHandle = await requestBulkDownloadAuthorization(filesToProcess.length);
      if (!dirHandle) {
        setIsProcessing(false);
        return;
      }
    }
    
    for (const file of filesToProcess) {
      setAudioFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' as const, progress: 0 } : f
      ));

      // Simulate processing progress with smaller increments
      for (let i = 0; i <= 80; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setAudioFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress: i } : f
        ));
      }

      try {
        // Use the optimized audio processing from the hook
        const enhancedBlob = await processAudioFile(file, settings);
        const enhancedUrl = URL.createObjectURL(enhancedBlob);
        
        const extension = settings.outputFormat || 'wav';
        const enhancedFilename = `${file.name.replace(/\.[^.]+$/, '')}_enhanced.${extension}`;
        
        downloadQueue.push({ blob: enhancedBlob, filename: enhancedFilename });
        
        // Add to enhancement history with proper format
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
            enhancedUrl,
            enhancedSize: enhancedBlob.size
          } : f
        ));
      } catch (error) {
        console.error('Error processing file:', error);
        
        // Add error to history
        addToHistory({
          fileName: file.name,
          settings,
          originalSize: file.size,
          enhancedSize: 0,
          status: 'error'
        });
        
        setAudioFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error' as const } : f
        ));
      }
    }

    // Bulk download handling with authorization already granted
    if (downloadQueue.length > 1 && bulkDownloadAuthorized) {
      for (const item of downloadQueue) {
        const downloaded = await downloadFile(item.blob, item.filename, folderName, dirHandle);
        if (downloaded) successfulDownloads++;
      }
      
      toast({
        title: "Bulk download complete!",
        description: `${successfulDownloads} files saved to ${folderName} folder.`,
      });
    } else if (downloadQueue.length > 1) {
      setBulkDownloadPending(downloadQueue.map(item => item.filename));
      
      toast({
        title: "Files ready for download",
        description: `${downloadQueue.length} enhanced files are ready. Click "Download All" to save them.`,
        action: (
          <Button 
            size="sm" 
            onClick={() => handleBulkDownload(downloadQueue, folderName)}
            className="bg-green-600 hover:bg-green-700"
          >
            Download All
          </Button>
        ),
      });
    } else if (downloadQueue.length === 1) {
      const downloaded = await downloadFile(downloadQueue[0].blob, downloadQueue[0].filename, folderName);
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
    
    setBulkDownloadPending([]);
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
            <UploadZone onFilesUploaded={handleFilesUploaded} />
          </TabsContent>

          <TabsContent value="library" className="mt-6">
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
          </TabsContent>

          <TabsContent value="enhance" className="mt-6 space-y-6">
            <EnhancementSettings
              onEnhance={handleEnhanceFiles}
              isProcessing={isProcessing}
              hasFiles={stats.uploaded > 0}
            />
          </TabsContent>

          <TabsContent value="queue" className="mt-6">
            <ProcessingQueue files={audioFiles} />
          </TabsContent>

          <TabsContent value="player" className="mt-6">
            <MediaPlayer />
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
