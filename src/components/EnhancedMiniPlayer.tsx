
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, Settings } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { AudioFile } from '@/types/audio';

interface EnhancedMiniPlayerProps {
  file: AudioFile;
}

export const EnhancedMiniPlayer = ({ file }: EnhancedMiniPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [showEQ, setShowEQ] = useState(false);
  const [eqBands, setEqBands] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

  useEffect(() => {
    if (audioRef.current && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        gainNodeRef.current = audioContextRef.current.createGain();
        
        // Create EQ filters
        filtersRef.current = eqFrequencies.map((freq, index) => {
          const filter = audioContextRef.current!.createBiquadFilter();
          filter.type = index === 0 ? 'lowshelf' : index === 9 ? 'highshelf' : 'peaking';
          filter.frequency.value = freq;
          filter.Q.value = 1;
          filter.gain.value = 0;
          return filter;
        });

        // Connect the audio graph
        let previousNode: AudioNode = sourceRef.current;
        filtersRef.current.forEach(filter => {
          previousNode.connect(filter);
          previousNode = filter;
        });
        previousNode.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = volume;
      }
    }
  }, [volume]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const timeUpdateHandler = () => {
      setCurrentTime(audioElement.currentTime);
    };

    const endedHandler = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audioElement.addEventListener("timeupdate", timeUpdateHandler);
    audioElement.addEventListener("ended", endedHandler);

    return () => {
      audioElement.removeEventListener("timeupdate", timeUpdateHandler);
      audioElement.removeEventListener("ended", endedHandler);
    };
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Playback failed:", error);
      setIsPlaying(false);
    }
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

  const handleEQChange = (bandIndex: number, value: number) => {
    const newEqBands = [...eqBands];
    newEqBands[bandIndex] = value;
    setEqBands(newEqBands);

    if (filtersRef.current[bandIndex]) {
      filtersRef.current[bandIndex].gain.value = value;
    }
  };

  const resetEQ = () => {
    const resetBands = new Array(10).fill(0);
    setEqBands(resetBands);
    filtersRef.current.forEach(filter => {
      filter.gain.value = 0;
    });
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-white flex items-center justify-between">
          <span className="truncate">{file.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEQ(!showEQ)}
            className="h-6 w-6 p-0 text-slate-400 hover:text-white"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Main Player Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="h-8 w-8 p-0 text-white hover:bg-slate-700"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                {volume === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
              </Button>
              <div className="w-16">
                <Slider
                  value={[volume * 100]}
                  onValueChange={handleVolumeChange}
                  min={0}
                  max={100}
                  step={1}
                  className="h-1"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{file.duration ? formatTime(file.duration) : '0:00'}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <Slider
            value={[currentTime]}
            onValueChange={handleTimeChange}
            max={file.duration || 100}
            step={1}
            className="h-1"
          />
        </div>

        {/* EQ Controls */}
        {showEQ && (
          <div className="bg-slate-900/50 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-white">Perfect Audio EQ</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={resetEQ}
                className="h-6 text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
              >
                Reset
              </Button>
            </div>
            <div className="flex justify-center items-end gap-2">
              {eqFrequencies.map((freq, index) => (
                <div key={freq} className="flex flex-col items-center">
                  <div className="h-20 flex items-end justify-center mb-1">
                    <Slider
                      orientation="vertical"
                      value={[eqBands[index]]}
                      onValueChange={([value]) => handleEQChange(index, value)}
                      min={-12}
                      max={12}
                      step={0.5}
                      className="h-16 w-4"
                    />
                  </div>
                  <div className="text-xs text-blue-400 mb-1 text-center">
                    {freq < 1000 ? `${freq}Hz` : `${freq/1000}kHz`}
                  </div>
                  <div className="text-xs text-slate-300 text-center min-w-8">
                    {eqBands[index] > 0 ? '+' : ''}{eqBands[index]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <audio 
          src={file.enhancedUrl || URL.createObjectURL(file.originalFile)} 
          ref={audioRef} 
          preload="metadata"
          crossOrigin="anonymous"
        />
      </CardContent>
    </Card>
  );
};
