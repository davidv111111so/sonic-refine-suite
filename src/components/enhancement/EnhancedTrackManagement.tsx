import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AudioFile } from '@/types/audio';
import { 
  BarChart3, 
  Download, 
  Package, 
  RefreshCw, 
  Loader2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Info,
  Zap
} from 'lucide-react';

interface EnhancedTrackManagementProps {
  audioFiles: AudioFile[];
  enhancedHistory: AudioFile[];
  onDownload: (file: AudioFile) => void;
  onConvert: (file: AudioFile, targetFormat: 'mp3' | 'wav' | 'flac') => void;
  onDownloadAll: () => void;
  onClearDownloaded?: () => void;
  onFileInfo?: (file: AudioFile) => void;
  processingSettings?: { outputFormat?: string };
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileType = (filename: string): 'mp3' | 'wav' | 'flac' | 'other' => {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'mp3') return 'mp3';
  if (ext === 'wav') return 'wav';
  if (ext === 'flac') return 'flac';
  return 'other';
};

const getFileTypeIcon = (fileType: string) => {
  const icons = {
    mp3: '🎵',
    wav: '🎼',
    flac: '💿',
    other: '📄'
  };
  return icons[fileType as keyof typeof icons] || icons.other;
};

export const EnhancedTrackManagement = ({
  audioFiles,
  enhancedHistory,
  onDownload,
  onConvert,
  onDownloadAll,
  onClearDownloaded,
  onFileInfo,
  processingSettings
}: EnhancedTrackManagementProps) => {
  
  const getExpectedOutputFormat = (file: AudioFile) => {
    if (file.status === 'enhanced') return 'WAV'; // Default enhanced format
    if (processingSettings?.outputFormat) {
      return processingSettings.outputFormat.toUpperCase();
    }
    // Default based on file type - preserve MP3, convert others to WAV
    const fileType = getFileType(file.name);
    return fileType === 'mp3' ? 'MP3' : 'WAV';
  };

  const getStatusBadge = (status: AudioFile['status']) => {
    switch (status) {
      case 'uploaded':
        return (
          <Badge className="bg-blue-600 text-white border-blue-500 hover:bg-blue-700 shadow-lg shadow-blue-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Queue
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-orange-600 text-white border-orange-500 hover:bg-orange-700 shadow-lg shadow-orange-500/30">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'enhanced':
        return (
          <Badge className="bg-green-600 text-white border-green-500 hover:bg-green-700 shadow-lg shadow-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-600 text-white border-red-500 hover:bg-red-700 shadow-lg shadow-red-500/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  const getConversionOptions = (file: AudioFile) => {
    const fileType = getFileType(file.name);
    const options = [];
    
    if (fileType === 'mp3') {
      options.push(
        { format: 'wav' as const, label: 'WAV', icon: '🎼' },
        { format: 'flac' as const, label: 'FLAC', icon: '💿' }
      );
    } else if (fileType === 'wav') {
      options.push(
        { format: 'mp3' as const, label: 'MP3', icon: '🎵' },
        { format: 'flac' as const, label: 'FLAC', icon: '💿' }
      );
    } else if (fileType === 'flac') {
      options.push(
        { format: 'mp3' as const, label: 'MP3', icon: '🎵' },
        { format: 'wav' as const, label: 'WAV', icon: '🎼' }
      );
    }
    
    return options;
  };

  const allFiles = [...audioFiles, ...enhancedHistory];
  const hasEnhancedFiles = enhancedHistory.some(file => file.status === 'enhanced');

  if (allFiles.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-600">
        <CardContent className="py-8">
          <div className="text-center text-slate-400">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No tracks uploaded yet</p>
            <p className="text-sm">Upload audio files to see them listed here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-600">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <BarChart3 className="h-5 w-5" />
            Track List ({allFiles.length} files)
          </CardTitle>
            {hasEnhancedFiles && (
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-2">All enhanced files available</p>
              </div>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Enhanced Header Row */}
          <div className="grid grid-cols-6 gap-4 p-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-lg text-sm font-medium text-slate-300 border border-slate-600">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Song Name
            </div>
            <div>File Size</div>
            <div>Status</div>
            <div>Conversion</div>
            <div>File Info</div>
            <div>Download</div>
          </div>
          
          {/* Enhanced Track Rows */}
          {allFiles.map((file) => {
            const fileType = getFileType(file.name);
            const conversionOptions = getConversionOptions(file);
            
            return (
              <div
                key={file.id}
                className="grid grid-cols-6 gap-4 p-4 bg-gradient-to-br from-slate-800/30 to-slate-900/50 border border-slate-600 rounded-lg hover:from-slate-700/40 hover:to-slate-800/60 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
              >
                {/* Song Name with File Type - Fixed Scrollable Title */}
                <div className="flex flex-col min-w-0 max-w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg flex-shrink-0">{getFileTypeIcon(fileType)}</span>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div 
                        className="text-white font-medium break-words"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'break-word',
                          lineHeight: '1.4'
                        }}
                        title={file.name}
                      >
                        {file.name}
                      </div>
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs truncate">{file.artist || 'Unknown Artist'}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs px-2 py-0 bg-slate-700/50 text-slate-300 border-slate-500">
                      {fileType.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* File Size */}
                <div className="flex flex-col justify-center">
                  <span className="text-white text-sm font-mono">
                    {file.status === 'enhanced' && file.enhancedSize 
                      ? (
                        <div>
                          <div className="text-green-400">{formatFileSize(file.enhancedSize)}</div>
                          <div className="text-slate-500 text-xs">orig: {formatFileSize(file.size)}</div>
                        </div>
                      )
                      : formatFileSize(file.size)
                    }
                  </span>
                  <span className="text-xs text-slate-400">/ 100MB max</span>
                </div>

                {/* Status with Progress */}
                <div className="flex flex-col justify-center">
                  {getStatusBadge(file.status)}
                  {file.progress !== undefined && file.status === 'processing' && (
                    <div className="mt-1 w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Conversion Options */}
                <div className="flex flex-col justify-center gap-1">
                  {file.status === 'processing' || file.status === 'enhanced' ? (
                    <div className="text-xs bg-gradient-to-r from-blue-900/30 to-green-900/30 p-2 rounded-md border border-blue-500/30">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="font-medium text-blue-300">Source:</span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0 bg-orange-700/50 text-orange-200 border-orange-500/50 font-medium">
                          {fileType.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-green-300">Output:</span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0 bg-green-700/50 text-green-200 border-green-500/50 font-medium">
                          {getExpectedOutputFormat(file)}
                        </Badge>
                      </div>
                      {file.status === 'enhanced' && file.enhancedSize && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="font-medium text-cyan-300">Size:</span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0 bg-cyan-700/50 text-cyan-200 border-cyan-500/50 font-medium">
                            {formatFileSize(file.enhancedSize)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : conversionOptions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {conversionOptions.map((option) => (
                        <Button
                          key={option.format}
                          variant="outline"
                          size="sm"
                          onClick={() => onConvert(file, option.format)}
                          className="text-xs px-2 py-1 h-7 bg-slate-700 border-slate-500 hover:bg-slate-600 text-white"
                          title={`Convert to ${option.label}`}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">No conversion</span>
                  )}
                </div>

                {/* File Info */}
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onFileInfo?.(file)}
                    className="text-xs bg-slate-700 border-slate-500 hover:bg-slate-600 text-white"
                  >
                    <Info className="h-3 w-3 mr-1" />
                    Info
                  </Button>
                </div>

                {/* Download */}
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={file.status !== 'enhanced'}
                    onClick={() => onDownload(file)}
                    className="text-xs bg-green-700 border-green-500 hover:bg-green-600 text-white disabled:bg-slate-700 disabled:border-slate-500 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        {allFiles.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-600">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-3">
                {/* Download All Button - enabled when 2+ enhanced files */}
                {enhancedHistory.filter(f => f.status === 'enhanced').length >= 2 && (
                  <Button
                    onClick={onDownloadAll}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium shadow-lg"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Download All ({enhancedHistory.filter(f => f.status === 'enhanced').length})
                  </Button>
                )}
                
                {/* Clear Button - enabled when there are enhanced files */}
                {enhancedHistory.length > 0 && onClearDownloaded && (
                  <Button
                    onClick={onClearDownloaded}
                    variant="outline"
                    className="bg-red-600/20 border-red-500 hover:bg-red-600/30 text-red-300 hover:text-red-200"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Clear Downloaded ({enhancedHistory.length})
                  </Button>
                )}
              </div>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-sm text-slate-400">Total Files</div>
                <div className="text-xl font-bold text-white">{allFiles.length}</div>
              </div>
              <div className="bg-blue-700/30 rounded-lg p-3">
                <div className="text-sm text-slate-400">In Queue</div>
                <div className="text-xl font-bold text-blue-400">
                  {allFiles.filter(f => f.status === 'uploaded').length}
                </div>
              </div>
              <div className="bg-orange-700/30 rounded-lg p-3">
                <div className="text-sm text-slate-400">Processing</div>
                <div className="text-xl font-bold text-orange-400">
                  {allFiles.filter(f => f.status === 'processing').length}
                </div>
              </div>
              <div className="bg-green-700/30 rounded-lg p-3">
                <div className="text-sm text-slate-400">Completed</div>
                <div className="text-xl font-bold text-green-400">
                  {allFiles.filter(f => f.status === 'enhanced').length}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};