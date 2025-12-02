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
  Settings,
  Activity,
  Music,
  ListMusic,
  Wand2,
  Zap,
  Sliders,
  ChevronUp,
  ChevronDown,
  FileAudio,
  Info,
  ChevronLeft
} from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import {
  getAudioContext,
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
import { AudioEffectsControls, AudioEffectsSettings } from "./AudioEffectsControls";
import { VideoEffectsControls, VideoEffectsSettings, INITIAL_VIDEO_EFFECTS } from "./VideoEffectsControls";
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

type PanelTab = 'eq' | 'visualizer' | 'dynamics' | 'effects' | 'data' | null;

// Helper to safely get or create MediaElementSourceNode
const getOrCreateMediaElementSource = (audioContext: AudioContext, mediaElement: HTMLMediaElement): MediaElementAudioSourceNode => {
  const existingSource = (mediaElement as any)._source;
  if (existingSource) {
    return existingSource;
  }
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
  // Playback State
  const [currentFile, setCurrentFile] = useState<AudioFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  // UI State
  const [activePanelTab, setActivePanelTab] = useState<PanelTab>(null);
  const [isPlaylistCollapsed, setIsPlaylistCollapsed] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Processing State
  const [limiterEnabled, setLimiterEnabled] = useState(true);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
  const [eqBands, setEqBands] = useState<EQBand[]>(INITIAL_EQ_BANDS);
  const [compressorSettings, setCompressorSettings] = useState<CompressorSettings>(INITIAL_COMPRESSOR);
  const [effectsSettings, setEffectsSettings] = useState<AudioEffectsSettings>(INITIAL_EFFECTS);
  const [videoEffects, setVideoEffects] = useState<VideoEffectsSettings>(INITIAL_VIDEO_EFFECTS);
  const [gainReduction, setGainReduction] = useState(0);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const shouldAutoPlayRef = useRef(false);

  // Audio Nodes Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const limiterNodeRef = useRef<DynamicsCompressorNode | null>(null);

  // Effects Nodes Refs
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

  // Toggle Panel Logic
  const togglePanel = (tab: PanelTab) => {
    setActivePanelTab(prev => prev === tab ? null : tab);
  };

  // Initialize Audio Context & Nodes (Once)
  useEffect(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    audioContextRef.current = ctx;

    // Create Nodes
    analyserNodeRef.current = ctx.createAnalyser();
    analyserNodeRef.current.fftSize = 2048;

    gainNodeRef.current = ctx.createGain();
    gainNodeRef.current.gain.value = volume;

    compressorNodeRef.current = ctx.createDynamicsCompressor();
    limiterNodeRef.current = ctx.createDynamicsCompressor();

    // Limiter settings
    limiterNodeRef.current.threshold.value = -0.5;
    limiterNodeRef.current.ratio.value = 20;
    limiterNodeRef.current.attack.value = 0.001;
    limiterNodeRef.current.release.value = 0.1;

    // EQ Filters
    if (eqFiltersRef.current.length === 0) {
      eqBands.forEach((band, index) => {
        const filter = ctx.createBiquadFilter();
        if (index === 0) filter.type = "lowshelf";
        else if (index === eqBands.length - 1) filter.type = "highshelf";
        else filter.type = "peaking";
        filter.frequency.value = band.frequency;
        filter.gain.value = band.gain;
        filter.Q.value = 1.0;
        eqFiltersRef.current.push(filter);
      });
    }

    // Effects Nodes
    delayNodeRef.current = ctx.createDelay();
    delayFeedbackNodeRef.current = ctx.createGain();
    delayDryNodeRef.current = ctx.createGain();
    delayWetNodeRef.current = ctx.createGain();

    reverbNodeRef.current = ctx.createConvolver();
    reverbDryNodeRef.current = ctx.createGain();
    reverbWetNodeRef.current = ctx.createGain();

    distortionNodeRef.current = ctx.createWaveShaper();
    filterNodeRef.current = ctx.createBiquadFilter();
    pannerNodeRef.current = ctx.createStereoPanner();

    // Create Impulse Response for Reverb (Simple)
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 2.0;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    if (reverbNodeRef.current) reverbNodeRef.current.buffer = impulse;

    // Create Distortion Curve
    const makeDistortionCurve = (amount: number) => {
      const k = typeof amount === 'number' ? amount : 50;
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      for (let i = 0; i < n_samples; ++i) {
        const x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
      }
      return curve;
    };
    if (distortionNodeRef.current) distortionNodeRef.current.curve = makeDistortionCurve(0);

  }, []);

  // Initialize WaveSurfer & Connect Graph
  useEffect(() => {
    if (!waveformRef.current || !videoRef.current) return;

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
      backend: 'MediaElement', // Critical for syncing with Video
      media: videoRef.current, // Use the video element as the media source
    });

    wavesurferRef.current = ws;

    ws.on('ready', () => {
      setDuration(ws.getDuration());
      if (shouldAutoPlayRef.current) {
        videoRef.current?.play().catch(console.error);
        shouldAutoPlayRef.current = false;
      }
    });

    // Connect Audio Graph
    const connectGraph = () => {
      const ctx = audioContextRef.current;
      if (!ctx || !videoRef.current) return;

      try {
        const source = getOrCreateMediaElementSource(ctx, videoRef.current);
        sourceNodeRef.current = source;

        let currentNode: AudioNode = source;

        // 1. EQ
        eqFiltersRef.current.forEach(filter => {
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
          const output = ctx.createGain();

          input.connect(delayDryNodeRef.current);
          delayDryNodeRef.current.connect(output);

          input.connect(delayNodeRef.current);
          delayNodeRef.current.connect(delayWetNodeRef.current);
          delayWetNodeRef.current.connect(output);

          currentNode = output;
        }

        // 6. Reverb
        if (reverbNodeRef.current && reverbDryNodeRef.current && reverbWetNodeRef.current) {
          const input = currentNode;
          const output = ctx.createGain();

          input.connect(reverbDryNodeRef.current);
          reverbDryNodeRef.current.connect(output);

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

        // 8. Gain
        if (gainNodeRef.current) {
          currentNode.connect(gainNodeRef.current);
          currentNode = gainNodeRef.current;
        }

        // 9. Limiter
        if (limiterNodeRef.current && limiterEnabled) {
          currentNode.connect(limiterNodeRef.current);
          currentNode = limiterNodeRef.current;
        }

        // 10. Analyser & Destination
        if (analyserNodeRef.current) {
          currentNode.connect(analyserNodeRef.current);
          analyserNodeRef.current.connect(ctx.destination);
        } else {
          currentNode.connect(ctx.destination);
        }

        console.log("✅ Audio Graph Connected");

      } catch (err) {
        console.error("Error connecting audio graph:", err);
      }
    };

    // Connect graph once media is ready (or immediately if already ready)
    if (videoRef.current.readyState >= 1) {
      connectGraph();
    } else {
      videoRef.current.addEventListener('canplay', connectGraph, { once: true });
    }

    return () => {
      ws.destroy();
    };
  }, []);

  // Load Media
  useEffect(() => {
    if (!currentFile || !videoRef.current || !wavesurferRef.current) return;

    const url = currentFile.enhancedUrl || currentFile.originalUrl;
    if (!url) return;

    console.log("Loading media:", url);
    videoRef.current.src = url;
    videoRef.current.load();
  }, [currentFile?.id]);

  // Update Effects Parameters
  useEffect(() => {
    const ctx = audioContextRef.current;
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
      // Re-calculate curve if amount changes significantly (simplified)
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

    // Playback Rate
    if (videoRef.current) {
      videoRef.current.playbackRate = effectsSettings.pitch;
      videoRef.current.preservesPitch = effectsSettings.preservesPitch;
    }

    // Volume
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, ctx.currentTime);
    }

  }, [eqBands, compressorSettings, effectsSettings, volume, limiterEnabled]);

  // Auto-play trigger
  useEffect(() => {
    if (autoPlayFile && autoPlayFile.id !== currentFile?.id) {
      shouldAutoPlayRef.current = true;
      setCurrentFile(autoPlayFile);
      if (onAutoPlayComplete) onAutoPlayComplete();
    }
  }, [autoPlayFile, currentFile, onAutoPlayComplete]);

  // Controls Visibility
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 8000);
    }
  };

  useEffect(() => {
    if (isPlaying) resetControlsTimeout();
    else {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  // Handlers
  const handlePlayPause = async () => {
    // 1. Resume Audio Context (Browser Policy)
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (err) {
        console.warn("AudioContext resume failed", err);
      }
    }

    // 2. Toggle Playback via Video Element (Source of Truth)
    if (videoRef.current) {
      if (videoRef.current.paused) {
        try {
          await videoRef.current.play();
          // State update handled by event listener
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            console.warn("Playback aborted (likely rapid toggle)");
          } else {
            console.error("Playback failed:", err);
          }
        }
      } else {
        videoRef.current.pause();
        // State update handled by event listener
      }
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  // Sync WaveSurfer with Video Element Events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Sync WaveSurfer cursor if needed
      if (wavesurferRef.current && Math.abs(wavesurferRef.current.getCurrentTime() - video.currentTime) > 0.1) {
        wavesurferRef.current.setTime(video.currentTime);
      }
    };
    const onEnded = () => setIsPlaying(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
    };
  }, []);

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
        console.error("Failed to parse dropped file", err);
      }
    }
  };

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map(file => ({
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        size: file.size,
        type: file.type,
        originalFile: file,
        originalUrl: URL.createObjectURL(file), // Generate Blob URL
        status: "uploaded" as const,
        fileType: file.name.split(".").pop()?.toLowerCase() as any,
      }));
      if (onFilesAdded) onFilesAdded(newFiles);
      toast.success(`Added ${newFiles.length} files`);
    },
    accept: { "audio/*": [], "video/*": [] },
    noClick: true,
  });

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Video Filter Style
  const videoFilterStyle = {
    filter: `brightness(${videoEffects.brightness}%) contrast(${videoEffects.contrast}%) saturate(${videoEffects.saturate}%) hue-rotate(${videoEffects.hueRotate}deg) invert(${videoEffects.invert}%) sepia(${videoEffects.sepia}%)`
  };

  return (
    <div className="flex h-[100dvh] bg-slate-950 text-slate-200 overflow-hidden" ref={containerRef}>

      {/* 1. Left Sidebar (Fixed Icons) */}
      <div className="w-16 flex flex-col items-center py-6 gap-6 border-r border-slate-800 bg-slate-950 z-50 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.location.href = '/'}
          className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full mb-4"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="w-full h-px bg-slate-800 mb-2" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => togglePanel('eq')}
          className={cn("rounded-xl w-10 h-10 transition-all", activePanelTab === 'eq' ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-white hover:bg-slate-800")}
          title="Equalizer"
        >
          <Sliders className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => togglePanel('visualizer')}
          className={cn("rounded-xl w-10 h-10 transition-all", activePanelTab === 'visualizer' ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-white hover:bg-slate-800")}
          title="Visualizer"
        >
          <Activity className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => togglePanel('dynamics')}
          className={cn("rounded-xl w-10 h-10 transition-all", activePanelTab === 'dynamics' ? "bg-purple-500/20 text-purple-400" : "text-slate-400 hover:text-white hover:bg-slate-800")}
          title="Dynamics"
        >
          <Zap className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => togglePanel('effects')}
          className={cn("rounded-xl w-10 h-10 transition-all", activePanelTab === 'effects' ? "bg-pink-500/20 text-pink-400" : "text-slate-400 hover:text-white hover:bg-slate-800")}
          title="Effects"
        >
          <Wand2 className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => togglePanel('data')}
          className={cn("rounded-xl w-10 h-10 transition-all", activePanelTab === 'data' ? "bg-orange-500/20 text-orange-400" : "text-slate-400 hover:text-white hover:bg-slate-800")}
          title="Data & Analytics"
        >
          <Info className="w-5 h-5" />
        </Button>
      </div>

      {/* 2. Expandable Panel */}
      <div
        className={cn(
          "bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out overflow-hidden flex flex-col",
          activePanelTab ? "w-[320px] opacity-100" : "w-0 opacity-0"
        )}
      >
        <div className="p-6 flex-1 overflow-y-auto min-w-[320px]">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white capitalize">{activePanelTab === 'data' ? 'Data & Analytics' : activePanelTab}</h2>
            <p className="text-sm text-slate-400">Configure {activePanelTab} settings</p>
          </div>

          {activePanelTab === 'eq' && (
            <TenBandEqualizer
              bands={eqBands}
              onBandChange={(i, g) => {
                const newBands = [...eqBands];
                newBands[i].gain = g;
                setEqBands(newBands);
              }}
              onReset={() => setEqBands(INITIAL_EQ_BANDS)}
            />
          )}

          {activePanelTab === 'visualizer' && (
            <div className="space-y-4">
              <div className="h-[200px] bg-black rounded-lg overflow-hidden border border-slate-800">
                <VisualizerDisplay
                  analyserNode={analyserNodeRef.current}
                  isPlaying={isPlaying}
                  mode={visualizerMode}
                  onModeChange={setVisualizerMode}
                />
              </div>
            </div>
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

          {activePanelTab === 'effects' && (
            <div className="space-y-8">
              <AudioEffectsControls
                settings={effectsSettings}
                onSettingsChange={(s) => setEffectsSettings({ ...effectsSettings, ...s })}
              />
              <div className="pt-6 border-t border-slate-800">
                <VideoEffectsControls
                  settings={videoEffects}
                  onSettingsChange={(s) => setVideoEffects({ ...videoEffects, ...s })}
                  onReset={() => setVideoEffects(INITIAL_VIDEO_EFFECTS)}
                />
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

      {/* 3. Main Content Area (Player + Playlist) */}
      <div className="flex-1 flex flex-col min-w-0 bg-black/20 relative">

        {/* Player Area */}
        <div
          className="flex-1 min-h-0 bg-black/40 relative group flex items-center justify-center overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handlePlayerDrop}
          onMouseMove={resetControlsTimeout}
          {...getRootProps()}
        >
          <input {...getInputProps()} />

          {/* Video Element (Always present, acts as audio source too) */}
          <video
            ref={videoRef}
            className={cn(
              "w-full h-full object-contain transition-all duration-300",
              !isVideo && "hidden" // Hide video element if audio file, but keep it in DOM for WaveSurfer
            )}
            style={videoFilterStyle}
            crossOrigin="anonymous"
            playsInline
          />

          {/* Audio Visualization (Waveform) */}
          {!isVideo && currentFile && (
            <div className="w-full max-w-4xl px-8 absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-64 h-64 rounded-full bg-gradient-to-br from-cyan-500/10 to-purple-600/10 flex items-center justify-center animate-pulse-slow border border-white/5 mb-12">
                <Music className="w-32 h-32 text-cyan-400/50" />
              </div>
            </div>
          )}

          {/* WaveSurfer Container (Overlay) */}
          <div
            ref={waveformRef}
            className={cn(
              "absolute bottom-0 left-0 right-0 h-[100px] opacity-80 hover:opacity-100 transition-opacity z-10 pointer-events-auto",
              isVideo && "hidden" // Hide waveform for video
            )}
          />

          {/* Empty State */}
          {!currentFile && (
            <div className="text-center text-slate-500 z-20 pointer-events-none">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 shadow-2xl shadow-cyan-900/20">
                <Upload className="w-10 h-10 text-cyan-400 opacity-50" />
              </div>
              <h2 className="text-2xl font-bold text-slate-200 mb-2">Upload Media</h2>
              <p className="text-slate-400 max-w-md mx-auto mb-8">
                Drag & drop audio or video files here
              </p>
              <Button
                variant="outline"
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/30 pointer-events-auto"
                onClick={open}
              >
                Select Files
              </Button>
            </div>
          )}

          {/* Overlay Play Button */}
          {currentFile && (
            <div className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-300 z-30 pointer-events-none",
              showControls || !isPlaying ? "opacity-100" : "opacity-0"
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

          {/* Transport Bar */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-20 transition-opacity duration-500 z-40",
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
                    if (videoRef.current) videoRef.current.currentTime = v[0];
                  }}
                  className="flex-1 cursor-pointer"
                />
                <span>{formatTime(duration)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleSkip(-10)} className="text-slate-300 hover:text-white hover:bg-white/10">
                      <SkipBack className="w-5 h-5" />
                    </Button>
                    <Button
                      size="icon"
                      className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black"
                      onClick={handlePlayPause}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleSkip(10)} className="text-slate-300 hover:text-white hover:bg-white/10">
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

        {/* Playlist (Collapsible) */}
        <div
          className={cn(
            "bg-slate-900 border-t border-slate-800 flex flex-col transition-all duration-300 ease-in-out shrink-0 z-50",
            isPlaylistCollapsed ? "h-12" : "h-[300px]"
          )}
        >
          <div className="p-2 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 h-12 shrink-0 relative">
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

            {/* Branding */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
              <LevelLogo size="lg" showIcon={true} />
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
  );
};
