
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Upload, Volume2, Equalizer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { SpectrumAnalyzer } from './SpectrumAnalyzer';
import { useToast } from '@/hooks/use-toast';

export const MediaPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [eqEnabled, setEqEnabled] = useState(false);
  const [eqBands, setEqBands] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const eqNodesRef = useRef<BiquadFilterNode[]>([]);
  
  const { toast } = useToast();

  const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (audioContextRef.current && eqEnabled) {
      eqNodesRef.current.forEach((node, index) => {
        if (node) {
          node.gain.value = eqBands[index];
        }
      });
    }
  }, [eqBands, eqEnabled]);

  const setupAudioContext = () => {
    if (!audioRef.current) return;

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContext();
    
    sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
    gainNodeRef.current = audioContextRef.current.createGain();
    
    // Create EQ nodes
    eqNodesRef.current = eqFrequencies.map((freq, index) => {
      const filter = audioContextRef.current!.createBiquadFilter();
      filter.type = index === 0 ? 'lowshelf' : index === eqFrequencies.length - 1 ? 'highshelf' : 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1;
      filter.gain.value = eqBands[index];
      return filter;
    });

    // Connect audio graph
    let currentNode: AudioNode = sourceRef.current;
    
    if (eqEnabled) {
      eqNodesRef.current.forEach(filter => {
        currentNode.connect(filter);
        currentNode = filter;
      });
    }
    
    currentNode.connect(gainNodeRef.current!);
    gainNodeRef.current!.connect(audioContextRef.current.destination);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an audio file",
        variant: "destructive"
      });
      return;
    }

    setCurrentFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    
    if (audioRef.current) {
      audioRef.current.src = url;
      setupAudioContext();
    }

    toast({
      title: "File loaded",
      description: `Now playing: ${file.name}`,
    });
  };

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
        toast({
          title: "Playback error",
          description: "Could not play the audio file",
          variant: "destructive"
        });
      });
    }
    
    setIsPlaying(!isPlaying);
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

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  const handleEQBandChange = (bandIndex: number, value: number) => {
    const newEqBands = [...eqBands];
    newEqBands[bandIndex] = value;
    setEqBands(newEqBands);
  };

  const resetEQ = () => {
    setEqBands([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
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
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden"
      />

      {/* File Selection */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="h-5 w-5 mr-2" />
              Select Audio File
            </Button>
            {currentFile && (
              <p className="mt-2 text-slate-300">
                Loaded: {currentFile.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Spectrum Analyzer */}
      {audioUrl && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center">Spectrum Analyzer</CardTitle>
          </CardHeader>
          <CardContent>
            <SpectrumAnalyzer 
              audioUrl={audioUrl} 
              playing={isPlaying}
              height={200}
            />
          </CardContent>
        </Card>
      )}

      {/* Player Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 space-y-4">
          {/* Progress Bar */}
          <div 
            className="h-3 bg-slate-700 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="bg-blue-500 h-full rounded-full transition-all"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
          </div>

          {/* Time Display */}
          <div className="flex justify-between text-sm text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => handleSkip(-10)}
              disabled={!audioUrl}
              className="text-white hover:text-blue-400"
            >
              <SkipBack className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={handlePlayPause}
              disabled={!audioUrl}
              className="text-white hover:text-blue-400"
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={() => handleSkip(10)}
              disabled={!audioUrl}
              className="text-white hover:text-blue-400"
            >
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-4">
            <Volume2 className="h-5 w-5 text-slate-400" />
            <Slider
              value={[volume]}
              onValueChange={([value]) => setVolume(value)}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-sm text-slate-400 w-12">{volume}%</span>
          </div>
        </CardContent>
      </Card>

      {/* 10-Band EQ */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Equalizer className="h-5 w-5" />
            10-Band Equalizer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Switch
              checked={eqEnabled}
              onCheckedChange={setEqEnabled}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={resetEQ}
              className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
            >
              Reset EQ
            </Button>
          </div>
          
          {eqEnabled && (
            <div className="grid grid-cols-5 lg:grid-cols-10 gap-4">
              {eqFrequencies.map((freq, index) => (
                <div key={freq} className="text-center">
                  <div className="h-32 flex items-end justify-center mb-2">
                    <Slider
                      orientation="vertical"
                      value={[eqBands[index]]}
                      onValueChange={([value]) => handleEQBandChange(index, value)}
                      min={-12}
                      max={12}
                      step={0.5}
                      className="h-28"
                    />
                  </div>
                  <div className="text-xs text-slate-400">
                    {freq < 1000 ? `${freq}Hz` : `${freq >= 1000 ? freq/1000 : freq}${freq >= 1000 ? 'k' : ''}Hz`}
                  </div>
                  <div className="text-xs text-slate-300">
                    {eqBands[index] > 0 ? '+' : ''}{eqBands[index]}dB
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
