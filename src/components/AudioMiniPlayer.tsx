
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AudioWaveform } from './AudioWaveform';
import { AudioFile } from '@/pages/Index';

interface AudioMiniPlayerProps {
  file: AudioFile;
}

export const AudioMiniPlayer = ({ file }: AudioMiniPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showWaveform, setShowWaveform] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  if (!file.originalUrl && !file.enhancedUrl) return null;

  return (
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
          <Activity className="h-4 w-4" />
        </Button>
        
        <span className="text-xs text-slate-400 w-16 text-center">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};
