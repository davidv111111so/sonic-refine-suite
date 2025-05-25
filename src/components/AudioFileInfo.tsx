
import { Volume2, Clock } from 'lucide-react';
import { AudioFile } from '@/pages/Index';

interface AudioFileInfoProps {
  file: AudioFile;
}

export const AudioFileInfo = ({ file }: AudioFileInfoProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Album Artwork - Larger Display */}
      {file.artworkUrl && (
        <div className="flex justify-center mb-4">
          <div className="w-28 h-28 rounded-md overflow-hidden border border-slate-700 shadow-lg">
            <img 
              src={file.artworkUrl} 
              alt="Album artwork" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* File Info */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1 text-slate-400">
          <Volume2 className="h-3 w-3" />
          <span>{formatFileSize(file.size)}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Clock className="h-3 w-3" />
          <span>{file.duration ? `${file.duration}s` : 'Unknown'}</span>
        </div>
      </div>

      {/* Processing Progress */}
      {file.status === 'processing' && (
        <div className="space-y-2">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all"
              style={{ width: `${file.progress || 0}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 text-center">
            Processing... {file.progress || 0}%
          </p>
        </div>
      )}

      {/* Audio Specs */}
      {(file.bitrate || file.sampleRate) && (
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
          {file.bitrate && (
            <div>Bitrate: {file.bitrate} kbps</div>
          )}
          {file.sampleRate && (
            <div>Sample: {file.sampleRate} Hz</div>
          )}
        </div>
      )}
    </div>
  );
};
