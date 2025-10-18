import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Download, Trash2, Clock, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  originalFile: File;
  audioBuffer?: AudioBuffer;
  status: 'loading' | 'ready' | 'processing' | 'error';
  metadata?: {
    duration: number;
    sampleRate: number;
    channels: number;
  };
}

interface TrackListProps {
  tracks: Track[];
  selectedTrackId?: string;
  onTrackSelect: (trackId: string) => void;
  onTrackRemove: (trackId: string) => void;
  onTrackExport: (trackId: string) => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  selectedTrackId,
  onTrackSelect,
  onTrackRemove,
  onTrackExport
}) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusBadge = (status: Track['status']) => {
    switch (status) {
      case 'loading':
        return (
          <Badge variant="secondary" className="bg-blue-600 text-white">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Loading
          </Badge>
        );
      case 'ready':
        return (
          <Badge variant="secondary" className="bg-green-600 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ready
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-orange-600 text-white">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="bg-slate-900/90 dark:bg-black/90 border-slate-700 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Music className="h-5 w-5" />
          Track List ({tracks.length} tracks)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tracks.length === 0 ? (
          <div className="text-center py-8">
            <Music className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No tracks uploaded yet</p>
            <p className="text-sm text-slate-500 mt-2">
              Upload audio files to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header Row */}
            <div className="grid grid-cols-6 gap-4 p-3 bg-slate-700/50 rounded-lg text-sm font-medium text-slate-300">
              <div className="col-span-2">Track Name</div>
              <div>Duration</div>
              <div>Size</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {/* Track Rows */}
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`
                  grid grid-cols-6 gap-4 p-3 rounded-lg border transition-all duration-200 cursor-pointer
                  ${selectedTrackId === track.id 
                    ? 'bg-blue-900/30 border-blue-500/50 shadow-lg' 
                    : 'bg-slate-800/50 border-slate-600 hover:bg-slate-700/50 hover:border-slate-500'
                  }
                `}
                onClick={() => onTrackSelect(track.id)}
              >
                {/* Track Name */}
                <div className="col-span-2 flex flex-col min-w-0">
                  <span className="text-white font-medium truncate">
                    {track.name}
                  </span>
                  {track.metadata && (
                    <span className="text-slate-400 text-xs">
                      {track.metadata.sampleRate}Hz • {track.metadata.channels}ch
                    </span>
                  )}
                </div>

                {/* Duration */}
                <div className="flex items-center">
                  <span className="text-white text-sm">
                    {track.metadata 
                      ? formatDuration(track.metadata.duration)
                      : '--:--'
                    }
                  </span>
                </div>

                {/* Size */}
                <div className="flex items-center">
                  <span className="text-white text-sm">
                    {formatFileSize(track.originalFile.size)}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center">
                  {getStatusBadge(track.status)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTrackExport(track.id);
                    }}
                    disabled={track.status !== 'ready'}
                    className="text-xs bg-green-700 border-green-500 hover:bg-green-600 text-white disabled:bg-slate-700 disabled:border-slate-500 disabled:text-slate-400"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTrackRemove(track.id);
                    }}
                    className="text-xs bg-red-700 border-red-500 hover:bg-red-600 text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};