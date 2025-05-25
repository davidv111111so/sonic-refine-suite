
import { FileAudio, Music } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AudioFile } from '@/pages/Index';

interface AudioFileHeaderProps {
  file: AudioFile;
}

export const AudioFileHeader = ({ file }: AudioFileHeaderProps) => {
  const getStatusColor = (status: AudioFile['status']) => {
    switch (status) {
      case 'uploaded': return 'bg-blue-600';
      case 'processing': return 'bg-yellow-600';
      case 'enhanced': return 'bg-green-600';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusText = (status: AudioFile['status']) => {
    switch (status) {
      case 'uploaded': return 'Ready';
      case 'processing': return 'Processing';
      case 'enhanced': return 'Enhanced';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {file.artworkUrl ? (
            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
              <img 
                src={file.artworkUrl} 
                alt="Album artwork" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-blue-900/30 rounded flex items-center justify-center flex-shrink-0">
              <FileAudio className="h-5 w-5 text-blue-400" />
            </div>
          )}
          <span className="font-medium text-white truncate" title={file.name}>
            {file.name}
          </span>
        </div>
        <Badge className={`${getStatusColor(file.status)} text-white border-0 flex-shrink-0`}>
          {getStatusText(file.status)}
        </Badge>
      </div>
      {file.artist && (
        <div className="flex items-center gap-2 text-sm text-slate-400 mt-2">
          <Music className="h-3 w-3" />
          <span className="truncate">{file.artist} - {file.title || 'Unknown Title'}</span>
        </div>
      )}
    </>
  );
};
