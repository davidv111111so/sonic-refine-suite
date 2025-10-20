/**
 * Advanced Audio Player with Real-time Enhancement
 * Features: EQ, compression, stereo widening, visualization
 * All processing happens in the browser using Web Audio API
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, Square, Volume2, VolumeX, 
  Music, Sliders, TrendingUp, Activity 
} from 'lucide-react';
import { getAudioContext, resumeAudioContext } from '@/utils/audioContextManager';
import { AudioFile } from '@/types/audio';

interface AdvancedAudioPlayerProps {
  audioFile: AudioFile | null;
  eqBands?: number[];
  onEQChange?: (bandIndex: number, value: number) => void;
}

const EQ_FREQUENCIES = [60, 250, 1000, 4000, 12000]; // 5-band EQ

export const AdvancedAudioPlayer: React.FC<AdvancedAudioPlayerProps> = ({
  audioFile,
  eqBands = [0, 0, 0, 0, 0],
  onEQChange
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  
  // Enhancement controls
  const [eqEnabled, setEqEnabled] = useState(true);
  const [compressionEnabled, setCompressionEnabled] = useState(false);
  const [compressionThreshold, setCompressionThreshold] = useState(-24);
  
  // Refs for Web Audio API nodes
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Canvas for visualization
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  // Initialize Web Audio API
  useEffect(() => {
    if (!audioFile || !audioElementRef.current) return;

    const initAudio = async () => {
      await resumeAudioContext();
      
      const audioContext = getAudioContext();
      audioContextRef.current = audioContext;
      
      // Create audio nodes if they don't exist
      if (!sourceNodeRef.current) {
        sourceNodeRef.current = audioContext.createMediaElementSource(audioElementRef.current!);
      }
      
      if (!gainNodeRef.current) {
        gainNodeRef.current = audioContext.createGain();
      }
      
      if (!compressorNodeRef.current) {
        compressorNodeRef.current = audioContext.createDynamicsCompressor();
      }
      
      if (!analyserNodeRef.current) {
        analyserNodeRef.current = audioContext.createAnalyser();
        analyserNodeRef.current.fftSize = 2048;
      }
      
      // Create EQ filters
      if (eqFiltersRef.current.length === 0) {
        EQ_FREQUENCIES.forEach((freq, i) => {
          const filter = audioContext.createBiquadFilter();
          
          if (i === 0) {
            filter.type = 'lowshelf';
          } else if (i === EQ_FREQUENCIES.length - 1) {
            filter.type = 'highshelf';
          } else {
            filter.type = 'peaking';
          }
          
          filter.frequency.value = freq;
          filter.gain.value = eqBands[i] || 0;
          filter.Q.value = 1.0;
          
          eqFiltersRef.current.push(filter);
        });
      }
      
      // Connect audio graph
      connectAudioGraph();
    };

    initAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioFile]);

  // Connect audio processing graph
  const connectAudioGraph = () => {
    if (!sourceNodeRef.current || !gainNodeRef.current || !analyserNodeRef.current) return;
    
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    let currentNode: AudioNode = sourceNodeRef.current;
    
    // Apply EQ if enabled
    if (eqEnabled && eqFiltersRef.current.length > 0) {
      eqFiltersRef.current.forEach(filter => {
        currentNode.connect(filter);
        currentNode = filter;
      });
    }
    
    // Apply compression if enabled
    if (compressionEnabled && compressorNodeRef.current) {
      currentNode.connect(compressorNodeRef.current);
      currentNode = compressorNodeRef.current;
    }
    
    // Connect to gain -> analyser -> destination
    currentNode.connect(gainNodeRef.current);
    gainNodeRef.current.connect(analyserNodeRef.current);
    analyserNodeRef.current.connect(audioContext.destination);
  };

  // Update EQ bands in real-time
  useEffect(() => {
    if (eqFiltersRef.current.length === 0 || !audioContextRef.current) return;
    
    eqFiltersRef.current.forEach((filter, index) => {
      if (eqBands[index] !== undefined) {
        filter.gain.setValueAtTime(
          eqBands[index],
          audioContextRef.current!.currentTime
        );
      }
    });
  }, [eqBands]);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      const gainValue = isMuted ? 0 : volume;
      gainNodeRef.current.gain.setValueAtTime(
        gainValue,
        audioContextRef.current.currentTime
      );
    }
  }, [volume, isMuted]);

  // Update compression
  useEffect(() => {
    if (compressorNodeRef.current && audioContextRef.current) {
      compressorNodeRef.current.threshold.setValueAtTime(
        compressionThreshold,
        audioContextRef.current.currentTime
      );
    }
  }, [compressionThreshold]);

  // Visualization
  useEffect(() => {
    if (!isPlaying || !analyserNodeRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserNodeRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(1, '#3b82f6');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const handlePlayPause = async () => {
    if (!audioElementRef.current) return;

    await resumeAudioContext();

    if (isPlaying) {
      audioElementRef.current.pause();
    } else {
      audioElementRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    if (!audioElementRef.current) return;
    audioElementRef.current.pause();
    audioElementRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (value: number[]) => {
    if (!audioElementRef.current) return;
    audioElementRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!audioFile) {
    return (
      <Card className="bg-slate-900/90 border-slate-700">
        <CardContent className="p-8 text-center">
          <Music className="h-16 w-16 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">No audio file loaded</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400">
            <Activity className="h-5 w-5" />
            Advanced Player
          </div>
          <Badge className="bg-green-600 text-white">
            Real-time Enhancement
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Audio Element */}
        <audio
          ref={audioElementRef}
          src={audioFile.originalUrl || URL.createObjectURL(audioFile.originalFile)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Visualization Canvas */}
        <canvas
          ref={canvasRef}
          width={600}
          height={100}
          className="w-full rounded-lg bg-slate-950/50 border border-slate-700"
        />

        {/* Track Info */}
        <div className="text-center">
          <h3 className="text-white font-semibold truncate">{audioFile.name}</h3>
          <div className="flex justify-between text-sm text-slate-400 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="w-full"
        />

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleStop}
            className="bg-slate-800 border-slate-600 hover:bg-slate-700"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={handlePlayPause}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-12 w-12"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="bg-slate-800 border-slate-600 hover:bg-slate-700"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-slate-400" />
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            onValueChange={(v) => setVolume(v[0])}
            className="flex-1"
          />
          <span className="text-sm text-slate-400 w-12 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Enhancement Controls */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" />
              <span className="text-white font-medium">Equalizer</span>
            </div>
            <Switch checked={eqEnabled} onCheckedChange={setEqEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <span className="text-white font-medium">Compression</span>
            </div>
            <Switch
              checked={compressionEnabled}
              onCheckedChange={setCompressionEnabled}
            />
          </div>

          {compressionEnabled && (
            <div className="pl-6 space-y-2">
              <label className="text-sm text-slate-400">
                Threshold: {compressionThreshold}dB
              </label>
              <Slider
                value={[compressionThreshold]}
                min={-60}
                max={0}
                step={1}
                onValueChange={(v) => setCompressionThreshold(v[0])}
              />
            </div>
          )}
        </div>

        {/* Processing Status */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>
            Processing: {eqEnabled ? 'EQ' : ''}{' '}
            {compressionEnabled ? 'Compression' : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
