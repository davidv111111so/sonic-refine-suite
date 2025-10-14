import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface RealtimeAudioPlayerProps {
  audioFile: File | null;
  eqBands: number[];
  processingSettings: {
    noiseReductionEnabled: boolean;
    noiseReduction: number;
    normalize: boolean;
    normalizeLevel: number;
    compressionEnabled: boolean;
    compressionRatio: string;
    compressionThreshold: number;
    stereoWideningEnabled: boolean;
    stereoWidening: number;
  };
}

export const RealtimeAudioPlayer: React.FC<RealtimeAudioPlayerProps> = ({
  audioFile,
  eqBands,
  processingSettings
}) => {
  const { t } = useLanguage();
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Initialize Web Audio API
  useEffect(() => {
    if (!audioFile) return;

    const initAudio = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        // Create audio nodes
        const gainNode = audioContext.createGain();
        gainNode.gain.value = volume / 100;
        gainNodeRef.current = gainNode;

        // Create 5-band EQ filters
        const frequencies = [50, 145, 874, 5560, 17200]; // Hz
        const filters: BiquadFilterNode[] = [];
        
        frequencies.forEach((freq, index) => {
          const filter = audioContext.createBiquadFilter();
          filter.type = 'peaking';
          filter.frequency.value = freq;
          filter.Q.value = 1.0;
          filter.gain.value = eqBands[index] || 0;
          filters.push(filter);
        });
        
        filtersRef.current = filters;

        // Create analyser for visualization
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;

        // Load and decode audio file
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        setDuration(audioBuffer.duration);

      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioFile]);

  // Update EQ in real-time
  useEffect(() => {
    if (filtersRef.current.length > 0) {
      filtersRef.current.forEach((filter, index) => {
        filter.gain.value = eqBands[index] || 0;
      });
    }
  }, [eqBands]);

  // Update volume in real-time
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const handlePlayPause = async () => {
    if (!audioContextRef.current || !audioFile) return;

    if (isPlaying) {
      // Pause
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Play
      try {
        const audioContext = audioContextRef.current;
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        sourceRef.current = source;

        // Connect audio graph: source -> filters -> gain -> analyser -> destination
        let previousNode: AudioNode = source;
        
        filtersRef.current.forEach(filter => {
          previousNode.connect(filter);
          previousNode = filter;
        });
        
        if (gainNodeRef.current) {
          previousNode.connect(gainNodeRef.current);
          gainNodeRef.current.connect(audioContext.destination);
          
          if (analyserRef.current) {
            gainNodeRef.current.connect(analyserRef.current);
          }
        }

        source.start(0);
        setIsPlaying(true);

        source.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };

      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!audioFile) {
    return (
      <Card className="bg-slate-900/90 dark:bg-black/90 border-slate-700 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm text-slate-400">{t('player.noAudioLoaded')}</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-cyan-600/50 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-sm">
          <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse"></div>
          {t('player.realtimePreview')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handlePlayPause}
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <div className="flex-1">
            <Slider
              value={[currentTime]}
              max={duration}
              step={0.1}
              className="w-full"
              disabled
            />
          </div>
          
          <span className="text-xs text-slate-300 font-mono min-w-[60px]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="text-white"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            value={[volume]}
            onValueChange={([val]) => setVolume(val)}
            max={100}
            step={1}
            className="w-full"
          />
          <span className="text-xs text-slate-300 font-mono min-w-[40px]">
            {volume}%
          </span>
        </div>

        {/* Real-time Status Indicator */}
        <div className="text-[10px] text-cyan-400 text-center">
          {t('player.realtimeProcessing')}
        </div>
      </CardContent>
    </Card>
  );
};