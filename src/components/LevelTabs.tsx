import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LevelUpload } from '@/components/level/LevelUpload';
import { LevelTrackList } from '@/components/level/LevelTrackList';
import { DynamicOutputSettings } from '@/components/enhancement/DynamicOutputSettings';
import { InteractiveProcessingOptions } from '@/components/enhancement/InteractiveProcessingOptions';
import { FiveBandEqualizer } from '@/components/enhancement/FiveBandEqualizer';
import { AdvancedAudioEnhancement } from '@/components/enhancement/AdvancedAudioEnhancement';
import { FileInfoModal } from '@/components/FileInfoModal';
import { AudioFile } from '@/types/audio';
import { ProcessingSettings } from '@/utils/audioProcessor';
import { BarChart3, Settings, Upload, Zap, Package, Music } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { IndividualModeQueue } from '@/components/enhancement/IndividualModeQueue';
import { AIMasteringTab } from '@/components/ai-mastering/AIMasteringTab';
import { LevelMediaPlayer } from '@/components/media-player/LevelMediaPlayer';
import { StemsTab } from '@/components/stems/StemsTab';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface LevelTabsProps {
  audioFiles: AudioFile[];
  enhancedHistory: AudioFile[];
  onFilesUploaded: (files: AudioFile[]) => void;
  onDownload: (file: AudioFile) => void;
  onConvert: (file: AudioFile, targetFormat: 'mp3' | 'wav' | 'flac') => void;
  onDownloadAll: () => void;
  onClearDownloaded: () => void;
  onClearAll: () => void;
  onDelete: (fileId: string) => void;
  onEnhanceFiles: (settings: ProcessingSettings) => void;
  eqBands: number[];
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
  eqEnabled: boolean;
  setEqEnabled: (enabled: boolean) => void;
}

