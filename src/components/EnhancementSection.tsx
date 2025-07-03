
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompactEnhancementSettings } from '@/components/CompactEnhancementSettings';
import { EnhancementPresets } from '@/components/EnhancementPresets';
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
}

export const EnhancementSection = ({
  audioFiles,
  onEnhance,
  isProcessing,
  eqBands,
  onEQBandChange,
  onResetEQ,
  eqEnabled,
  onApplyPreset
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        {/* Uploaded Songs for Enhancement */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Music className="h-5 w-5 text-blue-400" />
              Songs Ready for Enhancement ({uploadedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {uploadedFiles.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded border border-slate-700">
                    <FileAudio className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate font-medium">{file.name}</p>
                      <div className="text-xs text-slate-400">
                        {formatFileSize(file.size)} • Ready for Perfect Audio enhancement
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileAudio className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No songs uploaded yet</p>
                <p className="text-slate-500 text-sm">Upload songs in the Upload tab to enhance them</p>
              </div>
            )}
          </CardContent>
        </Card>

        <CompactEnhancementSettings
          onEnhance={onEnhance}
          isProcessing={isProcessing}
          hasFiles={uploadedFiles.length > 0}
        />
      </div>
      
      <div className="space-y-4">
        <EnhancementPresets onApplyPreset={onApplyPreset} />
      </div>
    </div>
  );
};
