import { useState, useCallback, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Guide } from '@/components/Guide';
import { Footer } from '@/components/Footer';
import { LanguageToggle } from '@/components/LanguageToggle';
import { CopyrightNotice } from '@/components/CopyrightNotice';
import { UserHeader } from '@/components/UserHeader';
import { LevelTabs } from '@/components/LevelTabs';
import Orb from '@/components/ui/Orb';
import { AnimatedTitle } from '@/components/AnimatedTitle';
import { IntroAnimation } from '@/components/IntroAnimation';
import { useToast } from '@/hooks/use-toast';
import { useFileManagement } from '@/hooks/useFileManagement';
import { useWebWorkerAudioProcessing } from '@/hooks/useWebWorkerAudioProcessing';
import { useEnhancementHistory } from '@/hooks/useEnhancementHistory';
import { AudioFile, AudioStats } from '@/types/audio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Helmet } from 'react-helmet-async';

const Index = () => {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();

  const [showIntro, setShowIntro] = useState(false);

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
  const [sessionMastered, setSessionMastered] = useState(0);
  const [sessionStems, setSessionStems] = useState(0);

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
  } = useWebWorkerAudioProcessing();

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
      console.log(`Processing file ${i + 1}/${filesToProcess.length}: ${file.name}`);
      console.log('Using settings:', enhancedSettings);

      setAudioFiles(prev => prev.map(f => f.id === file.id ? {
        ...f,
        status: 'processing' as const,
        progress: 0,
        processingStage: `Processing ${i + 1} of ${filesToProcess.length}...`
      } : f));

      try {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Ensure we respect the output format from settings, defaulting to wav
        const outputFormat = (enhancedSettings as any).outputFormat || 'wav';

        const processSettings = {
          ...enhancedSettings,
          outputFormat: outputFormat,
          sampleRate: (enhancedSettings as any).sampleRate || 48000,
          bitDepth: (enhancedSettings as any).bitDepth || 16
        };

        const enhancedBlob = await processAudioFile(file, processSettings, (progress, stage) => {
          setAudioFiles(prev => prev.map(f => f.id === file.id ? {
            ...f,
            progress: Math.round(progress),
            processingStage: `${stage} (${i + 1}/${filesToProcess.length})`
          } : f));
        });

        const enhancedUrl = URL.createObjectURL(enhancedBlob);
        const actualExtension = outputFormat.toLowerCase();
        const enhancedFilename = `${file.name.replace(/\.[^.]+$/, '')}_enhanced.${actualExtension}`;
        addToHistory({
          fileName: file.name,
          settings: enhancedSettings,
          originalSize: file.size,
          enhancedSize: enhancedBlob.size,
          status: 'success'
        });
        const enhancedFile = {
          ...file,
          name: enhancedFilename,
          size: enhancedBlob.size,
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
        const fileName = file.name.includes('_enhanced') ? file.name : `enhanced_${file.name.replace(/\.[^.]+$/, '')}.${extension}`;
        saveAs(blob, fileName);
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
          const extension = file.name.split('.').pop() || 'wav';
          const fileName = file.name.includes('_enhanced') ? file.name : `enhanced_${file.name.replace(/\.[^.]+$/, '')}.${extension}`;
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
  const { removeFromPlaylist } = usePlayer();
  const handleDeleteFile = useCallback((fileId: string) => {
    console.log(`🗑️ Deleting file: ${fileId}`);
    // Remove from upload/processing queue
    handleRemoveFile(fileId);

    // Remove from enhanced history
    setEnhancedHistory(prev => prev.filter(f => f.id !== fileId));

    // Also remove from global player playlist
    try {
      removeFromPlaylist(fileId);
    } catch (e) {
      console.warn('Error removing from player playlist:', e);
    }

    toast({
      title: "File removed",
      description: "File has been removed from the list."
    });
  }, [handleRemoveFile, removeFromPlaylist, toast]);

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
    total: audioFiles.length + enhancedHistory.length + sessionMastered + sessionStems,
    uploaded: audioFiles.filter(f => f.status === 'uploaded').length,
    processing: audioFiles.filter(f => f.status === 'processing').length,
    enhanced: enhancedHistory.length,
    mastered: sessionMastered,
    stems: sessionStems,
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
      <Helmet>
        <title>Sonic Refine Suite - Studio Grade Web Audio Processing</title>
        <meta name="description" content="Professional mastering, stem separation, noise reduction, and browser-based precision mixer. Built with modern Web Audio API." />
        <meta name="keywords" content="audio mastering, stem splitting, DJ mixer, web audio API, online audio editor, noise reduction" />
        <meta property="og:title" content="Sonic Refine Suite" />
        <meta property="og:description" content="Studio Grade Web Audio Processing" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://levelaudio.live" />
      </Helmet>

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

      <div className="relative z-10 container mx-auto px-4 py-4 max-w-6xl mb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <AnimatedTitle />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <UserHeader onLogout={handleLogoutCleanup} />
            <LanguageToggle />
            <Guide />
            <ThemeToggle />
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <UserHeader onLogout={handleLogoutCleanup} />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-slate-950/95 border-slate-800 text-white w-[280px] sm:w-[350px]">
                <SheetHeader className="text-left border-b border-slate-800 pb-4 mb-4">
                  <SheetTitle className="text-cyan-400 flex items-center gap-2">
                    Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 py-4">


                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">Settings & info</p>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                        <span className="text-sm font-medium">Appearance</span>
                        <ThemeToggle />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                        <span className="text-sm font-medium">Language</span>
                        <LanguageToggle />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                        <span className="text-sm font-medium">User Guide</span>
                        <Guide />
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>


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

        {/* Storage Notice */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
            <span className="text-slate-400 font-semibold uppercase tracking-wider">Privacy & Storage:</span> Most processing happens locally in your browser. For advanced AI features (Stem Separation & Mastering), files are temporarily processed on our secure servers and stored in encrypted Backblaze B2 buckets for 1 hour before being automatically deleted. We never share or retain your music.
          </p>
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>




      {/* Sticky Bottom Stats Bar */}
      {stats.total > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-xl px-4 py-3 flex justify-center gap-8 md:gap-16 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-white leading-none mb-1">{stats.total}</span>
            <span className="text-[9px] uppercase tracking-[0.15em] font-medium text-slate-500">Total Files</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-blue-400 leading-none mb-1">{stats.uploaded}</span>
            <span className="text-[9px] uppercase tracking-[0.15em] font-medium text-blue-500/70">Queue</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-orange-400 leading-none mb-1">{stats.processing}</span>
            <span className="text-[9px] uppercase tracking-[0.15em] font-medium text-orange-500/70">Processing</span>
          </div>
          <div className="flex flex-col items-center relative">
            {(stats.enhanced + stats.mastered + stats.stems) > 0 && <span className="absolute -top-1 -right-3 h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>}
            <span className="text-lg font-black text-emerald-400 leading-none mb-1">{stats.enhanced + stats.mastered + stats.stems}</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] uppercase tracking-[0.15em] font-medium text-emerald-500/70">Done</span>
              {stats.enhanced > 0 && <span className="text-[8px] px-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">{stats.enhanced}⚡</span>}
              {stats.mastered > 0 && <span className="text-[8px] px-1 rounded bg-purple-500/20 text-purple-400 font-bold">{stats.mastered}🎧</span>}
              {stats.stems > 0 && <span className="text-[8px] px-1 rounded bg-cyan-500/20 text-cyan-400 font-bold">{stats.stems}🎵</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;