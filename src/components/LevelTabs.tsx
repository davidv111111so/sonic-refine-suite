import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UploadWithConsent } from '@/components/UploadWithConsent';
import { EnhancedTrackManagement } from '@/components/enhancement/EnhancedTrackManagementUpdated';
import { DynamicOutputSettings } from '@/components/enhancement/DynamicOutputSettings';
import { InteractiveProcessingOptions } from '@/components/enhancement/InteractiveProcessingOptions';
import { FiveBandEqualizer } from '@/components/enhancement/FiveBandEqualizer';
import { AdvancedEQPresetsWithCompensation } from '@/components/enhancement/AdvancedEQPresetsWithCompensation';
import { FileInfoModal } from '@/components/FileInfoModal';
import { AudioFile } from '@/types/audio';
import { ProcessingSettings } from '@/utils/audioProcessor';
import { BarChart3, Settings, Upload, Zap, Package, Music } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { IndividualModeQueue } from '@/components/enhancement/IndividualModeQueue';
import { AIMasteringTab } from '@/components/ai-mastering/AIMasteringTab';
import { LevelMediaPlayer } from '@/components/media-player/LevelMediaPlayer';
import { toast } from 'sonner';

interface LevelTabsProps {
  audioFiles: AudioFile[];
  enhancedHistory: AudioFile[];
  onFilesUploaded: (files: AudioFile[]) => void;
  onDownload: (file: AudioFile) => void;
  onConvert: (file: AudioFile, targetFormat: 'mp3' | 'wav' | 'flac') => void;
  onDownloadAll: () => void;
  onClearDownloaded: () => void;
  onClearAll: () => void;
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
  onEnhanceFiles,
  eqBands,
  onEQBandChange,
  onResetEQ,
  eqEnabled,
  setEqEnabled
}: LevelTabsProps) => {
  const {
    t,
    language
  } = useLanguage();
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

  // Processing settings state with default 44.1kHz 16-bit quality
  const [processingSettings, setProcessingSettings] = useState<ProcessingSettings>({
    outputFormat: 'wav',
    sampleRate: 44100,
    bitDepth: 16,
    bitrate: 320,
    noiseReduction: 50,
    noiseReductionEnabled: false,
    normalize: true,
    normalizeLevel: -0.3, // Default to -0.3dB as per specs
    bassBoost: 0,
    trebleEnhancement: 0,
    compression: 4,
    compressionEnabled: false,
    compressionThreshold: -3, // Default threshold (ideal range: -1 to -3 dB)
    compressionRatio: '2:1', // Default ratio
    gainAdjustment: 0,
    stereoWidening: 25,
    stereoWideningEnabled: false,
    batchMode: false, // Default to individual mode
    eqBands: eqBands,
    enableEQ: eqEnabled
  });

  const handlePlayInMediaPlayer = (file: AudioFile) => {
    setAutoPlayFile(file);
    setActiveTab('media-player');
  };

  // Calculate estimated total output size based on format and settings
  const estimatedTotalSize = useMemo(() => {
    if (audioFiles.length === 0) return 0;

    // Determine which files to calculate for
    const filesToCalculate = processingSettings.batchMode
      ? audioFiles
      : audioFiles.filter(file => selectedFilesForIndividual.includes(file.id));

    if (filesToCalculate.length === 0) return 0;

    const totalDuration = filesToCalculate.reduce((acc, file) => acc + (file.duration || 0), 0);
    const channels = 2;
    const format = processingSettings.outputFormat.toLowerCase();

    let estimated = 0;

    switch (format) {
      case 'wav': {
        // WAV: Uncompressed PCM
        estimated = (processingSettings.sampleRate * processingSettings.bitDepth * channels * totalDuration) / 8;
        break;
      }
      case 'mp3': {
        // MP3: Compressed audio based on bitrate
        const bitrate = processingSettings.bitrate || 320;
        estimated = (bitrate * 1000 * totalDuration) / 8;
        break;
      }
      case 'flac': {
        // FLAC: Lossless compression (typically 60% of WAV size)
        const wavSize = (processingSettings.sampleRate * processingSettings.bitDepth * channels * totalDuration) / 8;
        estimated = wavSize * 0.6;
        break;
      }
      default:
        // Unknown format: use original size
        estimated = filesToCalculate.reduce((acc, file) => acc + file.size, 0);
    }

    // Add small overhead for headers/metadata
    return Math.round(estimated * 1.015);
  }, [audioFiles, selectedFilesForIndividual, processingSettings.batchMode, processingSettings.outputFormat, processingSettings.sampleRate, processingSettings.bitDepth, processingSettings.bitrate]);

  const handleProcessingSettingChange = (key: keyof ProcessingSettings, value: any) => {
    setProcessingSettings(prev => {
      const newSettings = { ...prev, [key]: value };

      // Show notification when switching to batch mode
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
  const handleLoadProcessingSettings = (settings: ProcessingSettings) => {
    setProcessingSettings(settings);
    if (settings.eqBands) {
      settings.eqBands.forEach((value, index) => {
        onEQBandChange(index, value);
      });
    }
    setEqEnabled(settings.enableEQ);
  };
  const handleFilesUploaded = async (files: AudioFile[]) => {
    // Limit to 5 files at a time for optimal performance
    if (files.length > 5) {
      toast.error('Please upload maximum 5 files at a time for optimal performance');
      return;
    }

    // Show analyzing toast
    const toastId = toast.loading(`Analyzing ${files.length} file${files.length > 1 ? 's' : ''}...`, {
      description: 'Detecting BPM and key signatures',
    });

    // Detect key and BPM for each file
    const { detectKeyFromFile } = await import('@/utils/keyDetector');
    const { detectBPMFromFile } = await import('@/utils/bpmDetector');

    const filesWithAnalysis = await Promise.all(
      files.map(async (file, idx) => {
        let harmonicKey = 'N/A';
        let bpm: number | undefined = undefined;

        console.log(`\n📝 [${idx + 1}/${files.length}] Starting analysis for: ${file.name}`);

        // Process BPM and Key in parallel with 5-second timeouts
        const [keyResult, bpmResult] = await Promise.allSettled([
          // Key detection with timeout
          Promise.race([
            detectKeyFromFile(file.originalFile),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Key timeout')), 5000))
          ]),
          // BPM detection with timeout
          Promise.race([
            detectBPMFromFile(file.originalFile),
            new Promise((_, reject) => setTimeout(() => reject(new Error('BPM timeout')), 5000))
          ])
        ]);

        // Assign results
        if (keyResult.status === 'fulfilled') {
          const keyAnalysis = keyResult.value as any;
          harmonicKey = keyAnalysis.camelot;
          console.log(`✅ Key detected: ${harmonicKey} for ${file.name}`);
        } else {
          console.warn(`⚠️ Key detection failed for ${file.name}:`, keyResult.reason);
        }

        if (bpmResult.status === 'fulfilled') {
          const bpmAnalysis = bpmResult.value as any;
          bpm = bpmAnalysis.bpm;
          console.log(`✅ BPM detected: ${bpm} for ${file.name}`);
        } else {
          console.warn(`⚠️ BPM detection failed for ${file.name}:`, bpmResult.reason);
        }

        return {
          ...file,
          harmonicKey,
          bpm
        };
      })
    );

    // Update toast with detailed success info
    const detectedBPM = filesWithAnalysis.filter(f => f.bpm).length;
    const detectedKey = filesWithAnalysis.filter(f => f.harmonicKey && f.harmonicKey !== 'N/A').length;

    if (detectedKey === 0 && detectedBPM === 0) {
      toast.error('Analysis failed', {
        id: toastId,
        description: 'Could not detect BPM or Key. Check console for details.',
      });
    } else if (detectedKey < files.length || detectedBPM < files.length) {
      toast.warning('Analysis partially complete', {
        id: toastId,
        description: `BPM: ${detectedBPM}/${files.length} • Key: ${detectedKey}/${files.length}`,
      });
    } else {
      toast.success('Analysis complete!', {
        id: toastId,
        description: `BPM: ${detectedBPM}/${files.length} • Key: ${detectedKey}/${files.length}`,
      });
    }

    onFilesUploaded(filesWithAnalysis);
    // Stay on Level tab - removed auto-navigation
  };

  const handleToggleFileForIndividual = (fileId: string) => {
    setSelectedFilesForIndividual(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  const handleClearSelectedFiles = () => {
    setSelectedFilesForIndividual([]);
  };

  const handleEnhanceFiles = async () => {
    // Check if we should process selected files or all files
    const filesToProcess = processingSettings.batchMode
      ? audioFiles
      : audioFiles.filter(file => selectedFilesForIndividual.includes(file.id));

    if (filesToProcess.length === 0) {
      const message = language === 'ES'
        ? 'Por favor seleccione al menos un archivo para procesar en modo individual'
        : 'Please select at least one file to process in individual mode';
      toast.error(message);
      return;
    }

    if (filesToProcess.length >= 2) {
      const message = language === 'ES'
        ? `¿Desea procesar y descargar ${filesToProcess.length} archivos?`
        : `Do you want to process and download ${filesToProcess.length} files?`;
      const userConfirmed = window.confirm(message);
      if (!userConfirmed) {
        return;
      }
    }

    const finalSettings = {
      ...processingSettings,
      eqBands: eqBands,
      enableEQ: eqEnabled,
      fileIdsToProcess: filesToProcess.map(f => f.id) // Add specific file IDs to process
    };

    console.log("🚀 Enhancing files with settings:", finalSettings);
    onEnhanceFiles(finalSettings);
    setActiveTab('level');
    toast.success(language === 'ES' ? 'Procesamiento iniciado' : 'Processing started');
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-900 dark:to-black border-2 border-slate-600 dark:border-slate-700 p-1 rounded-xl shadow-xl">
          <TabsTrigger value="level" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:via-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-3xl">
            <BarChart3 className="h-5 w-5" />
            <span className="text-lg text-blue-50">Level</span>
          </TabsTrigger>
          <TabsTrigger value="enhance" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-3xl">
            <Settings className="h-5 w-5" />
            <span className="text-lg text-cyan-50">{t('button.enhance')}</span>
          </TabsTrigger>
          <TabsTrigger value="ai-mastering" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-3xl">
            <Zap className="h-5 w-5" />
            <span className="text-lg text-cyan-50">AI Mastering</span>
          </TabsTrigger>
          <TabsTrigger value="media-player" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:via-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-3xl">
            <Music className="h-5 w-5" />
            <span className="text-lg text-green-50">Media Player</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="level" className="space-y-6">
          {/* Upload Section */}
          <Card className="bg-slate-900/90 dark:bg-black/90 border-slate-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-500">
                <Upload className="h-5 w-5" />
                {t('upload.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UploadWithConsent onFilesUploaded={handleFilesUploaded} supportedFormats={['.mp3', '.wav', '.flac']} maxFileSize={100 * 1024 * 1024} maxFiles={20} />
            </CardContent>
          </Card>

          {/* Enhanced Track Management */}
          <EnhancedTrackManagement
            audioFiles={audioFiles}
            enhancedHistory={enhancedHistory}
            onDownload={onDownload}
            onConvert={onConvert}
            onDownloadAll={onDownloadAll}
            onClearDownloaded={onClearDownloaded}
            onClearAll={onClearAll}
            onPlayInMediaPlayer={handlePlayInMediaPlayer}
            processingSettings={processingSettings}
            onFileInfo={file => {
              setFileInfoModal({
                isOpen: true,
                file
              });
            }}
          />

          {/* Bottom Action Buttons - Always visible when there are files */}
          {(audioFiles.length > 0 || enhancedHistory.length > 0) && <div className="flex justify-center gap-4 pt-6">
            {enhancedHistory.filter(f => f.status === 'enhanced').length >= 2 && <Button onClick={onDownloadAll} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-xl hover:shadow-green-500/30 transition-all duration-300" size="lg">
              <Package className="h-5 w-5 mr-2" />
              Download All ({enhancedHistory.filter(f => f.status === 'enhanced').length})
            </Button>}

            {enhancedHistory.length > 0 && <Button onClick={onClearDownloaded} variant="outline" className="border-2 border-red-500 text-red-300 hover:bg-red-600/20 dark:border-red-600 dark:hover:bg-red-700/20 font-bold py-3 px-8 rounded-xl transition-all duration-300" size="lg">
              Clear Downloaded ({enhancedHistory.length})
            </Button>}
          </div>}
        </TabsContent>

        <TabsContent value="enhance" className="space-y-6">
          {/* Enhanced Header */}
          <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 dark:from-purple-950/40 dark:to-blue-950/40 border-purple-400/40 shadow-xl shadow-purple-500/20">
            <CardHeader className="pb-4 bg-gray-800">
              <div className="flex items-center justify-between gap-4">
                {/* Level Button */}
                <Button onClick={handleEnhanceFiles} disabled={audioFiles.length === 0} variant="spectrum" size="lg" className="shadow-xl shrink-0 rounded-xl text-4xl">
                  <Zap className="h-6 w-6 mr-2 animate-pulse" />
                  <span className="text-xl tracking-widest font-black">LEVEL</span>
                  {!processingSettings.batchMode && selectedFilesForIndividual.length > 0 ? (
                    <Badge className="ml-3 bg-cyan-400 text-black border-cyan-300 px-3 py-0.5 text-sm font-bold animate-pulse">
                      {selectedFilesForIndividual.length} Selected
                    </Badge>
                  ) : audioFiles.length > 0 && (
                    <Badge className="ml-3 bg-white/30 text-white border-white/40 px-3 py-0.5 text-sm font-bold">
                      {audioFiles.length}
                    </Badge>
                  )}
                </Button>

                {/* Center Info */}
                <div className="flex-1 text-center">
                  <CardTitle className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent text-2xl font-black mb-3 drop-shadow-lg">
                    <Settings className="h-6 w-6 text-purple-300" />
                    {t('enhance.title')}
                  </CardTitle>
                  <div className="flex items-center justify-center gap-4 px-6 py-3 bg-gradient-to-r from-purple-800/60 via-blue-800/60 to-green-800/60 dark:from-purple-900/70 dark:via-blue-900/70 dark:to-green-900/70 rounded-xl border-2 border-purple-400/50 shadow-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent font-bold">{language === 'ES' ? 'Entrada' : 'Input'}:</span>
                      <span className="px-2 py-1 bg-purple-600/60 rounded-md text-sm font-bold border border-purple-400/60 shadow-lg text-neutral-50">
                        {audioFiles.length > 0 ? audioFiles[0].fileType?.toUpperCase() || audioFiles[0].name.split('.').pop()?.toUpperCase() || 'N/A' : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gradient-to-r from-pink-200 to-purple-200 bg-clip-text text-transparent font-bold">→ {language === 'ES' ? 'Salida' : 'Output'}:</span>
                      <span className="px-2 py-1 bg-pink-600/60 rounded-md text-sm font-bold border border-pink-400/60 shadow-lg text-neutral-50">
                        {processingSettings.outputFormat.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent font-bold">{t('enhance.quality')}:</span>
                      <span className="px-2 py-1 bg-blue-600/60 rounded-md text-sm font-bold border border-blue-400/60 shadow-lg text-neutral-50">
                        {processingSettings.sampleRate / 1000}kHz {processingSettings.bitDepth}bit
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gradient-to-r from-slate-200 to-gray-200 bg-clip-text text-transparent font-bold">{language === 'ES' ? 'Antes' : 'Before'}:</span>
                      <span className="px-2 py-1 bg-gray-600/60 rounded-md text-sm font-bold border border-gray-400/60 shadow-lg text-neutral-50">
                        {(() => {
                          const filesToShow = processingSettings.batchMode
                            ? audioFiles
                            : audioFiles.filter(file => selectedFilesForIndividual.includes(file.id));
                          const totalSize = filesToShow.reduce((acc, file) => acc + file.size, 0);
                          return Math.round(totalSize / 1024 / 1024);
                        })()}MB
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text text-transparent font-bold">→ {language === 'ES' ? 'Después' : 'After'}:</span>
                      <span className="px-2 py-1 bg-green-600/60 rounded-md text-sm font-bold border border-green-400/60 shadow-lg animate-pulse text-neutral-50">
                        {estimatedTotalSize > 0 ? `~${Math.round(estimatedTotalSize / 1024 / 1024)}MB` : '0MB'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Removed redundant presets - now only in Equalizer component */}
              </div>
            </CardHeader>
          </Card>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DynamicOutputSettings outputFormat={processingSettings.outputFormat} sampleRate={processingSettings.sampleRate} bitDepth={processingSettings.bitDepth} bitrate={processingSettings.bitrate} onOutputFormatChange={format => handleProcessingSettingChange('outputFormat', format)} onSampleRateChange={rate => handleProcessingSettingChange('sampleRate', rate)} onBitDepthChange={depth => handleProcessingSettingChange('bitDepth', depth)} onBitrateChange={rate => handleProcessingSettingChange('bitrate', rate)} />

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

          {/* Individual Mode Queue Selection */}
          {!processingSettings.batchMode && audioFiles.length > 0 && (
            <IndividualModeQueue
              files={audioFiles}
              selectedFiles={selectedFilesForIndividual}
              onToggleFile={handleToggleFileForIndividual}
              onClearAll={handleClearSelectedFiles}
            />
          )}

          {/* 5-Band Equalizer */}
          <FiveBandEqualizer eqBands={eqBands} onEQBandChange={onEQBandChange} onResetEQ={onResetEQ} enabled={eqEnabled} onEnabledChange={setEqEnabled} />
        </TabsContent>

        <TabsContent value="ai-mastering" className="space-y-6">
          <AIMasteringTab />
        </TabsContent>

        <TabsContent value="media-player" className="space-y-6">
          <LevelMediaPlayer
            files={[...audioFiles, ...enhancedHistory]}
            onFilesAdded={handleFilesUploaded}
            onFileDelete={(fileId) => {
              toast.success('File removed from player');
            }}
            autoPlayFile={autoPlayFile}
            onAutoPlayComplete={() => setAutoPlayFile(null)}
          />
        </TabsContent>
      </Tabs>

      {/* File Info Modal */}
      {fileInfoModal.isOpen && fileInfoModal.file && (
        <FileInfoModal
          file={fileInfoModal.file}
          isOpen={fileInfoModal.isOpen}
          onClose={() => setFileInfoModal({ isOpen: false, file: null })}
        />
      )}
    </>
  );
};