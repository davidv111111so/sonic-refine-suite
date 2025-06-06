
import { useState, useCallback, useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { useFileManagement } from '@/hooks/useFileManagement';
import { useAdvancedAudioProcessing } from '@/hooks/useAdvancedAudioProcessing';
import { useEnhancementHistory } from '@/hooks/useEnhancementHistory';
import { AudioFile, AudioStats } from '@/types/audio';
import { CompactUploadZone } from '@/components/CompactUploadZone';
import { CompactEnhancementSettings } from '@/components/CompactEnhancementSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Download, AudioWaveform } from 'lucide-react';

const Index = () => {
  console.log('Index component render started');
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { toast } = useToast();
  
  const {
    audioFiles,
    setAudioFiles,
    handleFilesUploaded,
    handleRemoveFile,
    handleUpdateFile
  } = useFileManagement();

  const { processAudioFile, isProcessing, setIsProcessing } = useAdvancedAudioProcessing();
  const { addToHistory } = useEnhancementHistory();

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationsEnabled(permission === 'granted');
      });
    }
  }, []);

  const handleEnhanceFiles = useCallback(async (settings: any) => {
    setIsProcessing(true);
    const filesToProcess = audioFiles.filter(file => file.status === 'uploaded');
    
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
        
        // Auto-download enhanced file
        const a = document.createElement('a');
        a.href = enhancedUrl;
        a.download = enhancedFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
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
            processingStage: 'Complete - Downloaded',
            enhancedUrl,
            enhancedSize: enhancedBlob.size
          } : f
        ));

        toast({
          title: "Enhancement complete!",
          description: `${file.name} has been enhanced and downloaded.`,
        });

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

        toast({
          title: "Enhancement failed",
          description: `Failed to process ${file.name}. Please try again.`,
          variant: "destructive"
        });
      }
    }

    setIsProcessing(false);
    
    if (notificationsEnabled && filesToProcess.length > 0) {
      new Notification('Audio Enhancement Complete', {
        body: `${filesToProcess.length} files enhanced and downloaded`,
        icon: '/favicon.ico'
      });
    }
  }, [audioFiles, notificationsEnabled, toast, processAudioFile, addToHistory, setIsProcessing, setAudioFiles]);

  const stats: AudioStats = {
    total: audioFiles.length,
    uploaded: audioFiles.filter(f => f.status === 'uploaded').length,
    processing: audioFiles.filter(f => f.status === 'processing').length,
    enhanced: audioFiles.filter(f => f.status === 'enhanced').length,
  };

  const processingFiles = audioFiles.filter(f => f.status === 'processing');

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-black text-white">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <AudioWaveform className="h-6 w-6 text-blue-400" />
              Audio Enhancer
            </h1>
            <p className="text-slate-400 text-sm">Professional audio enhancement in your browser</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Quick Stats */}
        {stats.total > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-white">{stats.total}</div>
                <div className="text-xs text-slate-400">Total Files</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-blue-400">{stats.uploaded}</div>
                <div className="text-xs text-slate-400">Ready</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-yellow-400">{stats.processing}</div>
                <div className="text-xs text-slate-400">Processing</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-green-400">{stats.enhanced}</div>
                <div className="text-xs text-slate-400">Enhanced</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Processing Progress */}
        {processingFiles.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">Processing Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {processingFiles.map(file => (
                <div key={file.id} className="mb-3 last:mb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-300 truncate">{file.name}</span>
                    <span className="text-xs text-slate-400">{file.progress}%</span>
                  </div>
                  <Progress value={file.progress} className="h-2 mb-1" />
                  <div className="text-xs text-slate-500">{file.processingStage}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Upload */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Upload Audio Files</h2>
              <CompactUploadZone
                onFilesUploaded={handleFilesUploaded}
                uploadedFiles={audioFiles}
                onRemoveFile={handleRemoveFile}
              />
            </div>
          </div>

          {/* Right Column - Enhancement Settings */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Enhancement Settings</h2>
              <CompactEnhancementSettings
                onEnhance={handleEnhanceFiles}
                isProcessing={isProcessing}
                hasFiles={stats.uploaded > 0}
              />
            </div>
          </div>
        </div>

        {/* Processing Info */}
        <Card className="bg-slate-800/50 border-slate-700 mt-6">
          <CardContent className="p-4">
            <div className="text-center text-sm text-slate-400">
              <p>Files are processed using advanced Web Audio API algorithms</p>
              <p className="text-xs mt-1">Enhanced files are automatically downloaded to your Downloads folder</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
