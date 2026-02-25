import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedAudioEnhancement } from './AdvancedAudioEnhancement';
import { IndividualModeQueue } from './IndividualModeQueue';
import { FiveBandEqualizer } from './FiveBandEqualizer';
import { DynamicOutputSettings } from './DynamicOutputSettings';
import { InteractiveProcessingOptions } from './InteractiveProcessingOptions';
import { AudioFile } from '@/types/audio';
import { ProcessingSettings } from '@/utils/audioProcessor';

interface EnhanceTabContentProps {
    audioFiles: AudioFile[];
    selectedFilesForIndividual: string[];
    processingSettings: ProcessingSettings;
    estimatedTotalSize: number;
    handleEnhanceFiles: () => Promise<void>;
    handleToggleFileForIndividual: (fileId: string) => void;
    handleClearSelectedFiles: () => void;
    eqBands: number[];
    onEQBandChange: (bandIndex: number, value: number) => void;
    onResetEQ: () => void;
    eqEnabled: boolean;
    setEqEnabled: (enabled: boolean) => void;
    handleProcessingSettingChange: (key: keyof ProcessingSettings, value: any) => void;
    handleResetProcessingOptions: () => void;
}

export const EnhanceTabContent: React.FC<EnhanceTabContentProps> = ({
    audioFiles,
    selectedFilesForIndividual,
    processingSettings,
    estimatedTotalSize,
    handleEnhanceFiles,
    handleToggleFileForIndividual,
    handleClearSelectedFiles,
    eqBands,
    onEQBandChange,
    onResetEQ,
    eqEnabled,
    setEqEnabled,
    handleProcessingSettingChange,
    handleResetProcessingOptions,
}) => {
    return (
        <div className="transform scale-90 origin-top w-[111%]">
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
        </div>
    );
};
