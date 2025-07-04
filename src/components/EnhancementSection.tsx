
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompactEnhancementSettings } from '@/components/CompactEnhancementSettings';
import { EnhancementPresets } from '@/components/EnhancementPresets';
import { CustomEQPresets } from '@/components/CustomEQPresets';
import { Music, FileAudio } from 'lucide-react';
import { AudioFile } from '@/types/audio';

interface EnhancementSectionProps {
  audioFiles: AudioFile[];
  onEnhance: (settings: any) => void;
  isProcessing: boolean;
  eqBands: number[];
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
  eqEnabled: boolean;
  onApplyPreset: (settings: any) => void;
  onRemoveFile?: (id: string) => void;
}

export const EnhancementSection = ({
  audioFiles,
  onEnhance,
  isProcessing,
  eqBands,
  onEQBandChange,
  onResetEQ,
  eqEnabled,
  onApplyPreset,
  onRemoveFile
}: EnhancementSectionProps) => {
  const uploadedFiles = audioFiles.filter(f => f.status === 'uploaded');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Enhancement Settings and Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <CompactEnhancementSettings
            onEnhance={onEnhance}
            isProcessing={isProcessing}
            hasFiles={uploadedFiles.length > 0}
            uploadedFiles={uploadedFiles}
            onRemoveFile={onRemoveFile}
          />
        </div>
        
        <div className="space-y-4">
          <EnhancementPresets onApplyPreset={onApplyPreset} />
          <CustomEQPresets 
            currentEQBands={eqBands} 
            onApplyPreset={(eqBands) => onApplyPreset({ eqBands })} 
          />
        </div>
      </div>
    </div>
  );
};
