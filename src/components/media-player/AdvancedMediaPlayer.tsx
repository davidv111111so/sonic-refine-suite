import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Upload, Trash2 } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import { getAudioContext, resumeAudioContext } from '@/utils/audioContextManager';
import { AudioFile } from '@/types/audio';
import { TenBandEqualizer, EQBand } from './TenBandEqualizer';
import { DynamicsCompressorControls, CompressorSettings } from './DynamicsCompressorControls';
import { AudioVisualizer } from './AudioVisualizer';
import { FunSpectrumVisualizer } from './FunSpectrumVisualizer';
import { PlaylistPanel } from './PlaylistPanel';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

interface AdvancedMediaPlayerProps {
  files: AudioFile[];
  onFilesAdded?: (files: AudioFile[]) => void;
  onFileDelete?: (fileId: string) => void;
  autoPlayFile?: AudioFile | null;
  onAutoPlayComplete?: () => void;
}

const INITIAL_EQ_BANDS: EQBand[] = [
  { frequency: 64, gain: 0 },
  { frequency: 125, gain: 0 },
  { frequency: 250, gain: 0 },
  { frequency: 500, gain: 0 },
  { frequency: 1000, gain: 0 },
  { frequency: 2000, gain: 0 },
  { frequency: 4000, gain: 0 },
  { frequency: 8000, gain: 0 },
]; // Removed 32Hz and 16000Hz as they don't affect audio

const INITIAL_COMPRESSOR: CompressorSettings = {
  threshold: -1.5,     // Within 0 to -3dB range
  ratio: 2.5,          // Within 1 to 4:1 range
  attack: 0.001,       // 1ms - within 0.1ms to 3ms range
  release: 0.0015      // 1.5ms - within 0ms to 3ms range
};

