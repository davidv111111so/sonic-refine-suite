import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Guide } from '@/components/Guide';
import { Footer } from '@/components/Footer';
import { LanguageToggle } from '@/components/LanguageToggle';
import { CopyrightNotice } from '@/components/CopyrightNotice';
import { UserHeader } from '@/components/UserHeader';
import { LevelTabs } from '@/components/LevelTabs';
import { IntroAnimation } from '@/components/IntroAnimation';
import { useToast } from '@/hooks/use-toast';
import { useFileManagement } from '@/hooks/useFileManagement';
import { useAdvancedAudioProcessing } from '@/hooks/useAdvancedAudioProcessing';
import { useEnhancementHistory } from '@/hooks/useEnhancementHistory';
import { AudioFile, AudioStats } from '@/types/audio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AnimatedTitle } from '@/components/AnimatedTitle';
import Orb from '@/components/ui/Orb';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import { SubscriptionModal } from '@/components/payment/SubscriptionModal';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [showIntro, setShowIntro] = useState(() => {
    const introShown = sessionStorage.getItem('introShown');
    return !introShown;
  });

  const handleIntroComplete = () => {
    sessionStorage.setItem('introShown', 'true');
    setShowIntro(false);
  };

  console.log('Level app render started');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [eqBands, setEqBands] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]); // 10-band EQ (5 bands mapped to specific indices)
  const [eqEnabled, setEqEnabled] = useState(true);
  const [processingQueue, setProcessingQueue] = useState<AudioFile[]>([]);
  const [enhancedHistory, setEnhancedHistory] = useState<AudioFile[]>([]);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const { toast } = useToast();
  const { addToHistory } = useEnhancementHistory();

  const {
    audioFiles,
    setAudioFiles,
    handleFilesUploaded,
    handleRemoveFile,
    handleUpdateFile,
    handleClearAllFiles
  } = useFileManagement();

  const {
    processAudioFile,
    isProcessing,
    setIsProcessing
  } = useAdvancedAudioProcessing();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Optional cleanup
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

  const handleLogoutCleanup = () => {
    handleClearAllFiles();
    setEnhancedHistory([]);
  };

  const handleEnhanceFiles = useCallback(async (settings: Record<string, any>) => {
    setIsProcessing(true);
    // Filter based on fileIdsToProcess if provided, otherwise process all uploaded files
    let filesToProcess = audioFiles.filter(file => file.status === 'uploaded');
    if (settings.fileIdsToProcess && settings.fileIdsToProcess.length > 0) {
      filesToProcess = filesToProcess.filter(file => settings.fileIdsToProcess.includes(file.id));
    }
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
      setAudioFiles(prev => prev.map(f => f.id === file.id ? {
        ...f,
        status: 'processing' as const,
        progress: 0,
        processingStage: `Processing ${i + 1} of ${filesToProcess.length}...`
      } : f));
      try {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        const defaultSettings: Record<string, any> = {
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
          setAudioFiles(prev => prev.map(f => f.id === file.id ? {
            ...f,
            progress: Math.round(progress),
            processingStage: `${stage} (${i + 1}/${filesToProcess.length})`
          } : f));
        });
        const enhancedUrl = URL.createObjectURL(enhancedBlob);
        const extension = defaultSettings.outputFormat || 'mp3';
        const enhancedFilename = `${file.name.replace(/\.[^.]+$/, '')}_enhanced.${extension}`;
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
          description: `${file.name} is ready for download.`
        });
        if (notificationsEnabled) {
          new Notification('Level - Enhancement Complete', {
            body: `${file.name} is ready for download`,
            icon: '/favicon.ico'
          });
        }

        // Auto-download using FileSaver.js
        saveAs(enhancedBlob, enhancedFilename);

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
        setAudioFiles(prev => prev.map(f => f.id === file.id ? {
          ...f,
          status: 'error' as const,
          processingStage: 'Enhancement failed - please try again'
        } : f));
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
      new Notification('Level - All Enhancements Complete', {
        body: `${filesToProcess.length} files ready for download`,
        icon: '/favicon.ico'
      });
    }
  }, [audioFiles, notificationsEnabled, toast, processAudioFile, addToHistory, setIsProcessing, setAudioFiles, eqBands, eqEnabled]);

  const handleEQBandChange = (bandIndex: number, value: number) => {
    setEqBands(prev => {
      const newEqBands = [...prev];
      newEqBands[bandIndex] = value;
      return newEqBands;
    });
  };

  const resetEQ = () => {
    setEqBands([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  };

  const handleDownloadEnhanced = async (file: AudioFile) => {
    if (file.enhancedUrl) {
      try {
        const response = await fetch(file.enhancedUrl);
        const blob = await response.blob();
        // Default to wav as requested
        const extension = 'wav';
        saveAs(blob, `enhanced_${file.name.replace(/\.[^.]+$/, '')}.${extension}`);
      } catch (error) {
        console.error('Download error:', error);
        toast({
          title: "Download Failed",
          description: "Could not download the file.",
          variant: "destructive"
        });
      }
    }
  };

  const handleConvertFile = async (file: AudioFile, targetFormat: 'mp3' | 'wav' | 'flac') => {
    // Check if format is supported client-side
    if (targetFormat !== 'wav') {
      toast({
        title: "Format Limitation",
        description: `Client-side conversion to ${targetFormat.toUpperCase()} is not currently supported. Converting to WAV instead.`,
        variant: "default"
      });
    }

    toast({
      title: "Conversion Started",
      description: `Converting ${file.name} to WAV...`
    });

    try {
      setIsProcessing(true);

      // Create settings for conversion (neutral settings)
      const conversionSettings = {
        outputFormat: 'wav', // Force WAV for now
        sampleRate: 44100,
        bitDepth: 16,
        noiseReduction: false,
        normalization: false,
        compression: false,
        enableEQ: false,
        stereoWidening: false,
        bassBoost: 0,
        trebleEnhancement: 0
      };

      const convertedBlob = await processAudioFile(file, conversionSettings);

      // Use FileSaver logic ensuring specific filename
      const fileName = `${file.name.replace(/\.[^.]+$/, '')}_converted.wav`;
      saveAs(convertedBlob, fileName);

      toast({
        title: "Conversion Complete",
        description: `${file.name} converted successfully.`
      });

    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion Failed",
        description: `Failed to convert ${file.name}.`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Persistent bulk download with confirmation dialog
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

    // Show confirmation dialog for bulk download
    const confirmed = window.confirm(`¿Desea descargar ${readyFiles.length} archivos?\nDo you want to download ${readyFiles.length} files?`);
    if (!confirmed) {
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
      const zipBlob = await zip.generateAsync({
        type: 'blob'
      });
      saveAs(zipBlob, `level_enhanced_${Date.now()}.zip`);

      toast({
        title: "Download Complete",
        description: `${readyFiles.length} enhanced files downloaded as ZIP.`
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

  // Handle file deletion (from both queues)
  const handleDeleteFile = useCallback((fileId: string) => {
    // Remove from upload/processing queue
    handleRemoveFile(fileId);

    // Remove from enhanced history
    setEnhancedHistory(prev => prev.filter(f => f.id !== fileId));

    toast({
      title: "File removed",
      description: "File has been removed from the list."
    });
  }, [handleRemoveFile, toast]);

  // Clear all files functionality
  const handleClearAll = useCallback(() => {
    if (audioFiles.length === 0 && enhancedHistory.length === 0) {
      toast({
        title: "No files to clear",
        description: "No files found.",
        variant: "destructive"
      });
      return;
    }
    if (window.confirm(`Are you sure you want to remove ALL ${audioFiles.length + enhancedHistory.length} files from the list?`)) {
      handleClearAllFiles();
      setEnhancedHistory([]);
      toast({
        title: "All files cleared",
        description: "All files have been removed from the list."
      });
    }
  }, [audioFiles, enhancedHistory, toast, handleClearAllFiles]);

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
      description: `${downloadedFiles.length} downloaded files have been cleared.`
    });
  }, [enhancedHistory, toast]);

  const stats: AudioStats = {
    total: audioFiles.length + enhancedHistory.length,
    uploaded: audioFiles.filter(f => f.status === 'uploaded').length,
    processing: audioFiles.filter(f => f.status === 'processing').length,
    enhanced: enhancedHistory.length
  };
  const processingFiles = audioFiles.filter(f => f.status === 'processing');

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (showIntro) {
    return <IntroAnimation onComplete={handleIntroComplete} />;
  }

  return (
    <div className="min-h-screen transition-colors duration-300 bg-background relative overflow-hidden">
      {/* Background Orb */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background/80 z-10 pointer-events-none" />
        <Orb
          hue={260}
          hoverIntensity={0.5}
          rotateOnHover={true}
          forceHoverState={false}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <AnimatedTitle />
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsPremiumModalOpen(true)}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white border-0 shadow-lg shadow-amber-900/20 group"
            >
              <Crown className="h-4 w-4 mr-2 group-hover:animate-bounce" />
              Premium
            </Button>
            <UserHeader onLogout={handleLogoutCleanup} />
            <LanguageToggle />
            <Guide />
            <ThemeToggle />
          </div>
        </div>

        {/* Stats */}
        {stats.total > 0 && <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-800 shadow-lg backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-slate-400">Total Files</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-950/30 border-blue-900/50 shadow-lg backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.uploaded}</div>
              <div className="text-sm text-blue-200">Queue</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-950/30 border-orange-900/50 shadow-lg backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.processing}</div>
              <div className="text-sm text-orange-200">Processing</div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-950/30 border-emerald-900/50 shadow-lg backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.enhanced}</div>
              <div className="text-sm text-emerald-200">Completed</div>
            </CardContent>
          </Card>
        </div>}

        {/* Processing Progress */}
        {processingFiles.length > 0 && <Card className="bg-slate-900/80 border-slate-800 mb-6 shadow-lg backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              Level Processing Status
              {processingQueue.length > 0 && <span className="text-sm text-blue-300">({processingQueue.length} in queue)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {processingFiles.map(file => <div key={file.id} className="mb-4 last:mb-0">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white truncate font-medium">{file.name}</span>
                <span className="text-sm text-blue-300 font-bold">{file.progress}%</span>
              </div>
              <Progress value={file.progress} className="h-3 mb-2" />
              <div className="text-sm text-slate-300">{file.processingStage}</div>
            </div>)}
          </CardContent>
        </Card>}

        {/* Main Tabs */}
        <LevelTabs
          audioFiles={audioFiles}
          enhancedHistory={enhancedHistory}
          onFilesUploaded={handleFilesUploaded}
          onDownload={handleDownloadEnhanced}
          onConvert={handleConvertFile}
          onDownloadAll={handleDownloadAll}
          onClearDownloaded={handleClearDownloaded}
          onClearAll={handleClearAll}
          onDelete={handleDeleteFile}
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

      <div className="relative z-10">
        <Footer />
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
      />
    </div>
  );
};

export default Index;