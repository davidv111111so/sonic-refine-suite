import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Upload,
  Maximize2,
  Minimize2,
  Settings,
  Activity,
  Music,
  Video,
  ListMusic,
  Waves,
  Sliders,
  Zap,
  Radio,
  Wand2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileAudio,
  Info
} from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import {
  getAudioContext,
  resumeAudioContext,
} from "@/utils/audioContextManager";
import { AudioFile } from "@/types/audio";
import { TenBandEqualizer, EQBand } from "./TenBandEqualizer";
import {
  DynamicsCompressorControls,
  CompressorSettings,
} from "./DynamicsCompressorControls";
import { PlaylistPanel } from "./PlaylistPanel";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { LevelLogo } from "@/components/LevelLogo";
import { VisualizerDisplay, VisualizerMode } from "./VisualizerDisplay";
import { FunSpectrumVisualizer } from "./FunSpectrumVisualizer";
import { AudioEffectsControls, AudioEffectsSettings } from "./AudioEffectsControls";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/utils/formatters";

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
];

const INITIAL_COMPRESSOR: CompressorSettings = {
  threshold: -10,
  ratio: 3,
  attack: 0.003,
  release: 0.25,
  enabled: false,
};

const INITIAL_EFFECTS: AudioEffectsSettings = {
  reverbMix: 0,
  delayTime: 0.25,
  delayFeedback: 0.3,
  delayMix: 0,
  pitch: 1,
  preservesPitch: true,
  distortionAmount: 0,
  filterType: 'none',
  filterFreq: 20000,
  filterQ: 1,
  pan: 0,
  enabled: false,
};

type PanelTab = 'eq' | 'visualizer' | 'dynamics' | 'effects' | 'data';

