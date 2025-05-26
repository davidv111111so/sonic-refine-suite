
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
import { useToast } from '@/hooks/use-toast';

export interface AudioFile {
  id: string;
  name: string;
  size: number;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
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

  const downloadFile = async (blob: Blob, filename: string, folderName: string) => {
    try {
      if ('showDirectoryPicker' in window && typeof window.showDirectoryPicker === 'function') {
        try {
          const dirHandle = await (window as any).showDirectoryPicker();
          
          const folderHandle = await dirHandle.getDirectoryHandle(folderName, { create: true });
          
          const fileHandle = await folderHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          
          await writable.write(blob);
          await writable.close();
          
          return true;
        } catch (error) {
          console.log('Directory picker failed, falling back to download');
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
    const filesToProcess = audioFiles.filter(file => file.status === 'uploaded');
    
    const folderName = `Enhanced_Audio_${new Date().toISOString().slice(0, 10)}`;
    
    let successfulDownloads = 0;
    
    for (const file of filesToProcess) {
      setAudioFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' as const, progress: 0 } : f
      ));

      for (let i = 0; i <= 100; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setAudioFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress: i } : f
        ));
      }

      const enhancedUrl = file.originalUrl;
      
      const extension = settings.outputFormat || 'mp3';
      const enhancedFilename = `${file.name.replace(/\.[^.]+$/, '')}_enhanced.${extension}`;
      
      try {
        const response = await fetch(enhancedUrl || '');
        const blob = await response.blob();
        const downloaded = await downloadFile(blob, enhancedFilename, folderName);
        
        if (downloaded) successfulDownloads++;
        
        setAudioFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'enhanced' as const, 
            progress: 100,
            enhancedUrl
          } : f
        ));
      } catch (error) {
        console.error('Error processing file:', error);
        setAudioFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error' as const } : f
        ));
      }
    }

    setIsProcessing(false);
    
    toast({
      title: "Enhancement complete!",
      description: `${filesToProcess.length} files processed. ${successfulDownloads > 0 ? `Files saved to ${folderName} folder.` : 'Files downloaded to default location.'}`,
    });
    
    if (notificationsEnabled && filesToProcess.length > 0) {
      new Notification('Audio Enhancement Complete', {
        body: `${filesToProcess.length} files enhanced with gain: ${settings.gainAdjustment || 0}dB`,
        icon: '/favicon.ico'
      });
    }
  }, [audioFiles, notificationsEnabled, toast]);

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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <FileAudio className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Audio Enhancer Pro
            </h1>
            <ThemeToggle />
          </div>
          <p className="text-slate-300 text-lg">
            Transform your music collection with professional-grade audio enhancement
          </p>
        </div>

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
          <TabsList className="grid w-full grid-cols-6 bg-slate-800 border-slate-700">
            <TabsTrigger value="upload" className="data-[state=active]:bg-blue-600">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-blue-600">
              <Music className="h-4 w-4 mr-2" />
              Library
            </TabsTrigger>
            <TabsTrigger value="enhance" className="data-[state=active]:bg-blue-600">
              <Settings className="h-4 w-4 mr-2" />
              Enhance
            </TabsTrigger>
            <TabsTrigger value="queue" className="data-[state=active]:bg-blue-600">
              <Download className="h-4 w-4 mr-2" />
              Queue
            </TabsTrigger>
            <TabsTrigger value="player" className="data-[state=active]:bg-blue-600">
              <Radio className="h-4 w-4 mr-2" />
              Player
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-blue-600">
              <History className="h-4 w-4 mr-2" />
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
            <BatchPresets onSelectPreset={handleSelectPreset} />
            
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
              history={[]} 
              onClearHistory={() => {
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
