import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Upload, Trash2 } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import { getAudioContext, resumeAudioContext } from '@/utils/audioContextManager';
import { AudioFile } from '@/types/audio';
import { TenBandEqualizer, EQBand } from './TenBandEqualizer';
import { DynamicsCompressorControls, CompressorSettings } from './DynamicsCompressorControls';
import { AudioVisualizer } from './AudioVisualizer';
import { FunSpectrumVisualizer } from './FunSpectrumVisualizer';
import { PlaylistPanel } from './PlaylistPanel';
import { MediaPlayerUpload } from './MediaPlayerUpload';
import { toast } from 'sonner';
interface LevelMediaPlayerProps {
  files: AudioFile[];
  onFilesAdded?: (files: AudioFile[]) => void;
  onFileDelete?: (fileId: string) => void;
  autoPlayFile?: AudioFile | null;
  onAutoPlayComplete?: () => void;
}
const INITIAL_EQ_BANDS: EQBand[] = [{
  frequency: 64,
  gain: 0
}, {
  frequency: 125,
  gain: 0
}, {
  frequency: 250,
  gain: 0
}, {
  frequency: 500,
  gain: 0
}, {
  frequency: 1000,
  gain: 0
}, {
  frequency: 2000,
  gain: 0
}, {
  frequency: 4000,
  gain: 0
}, {
  frequency: 8000,
  gain: 0
}]; // Removed 32Hz and 16000Hz as they don't affect audio
const INITIAL_COMPRESSOR: CompressorSettings = {
  threshold: -1.5,     // Within 0 to -3dB range
  ratio: 2.5,          // Within 1 to 4:1 range
  attack: 0.001,       // 1ms - within 0.1ms to 3ms range
  release: 0.0015      // 1.5ms - within 0ms to 3ms range
};
export const LevelMediaPlayer: React.FC<LevelMediaPlayerProps> = ({
  files,
  onFilesAdded,
  onFileDelete,
  autoPlayFile,
  onAutoPlayComplete
}) => {
  const [currentFile, setCurrentFile] = useState<AudioFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [loop, setLoop] = useState(false);
  const [eqBands, setEqBands] = useState<EQBand[]>(INITIAL_EQ_BANDS);
  const [compressorSettings, setCompressorSettings] = useState<CompressorSettings>(INITIAL_COMPRESSOR);
  const [gainReduction, setGainReduction] = useState(0);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return;
    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#3b82f6',
      progressColor: '#06b6d4',
      cursorColor: '#06b6d4',
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 2,
      height: 100,
      barGap: 2
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

  // File upload handler with proper analysis
  const handleFilesAdded = useCallback((newFiles: AudioFile[]) => {
    if (onFilesAdded) {
      onFilesAdded(newFiles);
    }
    toast.success(`Added ${newFiles.length} file(s) to player`);
  }, [onFilesAdded]);

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
      console.log('Auto-playing file from track list:', autoPlayFile.name);
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
            // Create source only once per element
            try {
              const source = audioContext.createMediaElementSource(backend);
              audioSourceRef.current = source;

              // Connect: source -> EQ filters -> compressor -> gain -> analyser -> destination
              let currentNode: AudioNode = source;
              eqFiltersRef.current.forEach(filter => {
                currentNode.connect(filter);
                currentNode = filter;
              });
              if (compressorNodeRef.current) {
                currentNode.connect(compressorNodeRef.current);
                currentNode = compressorNodeRef.current;
              }
              if (gainNodeRef.current) {
                currentNode.connect(gainNodeRef.current);
                currentNode = gainNodeRef.current;
              }
              if (analyserNodeRef.current) {
                gainNodeRef.current!.connect(analyserNodeRef.current);
                analyserNodeRef.current.connect(audioContext.destination);
              }
              console.log('✅ Web Audio API graph connected');
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

  // Update volume
  useEffect(() => {
    if (!gainNodeRef.current) return;
    const audioContext = getAudioContext();
    if (!audioContext) return;
    gainNodeRef.current.gain.setValueAtTime(volume, audioContext.currentTime);
  }, [volume]);

  // Monitor gain reduction
  useEffect(() => {
    if (!compressorNodeRef.current || !isPlaying) return;
    const interval = setInterval(() => {
      if (compressorNodeRef.current) {
        setGainReduction(compressorNodeRef.current.reduction);
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
    newBands[index] = {
      ...newBands[index],
      gain
    };
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
  return <div className="space-y-6 p-6">
      {/* Upload Zone with Terms & Conditions */}
      <MediaPlayerUpload onFilesAdded={handleFilesAdded} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Player Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Waveform Player */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
                <span className="text-2xl">🎵</span>
                {currentFile ? currentFile.name : 'No track loaded'}
              </h3>
              {currentFile && <Button variant="outline" size="icon" onClick={handleDeleteFile} className="bg-red-900/20 border-red-700 hover:bg-red-900/40 text-red-400">
                  <Trash2 className="h-4 w-4" />
                </Button>}
            </div>

            {/* Waveform */}
            <div ref={waveformRef} className="mb-6 rounded-lg overflow-hidden border border-slate-700" />

            {/* Timeline */}
            <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
              <span className="font-mono">{formatTime(currentTime)}</span>
              <span className="font-mono">{formatTime(duration)}</span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button variant="outline" size="icon" onClick={handleSkipBackward} disabled={!currentFile} className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white">
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button variant="default" size="icon" onClick={handlePlayPause} disabled={!currentFile} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-14 w-14">
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>

              <Button variant="outline" size="icon" onClick={handleSkipForward} disabled={!currentFile} className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white">
                <SkipForward className="h-5 w-5" />
              </Button>

              <Button variant="outline" size="icon" onClick={() => setLoop(!loop)} className={`${loop ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-white'} border-slate-600 hover:bg-slate-700`}>
                <Repeat className="h-5 w-5" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-4">
              <Volume2 className="h-5 w-5 text-cyan-400" />
              <Slider value={[volume]} min={0} max={1} step={0.01} onValueChange={v => setVolume(v[0])} className="flex-1" />
              <span className="text-sm text-slate-400 font-mono min-w-[50px] text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </Card>

          {/* EQ */}
          <TenBandEqualizer bands={eqBands} onBandChange={handleEQBandChange} onReset={handleEQReset} />

          {/* Compressor */}
          <DynamicsCompressorControls settings={compressorSettings} gainReduction={gainReduction} onSettingsChange={settings => setCompressorSettings({
          ...compressorSettings,
          ...settings
        })} />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Visualizer */}
          <AudioVisualizer analyserNode={analyserNodeRef.current} isPlaying={isPlaying} />

          {/* Playlist */}
          <PlaylistPanel 
            files={files} 
            currentFileId={currentFile?.id || null} 
            onFileSelect={setCurrentFile}
            onFileDelete={onFileDelete}
          />

          {/* Fun Spectrum Visualizer */}
          <FunSpectrumVisualizer analyserNode={analyserNodeRef.current} isPlaying={isPlaying} />
        </div>
      </div>
    </div>;
};