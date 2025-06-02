import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { AudioFile } from '@/types/audio';

interface AudioMiniPlayerProps {
  file: AudioFile;
}

export const AudioMiniPlayer = ({ file }: AudioMiniPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error("Playback failed:", error);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, volume, file.enhancedUrl]);

  useEffect(() => {
    const audioElement = audioRef.current;

    const timeUpdateHandler = () => {
      setCurrentTime(audioElement ? audioElement.currentTime : 0);
    };

    const endedHandler = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    if (audioElement) {
      audioElement.addEventListener("timeupdate", timeUpdateHandler);
      audioElement.addEventListener("ended", endedHandler);
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener("timeupdate", timeUpdateHandler);
        audioElement.removeEventListener("ended", endedHandler);
      }
    };
  }, []);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  const handleTimeChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="bg-slate-800/50 border-slate-700 rounded-md p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-white">{file.title}</h4>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon">
            {volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <div className="w-20">
            <Slider
              defaultValue={[volume * 100]}
              onValueChange={handleVolumeChange}
              aria-label="Volume"
              min={0}
              max={100}
              step={1}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{formatTime(currentTime)}</span>
        <span>{file.duration ? formatTime(file.duration) : '0:00'}</span>
      </div>
      <Slider
        defaultValue={[0]}
        max={file.duration || 100}
        step={1}
        value={[currentTime]}
        onValueChange={handleTimeChange}
        aria-label="Track progress"
      />
      <audio src={file.enhancedUrl || file.originalUrl} ref={audioRef} preload="metadata" />
    </div>
  );
};
