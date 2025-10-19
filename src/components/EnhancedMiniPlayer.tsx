
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, Settings } from 'lucide-react';
import { AudioFile } from '@/types/audio';

interface EnhancedMiniPlayerProps {
  file: AudioFile;
  onAudioElementRef?: (audioElement: HTMLAudioElement | null) => void;
}

export const EnhancedMiniPlayer = ({
  file,
  onAudioElementRef
}: EnhancedMiniPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Initialize Web Audio API context (persists across plays)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Create AudioContext only once
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('AudioContext created for', file.name);
    }

    // Create MediaElementSource only once per audio element
    if (!sourceNodeRef.current && audioContextRef.current) {
      try {
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audio);
        sourceNodeRef.current.connect(audioContextRef.current.destination);
        console.log('MediaElementSource connected for', file.name);
      } catch (error) {
        console.error('Error creating MediaElementSource:', error);
      }
    }

    // Pass audio element reference to parent
    if (onAudioElementRef) {
      onAudioElementRef(audio);
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoaded(true);
      console.log('Audio metadata loaded:', file.name, 'Duration:', audio.duration);
    };

    const handleLoadedData = () => {
      setIsLoaded(true);
      console.log('Audio data loaded successfully:', file.name);
    };

    const handleError = (e: any) => {
      console.error('Audio loading error for', file.name, ':', e);
      setIsLoaded(false);
    };

    const handleCanPlay = () => {
      setIsLoaded(true);
      console.log('Audio can play:', file.name);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      console.log('Audio playback ended:', file.name);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);

    // Set audio source with error handling
    try {
      if (file.enhancedUrl) {
        audio.src = file.enhancedUrl;
        console.log('Setting enhanced audio source:', file.enhancedUrl.substring(0, 50));
      } else if (file.originalFile) {
        const objectUrl = URL.createObjectURL(file.originalFile);
        audio.src = objectUrl;
        console.log('Setting original file audio source from Blob');
      }
      audio.load();
    } catch (error) {
      console.error('Error setting audio source:', error);
      setIsLoaded(false);
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      
      // Clean up audio element reference
      if (onAudioElementRef) {
        onAudioElementRef(null);
      }

      // Cleanup AudioContext on unmount
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [file, onAudioElementRef]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
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
    const audio = audioRef.current;
    const ctx = audioContextRef.current;
    
    if (!audio) {
      console.warn('Audio element not available');
      return;
    }

    if (!isLoaded) {
      console.warn('Audio not loaded yet, attempting to load...');
      try {
        await audio.load();
        // Wait for loadeddata event
        await new Promise((resolve) => {
          const handler = () => {
            audio.removeEventListener('loadeddata', handler);
            resolve(true);
          };
          audio.addEventListener('loadeddata', handler);
        });
      } catch (error) {
        console.error('Failed to load audio:', error);
        return;
      }
    }

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        console.log('Audio paused');
      } else {
        // Resume AudioContext if suspended
        if (ctx && ctx.state === 'suspended') {
          await ctx.resume();
          console.log('AudioContext resumed');
        }

        // Stop other audio players
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(audioEl => {
          if (audioEl !== audio && !audioEl.paused) {
            audioEl.pause();
          }
        });
        
        console.log('Attempting to play audio:', file.name);
        console.log('Audio src:', audio.src.substring(0, 100));
        console.log('Audio readyState:', audio.readyState);
        console.log('Audio networkState:', audio.networkState);
        console.log('Audio duration:', audio.duration);
        
        await audio.play();
        setIsPlaying(true);
        console.log('Audio playing successfully:', file.name);
      }
    } catch (error) {
      console.error("Playback failed:", error);
      console.error("Error details:", {
        name: (error as Error).name,
        message: (error as Error).message,
        src: audio.src,
        readyState: audio.readyState,
        networkState: audio.networkState,
        error: audio.error
      });
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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white flex items-center gap-2">
          <Settings className="h-4 w-4 text-blue-400" />
          Preview: {file.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlay}
            disabled={!isLoaded}
            className="h-8 w-8 p-0 text-white hover:bg-slate-700"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <div className="flex items-center gap-2 flex-1 mx-3">
            <span className="text-xs text-slate-400 font-mono">{formatTime(currentTime)}</span>
            <div className="flex-1">
              <Slider
                value={[currentTime]}
                onValueChange={handleTimeChange}
                max={duration || 100}
                step={1}
                className="w-full"
                disabled={!isLoaded}
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-2">
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
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        <audio ref={audioRef} preload="metadata" />
      </CardContent>
    </Card>
  );
};
