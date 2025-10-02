import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadWithConsent } from '@/components/UploadWithConsent';
import { EnhancedTrackManagement } from '@/components/enhancement/EnhancedTrackManagement';
import { DynamicOutputSettings } from '@/components/enhancement/DynamicOutputSettings';
import { InteractiveProcessingOptions } from '@/components/enhancement/InteractiveProcessingOptions';
import { ProfessionalEqualizer } from '@/components/enhancement/ProfessionalEqualizer';
import { EnhancedEQPresets } from '@/components/enhancement/EnhancedEQPresets';
import { FileInfoModal } from '@/components/FileInfoModal';
import { AudioFile } from '@/types/audio';
import { ProcessingSettings } from '@/utils/audioProcessor';
import { BarChart3, Settings, Upload, Zap, Package } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SpectrumTabsProps {
  audioFiles: AudioFile[];
  enhancedHistory: AudioFile[];
  onFilesUploaded: (files: AudioFile[]) => void;
  onDownload: (file: AudioFile) => void;
  onConvert: (file: AudioFile, targetFormat: 'mp3' | 'wav' | 'flac') => void;
  onDownloadAll: () => void;
  onClearDownloaded: () => void;
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
  onEnhanceFiles,
  eqBands,
  onEQBandChange,
  onResetEQ,
  eqEnabled,
  setEqEnabled
}: SpectrumTabsProps) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('spectrum');
  const [fileInfoModal, setFileInfoModal] = useState<{isOpen: boolean, file: AudioFile | null}>({
    isOpen: false,
    file: null
  });
  
  // Processing settings state with default 44.1kHz 16-bit quality
  const [processingSettings, setProcessingSettings] = useState<ProcessingSettings>({
    outputFormat: 'wav',
    sampleRate: 44100, // Default 44.1kHz
    bitDepth: 16, // Default 16-bit
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
    setProcessingSettings(prev => ({ ...prev, [key]: value }));
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
    // Automatically switch to enhance tab after files are uploaded
    setActiveTab('enhance');
  };

  const handleEnhanceFiles = async () => {
    // Show confirmation dialog if 2 or more files
    if (audioFiles.length >= 2) {
      const message = language === 'ES' 
        ? `¿Desea procesar y descargar ${audioFiles.length} archivos?`
        : `Do you want to process and download ${audioFiles.length} files?`;
      
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
    // Automatically switch back to spectrum tab after enhancement starts
    setActiveTab('spectrum');
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-600">
        <TabsTrigger 
          value="spectrum" 
          className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
        >
          <BarChart3 className="h-4 w-4" />
          {t('button.spectrum')}
        </TabsTrigger>
        <TabsTrigger 
          value="enhance" 
          className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
        >
          <Settings className="h-4 w-4" />
          {t('button.enhance')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="spectrum" className="space-y-6">
        {/* Upload Section */}
        <Card className="bg-slate-800/50 border-slate-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <Upload className="h-5 w-5" />
              {t('upload.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UploadWithConsent 
              onFilesUploaded={handleFilesUploaded}
              supportedFormats={['.mp3', '.wav', '.flac']}
              maxFileSize={100 * 1024 * 1024} // 100MB
              maxFiles={20}
            />
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
          processingSettings={processingSettings}
          onFileInfo={(file) => {
            setFileInfoModal({ isOpen: true, file });
          }}
        />

        {/* Download All Button at Bottom */}
        {(enhancedHistory.some(file => file.status === 'enhanced') || audioFiles.some(file => file.status === 'enhanced')) && (
          <div className="flex justify-center pt-4">
              <Button
                onClick={onDownloadAll}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-8 rounded-xl shadow-xl hover:shadow-purple-500/30 transition-all duration-300"
                size="lg"
              >
                <Package className="h-5 w-5 mr-2" />
                {t('button.downloadAll')}
              </Button>
          </div>
        )}
      </TabsContent>

      <TabsContent value="enhance" className="space-y-6">
        {/* Enhanced Header with Controls */}
        <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30 shadow-xl shadow-purple-500/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              {/* Left: Spectrum Button - Main Action Button */}
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleEnhanceFiles}
                  disabled={audioFiles.length === 0}
                  className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 text-white font-bold py-6 px-12 rounded-3xl shadow-2xl hover:shadow-purple-500/60 transition-all duration-300 disabled:opacity-50 border-2 border-white/30 hover:scale-105 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000"
                  size="lg"
                >
                  <Zap className="h-7 w-7 mr-3 animate-pulse drop-shadow-lg" />
                  <span className="text-2xl tracking-widest font-black drop-shadow-lg">SPECTRUM</span>
                  {audioFiles.length > 0 && (
                    <span className="ml-4 bg-white/30 px-4 py-1.5 rounded-full text-base font-bold animate-pulse shadow-lg">
                      {audioFiles.length}
                    </span>
                  )}
                </Button>
              </div>

              {/* Center: Title with Enhanced Output Info */}
              <div className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-purple-300 text-xl font-bold">
                  <Settings className="h-6 w-6" />
                  {t('enhance.title')}
                </CardTitle>
                {/* Enhanced Output Display with Better Styling and Real-time Updates */}
                <div className="flex items-center justify-center gap-4 mt-3 px-6 py-3 bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-green-900/40 rounded-xl border-2 border-purple-500/30 shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-purple-300 font-medium">{language === 'ES' ? 'Entrada' : 'Input'}:</span>
                    <span className="px-2 py-1 bg-purple-700/50 rounded-md text-sm font-bold text-white border border-purple-500/50">
                      {audioFiles.length > 0 ? (audioFiles[0].fileType?.toUpperCase() || audioFiles[0].name.split('.').pop()?.toUpperCase() || 'N/A') : '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-pink-300 font-medium">→ {language === 'ES' ? 'Salida' : 'Output'}:</span>
                    <span className="px-2 py-1 bg-pink-700/50 rounded-md text-sm font-bold text-white border border-pink-500/50">
                      {processingSettings.outputFormat.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-300 font-medium">{t('enhance.quality')}:</span>
                    <span className="px-2 py-1 bg-blue-700/50 rounded-md text-sm font-bold text-white border border-blue-500/50">
                      {processingSettings.sampleRate/1000}kHz {processingSettings.bitDepth}bit
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-300 font-medium">{language === 'ES' ? 'Antes' : 'Before'}:</span>
                    <span className="px-2 py-1 bg-gray-700/50 rounded-md text-sm font-bold text-gray-200 border border-gray-500/50">
                      {Math.round(audioFiles.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024)}MB
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-300 font-medium">→ {language === 'ES' ? 'Después' : 'After'}:</span>
                    <span className="px-2 py-1 bg-green-700/50 rounded-md text-sm font-bold text-green-200 border border-green-500/50 animate-pulse">
                      ~{Math.round(audioFiles.reduce((acc, file) => acc + file.size, 0) * 1.35 / 1024 / 1024)}MB
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Presets */}
              <div className="flex items-center gap-2">
                <EnhancedEQPresets 
                  eqBands={eqBands} 
                  onLoadPreset={(preset) => {
                    preset.forEach((value, index) => {
                      onEQBandChange(index, value);
                    });
                  }}
                  processingSettings={processingSettings}
                  onLoadProcessingSettings={handleLoadProcessingSettings}
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dynamic Output Settings */}
          <DynamicOutputSettings
            outputFormat={processingSettings.outputFormat}
            sampleRate={processingSettings.sampleRate}
            bitDepth={processingSettings.bitDepth}
            bitrate={processingSettings.bitrate}
            onOutputFormatChange={(format) => handleProcessingSettingChange('outputFormat', format)}
            onSampleRateChange={(rate) => handleProcessingSettingChange('sampleRate', rate)}
            onBitDepthChange={(depth) => handleProcessingSettingChange('bitDepth', depth)}
            onBitrateChange={(rate) => handleProcessingSettingChange('bitrate', rate)}
          />

          {/* Interactive Processing Options */}
          <InteractiveProcessingOptions
            noiseReduction={processingSettings.noiseReduction}
            noiseReductionEnabled={processingSettings.noiseReductionEnabled}
            normalize={processingSettings.normalize}
            normalizeLevel={processingSettings.normalizeLevel}
            compression={processingSettings.compression}
            compressionEnabled={processingSettings.compressionEnabled}
            stereoWidening={processingSettings.stereoWidening}
            stereoWideningEnabled={processingSettings.stereoWideningEnabled}
            onNoiseReductionChange={(value) => handleProcessingSettingChange('noiseReduction', value)}
            onNoiseReductionEnabledChange={(enabled) => handleProcessingSettingChange('noiseReductionEnabled', enabled)}
            onNormalizeChange={(enabled) => handleProcessingSettingChange('normalize', enabled)}
            onNormalizeLevelChange={(level) => handleProcessingSettingChange('normalizeLevel', level)}
            onCompressionChange={(value) => handleProcessingSettingChange('compression', value)}
            onCompressionEnabledChange={(enabled) => handleProcessingSettingChange('compressionEnabled', enabled)}
            onStereoWideningChange={(value) => handleProcessingSettingChange('stereoWidening', value)}
            onStereoWideningEnabledChange={(enabled) => handleProcessingSettingChange('stereoWideningEnabled', enabled)}
            onReset={handleResetProcessingOptions}
          />
        </div>

        {/* Professional Equalizer */}
        <ProfessionalEqualizer
          eqBands={eqBands}
          onEQBandChange={onEQBandChange}
          onResetEQ={onResetEQ}
          enabled={eqEnabled}
          onEnabledChange={setEqEnabled}
        />

      </TabsContent>
      
      {/* File Info Modal */}
      <FileInfoModal
        file={fileInfoModal.file}
        isOpen={fileInfoModal.isOpen}
        onClose={() => setFileInfoModal({ isOpen: false, file: null })}
      />
    </Tabs>
  );
};