import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, Settings } from 'lucide-react';
import { AudioFile } from '@/types/audio';
interface EnhancedMiniPlayerProps {
  file: AudioFile;
}
export const EnhancedMiniPlayer = ({
  file
}: EnhancedMiniPlayerProps) => {
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
    const colors = ['#8B0000', '#FF4500', '#FF8C00', '#FFD700', '#9ACD32', '#00FF7F', '#00CED1', '#4169E1', '#8A2BE2', '#FF1493'];
    const intensity = Math.abs(value) / 12;
    const opacity = 0.3 + intensity * 0.7;
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
  return;
};