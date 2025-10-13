import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UploadWithConsent } from '@/components/UploadWithConsent';
import { EnhancedTrackManagement } from '@/components/enhancement/EnhancedTrackManagement';
import { DynamicOutputSettings } from '@/components/enhancement/DynamicOutputSettings';
import { InteractiveProcessingOptions } from '@/components/enhancement/InteractiveProcessingOptions';
import { FiveBandEqualizer } from '@/components/enhancement/FiveBandEqualizer';
import { EnhancedEQPresets } from '@/components/enhancement/EnhancedEQPresets';
import { FileInfoModal } from '@/components/FileInfoModal';
import { AudioFile } from '@/types/audio';
import { ProcessingSettings } from '@/utils/audioProcessor';
import { BarChart3, Settings, Upload, Zap, Package } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AIMasteringTab } from '@/components/ai-mastering/AIMasteringTab';
interface SpectrumTabsProps {
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
export const SpectrumTabs = ({
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
}: SpectrumTabsProps) => {
  const {
    t,
    language
  } = useLanguage();
  const [activeTab, setActiveTab] = useState('spectrum');
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
    normalizeLevel: -3,
    bassBoost: 0,
    trebleEnhancement: 0,
    compression: 4,
    compressionEnabled: false,
    gainAdjustment: 0,
    stereoWidening: 25,
    stereoWideningEnabled: false,
    eqBands: eqBands,
    enableEQ: eqEnabled
  });
  const handleProcessingSettingChange = (key: keyof ProcessingSettings, value: any) => {
    setProcessingSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const handleResetProcessingOptions = () => {
    setProcessingSettings(prev => ({
      ...prev,
      noiseReduction: 50,
      noiseReductionEnabled: false,
      normalize: true,
      normalizeLevel: -3,
      compression: 4,
      compressionEnabled: false,
      stereoWidening: 25,
      stereoWideningEnabled: false
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
  const handleFilesUploaded = (files: AudioFile[]) => {
    onFilesUploaded(files);
    setActiveTab('enhance');
  };
  const handleEnhanceFiles = async () => {
    if (audioFiles.length >= 2) {
      const message = language === 'ES' ? `¿Desea procesar y descargar ${audioFiles.length} archivos?` : `Do you want to process and download ${audioFiles.length} files?`;
      const userConfirmed = window.confirm(message);
      if (!userConfirmed) {
        return;
      }
    }
    const finalSettings = {
      ...processingSettings,
      eqBands: eqBands,
      enableEQ: eqEnabled
    };
    onEnhanceFiles(finalSettings);
    setActiveTab('spectrum');
  };
  return <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-900 dark:to-black border-2 border-slate-600 dark:border-slate-700 p-1 rounded-xl shadow-xl">
        <TabsTrigger value="spectrum" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:via-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-3xl">
          <BarChart3 className="h-5 w-5" />
          <span className="text-lg text-yellow-200">{t('button.spectrum')}</span>
        </TabsTrigger>
        <TabsTrigger value="enhance" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-pink-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-3xl">
          <Settings className="h-5 w-5" />
          <span className="text-yellow-200 text-lg">{t('button.enhance')}</span>
        </TabsTrigger>
        <TabsTrigger value="ai-mastering" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 data-[state=active]:scale-105 transition-all duration-300 font-bold rounded-3xl">
          <Zap className="h-5 w-5" />
          <span className="text-lg text-yellow-200">AI Mastering</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="spectrum" className="space-y-6">
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
        <EnhancedTrackManagement audioFiles={audioFiles} enhancedHistory={enhancedHistory} onDownload={onDownload} onConvert={onConvert} onDownloadAll={onDownloadAll} onClearDownloaded={onClearDownloaded} onClearAll={onClearAll} processingSettings={processingSettings} onFileInfo={file => {
        setFileInfoModal({
          isOpen: true,
          file
        });
      }} />

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
              {/* Spectrum Button with Thunder Effects */}
              <Button 
                onClick={handleEnhanceFiles} 
                disabled={audioFiles.length === 0} 
                variant="spectrum" 
                size="lg" 
                className="shadow-xl shrink-0 rounded-xl text-4xl relative overflow-hidden group disabled:opacity-50"
              >
                {/* Animated lightning background */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(96,165,250,0.4),transparent_70%)] opacity-0 group-hover:opacity-100 animate-pulse" />
                
                {/* Lightning bolts animation */}
                <div className="absolute -top-2 -left-2 w-1 h-8 bg-gradient-to-b from-cyan-300 to-transparent rotate-12 opacity-0 group-hover:opacity-100 group-hover:animate-[flash_1s_ease-in-out_infinite]" />
                <div className="absolute top-1/2 -right-3 w-1 h-10 bg-gradient-to-b from-purple-300 to-transparent -rotate-12 opacity-0 group-hover:opacity-100 group-hover:animate-[flash_1.2s_ease-in-out_infinite]" />
                <div className="absolute bottom-0 left-1/3 w-1 h-6 bg-gradient-to-b from-blue-300 to-transparent rotate-45 opacity-0 group-hover:opacity-100 group-hover:animate-[flash_0.8s_ease-in-out_infinite]" />
                
                {/* Electric glow effect */}
                <div className="absolute inset-0 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.5)] opacity-0 group-hover:opacity-100 group-hover:animate-pulse" />
                
                {/* Content */}
                <div className="relative z-10 flex items-center">
                  <Zap className="h-6 w-6 mr-2 animate-pulse group-hover:animate-[spin_0.5s_ease-in-out] transition-all" />
                  <span className="text-xl tracking-widest font-black group-hover:text-white transition-colors">SPECTRUM</span>
                  {audioFiles.length > 0 && (
                    <Badge className="ml-3 bg-white/30 text-white border-white/40 px-3 py-0.5 text-sm font-bold group-hover:bg-white/50 transition-colors">
                      {audioFiles.length}
                    </Badge>
                  )}
                </div>
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
                      {Math.round(audioFiles.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024)}MB
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text text-transparent font-bold">→ {language === 'ES' ? 'Después' : 'After'}:</span>
                    <span className="px-2 py-1 bg-green-600/60 rounded-md text-sm font-bold border border-green-400/60 shadow-lg animate-pulse text-neutral-50">
                      ~{Math.round(audioFiles.reduce((acc, file) => acc + file.size, 0) * 1.35 / 1024 / 1024)}MB
                    </span>
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-2 shrink-0">
                <EnhancedEQPresets eqBands={eqBands} onLoadPreset={preset => {
                preset.forEach((value, index) => {
                  onEQBandChange(index, value);
                });
              }} processingSettings={processingSettings} onLoadProcessingSettings={handleLoadProcessingSettings} />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DynamicOutputSettings outputFormat={processingSettings.outputFormat} sampleRate={processingSettings.sampleRate} bitDepth={processingSettings.bitDepth} bitrate={processingSettings.bitrate} onOutputFormatChange={format => handleProcessingSettingChange('outputFormat', format)} onSampleRateChange={rate => handleProcessingSettingChange('sampleRate', rate)} onBitDepthChange={depth => handleProcessingSettingChange('bitDepth', depth)} onBitrateChange={rate => handleProcessingSettingChange('bitrate', rate)} />

          <InteractiveProcessingOptions noiseReduction={processingSettings.noiseReduction} noiseReductionEnabled={processingSettings.noiseReductionEnabled} normalize={processingSettings.normalize} normalizeLevel={processingSettings.normalizeLevel} compression={processingSettings.compression} compressionEnabled={processingSettings.compressionEnabled} stereoWidening={processingSettings.stereoWidening} stereoWideningEnabled={processingSettings.stereoWideningEnabled} onNoiseReductionChange={value => handleProcessingSettingChange('noiseReduction', value)} onNoiseReductionEnabledChange={enabled => handleProcessingSettingChange('noiseReductionEnabled', enabled)} onNormalizeChange={enabled => handleProcessingSettingChange('normalize', enabled)} onNormalizeLevelChange={level => handleProcessingSettingChange('normalizeLevel', level)} onCompressionChange={value => handleProcessingSettingChange('compression', value)} onCompressionEnabledChange={enabled => handleProcessingSettingChange('compressionEnabled', enabled)} onStereoWideningChange={value => handleProcessingSettingChange('stereoWidening', value)} onStereoWideningEnabledChange={enabled => handleProcessingSettingChange('stereoWideningEnabled', enabled)} onReset={handleResetProcessingOptions} />
        </div>

        {/* 5-Band Equalizer */}
        <FiveBandEqualizer eqBands={eqBands} onEQBandChange={onEQBandChange} onResetEQ={onResetEQ} enabled={eqEnabled} onEnabledChange={setEqEnabled} />
      </TabsContent>

      <TabsContent value="ai-mastering" className="space-y-6">
        <AIMasteringTab />
      </TabsContent>
      
      {/* File Info Modal */}
      <FileInfoModal file={fileInfoModal.file} isOpen={fileInfoModal.isOpen} onClose={() => setFileInfoModal({
      isOpen: false,
      file: null
    })} />
    </Tabs>;
};