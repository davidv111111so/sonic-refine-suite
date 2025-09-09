import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UploadWithConsent } from '@/components/UploadWithConsent';
import { FiveBandEqualizer } from '@/components/FiveBandEqualizer';
import { EQPresetButtons } from '@/components/EQPresetButtons';
import { AudioFile } from '@/types/audio';
import { BarChart3, Settings, Download, Package, Loader2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface SpectrumTabsProps {
  audioFiles: AudioFile[];
  enhancedHistory: AudioFile[];
  onFilesUploaded: (files: AudioFile[]) => void;
  onDownload: (file: AudioFile) => void;
  onConvert: (file: AudioFile, targetFormat: 'mp3' | 'wav') => void;
  onDownloadAll: () => void;
  onEnhanceFiles: (settings: any) => void;
  eqBands: number[];
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
  eqEnabled: boolean;
  setEqEnabled: (enabled: boolean) => void;
}

const formatFileSizeDisplay = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileType = (filename: string): 'mp3' | 'wav' | 'other' => {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'mp3') return 'mp3';
  if (ext === 'wav') return 'wav';
  return 'other';
};

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
  
  const getStatusBadge = (status: AudioFile['status']) => {
    switch (status) {
      case 'uploaded':
        return (
          <Badge className="bg-blue-600 text-white border-blue-500 hover:bg-blue-700">
            <Clock className="h-3 w-3 mr-1" />
            Queue
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-orange-600 text-white border-orange-500 hover:bg-orange-700">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Enhancing
          </Badge>
        );
      case 'enhanced':
        return (
          <Badge className="bg-green-600 text-white border-green-500 hover:bg-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-600 text-white border-red-500 hover:bg-red-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleLoadPreset = (preset: number[]) => {
    preset.forEach((value, index) => {
      onEQBandChange(index, value);
    });
  };

  const allFiles = [...audioFiles, ...enhancedHistory];
  const hasEnhancedFiles = enhancedHistory.length > 0;

  return (
    <Tabs defaultValue="spectrum" className="w-full">
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
              <BarChart3 className="h-5 w-5" />
              Upload Audio Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div 
                className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-md cursor-pointer bg-slate-700/20 border-slate-500/50 hover:bg-slate-700/40 hover:border-blue-400/50 transition-all duration-200"
              >
                <p className="text-white text-base text-center font-medium mb-1">
                  Drag audio files here or click to select
                </p>
                <p className="text-sm text-slate-300">MP3, WAV (Max 100MB each, 20 files)</p>
              </div>
              
              <Button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = '.mp3,.wav';
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) {
                      const audioFilesList: AudioFile[] = Array.from(files).map(file => ({
                        id: Math.random().toString(36).substring(7),
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        status: 'uploaded' as const,
                        originalFile: file,
                        progress: 0,
                        processingStage: 'Ready for enhancement'
                      }));
                      onFilesUploaded(audioFilesList);
                    }
                  };
                  input.click();
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
              >
                Select Files
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Track List */}
        {allFiles.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <BarChart3 className="h-5 w-5" />
                  Track List ({allFiles.length} files)
                </CardTitle>
                {hasEnhancedFiles && (
                  <Button
                    onClick={onDownloadAll}
                    className="bg-purple-600 hover:bg-purple-500 text-white"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Header Row */}
                <div className="grid grid-cols-5 gap-4 p-3 bg-slate-700/50 rounded-lg text-sm font-medium text-slate-300">
                  <div>Song Name</div>
                  <div>File Size</div>
                  <div>Status</div>
                  <div>Convert</div>
                  <div>Download</div>
                </div>
                
                {/* Track Rows */}
                {allFiles.map((file) => {
                  const fileType = getFileType(file.name);
                  const canConvert = fileType === 'mp3' || fileType === 'wav';
                  
                  return (
                    <div
                      key={file.id}
                      className="grid grid-cols-5 gap-4 p-3 bg-slate-800/50 border border-slate-600 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                    >
                      {/* Song Name */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-medium truncate">{file.name}</span>
                        <span className="text-slate-400 text-xs">{file.artist || 'Unknown Artist'}</span>
                      </div>

                      {/* File Size */}
                      <div className="flex flex-col justify-center">
                        <span className="text-white text-sm font-mono">
                          {file.status === 'enhanced' && file.enhancedSize 
                            ? `${formatFileSizeDisplay(file.enhancedSize)}`
                            : formatFileSizeDisplay(file.size)
                          }
                        </span>
                      </div>

                      {/* Status */}
                      <div className="flex items-center">
                        {getStatusBadge(file.status)}
                      </div>

                      {/* Convert */}
                      <div className="flex items-center">
                        {canConvert && file.status !== 'processing' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onConvert(file, fileType === 'mp3' ? 'wav' : 'mp3')}
                            className="text-xs bg-slate-700 border-slate-500 hover:bg-slate-600 text-white"
                          >
                            {fileType === 'mp3' ? 'To WAV' : 'To MP3'}
                          </Button>
                        )}
                      </div>

                      {/* Download */}
                      <div className="flex items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={file.status !== 'enhanced'}
                          onClick={() => onDownload(file)}
                          className="text-xs bg-green-700 border-green-500 hover:bg-green-600 text-white disabled:bg-slate-700 disabled:border-slate-500 disabled:text-slate-400"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="enhance" className="space-y-6">
        {/* EQ and Settings */}
        <Card className="bg-slate-800/50 border-slate-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <Settings className="h-5 w-5" />
                Audio Enhancement Settings
              </CardTitle>
              <EQPresetButtons 
                eqBands={eqBands} 
                onLoadPreset={handleLoadPreset}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <FiveBandEqualizer
              eqBands={eqBands}
              onEQBandChange={onEQBandChange}
              onResetEQ={onResetEQ}
              enabled={eqEnabled}
            />
            
            <div className="flex justify-center">
              <Button
                onClick={() => onEnhanceFiles({ eqBands, enableEQ: eqEnabled })}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold px-8 py-3"
                disabled={audioFiles.filter(f => f.status === 'uploaded').length === 0}
              >
                <Settings className="h-5 w-5 mr-2" />
                Start Enhancement
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};