
import { useState } from 'react';
import { Play, Pause, Download, Trash2, FileAudio, Volume2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AudioFile } from '@/pages/Index';

interface AudioFileCardProps {
  file: AudioFile;
  onRemove: (fileId: string) => void;
}

export const AudioFileCard = ({ file, onRemove }: AudioFileCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // Here you would implement actual audio playback
  };

  const handleDownload = () => {
    if (file.enhancedUrl) {
      const a = document.createElement('a');
      a.href = file.enhancedUrl;
      a.download = `enhanced_${file.name}`;
      a.click();
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileAudio className="h-5 w-5 text-blue-400 flex-shrink-0" />
            <span className="font-medium text-white truncate" title={file.name}>
              {file.name}
            </span>
          </div>
          <Badge className={`${getStatusColor(file.status)} text-white border-0 flex-shrink-0`}>
            {getStatusText(file.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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
            <Progress value={file.progress || 0} className="h-2" />
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

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayPause}
            className="text-slate-400 hover:text-white"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <div className="flex items-center gap-1">
            {file.status === 'enhanced' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-green-400 hover:text-green-300"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(file.id)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