// Helper to safely get or create MediaElementSourceNode
const getOrCreateMediaElementSource = (audioContext: AudioContext, mediaElement: HTMLMediaElement): MediaElementAudioSourceNode => {
  // Check if source already exists on the element
  const existingSource = (mediaElement as any)._source;
  if (existingSource) {
    return existingSource;
  }

  // Create new source and attach it to the element
  const source = audioContext.createMediaElementSource(mediaElement);
  (mediaElement as any)._source = source;
  return source;
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

  // Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState<PanelTab>('eq');
  const [isPlaylistCollapsed, setIsPlaylistCollapsed] = useState(false);

  // Trickplay Visibility
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Advanced controls
  const [limiterEnabled, setLimiterEnabled] = useState(true);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');

  const [eqBands, setEqBands] = useState<EQBand[]>(INITIAL_EQ_BANDS);
  const [compressorSettings, setCompressorSettings] = useState<CompressorSettings>(INITIAL_COMPRESSOR);
  const [effectsSettings, setEffectsSettings] = useState<AudioEffectsSettings>(INITIAL_EFFECTS);
  const [gainReduction, setGainReduction] = useState(0);

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Audio Nodes
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const limiterNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Effects Nodes
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayFeedbackNodeRef = useRef<GainNode | null>(null);
  const delayDryNodeRef = useRef<GainNode | null>(null);
  const delayWetNodeRef = useRef<GainNode | null>(null);

  const reverbNodeRef = useRef<ConvolverNode | null>(null);
  const reverbDryNodeRef = useRef<GainNode | null>(null);
  const reverbWetNodeRef = useRef<GainNode | null>(null);

  const distortionNodeRef = useRef<WaveShaperNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);

  const isVideo = currentFile?.fileType === 'mp4' || currentFile?.fileType === 'm4v' || currentFile?.fileType === 'mov' || currentFile?.fileType === 'webm';

  const shouldAutoPlayRef = useRef(false);

  // Make distortion curve
  const makeDistortionCurve = (amount: number) => {
    const k = (amount / 100) * 20;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  };

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || isVideo) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "hsl(var(--primary))",
      progressColor: "hsl(var(--accent))",
      cursorColor: "hsl(var(--accent))",
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 2,
      height: 100,
      barGap: 2,
      backend: 'MediaElement', // Use MediaElement to allow us to tap into it easily
    });

    wavesurferRef.current = ws;

    // Set crossOrigin on the media element created by WaveSurfer
    const media = ws.getMediaElement();
    if (media) {
      media.crossOrigin = "anonymous";
    }


    ws.on("ready", () => {
      setDuration(ws.getDuration());
    });

    ws.on("audioprocess", () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on("finish", () => {
      setIsPlaying(false);
    });

    return () => {
      ws.destroy();
    };
  }, [isVideo]);

  // File upload handler
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newAudioFiles: AudioFile[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        size: file.size,
        type: file.type,
        originalFile: file,
        status: "uploaded" as const,
        fileType: file.name.split(".").pop()?.toLowerCase() as any,
      }));

      if (onFilesAdded) {
        onFilesAdded(newAudioFiles);
      }

      toast.success(`Added ${acceptedFiles.length} file(s) to player`);
    },
    [onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".flac", ".m4a", ".ogg"],
      "video/*": [".mp4", ".m4v", ".mov", ".webm"],
    },
    multiple: true,
    noClick: true, // We handle click manually for the button, but drag works everywhere
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

    // Create compressor
    if (!compressorNodeRef.current) {
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = compressorSettings.threshold;
      compressor.ratio.value = compressorSettings.ratio;
      compressor.attack.value = compressorSettings.attack;
      compressor.release.value = compressorSettings.release;
      compressorNodeRef.current = compressor;
    }

    // Create master limiter
    if (!limiterNodeRef.current) {
      const limiter = audioContext.createDynamicsCompressor();
      limiter.threshold.value = -0.5;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.001;
      limiter.release.value = 0.1;
      limiterNodeRef.current = limiter;
    }

    // Create EQ filters
    if (eqFiltersRef.current.length === 0) {
      eqBands.forEach((band, index) => {
        const filter = audioContext.createBiquadFilter();
        if (index === 0) filter.type = "lowshelf";
        else if (index === eqBands.length - 1) filter.type = "highshelf";
        else filter.type = "peaking";
        filter.frequency.value = band.frequency;
        filter.gain.value = band.gain;
        filter.Q.value = 1.0;
        eqFiltersRef.current.push(filter);
      });
    }

    // Initialize Effects Nodes
    if (!delayNodeRef.current) {
      const delay = audioContext.createDelay(5.0);
      const feedback = audioContext.createGain();
      const dry = audioContext.createGain();
      const wet = audioContext.createGain();

      delay.delayTime.value = effectsSettings.delayTime;
      feedback.gain.value = effectsSettings.delayFeedback;
      dry.gain.value = 1 - effectsSettings.delayMix;
      wet.gain.value = effectsSettings.delayMix;

      delay.connect(feedback);
      feedback.connect(delay);

      delayNodeRef.current = delay;
      delayFeedbackNodeRef.current = feedback;
      delayDryNodeRef.current = dry;
      delayWetNodeRef.current = wet;
    }

    if (!reverbNodeRef.current) {
      const convolver = audioContext.createConvolver();
      const dry = audioContext.createGain();
      const wet = audioContext.createGain();

      const rate = audioContext.sampleRate;
      const length = rate * 2;
      const decay = 2.0;
      const impulse = audioContext.createBuffer(2, length, rate);
      const impulseL = impulse.getChannelData(0);
      const impulseR = impulse.getChannelData(1);
      for (let i = 0; i < length; i++) {
        const n = length - i;
        impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
      convolver.buffer = impulse;

      dry.gain.value = 1 - effectsSettings.reverbMix;
      wet.gain.value = effectsSettings.reverbMix;

      reverbNodeRef.current = convolver;
      reverbDryNodeRef.current = dry;
      reverbWetNodeRef.current = wet;
    }

    if (!distortionNodeRef.current) {
      const dist = audioContext.createWaveShaper();
      dist.curve = makeDistortionCurve(effectsSettings.distortionAmount);
      dist.oversample = '4x';
      distortionNodeRef.current = dist;
    }

    if (!filterNodeRef.current) {
      const filter = audioContext.createBiquadFilter();
      filter.type = effectsSettings.filterType === 'none' ? 'allpass' : effectsSettings.filterType;
      filter.frequency.value = effectsSettings.filterFreq;
      filter.Q.value = effectsSettings.filterQ;
      filterNodeRef.current = filter;
    }

    if (!pannerNodeRef.current) {
      const panner = audioContext.createStereoPanner();
      panner.pan.value = effectsSettings.pan;
      pannerNodeRef.current = panner;
    }

  }, []);

  // Auto-play file
  useEffect(() => {
    if (autoPlayFile && autoPlayFile.id !== currentFile?.id) {
      shouldAutoPlayRef.current = true;
      setCurrentFile(autoPlayFile);
      if (onAutoPlayComplete) {
        onAutoPlayComplete();
      }
    }
  }, [autoPlayFile, currentFile, onAutoPlayComplete]);

  // Async Analysis Effect
  useEffect(() => {
    if (!currentFile) return;

    // Simulate async analysis
    const analyze = async () => {
      // If already analyzed, skip
      if (currentFile.bpm && currentFile.harmonicKey) return;

      // Wait for 2 seconds to simulate analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock results
      const mockBpm = Math.floor(Math.random() * (140 - 110) + 110);
      const keys = ['1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A', '1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B'];
      const mockKey = keys[Math.floor(Math.random() * keys.length)];

      toast.success(`Analysis Complete: ${mockBpm} BPM, Key ${mockKey}`);
    };

    analyze();
  }, [currentFile]);

  // Load file and connect graph
  useEffect(() => {
    if (!currentFile) return;

    const loadMedia = async () => {
      try {
        const url = currentFile.enhancedUrl || currentFile.originalUrl;
        const audioContext = getAudioContext();
        let mediaElement: HTMLMediaElement | null = null;

        if (isVideo) {
          if (videoRef.current) {
            videoRef.current.src = url || '';
            videoRef.current.load();
            mediaElement = videoRef.current;
          }
        } else {
          if (wavesurferRef.current) {
            await wavesurferRef.current.load(url || '');
            mediaElement = wavesurferRef.current.getMediaElement();
          }
        }

        if (audioContext && mediaElement) {
          try {
            // Ensure context is running if we are about to play
            if (shouldAutoPlayRef.current && audioContext.state === 'suspended') {
              await audioContext.resume();
            }

            // Use helper to safely get or create source
            const source = getOrCreateMediaElementSource(audioContext, mediaElement);
            audioSourceRef.current = source;

            // Build audio graph
            let currentNode: AudioNode = source;

            // 1. EQ Chain
            eqFiltersRef.current.forEach((filter) => {
              currentNode.connect(filter);
              currentNode = filter;
            });

            // 2. Distortion
            if (distortionNodeRef.current) {
              currentNode.connect(distortionNodeRef.current);
              currentNode = distortionNodeRef.current;
            }

            // 3. Filter
            if (filterNodeRef.current) {
              currentNode.connect(filterNodeRef.current);
              currentNode = filterNodeRef.current;
            }

            // 4. Panner
            if (pannerNodeRef.current) {
              currentNode.connect(pannerNodeRef.current);
              currentNode = pannerNodeRef.current;
            }

            // 5. Delay
            if (delayNodeRef.current && delayDryNodeRef.current && delayWetNodeRef.current && delayFeedbackNodeRef.current) {
              const input = currentNode;
              const output = audioContext.createGain();

              // Dry path
              input.connect(delayDryNodeRef.current);
              delayDryNodeRef.current.connect(output);

              // Wet path
              input.connect(delayNodeRef.current);
              delayNodeRef.current.connect(delayWetNodeRef.current);
              delayWetNodeRef.current.connect(output);

              currentNode = output;
            }

            // 6. Reverb
            if (reverbNodeRef.current && reverbDryNodeRef.current && reverbWetNodeRef.current) {
              const input = currentNode;
              const output = audioContext.createGain();

              // Dry path
              input.connect(reverbDryNodeRef.current);
              reverbDryNodeRef.current.connect(output);

              // Wet path
              input.connect(reverbNodeRef.current);
              reverbNodeRef.current.connect(reverbWetNodeRef.current);
              reverbWetNodeRef.current.connect(output);

              currentNode = output;
            }

            // 7. Compressor
            if (compressorNodeRef.current) {
              currentNode.connect(compressorNodeRef.current);
              currentNode = compressorNodeRef.current;
            }

            // 8. Gain (Volume)
            if (gainNodeRef.current) {
              currentNode.connect(gainNodeRef.current);
              currentNode = gainNodeRef.current;
            }

            // 9. Master Limiter
            if (limiterNodeRef.current && limiterEnabled) {
              gainNodeRef.current!.connect(limiterNodeRef.current);
              currentNode = limiterNodeRef.current;
            }

            // 10. Analyser & Destination
            if (analyserNodeRef.current) {
              currentNode.connect(analyserNodeRef.current);
              analyserNodeRef.current.connect(audioContext.destination);
            } else {
              currentNode.connect(audioContext.destination);
            }

            console.log("✅ Audio graph connected");

            // Handle Auto Play
            if (shouldAutoPlayRef.current) {
              console.log("▶ Auto-playing track...");
              // Double check context state
              if (audioContext.state === 'suspended') {
                await audioContext.resume();
              }

              if (isVideo && videoRef.current) {
                await videoRef.current.play();
              } else if (wavesurferRef.current) {
                await wavesurferRef.current.play();
              }
              setIsPlaying(true);
              shouldAutoPlayRef.current = false;
            } else {
              setIsPlaying(false);
            }

          } catch (e) {
            console.warn("Error connecting audio graph:", e);
          }
        }
        toast.success(`Loaded: ${currentFile.name}`);
      } catch (error) {
        console.error("Failed to load media:", error);
        toast.error("Failed to load media file");
      }
    };

    loadMedia();
  }, [currentFile, isVideo]);

  // Update Effects Parameters
  useEffect(() => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // EQ
    eqFiltersRef.current.forEach((filter, index) => {
      if (eqBands[index]) {
        filter.gain.setValueAtTime(eqBands[index].gain, ctx.currentTime);
      }
    });

    // Compressor
    if (compressorNodeRef.current) {
      const c = compressorNodeRef.current;
      c.threshold.setValueAtTime(compressorSettings.threshold, ctx.currentTime);
      c.ratio.setValueAtTime(compressorSettings.ratio, ctx.currentTime);
      c.attack.setValueAtTime(compressorSettings.attack, ctx.currentTime);
      c.release.setValueAtTime(compressorSettings.release, ctx.currentTime);
    }

    // Delay
    if (delayNodeRef.current && delayFeedbackNodeRef.current && delayDryNodeRef.current && delayWetNodeRef.current) {
      delayNodeRef.current.delayTime.setValueAtTime(effectsSettings.delayTime, ctx.currentTime);
      delayFeedbackNodeRef.current.gain.setValueAtTime(effectsSettings.delayFeedback, ctx.currentTime);
      delayDryNodeRef.current.gain.setValueAtTime(1 - effectsSettings.delayMix, ctx.currentTime);
      delayWetNodeRef.current.gain.setValueAtTime(effectsSettings.delayMix, ctx.currentTime);
    }

    // Reverb
    if (reverbDryNodeRef.current && reverbWetNodeRef.current) {
      reverbDryNodeRef.current.gain.setValueAtTime(1 - effectsSettings.reverbMix, ctx.currentTime);
      reverbWetNodeRef.current.gain.setValueAtTime(effectsSettings.reverbMix, ctx.currentTime);
    }

    // Distortion
    if (distortionNodeRef.current) {
      distortionNodeRef.current.curve = makeDistortionCurve(effectsSettings.distortionAmount);
    }

    // Filter
    if (filterNodeRef.current) {
      filterNodeRef.current.type = effectsSettings.filterType === 'none' ? 'allpass' : effectsSettings.filterType;
      filterNodeRef.current.frequency.setValueAtTime(effectsSettings.filterFreq, ctx.currentTime);
      filterNodeRef.current.Q.setValueAtTime(effectsSettings.filterQ, ctx.currentTime);
    }

    // Panner
    if (pannerNodeRef.current) {
      pannerNodeRef.current.pan.setValueAtTime(effectsSettings.pan, ctx.currentTime);
    }

    // Playback Rate (Pitch)
    if (isVideo && videoRef.current) {
      videoRef.current.playbackRate = effectsSettings.pitch;
      videoRef.current.preservesPitch = effectsSettings.preservesPitch;
    } else if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(effectsSettings.pitch, effectsSettings.preservesPitch);
    }

  }, [eqBands, compressorSettings, effectsSettings, isVideo]);

  // Update volume
  useEffect(() => {
    if (!gainNodeRef.current) return;
    const audioContext = getAudioContext();
    if (!audioContext) return;
    gainNodeRef.current.gain.setValueAtTime(volume, audioContext.currentTime);
  }, [volume]);

  // Video Time Update
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  // Visibility Timeout
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 8000);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimeout();
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const handlePlayPause = async () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }

      if (isVideo && videoRef.current) {
        if (videoRef.current.paused) {
          await videoRef.current.play();
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      } else if (wavesurferRef.current) {
        if (wavesurferRef.current.isPlaying()) {
          wavesurferRef.current.pause();
          setIsPlaying(false);
        } else {
          await wavesurferRef.current.play();
          setIsPlaying(true);
        }
      } else {
        console.warn("No media element ready to play");
      }
    } catch (error) {
      console.error("Playback error:", error);
      toast.error("Playback failed. Please try again.");
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
    const newTime = Math.max(0, currentTime - 10);
    if (isVideo && videoRef.current) {
      videoRef.current.currentTime = newTime;
    } else if (wavesurferRef.current) {
      wavesurferRef.current.seekTo(newTime / duration);
    }
  };

  const handleSkipForward = () => {
    const newTime = Math.min(duration, currentTime + 10);
    if (isVideo && videoRef.current) {
      videoRef.current.currentTime = newTime;
    } else if (wavesurferRef.current) {
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
    toast.success("EQ reset to flat");
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Drag and Drop from Playlist
  const handlePlayerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (data) {
      try {
        const file = JSON.parse(data) as AudioFile;
        if (file && file.id) {
          shouldAutoPlayRef.current = true;
          setCurrentFile(file);
        }
      } catch (err) {
        console.error("Failed to parse dropped file data", err);
      }
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-200 overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = '/'}
              className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <LevelLogo size="md" showIcon={true} />
          </div>

          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={cn(
              "group relative px-6 py-2 rounded-full border transition-all duration-300 overflow-hidden",
              isPanelOpen
                ? "bg-cyan-950 border-cyan-500/50 text-cyan-400"
                : "bg-slate-900 border-slate-700 text-slate-200 hover:text-white"
            )}
          >
            <div className={cn("absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 transition-opacity duration-500", isPanelOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100")} />
            <div className="relative flex items-center gap-2">
              <Settings className={cn("h-4 w-4 transition-colors", isPanelOpen ? "text-cyan-400" : "text-slate-400 group-hover:text-white")} />
              <span className="font-bold tracking-wide">CONFIG</span>
            </div>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Side Panel (Push/Overlay) */}
        <div
          className={cn(
            "bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out z-40",
            isPanelOpen ? "w-[450px] translate-x-0" : "w-0 -translate-x-full opacity-0 overflow-hidden"
          )}
        >
          <div className="flex-1 flex min-h-0">
            {/* Sidebar Menu */}
            <div className="w-16 border-r border-slate-800 bg-slate-900/50 flex flex-col items-center py-6 gap-6 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActivePanelTab('effects')}
                className={cn("rounded-xl w-10 h-10 transition-all", activePanelTab === 'effects' ? "bg-pink-500/20 text-pink-400" : "text-slate-400 hover:text-white hover:bg-slate-800")}
                title="Effects"
              >
                <Wand2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActivePanelTab('dynamics')}
                className={cn("rounded-xl w-10 h-10 transition-all", activePanelTab === 'dynamics' ? "bg-purple-500/20 text-purple-400" : "text-slate-400 hover:text-white hover:bg-slate-800")}
                title="Dynamics"
              >
                <Zap className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActivePanelTab('eq')}
                className={cn("rounded-xl w-10 h-10 transition-all", activePanelTab === 'eq' ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-white hover:bg-slate-800")}
                title="Equalizer"
              >
                <Sliders className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActivePanelTab('visualizer')}
                className={cn("rounded-xl w-10 h-10 transition-all", activePanelTab === 'visualizer' ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-white hover:bg-slate-800")}
                title="Visualizer"
              >
                <Activity className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActivePanelTab('data')}
                className={cn("rounded-xl w-10 h-10 transition-all", activePanelTab === 'data' ? "bg-orange-500/20 text-orange-400" : "text-slate-400 hover:text-white hover:bg-slate-800")}
                title="Data & Analytics"
              >
                <Info className="w-5 h-5" />
              </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 min-w-0">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white capitalize">{activePanelTab === 'data' ? 'Data & Analytics' : activePanelTab}</h2>
                <p className="text-sm text-slate-400">Configure {activePanelTab} settings</p>
              </div>

              {activePanelTab === 'eq' && (
                <TenBandEqualizer
                  bands={eqBands}
                  onBandChange={handleEQBandChange}
                  onReset={handleEQReset}
                />
              )}

              {activePanelTab === 'visualizer' && (
                <div className="h-[300px]">
                  <VisualizerDisplay
                    analyserNode={analyserNodeRef.current}
                    isPlaying={isPlaying}
                    mode={visualizerMode}
                    onModeChange={setVisualizerMode}
                  />
                </div>
              )}

              {activePanelTab === 'effects' && (
                <AudioEffectsControls
                  settings={effectsSettings}
                  onSettingsChange={(s) => setEffectsSettings({ ...effectsSettings, ...s })}
                />
              )}

              {activePanelTab === 'dynamics' && (
                <div className="space-y-6">
                  <DynamicsCompressorControls
                    settings={compressorSettings}
                    gainReduction={gainReduction}
                    onSettingsChange={(s) => setCompressorSettings({ ...compressorSettings, ...s })}
                  />
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <Label>Master Limiter</Label>
                    <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-slate-200">Safety Limiter</span>
                        <p className="text-xs text-slate-500">Prevents clipping at -0.5dB</p>
                      </div>
                      <Button
                        size="sm"
                        variant={limiterEnabled ? "default" : "outline"}
                        onClick={() => setLimiterEnabled(!limiterEnabled)}
                        className={limiterEnabled ? "bg-emerald-600 hover:bg-emerald-500" : ""}
                      >
                        {limiterEnabled ? "ACTIVE" : "BYPASSED"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activePanelTab === 'data' && (
                <div className="space-y-6">
                  <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <FileAudio className="w-4 h-4 text-cyan-400" />
                      File Information
                    </h3>
                    {currentFile ? (
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 block">Name</span>
                          <span className="text-slate-200 truncate block" title={currentFile.name}>{currentFile.name}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Type</span>
                          <span className="text-slate-200 uppercase">{currentFile.fileType || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Size</span>
                          <span className="text-slate-200">{(currentFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Duration</span>
                          <span className="text-slate-200">{formatDuration(duration)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No file loaded</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Player & Playlist Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-black/20 min-h-0">
          {/* Top: Player (Video/Waveform) */}
          <div
            className="flex-1 min-h-0 bg-black/40 relative group flex items-center justify-center overflow-hidden"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handlePlayerDrop}
            onMouseMove={resetControlsTimeout}
            {...getRootProps()}
          >
            <input {...getInputProps()} />

            {currentFile ? (
              isVideo ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  onClick={handlePlayPause}
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full max-w-4xl px-8">
                  <div className="flex items-center justify-center mb-12">
                    <div className="w-64 h-64 rounded-full bg-gradient-to-br from-cyan-500/10 to-purple-600/10 flex items-center justify-center animate-pulse-slow border border-white/5">
                      <Music className="w-32 h-32 text-cyan-400/50" />
                    </div>
                  </div>
                  <div ref={waveformRef} className="opacity-80 hover:opacity-100 transition-opacity" />
                </div>
              )
            ) : (
              <div className="text-center text-slate-500">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 shadow-2xl shadow-cyan-900/20 group-hover:scale-110 transition-transform duration-500">
                  <Upload className="w-10 h-10 text-cyan-400 opacity-50" />
                </div>
                <h2 className="text-2xl font-bold text-slate-200 mb-2">Upload Media</h2>
                <p className="text-slate-400 max-w-md mx-auto">
                  Drag & drop audio or video files here, or click to browse.
                  <br />
                  <span className="text-xs text-slate-600 mt-2 block">Supports MP3, WAV, FLAC, MP4, MOV</span>
                </p>
                <Button
                  variant="outline"
                  className="mt-8 border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/30"
                  onClick={open}
                >
                  Select Files
                </Button>
              </div>
            )}

            {/* Overlay Play Button */}
            {currentFile && (
              <div className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
                showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
              )}>
                <Button
                  size="icon"
                  className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 pointer-events-auto scale-90 hover:scale-100 transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPause();
                  }}
                >
                  {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
                </Button>
              </div>
            )}

            {/* Transport Bar Overlay */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-20 transition-opacity duration-500",
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
              <div className="max-w-5xl mx-auto w-full space-y-4 pointer-events-auto">
                {/* Progress */}
                <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
                  <span>{formatTime(currentTime)}</span>
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={(v) => {
                      const newTime = v[0];
                      if (isVideo && videoRef.current) videoRef.current.currentTime = newTime;
                      if (!isVideo && wavesurferRef.current) wavesurferRef.current.seekTo(newTime / duration);
                      setCurrentTime(newTime);
                    }}
                    className="flex-1 cursor-pointer"
                  />
                  <span>{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={handleSkipBackward} className="text-slate-300 hover:text-white hover:bg-white/10">
                        <SkipBack className="w-5 h-5" />
                      </Button>
                      <Button
                        size="icon"
                        className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black"
                        onClick={handlePlayPause}
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleSkipForward} className="text-slate-300 hover:text-white hover:bg-white/10">
                        <SkipForward className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="h-8 w-px bg-white/10 mx-2" />

                    <div>
                      <h3 className="font-medium text-white text-sm">{currentFile?.name || "No Track"}</h3>
                      <p className="text-xs text-slate-400">{currentFile?.fileType?.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-32 group/vol">
                      <Volume2 className="w-4 h-4 text-slate-400 group-hover/vol:text-white" />
                      <Slider
                        value={[volume]}
                        max={1}
                        step={0.01}
                        onValueChange={(v) => setVolume(v[0])}
                        className="opacity-50 group-hover/vol:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Playlist (Fixed Height) */}
          <div
            className={cn(
              "bg-slate-900 border-t border-slate-800 flex flex-col transition-all duration-300 ease-in-out shrink-0",
              isPlaylistCollapsed ? "h-12" : "h-[500px]"
            )}
          >
            <div className="p-2 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 h-12 shrink-0">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPlaylistCollapsed(!isPlaylistCollapsed)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                >
                  {isPlaylistCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
                <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-cyan-400" />
                  Playlist
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div
                  onClick={open}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 cursor-pointer transition-colors"
                >
                  <Upload className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-400">Add Files</span>
                </div>
              </div>
            </div>

            <div className={cn("flex-1 overflow-hidden transition-opacity duration-300", isPlaylistCollapsed ? "opacity-0" : "opacity-100")}>
              <PlaylistPanel
                files={files}
                currentFileId={currentFile?.id || null}
                onFileSelect={(file) => {
                  shouldAutoPlayRef.current = true;
                  setCurrentFile(file);
                }}
                onFileDelete={onFileDelete}
                onClearAll={() => { }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
