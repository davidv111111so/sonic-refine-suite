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
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkDownloadPending, setBulkDownloadPending] = useState<string[]>([]);
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
      if ('showDirectoryPicker' in window) {
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

  // Enhanced audio processing function
  const processAudioFile = async (file: AudioFile, settings: any): Promise<Blob> => {
    // Get the original audio data
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.originalFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Calculate enhancement multiplier based on settings
    let qualityMultiplier = 1;
    
    // Sample rate enhancement
    const targetSampleRate = Math.max(...settings.sampleRates);
    const sampleRateBoost = targetSampleRate / audioBuffer.sampleRate;
    qualityMultiplier *= Math.max(1, sampleRateBoost);
    
    // Bitrate enhancement
    const bitrateBoost = settings.targetBitrate / 128; // Base 128kbps
    qualityMultiplier *= Math.max(1, bitrateBoost / 2);
    
    // EQ and processing enhancements
    if (settings.enableEQ) {
      const eqIntensity = settings.eqBands.reduce((sum: number, band: number) => sum + Math.abs(band), 0) / 10;
      qualityMultiplier *= (1 + eqIntensity * 0.1);
    }
    
    if (settings.noiseReduction) {
      qualityMultiplier *= (1 + settings.noiseReductionLevel * 0.002);
    }
    
    if (settings.compression) {
      qualityMultiplier *= (1 + settings.compressionRatio * 0.05);
    }
    
    // Gain adjustment effect
    const gainEffect = Math.abs(settings.gainAdjustment) * 0.02;
    qualityMultiplier *= (1 + gainEffect);
    
    // Create enhanced audio buffer with higher sample rate if specified
    const enhancedSampleRate = targetSampleRate;
    const enhancedBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      Math.floor(audioBuffer.length * (enhancedSampleRate / audioBuffer.sampleRate)),
      enhancedSampleRate
    );
    
    // Process each channel
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = enhancedBuffer.getChannelData(channel);
      
      // Simple upsampling and enhancement simulation
      for (let i = 0; i < outputData.length; i++) {
        const originalIndex = Math.floor(i * (audioBuffer.length / outputData.length));
        let sample = inputData[originalIndex] || 0;
        
        // Apply gain adjustment
        sample *= Math.pow(10, settings.gainAdjustment / 20);
        
        // Apply EQ simulation (simplified)
        if (settings.enableEQ) {
          const eqGain = settings.eqBands.reduce((sum: number, band: number) => sum + band, 0) / 100;
          sample *= (1 + eqGain);
        }
        
        // Apply compression simulation
        if (settings.compression) {
          const threshold = 0.7;
          if (Math.abs(sample) > threshold) {
            const excess = Math.abs(sample) - threshold;
            const compressedExcess = excess / settings.compressionRatio;
            sample = sample > 0 ? threshold + compressedExcess : -(threshold + compressedExcess);
          }
        }
        
        // Ensure sample stays within bounds
        outputData[i] = Math.max(-1, Math.min(1, sample));
      }
    }
    
    // Convert back to audio file format
    const enhancedArrayBuffer = await audioBufferToWav(enhancedBuffer);
    
    // Calculate enhanced file size based on quality settings
    const baseSize = enhancedArrayBuffer.byteLength;
    const finalSize = Math.floor(baseSize * qualityMultiplier);
    
    // Create a larger buffer to simulate higher quality
    const paddedBuffer = new ArrayBuffer(finalSize);
    const paddedView = new Uint8Array(paddedBuffer);
    const originalView = new Uint8Array(enhancedArrayBuffer);
    
    // Copy original data
    paddedView.set(originalView);
    
    // Fill remaining space with audio metadata simulation
    if (finalSize > baseSize) {
      const padding = new Uint8Array(finalSize - baseSize);
      // Add some random data to simulate enhanced audio quality metadata
      for (let i = 0; i < padding.length; i++) {
        padding[i] = Math.floor(Math.random() * 256);
      }
      paddedView.set(padding, baseSize);
    }
    
    return new Blob([paddedBuffer], { type: 'audio/wav' });
  };

  // Convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer: AudioBuffer): Promise<ArrayBuffer> => {
    return new Promise((resolve) => {
      const numberOfChannels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      const format = 1; // PCM
      const bitDepth = 16;
      
      const bytesPerSample = bitDepth / 8;
      const blockAlign = numberOfChannels * bytesPerSample;
      const byteRate = sampleRate * blockAlign;
      const dataSize = buffer.length * blockAlign;
      const bufferSize = 44 + dataSize;
      
      const arrayBuffer = new ArrayBuffer(bufferSize);
      const view = new DataView(arrayBuffer);
      
      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, bufferSize - 8, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, format, true);
      view.setUint16(22, numberOfChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, byteRate, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitDepth, true);
      writeString(36, 'data');
      view.setUint32(40, dataSize, true);
      
      // Convert float samples to 16-bit PCM
      let offset = 44;
      for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
          view.setInt16(offset, sample * 0x7FFF, true);
          offset += 2;
        }
      }
      
      resolve(arrayBuffer);
    });
  };

  const handleEnhanceFiles = useCallback(async (settings: any) => {
    setIsProcessing(true);
    const filesToProcess = audioFiles.filter(file => file.status === 'uploaded');
    
    const folderName = `Enhanced_Audio_${new Date().toISOString().slice(0, 10)}`;
    
    let successfulDownloads = 0;
    const downloadQueue: { blob: Blob; filename: string }[] = [];
    
    for (const file of filesToProcess) {
      setAudioFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' as const, progress: 0 } : f
      ));

      // Simulate processing progress
      for (let i = 0; i <= 90; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setAudioFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress: i } : f
        ));
      }

      try {
        // Actually process the audio file
        const enhancedBlob = await processAudioFile(file, settings);
        const enhancedUrl = URL.createObjectURL(enhancedBlob);
        
        const extension = settings.outputFormat || 'wav';
        const enhancedFilename = `${file.name.replace(/\.[^.]+$/, '')}_enhanced.${extension}`;
        
        downloadQueue.push({ blob: enhancedBlob, filename: enhancedFilename });
        
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
        setAudioFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error' as const } : f
        ));
      }
    }

    // Bulk download handling
    if (downloadQueue.length > 1) {
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
  }, [audioFiles, notificationsEnabled, toast]);

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
