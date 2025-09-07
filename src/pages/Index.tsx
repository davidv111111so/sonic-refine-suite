import { useState, useCallback, useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Guide } from '@/components/Guide';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { useFileManagement } from '@/hooks/useFileManagement';
import { useAdvancedAudioProcessing } from '@/hooks/useAdvancedAudioProcessing';
import { useEnhancementHistory } from '@/hooks/useEnhancementHistory';
import { AudioFile, AudioStats } from '@/types/audio';
import { UploadWithConsent } from '@/components/UploadWithConsent';
import { TrackManagementRow } from '@/components/TrackManagementRow';
import { FiveBandEqualizer } from '@/components/FiveBandEqualizer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AnimatedTitle } from '@/components/AnimatedTitle';
import { Music, Download, Package, AlertTriangle } from 'lucide-react';

const Index = () => {
  console.log('Perfect Audio app render started');
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [eqBands, setEqBands] = useState([0, 0, 0, 0, 0]); // 5-band EQ
  const [eqEnabled, setEqEnabled] = useState(true);
  const [currentAudioElement, setCurrentAudioElement] = useState<HTMLAudioElement | null>(null);
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
      // Stop all audio elements
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Stop all audio when tab becomes hidden
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
    
    // Set up processing queue - process one file at a time to prevent crashes
    setProcessingQueue(filesToProcess);
    
    const enhancedSettings = {
      ...settings,
      eqBands: eqBands,
      enableEQ: eqEnabled
    };
    
    // Process files one by one to prevent crashes with delay between files
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
        // Add delay between files to prevent crashes and resource exhaustion
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay
        }

        // Set default processing to WAV 44.1kHz 16-bit as per v2.0 spec
        const defaultSettings = {
          outputFormat: 'wav',
          sampleRate: 44100,
          bitDepth: 16,
          ...enhancedSettings
        };

        // Preserve MP3 format if input is MP3
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
        const enhancedFilename = `${file.name.replace(/\.[^.]+$/, '')}_perfect.${extension}`;
        
        // Auto-download enhanced file
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
          processingStage: 'Perfect Audio enhancement complete - Downloaded!',
          enhancedUrl,
          enhancedSize: enhancedBlob.size
        };

        // Remove from main audioFiles and add to enhanced history
        setAudioFiles(prev => prev.filter(f => f.id !== file.id));
        setEnhancedHistory(prev => {
          const updated = [...prev, enhancedFile];
          return updated.slice(-20); // Keep last 20
        });

        toast({
          title: "Perfect Audio Enhancement Complete!",
          description: `${file.name} has been enhanced and downloaded automatically.`,
        });

        if (notificationsEnabled) {
          new Notification('Perfect Audio - Download Complete', {
            body: `${file.name} has been enhanced and downloaded successfully`,
            icon: '/favicon.ico'
          });
        }

        // Force garbage collection if available
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
      new Notification('Perfect Audio - All Enhancements Complete', {
        body: `${filesToProcess.length} files enhanced and downloaded successfully`,
        icon: '/favicon.ico'
      });
    }
  }, [audioFiles, notificationsEnabled, toast, processAudioFile, addToHistory, setIsProcessing, setAudioFiles, eqBands, eqEnabled]);

  const handleApplyPreset = (presetSettings: any) => {
    if (presetSettings.eqBands) {
      setEqBands(presetSettings.eqBands);
    }
    toast({
      title: "Preset Applied",
      description: "Enhancement settings have been updated with the selected preset.",
    });
  };

  const handleEQBandChange = (bandIndex: number, value: number) => {
    const newEqBands = [...eqBands];
    newEqBands[bandIndex] = value;
    setEqBands(newEqBands);
  };

  const resetEQ = () => {
    setEqBands([0, 0, 0, 0, 0]); // Reset 5-band EQ
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

  const handleDeleteEnhanced = (fileId: string) => {
    setEnhancedHistory(prev => prev.filter(f => f.id !== fileId));
    toast({
      title: "File Deleted",
      description: "Enhanced file has been removed.",
    });
  };

  // Handle file conversion between MP3 and WAV
  const handleConvertFile = async (file: AudioFile, targetFormat: 'mp3' | 'wav') => {
    // This would integrate with conversion endpoints in a real implementation
    toast({
      title: "Conversion Started",
      description: `Converting ${file.name} to ${targetFormat.toUpperCase()}...`,
    });
    
    // Placeholder for actual conversion logic
    console.log(`Converting ${file.name} to ${targetFormat}`);
  };

  // Download all enhanced files as ZIP
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
      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add each enhanced file to the ZIP
      for (const file of readyFiles) {
        if (file.enhancedUrl) {
          const response = await fetch(file.enhancedUrl);
          const blob = await response.blob();
          const extension = file.enhancedUrl.includes('.mp3') ? 'mp3' : 'wav';
          const fileName = `enhanced_${file.name.replace(/\.[^.]+$/, '')}.${extension}`;
          zip.file(fileName, blob);
        }
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `perfect_audio_enhanced_${Date.now()}.zip`;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-black dark:from-gray-900 dark:via-blue-950 dark:to-gray-900 light:from-white light:via-blue-50 light:to-white text-white dark:text-white light:text-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Enhanced Header with Guide Button */}
        <div className="flex items-center justify-between mb-8">
          <AnimatedTitle />
          <div className="flex items-center gap-3">
            <Guide />
            <ThemeToggle />
          </div>
        </div>

        {/* Enhanced Stats */}
        {stats.total > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-900 light:from-white light:to-gray-50 border-slate-600 dark:border-slate-600 light:border-gray-200 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white dark:text-white light:text-gray-900">{stats.total}</div>
                <div className="text-sm text-slate-300 dark:text-slate-300 light:text-gray-600">Total Files</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-600 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.uploaded}</div>
                <div className="text-sm text-blue-100">Ready</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-600 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.processing}</div>
                <div className="text-sm text-yellow-100">Processing</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-600 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.enhanced}</div>
                <div className="text-sm text-green-100">Enhanced</div>
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
                Perfect Audio Processing Status
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

        {/* Single Unified Page - v2.0 */}
        <div className="space-y-8">
          {/* Upload Section with Consent */}
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Music className="h-5 w-5" />
                Upload Audio Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UploadWithConsent onFilesUploaded={handleFilesUploaded} />
            </CardContent>
          </Card>

          {/* Track Management Section */}
          {audioFiles.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <Music className="h-5 w-5" />
                    Track Management ({audioFiles.length} files)
                  </CardTitle>
                  {enhancedHistory.length > 0 && (
                    <Button
                      onClick={handleDownloadAll}
                      className="bg-purple-600 hover:bg-purple-500 text-white"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {audioFiles.map((file) => (
                    <TrackManagementRow
                      key={file.id}
                      file={file}
                      onDownload={handleDownloadEnhanced}
                      onConvert={handleConvertFile}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Files Section */}
          {enhancedHistory.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-purple-400">
                    <Download className="h-5 w-5" />
                    Enhanced Files ({enhancedHistory.length} ready)
                  </CardTitle>
                  <Button
                    onClick={handleDownloadAll}
                    className="bg-purple-600 hover:bg-purple-500 text-white"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {enhancedHistory.map((file) => (
                    <TrackManagementRow
                      key={file.id}
                      file={file}
                      onDownload={handleDownloadEnhanced}
                      onConvert={handleConvertFile}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 5-Band EQ Section */}
          {audioFiles.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-cyan-400">
                  <span className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    5-Band Audio Equalizer
                  </span>
                  <Button
                    onClick={handleEnhanceFiles}
                    disabled={isProcessing || audioFiles.filter(f => f.status === 'uploaded').length === 0}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-6"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Perfect Audio Enhancement'
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FiveBandEqualizer
                  eqBands={eqBands}
                  onEQBandChange={handleEQBandChange}
                  onResetEQ={resetEQ}
                  enabled={eqEnabled}
                  audioElement={currentAudioElement}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Enhanced Processing Info */}
        <Card className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-900 light:from-white light:to-gray-50 border-slate-600 dark:border-slate-600 light:border-gray-200 mt-8 shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-white dark:text-white light:text-gray-900 font-bold text-lg">Perfect Audio - Professional Enhancement Engine</p>
              <p className="text-slate-300 dark:text-slate-300 light:text-gray-600 mt-2">Enhanced files automatically download • Queue processes one-at-a-time for stability</p>
              <div className="flex justify-center gap-6 mt-4 text-sm text-slate-400 dark:text-slate-400 light:text-gray-500">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Advanced Web Audio API
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  One-at-a-time Processing
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  Studio Quality
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Index;
