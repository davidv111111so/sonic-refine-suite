
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { AudioFile } from '@/types/audio';

interface AudioComparisonProps {
  originalUrl: string | undefined;
  enhancedUrl: string | undefined;
  filename: string;
}

export const AudioComparison = ({ originalUrl, enhancedUrl, filename }: AudioComparisonProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [currentAudio, setCurrentAudio] = useState<'original' | 'enhanced'>('original');
  const originalAudioRef = useRef<HTMLAudioElement>(null);
  const enhancedAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const updateProgress = () => {
      if (originalAudioRef.current && enhancedAudioRef.current) {
        const currentTime = currentAudio === 'original' ? originalAudioRef.current.currentTime : enhancedAudioRef.current.currentTime;
        const duration = currentAudio === 'original' ? originalAudioRef.current.duration : enhancedAudioRef.current.duration;
        setProgress(duration ? (currentTime / duration) * 100 : 0);
      }
    };

    const intervalId = setInterval(updateProgress, 100);
    return () => clearInterval(intervalId);
  }, [currentAudio]);

  useEffect(() => {
    if (originalAudioRef.current) {
      originalAudioRef.current.volume = volume;
    }
    if (enhancedAudioRef.current) {
      enhancedAudioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (originalAudioRef.current && enhancedAudioRef.current) {
      if (isPlaying) {
        originalAudioRef.current.pause();
        enhancedAudioRef.current.pause();
      } else {
        if (currentAudio === 'original') {
          originalAudioRef.current.play();
          enhancedAudioRef.current.pause();
        } else {
          enhancedAudioRef.current.play();
          originalAudioRef.current.pause();
        }
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (originalAudioRef.current) {
      originalAudioRef.current.volume = newVolume;
    }
    if (enhancedAudioRef.current) {
      enhancedAudioRef.current.volume = newVolume;
    }
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (originalAudioRef.current && enhancedAudioRef.current) {
      const progressBar = event.currentTarget;
      const clickPosition = event.clientX - progressBar.getBoundingClientRect().left;
      const newProgress = clickPosition / progressBar.offsetWidth;

      const duration = currentAudio === 'original' ? originalAudioRef.current.duration : enhancedAudioRef.current.duration;
      const newTime = newProgress * duration;

      if (currentAudio === 'original') {
        originalAudioRef.current.currentTime = newTime;
      } else {
        enhancedAudioRef.current.currentTime = newTime;
      }
      setProgress(newProgress * 100);
    }
  };

  const handleAudioSwitch = (audioType: 'original' | 'enhanced') => {
    setCurrentAudio(audioType);
    setIsPlaying(false);
    setProgress(0);

    if (originalAudioRef.current && enhancedAudioRef.current) {
      originalAudioRef.current.pause();
      enhancedAudioRef.current.pause();
      originalAudioRef.current.currentTime = 0;
      enhancedAudioRef.current.currentTime = 0;
    }
  };

  const handleRestart = () => {
    if (originalAudioRef.current && enhancedAudioRef.current) {
      originalAudioRef.current.currentTime = 0;
      enhancedAudioRef.current.currentTime = 0;
      setProgress(0);
      if (isPlaying) {
        if (currentAudio === 'original') {
          originalAudioRef.current.play();
        } else {
          enhancedAudioRef.current.play();
        }
      }
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-white">{filename} Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant={currentAudio === 'original' ? 'default' : 'secondary'} onClick={() => handleAudioSwitch('original')} className="cursor-pointer">
            Original
          </Badge>
          <Badge variant={currentAudio === 'enhanced' ? 'default' : 'secondary'} onClick={() => handleAudioSwitch('enhanced')} className="cursor-pointer">
            Enhanced
          </Badge>
        </div>

        <div className="relative">
          <audio
            ref={originalAudioRef}
            src={originalUrl}
            onEnded={() => setIsPlaying(false)}
            style={{ display: 'none' }}
          />
          <audio
            ref={enhancedAudioRef}
            src={enhancedUrl}
            onEnded={() => setIsPlaying(false)}
            style={{ display: 'none' }}
          />
          <div
            className="h-2 bg-slate-600 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={handleRestart}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            {volume === 0 ? (
              <VolumeX className="h-4 w-4 text-white" />
            ) : (
              <Volume2 className="h-4 w-4 text-white" />
            )}
            <Slider
              defaultValue={[volume * 100]}
              onValueChange={handleVolumeChange}
              className="w-[100px]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
