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
import { AudioFile } from '@/types/audio';
import { ProcessingSettings } from '@/utils/audioProcessor';
import { BarChart3, Settings, Upload, Zap } from 'lucide-react';

interface SpectrumTabsProps {
  audioFiles: AudioFile[];
  enhancedHistory: AudioFile[];
  onFilesUploaded: (files: AudioFile[]) => void;
  onDownload: (file: AudioFile) => void;
  onConvert: (file: AudioFile, targetFormat: 'mp3' | 'wav' | 'flac') => void;
  onDownloadAll: () => void;
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
  onEnhanceFiles,
  eqBands,
  onEQBandChange,
  onResetEQ,
  eqEnabled,
  setEqEnabled
}: SpectrumTabsProps) => {
  const [activeTab, setActiveTab] = useState('spectrum');
  
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

  const handleEnhanceFiles = () => {
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
          Spectrum
        </TabsTrigger>
        <TabsTrigger 
          value="enhance" 
          className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
        >
          <Settings className="h-4 w-4" />
          Enhance
        </TabsTrigger>
      </TabsList>

      <TabsContent value="spectrum" className="space-y-6">
        {/* Upload Section */}
        <Card className="bg-slate-800/50 border-slate-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <Upload className="h-5 w-5" />
              Upload Audio Files
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
          processingSettings={processingSettings}
          onFileInfo={(file) => {
            // TODO: Implement file info modal
            console.log('Show file info for:', file);
          }}
        />
      </TabsContent>

      <TabsContent value="enhance" className="space-y-6">
        {/* Enhanced Header with Presets and Enhance Button */}
        <Card className="bg-slate-800/50 border-slate-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-purple-400 text-lg">
                  <Settings className="h-5 w-5" />
                  Advanced Audio Enhancement
                </CardTitle>
                <p className="text-slate-400 text-sm mt-1">
                  Professional-grade audio processing with 44.1kHz 16-bit default quality
                </p>
              </div>
              <div className="flex items-center gap-4">
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
                <Button
                  onClick={handleEnhanceFiles}
                  disabled={audioFiles.length === 0}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50"
                  size="lg"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Enhance All Files ({audioFiles.length})
                </Button>
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
    </Tabs>
  );
};