export const LevelTabs = ({
  audioFiles,
  enhancedHistory,
  onFilesUploaded,
  onDownload,
  onConvert,
  onDownloadAll,
  onClearDownloaded,
  onClearAll,
  onDelete,
  onEnhanceFiles,
  eqBands,
  onEQBandChange,
  onResetEQ,
  eqEnabled,
  setEqEnabled
}: LevelTabsProps) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('level');
  const [autoPlayFile, setAutoPlayFile] = useState<AudioFile | null>(null);
  const [selectedFilesForIndividual, setSelectedFilesForIndividual] = useState<string[]>([]);
  const [fileInfoModal, setFileInfoModal] = useState<{
    isOpen: boolean;
    file: AudioFile | null;
  }>({
    isOpen: false,
    file: null
  });

  // Analysis progress state
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Processing settings state
  const [processingSettings, setProcessingSettings] = useState<ProcessingSettings>({
    outputFormat: 'wav',
    sampleRate: 44100,
    bitDepth: 16,
    bitrate: 320,
    noiseReduction: 50,
    noiseReductionEnabled: false,
    normalize: true,
    normalizeLevel: -0.3,
    bassBoost: 0,
    trebleEnhancement: 0,
    compression: 4,
    compressionEnabled: false,
    compressionThreshold: -3,
    compressionRatio: '2:1',
    gainAdjustment: 0,
    stereoWidening: 25,
    stereoWideningEnabled: false,
    batchMode: false,
    eqBands: eqBands,
    enableEQ: eqEnabled
  });

  const handlePlayInMediaPlayer = (file: AudioFile) => {
    setAutoPlayFile(file);
    setActiveTab('media-player');
  };

  // Calculate estimated total output size
  const estimatedTotalSize = useMemo(() => {
    if (audioFiles.length === 0) return 0;

    const filesToCalculate = processingSettings.batchMode
      ? audioFiles
      : audioFiles.filter(file => selectedFilesForIndividual.includes(file.id));

    if (filesToCalculate.length === 0) return 0;

    const totalDuration = filesToCalculate.reduce((acc, file) => acc + (file.duration || 0), 0);
    const totalOriginalSize = filesToCalculate.reduce((acc, file) => acc + file.size, 0);

    if (totalDuration === 0) {
      const format = processingSettings.outputFormat.toLowerCase();
      if (format === 'wav') return totalOriginalSize * 10;
      if (format === 'flac') return totalOriginalSize * 6;
      return totalOriginalSize;
    }

    const channels = 2;
    const format = processingSettings.outputFormat.toLowerCase();
    let estimated = 0;

    switch (format) {
      case 'wav':
        estimated = (processingSettings.sampleRate * processingSettings.bitDepth * channels * totalDuration) / 8;
        break;
      case 'mp3':
        const bitrate = processingSettings.bitrate || 320;
        estimated = (bitrate * 1000 * totalDuration) / 8;
        break;
      case 'flac':
        const wavSize = (processingSettings.sampleRate * processingSettings.bitDepth * channels * totalDuration) / 8;
        estimated = wavSize * 0.6;
        break;
      default:
        estimated = totalOriginalSize;
    }

    return Math.round(estimated * 1.015);
  }, [audioFiles, selectedFilesForIndividual, processingSettings]);

  const handleProcessingSettingChange = (key: keyof ProcessingSettings, value: any) => {
    setProcessingSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      if (key === 'batchMode' && value === true && prev.batchMode === false) {
        toast.info(language === 'ES' ? 'Modo por Lotes Activado' : 'Batch Mode Activated', {
          description: language === 'ES'
            ? 'Todos los archivos serán procesados con la misma configuración'
            : 'All files will be processed with the same settings'
        });
      }
      return newSettings;
    });
  };

  const handleResetProcessingOptions = () => {
    setProcessingSettings(prev => ({
      ...prev,
      noiseReduction: 50,
      noiseReductionEnabled: false,
      normalize: true,
      normalizeLevel: -0.3,
      compression: 4,
      compressionEnabled: false,
      compressionThreshold: -3,
      compressionRatio: '2:1',
      stereoWidening: 25,
      stereoWideningEnabled: false,
      batchMode: false
    }));
  };

  const handleFilesUploaded = async (files: AudioFile[]) => {
    if (files.length > 5) {
      toast.error('Please upload maximum 5 files at a time for optimal performance');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Start simulated progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) return prev; // Cap at 90% until actually done
        // Slow down as we get closer to 90%
        const increment = prev < 50 ? 2 : prev < 80 ? 1 : 0.5;
        return Math.min(prev + increment, 90);
      });
    }, 100);

    const toastId = toast.loading(`Analyzing ${files.length} file${files.length > 1 ? 's' : ''}...`, {
      description: 'Detecting BPM and key signatures',
    });

    try {
      const { detectKeyFromFile } = await import('@/utils/keyDetector');
      const { detectBPMFromFile } = await import('@/utils/bpmDetector');

      const filesWithAnalysis = await Promise.all(
        files.map(async (file, idx) => {
          let harmonicKey = 'N/A';
          let bpm: number | undefined = undefined;

          const [keyResult, bpmResult] = await Promise.allSettled([
            Promise.race([
              detectKeyFromFile(file.originalFile),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Key timeout')), 5000))
            ]),
            Promise.race([
              detectBPMFromFile(file.originalFile),
              new Promise((_, reject) => setTimeout(() => reject(new Error('BPM timeout')), 5000))
            ])
          ]);

          if (keyResult.status === 'fulfilled') {
            harmonicKey = (keyResult.value as any).camelot;
          }
          if (bpmResult.status === 'fulfilled') {
            bpm = (bpmResult.value as any).bpm;
          }

          return { ...file, harmonicKey, bpm };
        })
      );

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      const detectedBPM = filesWithAnalysis.filter(f => f.bpm).length;
      const detectedKey = filesWithAnalysis.filter(f => f.harmonicKey && f.harmonicKey !== 'N/A').length;

      if (detectedKey === 0 && detectedBPM === 0) {
        toast.error('Analysis failed', { id: toastId, description: 'Could not detect BPM or Key.' });
      } else {
        toast.success('Analysis complete!', { id: toastId, description: `BPM: ${detectedBPM}/${files.length} • Key: ${detectedKey}/${files.length}` });
      }

      // Small delay to let user see 100%
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        onFilesUploaded(filesWithAnalysis);
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      toast.error('Analysis error', { id: toastId, description: 'An unexpected error occurred.' });
      console.error(error);
    }
  };

  const handleToggleFileForIndividual = (fileId: string) => {
    setSelectedFilesForIndividual(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const handleClearSelectedFiles = () => setSelectedFilesForIndividual([]);

  const handleEnhanceFiles = async () => {
    const filesToProcess = processingSettings.batchMode
      ? audioFiles
      : audioFiles.filter(file => selectedFilesForIndividual.includes(file.id));

    if (filesToProcess.length === 0) {
      toast.error(language === 'ES' ? 'Seleccione al menos un archivo' : 'Please select at least one file');
      return;
    }

    const finalSettings = {
      ...processingSettings,
      eqBands: eqBands,
      enableEQ: eqEnabled,
      fileIdsToProcess: filesToProcess.map(f => f.id)
    };

    onEnhanceFiles(finalSettings);
    setSelectedFilesForIndividual([]);
    setActiveTab('level');
    toast.success(language === 'ES' ? 'Procesamiento iniciado' : 'Processing started');
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative z-30">
        <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-900 dark:to-black border-2 border-slate-600 dark:border-slate-700 p-1 rounded-xl shadow-xl relative z-50">
          <TabsTrigger value="level" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:via-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-3xl cursor-pointer">
            <BarChart3 className="h-5 w-5" />
            <span className="text-lg text-blue-50">Level</span>
          </TabsTrigger>
          <TabsTrigger value="enhance" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-3xl cursor-pointer">
            <Settings className="h-5 w-5" />
            <span className="text-lg text-cyan-50">{t('button.enhance')}</span>
          </TabsTrigger>
          <TabsTrigger value="stems" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-3xl cursor-pointer">
            <Package className="h-5 w-5" />
            <span className="text-lg text-indigo-50">Stems</span>
          </TabsTrigger>
          <TabsTrigger value="ai-mastering" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-3xl cursor-pointer">
            <Zap className="h-5 w-5" />
            <span className="text-lg text-cyan-50">AI Mastering</span>
          </TabsTrigger>
          <TabsTrigger value="media-player" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:via-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-3xl cursor-pointer">
            <Music className="h-5 w-5" />
            <span className="text-lg text-green-50">Media Player</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="level" className={`space-y-8 ${activeTab !== 'level' ? 'hidden' : ''}`}>
          <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-5xl mx-auto">
            <div className="w-full mb-8 space-y-4">
              <LevelUpload onFilesUploaded={handleFilesUploaded} />
              {isAnalyzing && (
                <div className="w-full max-w-md mx-auto space-y-2 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Analyzing audio...</span>
                    <span>{analysisProgress}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-2" />
                </div>
              )}
            </div>
            <div className="w-full">
              <LevelTrackList
                files={[...audioFiles, ...enhancedHistory]}
                onPlay={handlePlayInMediaPlayer}
                onDownload={onDownload}
                onDelete={onDelete}
                onClearAll={onClearAll}
                onConvert={onConvert}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="enhance" className={`space-y-6 ${activeTab !== 'enhance' ? 'hidden' : ''}`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left Column: Main Controls */}
            <div className="lg:col-span-2 space-y-6">
              <AdvancedAudioEnhancement
                audioFiles={processingSettings.batchMode ? audioFiles : audioFiles.filter(f => selectedFilesForIndividual.includes(f.id))}
                processingSettings={processingSettings}
                estimatedTotalSize={estimatedTotalSize}
                onEnhance={handleEnhanceFiles}
                isProcessing={false}
              />

              {!processingSettings.batchMode && audioFiles.length > 0 && (
                <IndividualModeQueue
                  files={audioFiles}
                  selectedFiles={selectedFilesForIndividual}
                  onToggleFile={handleToggleFileForIndividual}
                  onClearAll={handleClearSelectedFiles}
                />
              )}

              <FiveBandEqualizer
                eqBands={eqBands}
                onEQBandChange={onEQBandChange}
                onResetEQ={onResetEQ}
                enabled={eqEnabled}
                onEnabledChange={setEqEnabled}
              />
            </div>

            {/* Right Column: Settings & Actions */}
            <div className="space-y-6 flex flex-col h-full">
              <div className="space-y-6 flex-1">
                <Card className="bg-slate-900/90 border-slate-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold text-slate-200">Output Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DynamicOutputSettings
                      outputFormat={processingSettings.outputFormat}
                      sampleRate={processingSettings.sampleRate}
                      bitDepth={processingSettings.bitDepth}
                      bitrate={processingSettings.bitrate}
                      onOutputFormatChange={format => handleProcessingSettingChange('outputFormat', format)}
                      onSampleRateChange={rate => handleProcessingSettingChange('sampleRate', rate)}
                      onBitDepthChange={depth => handleProcessingSettingChange('bitDepth', depth)}
                      onBitrateChange={rate => handleProcessingSettingChange('bitrate', rate)}
                    />
                  </CardContent>
                </Card>

                <InteractiveProcessingOptions
                  noiseReduction={processingSettings.noiseReduction}
                  noiseReductionEnabled={processingSettings.noiseReductionEnabled}
                  normalize={processingSettings.normalize}
                  normalizeLevel={processingSettings.normalizeLevel}
                  compression={processingSettings.compression}
                  compressionEnabled={processingSettings.compressionEnabled}
                  compressionThreshold={processingSettings.compressionThreshold}
                  compressionRatio={processingSettings.compressionRatio}
                  stereoWidening={processingSettings.stereoWidening}
                  stereoWideningEnabled={processingSettings.stereoWideningEnabled}
                  batchMode={processingSettings.batchMode}
                  onNoiseReductionChange={value => handleProcessingSettingChange('noiseReduction', value)}
                  onNoiseReductionEnabledChange={enabled => handleProcessingSettingChange('noiseReductionEnabled', enabled)}
                  onNormalizeChange={enabled => handleProcessingSettingChange('normalize', enabled)}
                  onNormalizeLevelChange={level => handleProcessingSettingChange('normalizeLevel', level)}
                  onCompressionChange={value => handleProcessingSettingChange('compression', value)}
                  onCompressionEnabledChange={enabled => handleProcessingSettingChange('compressionEnabled', enabled)}
                  onCompressionThresholdChange={value => handleProcessingSettingChange('compressionThreshold', value)}
                  onCompressionRatioChange={ratio => handleProcessingSettingChange('compressionRatio', ratio)}
                  onStereoWideningChange={value => handleProcessingSettingChange('stereoWidening', value)}
                  onStereoWideningEnabledChange={enabled => handleProcessingSettingChange('stereoWideningEnabled', enabled)}
                  onBatchModeChange={enabled => handleProcessingSettingChange('batchMode', enabled)}
                  onReset={handleResetProcessingOptions}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stems" className={`space-y-6 ${activeTab !== 'stems' ? 'hidden' : ''}`}>
          <StemsTab audioFiles={audioFiles} onFilesUploaded={onFilesUploaded} />
        </TabsContent>

        <TabsContent value="ai-mastering" className={`space-y-6 ${activeTab !== 'ai-mastering' ? 'hidden' : ''}`}>
          <AIMasteringTab />
        </TabsContent>

        <TabsContent value="media-player" className={`space-y-6 ${activeTab !== 'media-player' ? 'hidden' : ''}`}>
          <LevelMediaPlayer
            files={[...audioFiles, ...enhancedHistory]}
            onFilesAdded={handleFilesUploaded}
            onFileDelete={onDelete}
            autoPlayFile={autoPlayFile}
            onAutoPlayComplete={() => setAutoPlayFile(null)}
            onClearAll={onClearAll}
          />
        </TabsContent>
      </Tabs >

      {
        fileInfoModal.isOpen && fileInfoModal.file && (
          <FileInfoModal
            file={fileInfoModal.file}
            isOpen={fileInfoModal.isOpen}
            onClose={() => setFileInfoModal({ isOpen: false, file: null })}
          />
        )
      }
    </>
  );
};