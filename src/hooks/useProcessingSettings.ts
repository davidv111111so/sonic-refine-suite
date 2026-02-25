import { useState } from 'react';
import { ProcessingSettings } from '@/utils/audioProcessor';
import { toast } from 'sonner';

interface UseProcessingSettingsProps {
    initialEqBands: number[];
    eqEnabled: boolean;
    language: string;
}

export const useProcessingSettings = ({ initialEqBands, eqEnabled, language }: UseProcessingSettingsProps) => {
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
        eqBands: initialEqBands,
        enableEQ: eqEnabled
    });

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

    return {
        processingSettings,
        setProcessingSettings,
        handleProcessingSettingChange,
        handleResetProcessingOptions
    };
};
