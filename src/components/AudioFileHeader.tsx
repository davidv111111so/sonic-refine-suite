import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AudioFileActions } from '@/components/AudioFileActions';
import { AudioFile } from '@/types/audio';

interface AudioFileHeaderProps {
  file: AudioFile;
  onRemove: (fileId: string) => void;
  onUpdate: (fileId: string, updates: Partial<AudioFile>) => void;
}

export const AudioFileHeader = ({ file, onRemove, onUpdate }: AudioFileHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <img
          src={file.artworkUrl || '/placeholder-artwork.png'}
          alt={file.title || 'Audio File'}
          className="w-12 h-12 rounded-md mr-4"
          style={{ objectFit: 'cover' }}
        />
        <div>
          <h3 className="text-lg font-semibold text-white">{file.title || file.name}</h3>
          <p className="text-sm text-slate-400">{file.artist || 'Unknown Artist'}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {file.status === 'processing' && (
          <Badge variant="secondary">
            Processing
          </Badge>
        )}
        {file.status === 'enhanced' && (
          <Badge variant="outline">
            Enhanced
          </Badge>
        )}
        {file.status === 'error' && (
          <Badge variant="destructive">
            Error
          </Badge>
        )}
        <AudioFileActions file={file} onRemove={onRemove} onUpdate={onUpdate} />
      </div>
    </div>
  );
};