export const AdvancedMediaPlayer: React.FC<AdvancedMediaPlayerProps> = ({
  files,
  onFilesAdded,
  onFileDelete,
  autoPlayFile,
  onAutoPlayComplete,
}) => {
  const [currentFile, setCurrentFile] = useState<AudioFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [loop, setLoop] = useState(false);
  
  // Advanced controls
  const [pitchShift, setPitchShift] = useState(0); // -12 to +12 semitones
  const [tempo, setTempo] = useState(100); // 50% to 150%
  const [reverbMix, setReverbMix] = useState(0); // 0-100%
  const [delayMix, setDelayMix] = useState(0); // 0-100%
  const [delayTime, setDelayTime] = useState(0.5); // seconds
  const [limiterEnabled, setLimiterEnabled] = useState(true);
  
  // Real-time meters
  const [lufsIntegrated, setLufsIntegrated] = useState(0);
  const [lufsMomentary, setLufsMomentary] = useState(0);
  const [truePeak, setTruePeak] = useState(0);
  const [dynamicRange, setDynamicRange] = useState(0);
  const [phaseCorrelation, setPhaseCorrelation] = useState(0);
  
  const [eqBands, setEqBands] = useState<EQBand[]>(INITIAL_EQ_BANDS);
  const [compressorSettings, setCompressorSettings] = useState<CompressorSettings>(INITIAL_COMPRESSOR);
  const [gainReduction, setGainReduction] = useState(0);
  
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const limiterNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const reverbNodeRef = useRef<ConvolverNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'hsl(var(--primary))',
      progressColor: 'hsl(var(--accent))',
      cursorColor: 'hsl(var(--accent))',
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 2,
      height: 100,
      barGap: 2,
    });

    wavesurferRef.current = ws;

    ws.on('ready', () => {
      setDuration(ws.getDuration());
    });

    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on('finish', () => {
      if (loop) {
        ws.play();
      } else {
        setIsPlaying(false);
      }
    });

    return () => {
      ws.destroy();
    };
  }, [loop]);

  // File upload handler
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newAudioFiles: AudioFile[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        size: file.size,
        type: file.type,
        originalFile: file,
        originalUrl: URL.createObjectURL(file),
        status: 'uploaded' as const,
        fileType: file.name.split('.').pop()?.toLowerCase() as 'mp3' | 'wav' | 'flac' | 'unsupported',
      }));

      if (onFilesAdded) {
        onFilesAdded(newAudioFiles);
      }

      toast.success(`Added ${acceptedFiles.length} file(s) to player`);
    },
    [onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.m4a', '.ogg'],
    },
    multiple: true,
  });

  // Initialize Web Audio API nodes
  useEffect(() => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    // Create analyser
    if (!analyserNodeRef.current) {
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserNodeRef.current = analyser;
    }

    // Create gain node
    if (!gainNodeRef.current) {
      const gain = audioContext.createGain();
      gain.gain.value = volume;
      gainNodeRef.current = gain;
    }

    // Create compressor with DRC constraints
    if (!compressorNodeRef.current) {
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = compressorSettings.threshold;
      compressor.ratio.value = compressorSettings.ratio;
      compressor.attack.value = compressorSettings.attack;
      compressor.release.value = compressorSettings.release;
      compressor.knee.value = 0; // Knee removed - hard knee compression
      compressorNodeRef.current = compressor;
    }

    // Create master limiter
    if (!limiterNodeRef.current) {
      const limiter = audioContext.createDynamicsCompressor();
      limiter.threshold.value = -0.5;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.001;
      limiter.release.value = 0.1;
      limiter.knee.value = 0;
      limiterNodeRef.current = limiter;
    }

    // Create delay
    if (!delayNodeRef.current) {
      const delay = audioContext.createDelay(5);
      delay.delayTime.value = delayTime;
      delayNodeRef.current = delay;
    }

    // Create EQ filters
    if (eqFiltersRef.current.length === 0) {
      eqBands.forEach((band, index) => {
        const filter = audioContext.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === eqBands.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
        }
        filter.frequency.value = band.frequency;
        filter.gain.value = band.gain;
        filter.Q.value = 1.0;
        eqFiltersRef.current.push(filter);
      });
    }
  }, []);

  // Auto-play file when passed from track list
  useEffect(() => {
    if (autoPlayFile && autoPlayFile.id !== currentFile?.id) {
      setCurrentFile(autoPlayFile);
      if (onAutoPlayComplete) {
        onAutoPlayComplete();
      }
    }
  }, [autoPlayFile, currentFile, onAutoPlayComplete]);

  // Load file into WaveSurfer
  useEffect(() => {
    if (!currentFile || !wavesurferRef.current) return;

    const loadAudio = async () => {
      try {
        const url = currentFile.enhancedUrl || currentFile.originalUrl;
        if (!url && currentFile.originalFile) {
          const blob = currentFile.originalFile;
          const objectUrl = URL.createObjectURL(blob);
          await wavesurferRef.current!.load(objectUrl);
        } else if (url) {
          await wavesurferRef.current!.load(url);
        }

        // Connect Web Audio API nodes
        const audioContext = getAudioContext();
        if (audioContext && wavesurferRef.current) {
          const backend = wavesurferRef.current.getMediaElement();
          if (backend && !audioSourceRef.current) {
            try {
              const source = audioContext.createMediaElementSource(backend);
              audioSourceRef.current = source;

              // Build audio graph: source -> EQ -> compressor -> delay -> gain -> limiter -> analyser -> destination
              let currentNode: AudioNode = source;

              // EQ chain
              eqFiltersRef.current.forEach((filter) => {
                currentNode.connect(filter);
                currentNode = filter;
              });

              // Compressor
              if (compressorNodeRef.current) {
                currentNode.connect(compressorNodeRef.current);
                currentNode = compressorNodeRef.current;
              }

              // Delay (with wet/dry mix would require more nodes)
              if (delayNodeRef.current && delayMix > 0) {
                currentNode.connect(delayNodeRef.current);
                currentNode = delayNodeRef.current;
              }

              // Gain
              if (gainNodeRef.current) {
                currentNode.connect(gainNodeRef.current);
                currentNode = gainNodeRef.current;
              }

              // Master Limiter
              if (limiterNodeRef.current && limiterEnabled) {
                gainNodeRef.current!.connect(limiterNodeRef.current);
                currentNode = limiterNodeRef.current;
              }

              // Analyser
              if (analyserNodeRef.current) {
                currentNode.connect(analyserNodeRef.current);
                analyserNodeRef.current.connect(audioContext.destination);
              } else {
                currentNode.connect(audioContext.destination);
              }

              console.log('✅ Advanced audio graph connected');
            } catch (error) {
              console.error('Error connecting audio graph:', error);
            }
          }
        }

        toast.success(`Loaded: ${currentFile.name}`);
      } catch (error) {
        console.error('Failed to load audio:', error);
        toast.error('Failed to load audio file');
      }
    };

    loadAudio();
  }, [currentFile]);

  // Update EQ in real-time
  useEffect(() => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    eqFiltersRef.current.forEach((filter, index) => {
      if (eqBands[index]) {
        filter.gain.setValueAtTime(eqBands[index].gain, audioContext.currentTime);
      }
    });
  }, [eqBands]);

  // Update compressor in real-time with DRC constraints
  useEffect(() => {
    if (!compressorNodeRef.current) return;
    const audioContext = getAudioContext();
    if (!audioContext) return;

    const comp = compressorNodeRef.current;
    comp.threshold.setValueAtTime(compressorSettings.threshold, audioContext.currentTime);
    comp.ratio.setValueAtTime(compressorSettings.ratio, audioContext.currentTime);
    comp.attack.setValueAtTime(compressorSettings.attack, audioContext.currentTime);
    comp.release.setValueAtTime(compressorSettings.release, audioContext.currentTime);
    comp.knee.setValueAtTime(0, audioContext.currentTime); // Always 0 - hard knee
  }, [compressorSettings]);

  // Update delay time
  useEffect(() => {
    if (!delayNodeRef.current) return;
    const audioContext = getAudioContext();
    if (!audioContext) return;

    delayNodeRef.current.delayTime.setValueAtTime(delayTime, audioContext.currentTime);
  }, [delayTime]);

  // Update volume
  useEffect(() => {
    if (!gainNodeRef.current) return;
    const audioContext = getAudioContext();
    if (!audioContext) return;

    gainNodeRef.current.gain.setValueAtTime(volume, audioContext.currentTime);
  }, [volume]);

  // Monitor gain reduction and meters
  useEffect(() => {
    if (!compressorNodeRef.current || !isPlaying) return;

    const interval = setInterval(() => {
      if (compressorNodeRef.current) {
        setGainReduction(compressorNodeRef.current.reduction);
      }

      // Update real-time meters (simplified - would need proper metering library for accurate LUFS)
      if (analyserNodeRef.current) {
        const bufferLength = analyserNodeRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNodeRef.current.getByteTimeDomainData(dataArray);

        // Calculate peak
        let peak = 0;
        for (let i = 0; i < bufferLength; i++) {
          const value = Math.abs(dataArray[i] - 128) / 128;
          if (value > peak) peak = value;
        }
        setTruePeak(20 * Math.log10(peak || 0.0001));

        // Simplified loudness estimation (not true LUFS)
        const rms = Math.sqrt(dataArray.reduce((acc, val) => acc + Math.pow((val - 128) / 128, 2), 0) / bufferLength);
        setLufsMomentary(-23 + 20 * Math.log10(rms || 0.0001));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlayPause = async () => {
    if (!wavesurferRef.current) return;

    try {
      await resumeAudioContext();
      if (isPlaying) {
        wavesurferRef.current.pause();
        setIsPlaying(false);
      } else {
        await wavesurferRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      toast.error('Playback failed');
    }
  };

  const handleDeleteFile = () => {
    if (!currentFile) return;
    if (onFileDelete) {
      onFileDelete(currentFile.id);
    }
    setCurrentFile(null);
    setIsPlaying(false);
    toast.success(`Deleted: ${currentFile.name}`);
  };

  const handleSkipBackward = () => {
    if (wavesurferRef.current) {
      const newTime = Math.max(0, currentTime - 10);
      wavesurferRef.current.seekTo(newTime / duration);
    }
  };

  const handleSkipForward = () => {
    if (wavesurferRef.current) {
      const newTime = Math.min(duration, currentTime + 10);
      wavesurferRef.current.seekTo(newTime / duration);
    }
  };

  const handleEQBandChange = (index: number, gain: number) => {
    const newBands = [...eqBands];
    newBands[index] = { ...newBands[index], gain };
    setEqBands(newBands);
  };

  const handleEQReset = () => {
    setEqBands(INITIAL_EQ_BANDS);
    toast.success('EQ reset to flat');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Upload Zone */}
      <Card className="bg-gradient-to-br from-background to-muted border-border">
        <div
          {...getRootProps()}
          className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Upload className="h-12 w-12 text-primary" />
            <div>
              <p className="text-lg font-semibold mb-2 text-primary">
                {isDragActive ? 'Drop files here...' : 'Drop audio files here or click to browse'}
              </p>
              <p className="text-sm text-muted-foreground">Supports MP3, WAV, FLAC, M4A, OGG</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Player Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Waveform Player */}
          <Card className="bg-card border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                <span className="text-2xl">🎵</span>
                {currentFile ? currentFile.name : 'No track loaded'}
              </h3>
              {currentFile && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDeleteFile}
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Waveform */}
            <div ref={waveformRef} className="mb-6 rounded-lg overflow-hidden border border-border" />

            {/* Timeline */}
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <span className="font-mono">{formatTime(currentTime)}</span>
              <span className="font-mono">{formatTime(duration)}</span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSkipBackward}
                disabled={!currentFile}
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button
                variant="default"
                size="icon"
                onClick={handlePlayPause}
                disabled={!currentFile}
                className="h-14 w-14"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleSkipForward}
                disabled={!currentFile}
              >
                <SkipForward className="h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setLoop(!loop)}
                className={loop ? 'bg-primary text-primary-foreground' : ''}
              >
                <Repeat className="h-5 w-5" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-4">
              <Volume2 className="h-5 w-5 text-primary" />
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(v) => setVolume(v[0])}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground font-mono min-w-[50px] text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </Card>

          {/* Advanced Controls */}
          <Card className="bg-card border-border p-6">
            <h3 className="text-lg font-bold mb-4 text-primary">Advanced Controls</h3>

            <div className="space-y-4">
              {/* Pitch Shift */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Pitch Shift</Label>
                  <span className="text-sm text-muted-foreground">{pitchShift > 0 ? '+' : ''}{pitchShift} semitones</span>
                </div>
                <Slider
                  value={[pitchShift]}
                  min={-12}
                  max={12}
                  step={1}
                  onValueChange={(v) => setPitchShift(v[0])}
                />
                <p className="text-xs text-muted-foreground mt-1">Note: Requires additional processing library</p>
              </div>

              {/* Tempo */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Tempo / Time-Stretch</Label>
                  <span className="text-sm text-muted-foreground">{tempo}%</span>
                </div>
                <Slider
                  value={[tempo]}
                  min={50}
                  max={150}
                  step={1}
                  onValueChange={(v) => setTempo(v[0])}
                />
                <p className="text-xs text-muted-foreground mt-1">Note: Requires additional processing library</p>
              </div>

              {/* Reverb Mix */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Reverb Mix</Label>
                  <span className="text-sm text-muted-foreground">{reverbMix}%</span>
                </div>
                <Slider
                  value={[reverbMix]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(v) => setReverbMix(v[0])}
                />
              </div>

              {/* Delay Mix */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Delay Mix</Label>
                  <span className="text-sm text-muted-foreground">{delayMix}%</span>
                </div>
                <Slider
                  value={[delayMix]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(v) => setDelayMix(v[0])}
                />
              </div>

              {/* Delay Time */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Delay Time</Label>
                  <span className="text-sm text-muted-foreground">{delayTime.toFixed(2)}s</span>
                </div>
                <Slider
                  value={[delayTime]}
                  min={0.1}
                  max={2}
                  step={0.1}
                  onValueChange={(v) => setDelayTime(v[0])}
                />
              </div>

              {/* Master Limiter */}
              <div className="flex items-center justify-between">
                <Label>Master Limiter</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLimiterEnabled(!limiterEnabled)}
                  className={limiterEnabled ? 'bg-primary text-primary-foreground' : ''}
                >
                  {limiterEnabled ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Real-Time Meters */}
          <Card className="bg-card border-border p-6">
            <h3 className="text-lg font-bold mb-4 text-primary">Real-Time Analysis</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>LUFS Momentary</Label>
                <div className="text-2xl font-bold text-primary">{lufsMomentary.toFixed(1)}</div>
              </div>

              <div className="space-y-2">
                <Label>True Peak</Label>
                <div className="text-2xl font-bold text-primary">{truePeak.toFixed(1)} dB</div>
              </div>

              <div className="space-y-2">
                <Label>Dynamic Range</Label>
                <div className="text-2xl font-bold text-primary">{dynamicRange.toFixed(1)} LU</div>
              </div>

              <div className="space-y-2">
                <Label>Phase Correlation</Label>
                <div className="text-2xl font-bold text-primary">{phaseCorrelation.toFixed(2)}</div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Note: These are simplified estimates. For professional metering, use dedicated tools.
            </p>
          </Card>

          {/* EQ */}
          <TenBandEqualizer bands={eqBands} onBandChange={handleEQBandChange} onReset={handleEQReset} />

          {/* Compressor */}
          <DynamicsCompressorControls
            settings={compressorSettings}
            gainReduction={gainReduction}
            onSettingsChange={(settings) => setCompressorSettings({ ...compressorSettings, ...settings })}
          />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Visualizer */}
          <AudioVisualizer analyserNode={analyserNodeRef.current} isPlaying={isPlaying} />

          {/* Playlist */}
          <PlaylistPanel files={files} currentFileId={currentFile?.id || null} onFileSelect={setCurrentFile} />

          {/* Fun Spectrum Visualizer */}
          <FunSpectrumVisualizer analyserNode={analyserNodeRef.current} isPlaying={isPlaying} />
        </div>
      </div>
    </div>
  );
};
