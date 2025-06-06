
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
  console.log('Perfect Audio app render started');
  
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

  const calculateEstimatedSize = (originalSize: number, settings: any) => {
    let multiplier = 1;
    
    // Sample rate impact
    if (settings.sampleRate > 44100) {
      multiplier *= settings.sampleRate / 44100;
    }
    
    // Bit depth impact
    if (settings.bitDepth === 24) {
      multiplier *= 1.5;
    }
    
    // Format impact
    switch (settings.outputFormat) {
      case 'wav':
        multiplier *= 10; // Uncompressed
        break;
      case 'flac':
        multiplier *= 0.6; // Lossless compression
        break;
      case 'mp3':
      default:
        multiplier *= 0.1; // Compressed
        break;
    }
    
    return Math.round(originalSize * multiplier);
  };

  const handleEnhanceFiles = useCallback(async (settings: any) => {
    setIsProcessing(true);
    const filesToProcess = audioFiles.filter(file => file.status === 'uploaded');
    
    // Show estimated sizes before processing
    filesToProcess.forEach(file => {
      const estimatedSize = calculateEstimatedSize(file.size, settings);
      toast({
        title: "Processing Estimation",
        description: `${file.name}: Estimated output size ~${(estimatedSize / (1024 * 1024)).toFixed(1)}MB`,
      });
    });
    
    for (const file of filesToProcess) {
      setAudioFiles(prev => prev.map(f => 
        f.id === file.id ? { 
          ...f, 
          status: 'processing' as const, 
          progress: 0,
          processingStage: 'Starting enhancement...'
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
        const extension = settings.outputFormat || 'mp3';
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
            processingStage: 'Perfect Audio - Downloaded',
            enhancedUrl,
            enhancedSize: enhancedBlob.size
          } : f
        ));

        toast({
          title: "Perfect Audio Enhancement Complete!",
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
            processingStage: 'Enhancement failed - please try again'
          } : f
        ));

        toast({
          title: "Enhancement failed",
          description: `Failed to process ${file.name}. Please try again with different settings.`,
          variant: "destructive"
        });
      }
    }

    setIsProcessing(false);
    
    if (notificationsEnabled && filesToProcess.length > 0) {
      new Notification('Perfect Audio Enhancement Complete', {
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
        {/* Enhanced Header with Branding */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="relative">
                <AudioWaveform className="h-8 w-8 text-blue-400 animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 bg-blue-400/20 rounded-full animate-ping"></div>
              </div>
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Perfect Audio
              </span>
            </h1>
            <p className="text-slate-300 text-sm ml-11">Professional audio enhancement in your browser</p>
            <div className="absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-xl"></div>
          </div>
          <ThemeToggle />
        </div>

        {/* Enhanced Stats with White Accents */}
        {stats.total > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-white">{stats.total}</div>
                <div className="text-xs text-slate-300">Total Files</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-600 shadow-lg">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-white">{stats.uploaded}</div>
                <div className="text-xs text-blue-100">Ready</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-600 shadow-lg">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-white">{stats.processing}</div>
                <div className="text-xs text-yellow-100">Processing</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-600 shadow-lg">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-white">{stats.enhanced}</div>
                <div className="text-xs text-green-100">Enhanced</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Processing Progress */}
        {processingFiles.length > 0 && (
          <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-slate-600 mb-6 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                Perfect Audio Processing Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {processingFiles.map(file => (
                <div key={file.id} className="mb-3 last:mb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-white truncate font-medium">{file.name}</span>
                    <span className="text-xs text-blue-300 font-bold">{file.progress}%</span>
                  </div>
                  <Progress value={file.progress} className="h-2 mb-1" />
                  <div className="text-xs text-slate-300">{file.processingStage}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Upload */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-400 rounded"></div>
                Upload Audio Files
              </h2>
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
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-blue-400 rounded"></div>
                Enhancement Settings
              </h2>
              <CompactEnhancementSettings
                onEnhance={handleEnhanceFiles}
                isProcessing={isProcessing}
                hasFiles={stats.uploaded > 0}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Processing Info */}
        <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-slate-600 mt-6 shadow-lg">
          <CardContent className="p-4">
            <div className="text-center text-sm">
              <p className="text-white font-medium">Perfect Audio - Professional Enhancement Engine</p>
              <p className="text-slate-300 text-xs mt-1">Enhanced files are automatically downloaded to your Downloads folder</p>
              <div className="flex justify-center gap-4 mt-2 text-xs text-slate-400">
                <span>✓ Advanced Web Audio API</span>
                <span>✓ Real-time Processing</span>
                <span>✓ Studio Quality</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
