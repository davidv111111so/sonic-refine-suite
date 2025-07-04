
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompactEnhancementSettings } from '@/components/CompactEnhancementSettings';
import { EnhancementPresets } from '@/components/EnhancementPresets';
import { CustomEQPresets } from '@/components/CustomEQPresets';
import { CompactEqualizer } from '@/components/CompactEqualizer';
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
            eqBands={eqBands}
            onEQBandChange={onEQBandChange}
            onResetEQ={onResetEQ}
            eqEnabled={eqEnabled}
          />
        </div>
        
        <div className="space-y-4">
          <EnhancementPresets onApplyPreset={onApplyPreset} />
          
          {/* Compact EQ for Enhancement Preview - Above Custom Presets */}
          {uploadedFiles.length > 0 && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg p-3 border border-slate-600 shadow-lg">
              <h4 className="text-xs font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-wide mb-2">
                Enhancement EQ Preview
              </h4>
              <div className="flex justify-center items-end gap-1 py-2 px-2 border border-slate-600 rounded-lg bg-gradient-to-t from-slate-800/60 to-slate-700/30 backdrop-blur-md shadow-inner">
                {[31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000].map((freq, index) => (
                  <div key={freq} className="flex flex-col items-center group">
                    <div className="h-12 flex items-end justify-center mb-1 relative">
                      <div 
                        className="absolute inset-x-0 bottom-0 rounded-t-lg transition-all duration-500 ease-out"
                        style={{
                          background: `linear-gradient(180deg, 
                            ${['#ff1744', '#ff6d00', '#ffc400', '#76ff03', '#00e676', '#00e5ff', '#3d5afe', '#651fff', '#e91e63', '#ff3d00'][index]}40 0%, 
                            ${['#ff1744', '#ff6d00', '#ffc400', '#76ff03', '#00e676', '#00e5ff', '#3d5afe', '#651fff', '#e91e63', '#ff3d00'][index]}20 50%, 
                            transparent 100%)`,
                          boxShadow: eqBands[index] !== 0 ? `0 0 10px ${['#ff1744', '#ff6d00', '#ffc400', '#76ff03', '#00e676', '#00e5ff', '#3d5afe', '#651fff', '#e91e63', '#ff3d00'][index]}40` : 'none',
                        }}
                      />
                      <div className="relative z-10 w-3">
                        <input
                          type="range"
                          min="-12"
                          max="12"
                          step="0.5"
                          value={eqBands[index]}
                          onChange={(e) => onEQBandChange(index, parseFloat(e.target.value))}
                          className="h-10 w-3 transform -rotate-90 origin-center"
                          style={{
                            background: 'transparent',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="text-xs text-center mb-1 font-bold tracking-wider bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {freq < 1000 ? `${freq}Hz` : `${freq/1000}k`}
                    </div>
                    
                    <div 
                      className="text-xs text-center min-w-6 font-mono bg-slate-900/90 rounded-full px-1 py-0.5 border transition-all duration-300 shadow-lg"
                      style={{
                        color: eqBands[index] !== 0 ? ['#ff1744', '#ff6d00', '#ffc400', '#76ff03', '#00e676', '#00e5ff', '#3d5afe', '#651fff', '#e91e63', '#ff3d00'][index] : '#94a3b8',
                        borderColor: eqBands[index] !== 0 ? ['#ff1744', '#ff6d00', '#ffc400', '#76ff03', '#00e676', '#00e5ff', '#3d5afe', '#651fff', '#e91e63', '#ff3d00'][index] + '60' : '#475569',
                        fontSize: '9px'
                      }}
                    >
                      {eqBands[index] > 0 ? '+' : ''}{eqBands[index]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <CustomEQPresets 
            currentEQBands={eqBands} 
            onApplyPreset={(eqBands) => onApplyPreset({ eqBands })} 
          />
        </div>
      </div>
    </div>
  );
};
