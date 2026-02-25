import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LevelTabContent } from './level/LevelTabContent';
import { EnhanceTabContent } from './enhancement/EnhanceTabContent';
import { AudioFile } from '@/types/audio';
import { ProcessingSettings } from '@/utils/audioProcessor';
import { BarChart3, Settings, Zap, Package, Music, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AIMasteringTab } from '@/components/ai-mastering/AIMasteringTab';
import { LevelMediaPlayer } from '@/components/media-player/LevelMediaPlayer';
import { MiniPlayer } from '@/components/media-player/MiniPlayer';
import { StemsTab } from '@/components/stems/StemsTab';
import { toast } from 'sonner';
import { usePlayer } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumBadge, PremiumGate } from '@/components/ui/PremiumBadge';

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
  onDelete,
  onClearAll,
  onEnhanceFiles,
  eqBands,
  onEQBandChange,
  onResetEQ,
  eqEnabled,
  setEqEnabled
}: LevelTabsProps) => {
  const { t, language } = useLanguage();
  const { addToPlaylist, isPlaying } = usePlayer();
  const { isPremium, isAdmin } = useAuth();
  const hasPremiumAccess = isPremium || isAdmin;
  const [activeTab, setActiveTab] = useState('level');
  const [showMiniPlayer, setShowMiniPlayer] = useState(true);
  const [autoPlayFile, setAutoPlayFile] = useState<AudioFile | null>(null);
  const [selectedFilesForIndividual, setSelectedFilesForIndividual] = useState<string[]>([]);

  // Analysis progress state
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Stems/Mastering processing state
  const [isStemsProcessing, setIsStemsProcessing] = useState(false);
  const [isMasteringProcessing, setIsMasteringProcessing] = useState(false);

  // Browser Close Warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isStemsProcessing || isMasteringProcessing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isStemsProcessing, isMasteringProcessing]);

  useEffect(() => {
    if (activeTab === 'media-player') {
      setShowMiniPlayer(true);
    }
  }, [activeTab]);

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

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) return prev;
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
        files.map(async (file) => {
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

          if (keyResult.status === 'fulfilled') harmonicKey = (keyResult.value as any).camelot;
          if (bpmResult.status === 'fulfilled') bpm = (bpmResult.value as any).bpm;

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

      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        onFilesUploaded(filesWithAnalysis);
        addToPlaylist(filesWithAnalysis);
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      toast.error('Analysis error', { id: toastId, description: 'An unexpected error occurred.' });
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

  const handleTabChange = (value: string) => setActiveTab(value);

  const handleStemsComplete = () => {
    if (activeTab !== 'stems') {
      toast.success("Stem Separation Complete!", {
        description: "Your stems are ready.",
        action: {
          label: "View Results",
          onClick: () => setActiveTab('stems')
        }
      });
    }
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full relative z-30">
        <TabsList className="grid w-full h-[60px] grid-cols-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-900 dark:to-black border-2 border-slate-600 dark:border-slate-700 p-1.5 rounded-2xl shadow-xl relative z-50 items-center">
          <TabsTrigger value="level" className="h-full flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:via-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-xl cursor-pointer">
            <BarChart3 className="h-5 w-5" />
            <span className="text-lg text-blue-50">Level</span>
          </TabsTrigger>
          <TabsTrigger value="enhance" className="h-full flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-xl cursor-pointer">
            <Settings className="h-5 w-5" />
            <span className="text-lg text-cyan-50">{t('button.enhance')}</span>
          </TabsTrigger>
          <TabsTrigger value="stems" className="h-full flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-xl cursor-pointer">
            <Package className="h-5 w-5" />
            <span className="text-lg text-indigo-50">Stems</span>
            <PremiumBadge locked={!hasPremiumAccess} />
          </TabsTrigger>
          <TabsTrigger value="ai-mastering" className="h-full flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-xl cursor-pointer">
            <Zap className="h-5 w-5" />
            <span className="text-lg text-cyan-50">AI Mastering</span>
            <PremiumBadge locked={!hasPremiumAccess} />
          </TabsTrigger>
          <TabsTrigger value="media-player" className="h-full flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:via-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-xl cursor-pointer">
            <Music className="h-5 w-5" />
            <span className="text-lg text-green-50">Media Player</span>
          </TabsTrigger>
          <div
            onClick={() => window.open('/mixer', '_blank')}
            className="h-full flex items-center justify-center gap-2 px-4 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl cursor-pointer transition-all duration-300"
            role="button"
            title="Open Mixer Lab in new window"
          >
            <ExternalLink className="h-5 w-5" />
            <span className="text-lg font-bold">Mixer Lab</span>
            <PremiumBadge locked={!hasPremiumAccess} />
          </div>
        </TabsList>

        <TabsContent value="level" className={activeTab !== 'level' ? 'hidden' : ''}>
          <LevelTabContent
            audioFiles={audioFiles}
            enhancedHistory={enhancedHistory}
            isAnalyzing={isAnalyzing}
            analysisProgress={analysisProgress}
            handleFilesUploaded={handleFilesUploaded}
            handlePlayInMediaPlayer={handlePlayInMediaPlayer}
            onDownload={onDownload}
            onDelete={onDelete}
            onClearAll={onClearAll}
            onConvert={onConvert}
          />
        </TabsContent>

        <TabsContent value="enhance" className={activeTab !== 'enhance' ? 'hidden' : ''}>
          <EnhanceTabContent
            audioFiles={audioFiles}
            selectedFilesForIndividual={selectedFilesForIndividual}
            processingSettings={processingSettings}
            estimatedTotalSize={estimatedTotalSize}
            handleEnhanceFiles={handleEnhanceFiles}
            handleToggleFileForIndividual={handleToggleFileForIndividual}
            handleClearSelectedFiles={handleClearSelectedFiles}
            eqBands={eqBands}
            onEQBandChange={onEQBandChange}
            onResetEQ={onResetEQ}
            eqEnabled={eqEnabled}
            setEqEnabled={setEqEnabled}
            handleProcessingSettingChange={handleProcessingSettingChange}
            handleResetProcessingOptions={handleResetProcessingOptions}
          />
        </TabsContent>

        <TabsContent value="stems" forceMount={true} className={activeTab !== 'stems' ? 'hidden' : ''}>
          <PremiumGate isLocked={!hasPremiumAccess} featureName="Stem Separation">
            <StemsTab
              audioFiles={audioFiles}
              onFilesUploaded={handleFilesUploaded}
              isProcessing={isStemsProcessing}
              setIsProcessing={setIsStemsProcessing}
              onComplete={handleStemsComplete}
            />
          </PremiumGate>
        </TabsContent>

        <TabsContent value="ai-mastering" forceMount={true} className={activeTab !== 'ai-mastering' ? 'hidden' : ''}>
          <PremiumGate isLocked={!hasPremiumAccess} featureName="AI Mastering">
            <AIMasteringTab
              isProcessing={isMasteringProcessing}
              setIsProcessing={setIsMasteringProcessing}
            />
          </PremiumGate>
        </TabsContent>

        <TabsContent value="media-player" forceMount={true} className={activeTab !== 'media-player' ? 'hidden' : ''}>
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

      {activeTab !== 'media-player' && isPlaying && showMiniPlayer && (
        <MiniPlayer
          onExpand={() => setActiveTab('media-player')}
          onClose={() => setShowMiniPlayer(false)}
        />
      )}
    </>
  );
};
