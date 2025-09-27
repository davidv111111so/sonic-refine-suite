import { useState, useCallback, useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Guide } from '@/components/Guide';
import { Footer } from '@/components/Footer';
import { LanguageToggle } from '@/components/LanguageToggle';
import { CopyrightNotice } from '@/components/CopyrightNotice';
import { SpectrumTabs } from '@/components/SpectrumTabs';
import { useToast } from '@/hooks/use-toast';
import { useFileManagement } from '@/hooks/useFileManagement';
import { useAdvancedAudioProcessing } from '@/hooks/useAdvancedAudioProcessing';
import { useEnhancementHistory } from '@/hooks/useEnhancementHistory';
import { AudioFile, AudioStats } from '@/types/audio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AnimatedTitle } from '@/components/AnimatedTitle';

const Index = () => {
  console.log('Spectrum app render started');
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [eqBands, setEqBands] = useState([0, 0, 0, 0, 0]); // 5-band EQ
  const [eqEnabled, setEqEnabled] = useState(true);
  const [processingQueue, setProcessingQueue] = useState<AudioFile[]>([]);
  const [enhancedHistory, setEnhancedHistory] = useState<AudioFile[]>([]);
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

  // Stop audio when page unloads or user leaves tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
          audio.pause();
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
    
    if (filesToProcess.length === 0) {
      setIsProcessing(false);
      toast({
        title: "No files to process",
        description: "Please upload some audio files first.",
        variant: "destructive"
      });
      return;
    }
    
    setProcessingQueue(filesToProcess);
    
    const enhancedSettings = {
      ...settings,
      eqBands: eqBands,
      enableEQ: eqEnabled
    };
    
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      
      setAudioFiles(prev => prev.map(f => 
        f.id === file.id ? { 
          ...f, 
          status: 'processing' as const, 
          progress: 0,
          processingStage: `Processing ${i + 1} of ${filesToProcess.length}...`
        } : f
      ));

      try {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const defaultSettings = {
          outputFormat: 'wav',
          sampleRate: 44100,
          bitDepth: 16,
          ...enhancedSettings
        };

        const fileExtension = file.name.toLowerCase().split('.').pop();
        if (fileExtension === 'mp3') {
          defaultSettings.outputFormat = 'mp3';
        }

        const enhancedBlob = await processAudioFile(file, defaultSettings, (progress, stage) => {
          setAudioFiles(prev => prev.map(f => 
            f.id === file.id ? { 
              ...f, 
              progress: Math.round(progress),
              processingStage: `${stage} (${i + 1}/${filesToProcess.length})`
            } : f
          ));
        });

        const enhancedUrl = URL.createObjectURL(enhancedBlob);
        const extension = enhancedSettings.outputFormat || 'mp3';
        const enhancedFilename = `${file.name.replace(/\.[^.]+$/, '')}_enhanced.${extension}`;
        
        const a = document.createElement('a');
        a.href = enhancedUrl;
        a.download = enhancedFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        addToHistory({
          fileName: file.name,
          settings: enhancedSettings,
          originalSize: file.size,
          enhancedSize: enhancedBlob.size,
          status: 'success'
        });
        
        const enhancedFile = {
          ...file,
          status: 'enhanced' as const, 
          progress: 100,
          processingStage: 'Enhancement complete - Downloaded!',
          enhancedUrl,
          enhancedSize: enhancedBlob.size
        };

        setAudioFiles(prev => prev.filter(f => f.id !== file.id));
        setEnhancedHistory(prev => {
          const updated = [...prev, enhancedFile];
          return updated.slice(-20);
        });

        toast({
          title: "Enhancement Complete!",
          description: `${file.name} has been enhanced and downloaded automatically.`,
        });

        if (notificationsEnabled) {
          new Notification('Spectrum - Download Complete', {
            body: `${file.name} has been enhanced and downloaded successfully`,
            icon: '/favicon.ico'
          });
        }

        if (window.gc) {
          window.gc();
        }

      } catch (error) {
        console.error('Error processing file:', error);
        
        addToHistory({
          fileName: file.name,
          settings: enhancedSettings,
          originalSize: file.size,
          enhancedSize: 0,
          status: 'error'
        });
        
        setAudioFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'error' as const,
            processingStage: 'Enhancement failed - please try again'
          } : f
        ));

        toast({
          title: "Enhancement failed",
          description: `Failed to process ${file.name}. Please try again.`,
          variant: "destructive"
        });
      }
    }

    setProcessingQueue([]);
    setIsProcessing(false);
    
    if (notificationsEnabled && filesToProcess.length > 0) {
      new Notification('Spectrum - All Enhancements Complete', {
        body: `${filesToProcess.length} files enhanced and downloaded successfully`,
        icon: '/favicon.ico'
      });
    }
  }, [audioFiles, notificationsEnabled, toast, processAudioFile, addToHistory, setIsProcessing, setAudioFiles, eqBands, eqEnabled]);

  const handleEQBandChange = (bandIndex: number, value: number) => {
    const newEqBands = [...eqBands];
    newEqBands[bandIndex] = value;
    setEqBands(newEqBands);
  };

  const resetEQ = () => {
    setEqBands([0, 0, 0, 0, 0]);
  };

  const handleDownloadEnhanced = (file: AudioFile) => {
    if (file.enhancedUrl) {
      const a = document.createElement('a');
      a.href = file.enhancedUrl;
      a.download = `enhanced_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleConvertFile = async (file: AudioFile, targetFormat: 'mp3' | 'wav') => {
    toast({
      title: "Conversion Started",
      description: `Converting ${file.name} to ${targetFormat.toUpperCase()}...`,
    });
    
    console.log(`Converting ${file.name} to ${targetFormat}`);
  };

  const handleDownloadAll = async () => {
    const readyFiles = enhancedHistory.filter(f => f.status === 'enhanced' && f.enhancedUrl);
    
    if (readyFiles.length === 0) {
      toast({
        title: "No files ready",
        description: "No enhanced files are available for download.",
        variant: "destructive"
      });
      return;
    }

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (const file of readyFiles) {
        if (file.enhancedUrl) {
          const response = await fetch(file.enhancedUrl);
          const blob = await response.blob();
          const extension = file.enhancedUrl.includes('.mp3') ? 'mp3' : 'wav';
          const fileName = `enhanced_${file.name.replace(/\.[^.]+$/, '')}.${extension}`;
          zip.file(fileName, blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spectrum_enhanced_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `${readyFiles.length} enhanced files downloaded as ZIP.`,
      });
    } catch (error) {
      console.error('Error creating ZIP:', error);
      toast({
        title: "Download Failed",
        description: "Failed to create ZIP file. Please try downloading files individually.",
        variant: "destructive"
      });
    }
  };

  const stats: AudioStats = {
    total: audioFiles.length + enhancedHistory.length,
    uploaded: audioFiles.filter(f => f.status === 'uploaded').length,
    processing: audioFiles.filter(f => f.status === 'processing').length,
    enhanced: enhancedHistory.length,
  };

  const processingFiles = audioFiles.filter(f => f.status === 'processing');

  // Clear downloaded files functionality
  const handleClearDownloaded = useCallback(() => {
    const downloadedFiles = enhancedHistory.filter(f => f.status === 'enhanced');
    if (downloadedFiles.length === 0) {
      toast({
        title: "No files to clear",
        description: "No downloaded files found.",
        variant: "destructive"
      });
      return;
    }
    
    // Mark all enhanced files as downloaded (simulate download tracking)
    setEnhancedHistory([]);
    toast({
      title: "Files cleared",
      description: `${downloadedFiles.length} downloaded files have been cleared.`,
    });
  }, [enhancedHistory, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-black light:bg-white dark:from-black dark:via-gray-900 dark:to-black text-white light:text-black transition-colors duration-300">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <AnimatedTitle />
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Guide />
            <ThemeToggle />
          </div>
        </div>

        {/* Stats */}
        {stats.total > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-slate-300">Total Files</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-600 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.uploaded}</div>
                <div className="text-sm text-blue-100">Queue</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-900 to-orange-800 border-orange-600 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.processing}</div>
                <div className="text-sm text-orange-100">Processing</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-600 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.enhanced}</div>
                <div className="text-sm text-green-100">Completed</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Processing Progress */}
        {processingFiles.length > 0 && (
          <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-slate-600 mb-6 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                Spectrum Processing Status
                {processingQueue.length > 0 && (
                  <span className="text-sm text-blue-300">({processingQueue.length} in queue)</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {processingFiles.map(file => (
                <div key={file.id} className="mb-4 last:mb-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white truncate font-medium">{file.name}</span>
                    <span className="text-sm text-blue-300 font-bold">{file.progress}%</span>
                  </div>
                  <Progress value={file.progress} className="h-3 mb-2" />
                  <div className="text-sm text-slate-300">{file.processingStage}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <SpectrumTabs
          audioFiles={audioFiles}
          enhancedHistory={enhancedHistory}
          onFilesUploaded={handleFilesUploaded}
          onDownload={handleDownloadEnhanced}
          onConvert={handleConvertFile}
          onDownloadAll={handleDownloadAll}
          onClearDownloaded={handleClearDownloaded}
          onEnhanceFiles={handleEnhanceFiles}
          eqBands={eqBands}
          onEQBandChange={handleEQBandChange}
          onResetEQ={resetEQ}
          eqEnabled={eqEnabled}
          setEqEnabled={setEqEnabled}
        />

        {/* Copyright Notice at Bottom */}
        <div className="mt-8">
          <CopyrightNotice />
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;