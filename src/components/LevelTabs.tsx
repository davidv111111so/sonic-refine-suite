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
import { useFileAnalysis } from '@/hooks/useFileAnalysis';
import { useProcessingSettings } from '@/hooks/useProcessingSettings';

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
  const { addToPlaylist, isPlaying, stop } = usePlayer();
  const { isPremium, isAdmin } = useAuth();
  const hasPremiumAccess = isPremium || isAdmin;
  const [activeTab, setActiveTab] = useState('level');
  const [showMiniPlayer, setShowMiniPlayer] = useState(true);
  const [autoPlayFile, setAutoPlayFile] = useState<AudioFile | null>(null);
  const [selectedFilesForIndividual, setSelectedFilesForIndividual] = useState<string[]>([]);

  // Custom Hooks for Modular Logic
  const { isAnalyzing, analysisProgress, handleFilesUploaded } = useFileAnalysis({
    onFilesUploaded,
    addToPlaylist,
    language
  });

  const {
    processingSettings,
    handleProcessingSettingChange,
    handleResetProcessingOptions
  } = useProcessingSettings({
    initialEqBands: eqBands,
    eqEnabled,
    language
  });

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
            className="relative group h-full flex items-center justify-center gap-2 px-4 rounded-xl cursor-pointer transition-all duration-500 hover:bg-slate-800/80 overflow-hidden"
            role="button"
            title="Open Mixer Lab in new window"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <ExternalLink className="h-4 w-4 text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)] group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-black tracking-wide bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(192,132,252,0.4)] group-hover:drop-shadow-[0_0_20px_rgba(192,132,252,0.8)] transition-all duration-300">Mixer Lab</span>
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
          onClose={() => { stop(); setShowMiniPlayer(false); }}
        />
      )}
    </>
  );
};
