
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, Settings } from 'lucide-react';
import { AudioFile } from '@/types/audio';

interface EnhancedMiniPlayerProps {
  file: AudioFile;
}

export const EnhancedMiniPlayer = ({ file }: EnhancedMiniPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showEQ, setShowEQ] = useState(true);
  const [eqBands, setEqBands] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

  // Dynamic colors for EQ bands based on frequency
  const getEQColor = (index: number, value: number) => {
    const colors = [
      '#8B0000', '#FF4500', '#FF8C00', '#FFD700', '#9ACD32',
      '#00FF7F', '#00CED1', '#4169E1', '#8A2BE2', '#FF1493'
    ];
    const intensity = Math.abs(value) / 12;
    const opacity = 0.3 + (intensity * 0.7);
    return `${colors[index]}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoaded(true);
      console.log('Audio loaded successfully:', file.name);
    };

    const handleLoadedData = () => {
      setIsLoaded(true);
    };

    const handleError = (e: any) => {
      console.error('Audio loading error:', e);
      setIsLoaded(false);
    };

    const handleCanPlay = () => {
      setIsLoaded(true);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    // Set audio source
    if (file.enhancedUrl) {
      audio.src = file.enhancedUrl;
    } else if (file.originalFile) {
      audio.src = URL.createObjectURL(file.originalFile);
    }

    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [file]);

  useEffect(() => {
    if (audioRef.current && !audioContextRef.current && isLoaded) {
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
        
        console.log('Audio context initialized successfully');
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }, [isLoaded]);

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
    if (!audioRef.current || !isLoaded) {
      console.warn('Audio not ready for playback');
      return;
    }

    try {
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Playback failed:", error);
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  const handleTimeChange = (value: number[]) => {
    if (audioRef.current && isLoaded) {
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
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLoaded ? 'bg-green-400' : 'bg-red-400'}`} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEQ(!showEQ)}
              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Main Player Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              disabled={!isLoaded}
              className="h-10 w-10 p-0 text-white hover:bg-slate-700 disabled:opacity-50 bg-slate-700/50 rounded-full"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-white bg-slate-700/30 rounded"
              >
                {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <div className="w-20">
                <Slider
                  value={[volume * 100]}
                  onValueChange={handleVolumeChange}
                  min={0}
                  max={100}
                  step={1}
                  className="h-2"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <Slider
            value={[currentTime]}
            onValueChange={handleTimeChange}
            max={duration || 100}
            step={1}
            className="h-2"
            disabled={!isLoaded}
          />
        </div>

        {/* Enhanced EQ Controls */}
        {showEQ && (
          <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">Perfect Audio EQ</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={resetEQ}
                className="h-7 text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
              >
                Reset
              </Button>
            </div>
            <div className="relative">
              {/* Vertical grid lines behind sliders */}
              <div className="absolute inset-0 flex justify-between items-center px-2">
                {eqFrequencies.map((_, index) => (
                  <div
                    key={index}
                    className="w-px bg-slate-600/30 h-full"
                    style={{
                      background: `linear-gradient(to bottom, transparent, ${getEQColor(index, eqBands[index])}, transparent)`
                    }}
                  />
                ))}
              </div>
              
              {/* EQ Sliders */}
              <div className="flex justify-center items-end gap-3 relative z-10">
                {eqFrequencies.map((freq, index) => (
                  <div key={freq} className="flex flex-col items-center">
                    <div className="h-24 flex items-end justify-center mb-2 relative">
                      {/* Dynamic color background */}
                      <div 
                        className="absolute inset-0 rounded opacity-30 transition-all duration-300"
                        style={{
                          background: `linear-gradient(to top, ${getEQColor(index, eqBands[index])}, transparent)`,
                          transform: `scaleY(${0.2 + Math.abs(eqBands[index]) / 12 * 0.8})`
                        }}
                      />
                      <Slider
                        orientation="vertical"
                        value={[eqBands[index]]}
                        onValueChange={([value]) => handleEQChange(index, value)}
                        min={-12}
                        max={12}
                        step={0.5}
                        className="h-20 w-5 relative z-10"
                      />
                    </div>
                    <div className="text-xs text-blue-400 mb-1 text-center font-medium">
                      {freq < 1000 ? `${freq}Hz` : `${freq/1000}kHz`}
                    </div>
                    <div className="text-xs text-white text-center min-w-10 font-mono bg-slate-800/50 rounded px-1">
                      {eqBands[index] > 0 ? '+' : ''}{eqBands[index]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <audio 
          ref={audioRef} 
          preload="metadata"
          crossOrigin="anonymous"
        />
      </CardContent>
    </Card>
  );
};
