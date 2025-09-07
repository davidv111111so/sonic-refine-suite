import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AudioFile } from '@/types/audio';
import { Download, RefreshCw, Loader2 } from 'lucide-react';

interface TrackManagementRowProps {
  file: AudioFile;
  onDownload: (file: AudioFile) => void;
  onConvert: (file: AudioFile, targetFormat: 'mp3' | 'wav') => void;
}

const formatFileSize = (bytes: number) => {
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

export const TrackManagementRow = ({ file, onDownload, onConvert }: TrackManagementRowProps) => {
  const fileType = getFileType(file.name);
  const canConvert = fileType === 'mp3' || fileType === 'wav';

  const getStatusBadge = () => {
    switch (file.status) {
      case 'uploaded':
        return (
          <Badge variant="secondary" className="bg-blue-600 text-white border-blue-500">
            Queued
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-orange-600 text-white border-orange-500">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'enhanced':
        return (
          <Badge variant="outline" className="bg-green-600 text-white border-green-500">
            Ready
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="bg-red-600 text-white border-red-500">
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  const getFileInfo = () => {
    if (file.status === 'enhanced' && file.enhancedSize) {
      return `${formatFileSize(file.size)} / ${formatFileSize(file.enhancedSize)}`;
    }
    return `${formatFileSize(file.size)} / 100MB max`;
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600 rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-200">
      {/* Track Name */}
      <div className="flex-1 min-w-0 mr-4">
        <h3 className="text-white font-medium truncate">{file.name}</h3>
        <p className="text-slate-400 text-sm">{file.artist || 'Unknown Artist'}</p>
      </div>

      {/* Status Indicator */}
      <div className="mr-4">
        {getStatusBadge()}
      </div>

      {/* Conversion Button */}
      <div className="mr-4">
        {canConvert && (
          <Button
            variant="outline"
            size="sm"
            disabled={file.status === 'processing'}
            onClick={() => onConvert(file, fileType === 'mp3' ? 'wav' : 'mp3')}
            className="text-xs bg-slate-700 border-slate-500 hover:bg-slate-600 text-white"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Convert to {fileType === 'mp3' ? 'WAV' : 'MP3'}
          </Button>
        )}
      </div>

      {/* File Info */}
      <div className="mr-4 text-right min-w-[120px]">
        <p className="text-white text-sm font-mono">{getFileInfo()}</p>
      </div>

      {/* Download Button */}
      <div>
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
};