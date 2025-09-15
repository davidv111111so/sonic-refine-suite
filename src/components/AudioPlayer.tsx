import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, Volume2, VolumeX } from 'lucide-react';

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

interface AudioPlayerProps {
  track?: Track;
  disabled?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  track,
  disabled = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([0.8]);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioUrlRef = useRef<string>('');

  // Create audio URL when track changes
  useEffect(() => {
    if (track && track.originalFile) {
      // Clean up previous URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      
      // Create new URL
      audioUrlRef.current = URL.createObjectURL(track.originalFile);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrlRef.current;
        audioRef.current.load();
      }
    }

    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [track]);

  // Update duration when metadata loads
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume[0];
    }
  }, [volume, isMuted]);

  const handlePlay = () => {
    if (!audioRef.current || !track) return;
    
    audioRef.current.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    
    const newTime = (value[0] / 100) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="bg-slate-800/50 border-slate-600">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-cyan-400 text-lg">
          <Play className="h-5 w-5" />
          Audio Player
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <audio ref={audioRef} preload="metadata" />
        
        {/* Track Info */}
        <div className="text-center">
          <p className="text-white font-medium truncate">
            {track?.name || 'No track selected'}
          </p>
          <p className="text-slate-400 text-sm">
            {track?.metadata ? `${track.metadata.sampleRate}Hz • ${track.metadata.channels}ch` : '--'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            disabled={!track || disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlay}
            disabled={!track || disabled || isPlaying}
            className="bg-green-700 border-green-500 hover:bg-green-600 text-white disabled:bg-slate-700 disabled:border-slate-500"
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePause}
            disabled={!track || disabled || !isPlaying}
            className="bg-orange-700 border-orange-500 hover:bg-orange-600 text-white disabled:bg-slate-700 disabled:border-slate-500"
          >
            <Pause className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            disabled={!track || disabled}
            className="bg-red-700 border-red-500 hover:bg-red-600 text-white disabled:bg-slate-700 disabled:border-slate-500"
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-white"
          >
            {isMuted || volume[0] === 0 ? 
              <VolumeX className="h-4 w-4" /> : 
              <Volume2 className="h-4 w-4" />
            }
          </Button>
          <Slider
            value={volume}
            onValueChange={setVolume}
            max={1}
            step={0.1}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-8">
            {Math.round(volume[0] * 100)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
};