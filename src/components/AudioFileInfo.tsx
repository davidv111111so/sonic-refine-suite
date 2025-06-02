import React from 'react';
import { Clock, HardDrive, Zap } from 'lucide-react';
import { AudioFile } from '@/types/audio';

interface AudioFileInfoProps {
  file: AudioFile;
}

export const AudioFileInfo = ({ file }: AudioFileInfoProps) => {
  const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
  const enhancedFileSizeInMB = file.enhancedSize ? (file.enhancedSize / (1024 * 1024)).toFixed(2) : null;

  return (
    <div className="space-y-1 text-sm text-slate-400">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>{file.duration ? `${file.duration.toFixed(2)}s` : 'N/A'}</span>
      </div>
      <div className="flex items-center gap-2">
        <HardDrive className="h-4 w-4" />
        <span>{fileSizeInMB} MB</span>
        {enhancedFileSizeInMB && (
          <>
            <Zap className="h-4 w-4 text-blue-400" />
            <span className="text-blue-300">{enhancedFileSizeInMB} MB</span>
          </>
        )}
      </div>
    </div>
  );
};

