
import { useState, useRef } from 'react';
import { Play, Pause, Download, Trash2, FileAudio, Volume2, Clock, Music, Image, Waveform, FileCheck, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AudioFile } from '@/pages/Index';
import { AudioWaveform } from './AudioWaveform';
import { AudioComparison } from './AudioComparison';
import { ID3TagEditor } from './ID3TagEditor';
import { AudioAnalysis } from './AudioAnalysis';

interface AudioFileCardProps {
  file: AudioFile;
  onRemove: (fileId: string) => void;
  onUpdate?: (fileId: string, updates: Partial<AudioFile>) => void;
}

export const AudioFileCard = ({ file, onRemove, onUpdate }: AudioFileCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showWaveform, setShowWaveform] = useState(false);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = duration * pos;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleDownload = () => {
    if (file.enhancedUrl) {
      const a = document.createElement('a');
      a.href = file.enhancedUrl;
      // Set the download folder to "So" in the music folder
      a.download = `So/enhanced_${file.name}`;
      a.click();
    }
  };

  const handleUpdateFile = (fileId: string, updates: Partial<AudioFile>) => {
    if (onUpdate) {
      onUpdate(fileId, updates);
    }
    setActiveDialog(null);
  };

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-200">
        <CardHeader className="pb-3">
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
        </CardHeader>

        <CardContent className="space-y-4">
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

          {/* Mini Player with Waveform */}
          {(file.originalUrl || file.enhancedUrl) && (
            <div className="space-y-2">
              <audio 
                ref={audioRef}
                src={file.enhancedUrl || file.originalUrl} 
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                className="hidden"
              />
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePlayPause}
                  className="text-blue-400 hover:text-white p-1 h-8 w-8"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                
                {showWaveform ? (
                  <div className="flex-1">
                    <AudioWaveform 
                      audioUrl={file.enhancedUrl || file.originalUrl || ''} 
                      playing={isPlaying}
                      height={20}
                    />
                  </div>
                ) : (
                  <div 
                    className="h-2 bg-slate-700 rounded-full flex-1 cursor-pointer"
                    onClick={handleSeek}
                  >
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    ></div>
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWaveform(!showWaveform)}
                  className="text-slate-400 hover:text-white p-1 h-8 w-8"
                  title={showWaveform ? "Show progress bar" : "Show waveform"}
                >
                  <Waveform className="h-4 w-4" />
                </Button>
                
                <span className="text-xs text-slate-400 w-16 text-center">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
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

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPause}
              className="text-slate-400 hover:text-white"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 mr-1" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              {isPlaying ? "Pause" : "Play"}
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

          {/* Additional Actions */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveDialog('comparison')}
              className="bg-slate-700 border-slate-600 text-xs text-slate-300 h-8"
              disabled={file.status !== 'enhanced'}
            >
              A/B Compare
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveDialog('tags')}
              className="bg-slate-700 border-slate-600 text-xs text-slate-300 h-8"
            >
              Edit Tags
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveDialog('analysis')}
              className="bg-slate-700 border-slate-600 text-xs text-slate-300 h-8"
            >
              Analysis
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audio Comparison Dialog */}
      <Dialog open={activeDialog === 'comparison'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white">Audio Comparison</DialogTitle>
          </DialogHeader>
          <AudioComparison file={file} />
        </DialogContent>
      </Dialog>

      {/* ID3 Tag Editor Dialog */}
      <Dialog open={activeDialog === 'tags'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit ID3 Tags</DialogTitle>
          </DialogHeader>
          <ID3TagEditor file={file} onUpdate={handleUpdateFile} />
        </DialogContent>
      </Dialog>

      {/* Audio Analysis Dialog */}
      <Dialog open={activeDialog === 'analysis'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Audio Analysis</DialogTitle>
          </DialogHeader>
          <AudioAnalysis file={file} />
        </DialogContent>
      </Dialog>
    </>
  );
};
