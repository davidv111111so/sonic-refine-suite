import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Repeat,
  Trash2,
  ExternalLink
} from "lucide-react";
// WaveSurfer removed
import { DetailWaveform } from "../mixer/DetailWaveform";
import { SpectralWaveform } from "../mixer/SpectralWaveform";
import {
  getAudioContext,
} from "@/utils/audioContextManager";
import { AudioFile } from "@/types/audio";
import { TenBandEqualizer, EQBand } from "./TenBandEqualizer";
import {
  DynamicsCompressorControls,
  CompressorSettings,
} from "./DynamicsCompressorControls";
import { VisualizerDisplay, VisualizerMode } from "./VisualizerDisplay";
import { PlaylistPanel } from "./PlaylistPanel";
import { MediaPlayerUpload } from "./MediaPlayerUpload";
import { AudioEffectsControls, AudioEffectsSettings } from "./AudioEffectsControls";
import { toast } from "sonner";
import { usePlayer } from "@/contexts/PlayerContext";

interface LevelMediaPlayerProps {
  files: AudioFile[];
  onFilesAdded?: (files: AudioFile[]) => void;
  onFileDelete?: (fileId: string) => void;
  autoPlayFile?: AudioFile | null;
  onAutoPlayComplete?: () => void;
  onClearAll?: () => void;
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

export const LevelMediaPlayer: React.FC<LevelMediaPlayerProps> = ({
  files,
  onFilesAdded,
  onFileDelete,
  autoPlayFile,
  onAutoPlayComplete,
  onClearAll,
}) => {
  // Use Global Player Context
  const {
    currentTrack,
    isPlaying,
    playPause,
    volume,
    setVolume,
    currentTime,
    duration,
    audioElement,
    mediaSourceNode,
    loadTrack,
    seekTo,
    addToPlaylist,
    playNext,
    playPrevious,
    setIsDirectOutputEnabled
  } = usePlayer();

  // Route Audio through our Effects Chain ONLY
  useEffect(() => {
    // Disable global direct output so we can process audio here
    setIsDirectOutputEnabled(false);

    return () => {
      // Re-enable global output when leaving this view
      setIsDirectOutputEnabled(true);
    };
  }, [setIsDirectOutputEnabled]);

  const [loop, setLoop] = useState(false);
  const [eqBands, setEqBands] = useState<EQBand[]>(INITIAL_EQ_BANDS);
  const [compressorSettings, setCompressorSettings] = useState<CompressorSettings>(INITIAL_COMPRESSOR);
  const [effectsSettings, setEffectsSettings] = useState<AudioEffectsSettings>(INITIAL_EFFECTS);
  const [gainReduction, setGainReduction] = useState(0);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');

  // Removed unused WaveSurfer refs

  // Audio Nodes Refs
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Effects Nodes
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayFeedbackNodeRef = useRef<GainNode | null>(null);
  const delayDryNodeRef = useRef<GainNode | null>(null);
  const delayWetNodeRef = useRef<GainNode | null>(null);

  const reverbNodeRef = useRef<ConvolverNode | null>(null);
  const reverbDryNodeRef = useRef<GainNode | null>(null);
  const reverbWetNodeRef = useRef<GainNode | null>(null);

  // New Effects Nodes
  const distortionNodeRef = useRef<WaveShaperNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);

  // Make distortion curve (Softer)
  const makeDistortionCurve = (amount: number) => {
    // Map 0-100 to a smaller range for softer distortion (e.g., 0-20)
    const k = (amount / 100) * 20;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      // Standard sigmoid function for smoother saturation
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  };



  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [waveformZoom, setWaveformZoom] = useState(100);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  // Load & Decode Audio for DetailWaveform
  useEffect(() => {
    const ctx = getAudioContext();
    if (!currentTrack || !ctx) {
      setAudioBuffer(null);
      return;
    }

    const loadAudio = async () => {
      try {
        console.log("🌊 Loading Waveform for:", currentTrack.name);
        setIsDecoding(true);
        setDecodeError(null);

        const url = currentTrack.enhancedUrl || currentTrack.originalUrl;
        if (!url) {
          console.error("🌊 No URL found for track");
          return;
        }

        // Fetch
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        console.log("🌊 Audio fetch success, size:", arrayBuffer.byteLength);

        if (arrayBuffer.byteLength === 0) {
          throw new Error("Fetched audio buffer is empty");
        }

        // Clone to avoid detachment
        const bufferCopy = arrayBuffer.slice(0);

        // Decode
        const decoded = await ctx.decodeAudioData(bufferCopy);
        console.log("🌊 Decode success, duration:", decoded.duration);

        setAudioBuffer(decoded);
        setIsDecoding(false);

      } catch (error: any) {
        console.error("🌊 Waveform Decode Error:", error);
        setDecodeError(error.message || "Failed to decode");
        setIsDecoding(false);
      }
    };

    loadAudio();
  }, [currentTrack]);

  // Sync Waveform Drag
  const handleWaveformSeek = (time: number) => {
    seekTo(time);
  };

  // Handle File Uploads
  const handleFilesAdded = useCallback(
    (newFiles: AudioFile[]) => {
      if (onFilesAdded) {
        onFilesAdded(newFiles);
      }
      // Note: We rely on the parent (LevelTabs) to add to the global playlist after analysis
      // This prevents duplicates and ensures BPM/Key data is present

      // If nothing playing, we might want to load first, but we should wait for analysis
      // So we remove the immediate loadTrack here as well
      toast.info(`Analyzing ${newFiles.length} file(s)...`);
    },
    [onFilesAdded]
  );

  // Initialize Audio Graph (Effects Chain)
  useEffect(() => {
    const audioContext = getAudioContext();
    if (!audioContext || !mediaSourceNode) return;

    // Create Nodes if they don't exist
    if (!analyserNodeRef.current) {
      analyserNodeRef.current = audioContext.createAnalyser();
      analyserNodeRef.current.fftSize = 2048;
    }

    if (!gainNodeRef.current) {
      gainNodeRef.current = audioContext.createGain();
      gainNodeRef.current.gain.value = 1.0; // Unity gain, volume handled by audio element
    }

    if (!compressorNodeRef.current) {
      compressorNodeRef.current = audioContext.createDynamicsCompressor();
      const c = compressorNodeRef.current;
      c.threshold.value = compressorSettings.threshold;
      c.ratio.value = compressorSettings.ratio;
      c.attack.value = compressorSettings.attack;
      c.release.value = compressorSettings.release;
    }

    if (eqFiltersRef.current.length === 0) {
      eqBands.forEach((band, index) => {
        const filter = audioContext.createBiquadFilter();
        if (index === 0) filter.type = "lowshelf";
        else if (index === eqBands.length - 1) filter.type = "highshelf";
        else filter.type = "peaking";
        filter.frequency.value = band.frequency;
        filter.gain.value = band.gain;
        eqFiltersRef.current.push(filter);
      });
    }

    // Initialize Delay
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

    // Initialize Reverb
    if (!reverbNodeRef.current) {
      const convolver = audioContext.createConvolver();
      const dry = audioContext.createGain();
      const wet = audioContext.createGain();

      // Load impulse response (placeholder or generated)
      // For now, simple noise burst for reverb tail
      const rate = audioContext.sampleRate;
      const length = rate * 2; // 2 seconds
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

    // Initialize Distortion
    if (!distortionNodeRef.current) {
      const dist = audioContext.createWaveShaper();
      dist.curve = makeDistortionCurve(0);
      dist.oversample = '4x';
      distortionNodeRef.current = dist;
    }

    // Initialize Filter
    if (!filterNodeRef.current) {
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass'; // Default
      filter.frequency.value = 20000;
      filter.Q.value = 1;
      filterNodeRef.current = filter;
    }

    // Initialize Panner
    if (!pannerNodeRef.current) {
      const panner = audioContext.createStereoPanner();
      panner.pan.value = 0;
      pannerNodeRef.current = panner;
    }

    // Connect the Graph

    // Helper to safely disconnect a node
    const safeDisconnect = (node: AudioNode | null) => {
      if (node) {
        try {
          node.disconnect();
        } catch (e) {
          // Ignore errors if node wasn't connected
        }
      }
    };

    // Disconnect everything first to prevent double connections
    safeDisconnect(mediaSourceNode);
    eqFiltersRef.current.forEach(f => safeDisconnect(f));
    safeDisconnect(compressorNodeRef.current);
    safeDisconnect(distortionNodeRef.current);
    safeDisconnect(filterNodeRef.current);
    safeDisconnect(delayNodeRef.current); // Wet path
    safeDisconnect(delayDryNodeRef.current); // Dry path
    safeDisconnect(reverbNodeRef.current);
    safeDisconnect(reverbDryNodeRef.current);
    safeDisconnect(pannerNodeRef.current);
    safeDisconnect(gainNodeRef.current);
    safeDisconnect(analyserNodeRef.current);

    // Rebuild the chain
    let currentNode: AudioNode = mediaSourceNode;

    // 1. EQ (Always in chain, flat by default)
    eqFiltersRef.current.forEach(filter => {
      currentNode.connect(filter);
      currentNode = filter;
    });

    // 2. Compressor (If enabled)
    if (compressorSettings.enabled && compressorNodeRef.current) {
      currentNode.connect(compressorNodeRef.current);
      currentNode = compressorNodeRef.current;
    }

    // 3. Audio Effects Chain (Distortion -> Filter -> Delay -> Reverb -> Panner)
    if (effectsSettings.enabled) {
      // Distortion
      if (distortionNodeRef.current) {
        currentNode.connect(distortionNodeRef.current);
        currentNode = distortionNodeRef.current;
      }

      // Filter
      if (filterNodeRef.current) {
        currentNode.connect(filterNodeRef.current);
        currentNode = filterNodeRef.current;
      }

      // Delay (Parallel)
      if (delayNodeRef.current && delayDryNodeRef.current && delayWetNodeRef.current) {
        const delayInput = audioContext.createGain();
        const delayOutput = audioContext.createGain();

        // We need to manage these temp nodes or just connect directly
        // Connecting directly is cleaner for React useEffect re-runs
        // But parallel paths need a split. 
        // Let's use the existing nodes but be careful.
        // Actually, creating new Gain nodes inside useEffect is bad if we don't clean them up.
        // For simplicity and robustness, let's just chain them if possible, or use the refs if they exist.
        // If we created temp gains in previous runs, they are garbage collected if disconnected.

        // Better approach for parallel:
        // source -> dry -> output
        // source -> wet -> output

        currentNode.connect(delayDryNodeRef.current);
        currentNode.connect(delayNodeRef.current);

        delayNodeRef.current.connect(delayWetNodeRef.current);

        // We need a merge point. 
        // We can connect both dry and wet to the NEXT node in the chain.
        // But we need a single node to represent the "output" of this stage to continue the chain.
        // So we DO need a merge node.
        // Let's use a persistent merge node if possible, or just connect both to the next stage.
        // Connecting both to the next stage works!

        // But wait, if we have Reverb next, we need to connect BOTH delayDry and delayWet to Reverb.
        // This gets complicated. 
        // EASIER FIX: Just use the GainNode we created in init? 
        // We didn't create a merge node in init.

        // Let's create a temporary merge gain for this render cycle.
        const delayMerge = audioContext.createGain();
        delayDryNodeRef.current.connect(delayMerge);
        delayWetNodeRef.current.connect(delayMerge);

        currentNode = delayMerge;
      }

      // Reverb Chain
      if (reverbNodeRef.current && reverbDryNodeRef.current && reverbWetNodeRef.current) {
        // Similar parallel logic
        const reverbMerge = audioContext.createGain();

        currentNode.connect(reverbDryNodeRef.current);
        currentNode.connect(reverbNodeRef.current);

        reverbNodeRef.current.connect(reverbWetNodeRef.current);

        reverbDryNodeRef.current.connect(reverbMerge);
        reverbWetNodeRef.current.connect(reverbMerge);

        currentNode = reverbMerge;
      }

      // Panner
      if (pannerNodeRef.current) {
        currentNode.connect(pannerNodeRef.current);
        currentNode = pannerNodeRef.current;
      }
    }

    // 4. Master Gain
    if (gainNodeRef.current) {
      currentNode.connect(gainNodeRef.current);
      currentNode = gainNodeRef.current;
    }

    // 5. Analyser -> Destination
    if (analyserNodeRef.current) {
      currentNode.connect(analyserNodeRef.current);
      analyserNodeRef.current.connect(audioContext.destination);
    } else {
      currentNode.connect(audioContext.destination);
    }

    console.log("🎛️ Audio Graph Connected");

    return () => {
      // Cleanup: Disconnect everything we might have connected
      safeDisconnect(mediaSourceNode);
      eqFiltersRef.current.forEach(f => safeDisconnect(f));
      safeDisconnect(compressorNodeRef.current);
      safeDisconnect(distortionNodeRef.current);
      safeDisconnect(filterNodeRef.current);
      safeDisconnect(delayNodeRef.current);
      safeDisconnect(delayDryNodeRef.current);
      safeDisconnect(reverbNodeRef.current);
      safeDisconnect(reverbDryNodeRef.current);
      safeDisconnect(pannerNodeRef.current);
      safeDisconnect(gainNodeRef.current);
      safeDisconnect(analyserNodeRef.current);
      console.log("🔌 Audio Graph Disconnected");
    };
  }, [mediaSourceNode, effectsSettings.enabled, compressorSettings.enabled]);

  // Compressor Metering Loop
  useEffect(() => {
    if (!compressorSettings.enabled || !isPlaying) {
      setGainReduction(0);
      return;
    }

    let animationFrameId: number;

    const updateMeter = () => {
      if (compressorNodeRef.current) {
        // reduction is a float in dB (always positive or 0 in Web Audio spec for reduction amount? 
        // MDN: "a float representing the amount of gain reduction currently applied by the compressor to the signal."
        // Usually negative in meters, but the API returns a float. Let's check typical behavior.
        // Actually reduction is often negative in dB, e.g. -3.0. 
        // My previous code used it directly. Let's stick to that.
        setGainReduction(compressorNodeRef.current.reduction);
        animationFrameId = requestAnimationFrame(updateMeter);
      }
    };

    updateMeter();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [compressorSettings.enabled, isPlaying]);

  // Auto-play file logic
  useEffect(() => {
    if (autoPlayFile && autoPlayFile.id !== currentTrack?.id) {
      console.log("Auto-playing file from track list:", autoPlayFile.name);
      loadTrack(autoPlayFile);
      if (onAutoPlayComplete) {
        onAutoPlayComplete();
      }
    }
  }, [autoPlayFile, currentTrack, onAutoPlayComplete, loadTrack]);

  // Update Effects Parameters
  useEffect(() => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    // EQ
    eqFiltersRef.current.forEach((filter, index) => {
      if (index < eqBands.length) {
        filter.gain.setTargetAtTime(eqBands[index].gain, audioContext.currentTime, 0.1);
      }
    });

    // Compressor
    if (compressorNodeRef.current) {
      const c = compressorNodeRef.current;
      c.threshold.setTargetAtTime(compressorSettings.threshold, audioContext.currentTime, 0.1);
      c.ratio.setTargetAtTime(compressorSettings.ratio, audioContext.currentTime, 0.1);
      c.attack.setTargetAtTime(compressorSettings.attack, audioContext.currentTime, 0.1);
      c.release.setTargetAtTime(compressorSettings.release, audioContext.currentTime, 0.1);
    }

    // Delay
    if (delayNodeRef.current && delayFeedbackNodeRef.current && delayDryNodeRef.current && delayWetNodeRef.current) {
      delayNodeRef.current.delayTime.setTargetAtTime(effectsSettings.delayTime, audioContext.currentTime, 0.1);
      delayFeedbackNodeRef.current.gain.setTargetAtTime(effectsSettings.delayFeedback, audioContext.currentTime, 0.1);
      delayDryNodeRef.current.gain.setTargetAtTime(1 - effectsSettings.delayMix, audioContext.currentTime, 0.1);
      delayWetNodeRef.current.gain.setTargetAtTime(effectsSettings.delayMix, audioContext.currentTime, 0.1);
    }

    // Reverb
    if (reverbDryNodeRef.current && reverbWetNodeRef.current) {
      reverbDryNodeRef.current.gain.setTargetAtTime(1 - effectsSettings.reverbMix, audioContext.currentTime, 0.1);
      reverbWetNodeRef.current.gain.setTargetAtTime(effectsSettings.reverbMix, audioContext.currentTime, 0.1);
    }

    // Distortion
    if (distortionNodeRef.current) {
      if (effectsSettings.distortionAmount === 0) {
        distortionNodeRef.current.curve = null;
      } else {
        distortionNodeRef.current.curve = makeDistortionCurve(effectsSettings.distortionAmount);
      }
    }

    // Filter
    if (filterNodeRef.current) {
      if (effectsSettings.filterType === 'none') {
        // Bypass filter effectively by setting frequency to limits or using allpass
        // Allpass is safest to keep signal flow without attenuation
        filterNodeRef.current.type = 'allpass';
      } else {
        filterNodeRef.current.type = effectsSettings.filterType;
        filterNodeRef.current.frequency.setTargetAtTime(effectsSettings.filterFreq, audioContext.currentTime, 0.1);
        filterNodeRef.current.Q.setTargetAtTime(effectsSettings.filterQ, audioContext.currentTime, 0.1);
      }
    }

    // Panner
    if (pannerNodeRef.current) {
      pannerNodeRef.current.pan.setTargetAtTime(effectsSettings.pan, audioContext.currentTime, 0.1);
    }

    // Pitch (Playback Rate)
    if (audioElement) {
      audioElement.playbackRate = effectsSettings.pitch;
      audioElement.preservesPitch = effectsSettings.preservesPitch;
    }

  }, [eqBands, compressorSettings, effectsSettings, audioElement]);

  const handleSkipBackward = () => {
    seekTo(Math.max(0, currentTime - 10));
  };

  const handleSkipForward = () => {
    seekTo(Math.min(duration, currentTime + 10));
  };

  const handleDeleteFile = () => {
    if (!currentTrack) return;
    if (onFileDelete) {
      onFileDelete(currentTrack.id);
    }
    toast.success(`Deleted: ${currentTrack.name}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Media Player</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('/player', '_blank')}
          className="flex items-center gap-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/30"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open External Player</span>
        </Button>
      </div>

      {/* Upload Zone */}
      <MediaPlayerUpload onFilesAdded={handleFilesAdded} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Waveform & EQ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Waveform Player */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
                <span className="text-2xl">🎵</span>
                {currentTrack ? currentTrack.name : "No track loaded"}
              </h3>
              {currentTrack && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDeleteFile}
                  className="bg-red-900/20 border-red-700 hover:bg-red-900/40 text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div
              className="mb-6 rounded-lg overflow-hidden border border-slate-700/50 bg-slate-950/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative h-[150px]"
            >
              {isDecoding && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 text-cyan-400 font-mono text-xs">
                  DECODING AUDIO...
                </div>
              )}

              {decodeError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 z-20 text-white font-mono text-xs">
                  ERROR: {decodeError}
                </div>
              )}

              <SpectralWaveform
                buffer={audioBuffer}
                currentTime={currentTime || 0}
                zoom={waveformZoom}
                setZoom={setWaveformZoom}
                color="cyan"
                height={150}
                showGrid={true}
                onSeek={handleWaveformSeek}
                isPlaying={isPlaying}
                onPlay={playPause}
                onPause={playPause}
              />

              {/* Zoom Controls Overlay */}
              <div className="absolute top-2 right-2 flex flex-col gap-1 z-30">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6 rounded-full bg-black/50 hover:bg-black/80 text-cyan-400 border border-cyan-500/30"
                  onClick={() => setWaveformZoom(z => Math.min(z * 1.5, 1000))}
                >
                  <span className="text-xs font-bold">+</span>
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6 rounded-full bg-black/50 hover:bg-black/80 text-cyan-400 border border-cyan-500/30"
                  onClick={() => setWaveformZoom(z => Math.max(z / 1.5, 10))}
                >
                  <span className="text-xs font-bold">-</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
              <span className="font-mono">{formatTime(currentTime)}</span>
              <span className="font-mono">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-center gap-4 mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSkipBackward}
                disabled={!currentTrack}
                className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white"
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button
                variant="default"
                size="icon"
                onClick={playPause}
                disabled={!currentTrack}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-14 w-14"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleSkipForward}
                disabled={!currentTrack}
                className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white"
              >
                <SkipForward className="h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setLoop(!loop)}
                className={`${loop ? "bg-cyan-500 text-white" : "bg-slate-800 text-white"} border-slate-600 hover:bg-slate-700`}
              >
                <Repeat className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Volume2 className="h-5 w-5 text-cyan-400" />
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(v) => setVolume(v[0])}
                className="flex-1"
              />
              <span className="text-sm text-slate-400 font-mono min-w-[50px] text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </Card>

          {/* EQ */}
          <TenBandEqualizer
            bands={eqBands}
            onBandChange={(index, gain) => {
              const newBands = [...eqBands];
              newBands[index] = { ...newBands[index], gain };
              setEqBands(newBands);
            }}
            onReset={() => {
              setEqBands(INITIAL_EQ_BANDS);
              toast.success("EQ reset to flat");
            }}
          />

          {/* Playlist */}
          <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <PlaylistPanel
              files={files}
              currentFileId={currentTrack?.id || null}
              onFileSelect={loadTrack}
              onFileDelete={onFileDelete}
              onClearAll={onClearAll}
            />
          </div>
        </div>

        {/* Right Column: Audio Effects, Compressor & Visualizer */}
        <div className="space-y-6 flex flex-col">
          {/* Audio Effects (Top) */}
          <AudioEffectsControls
            settings={effectsSettings}
            onSettingsChange={(settings) => setEffectsSettings(prev => ({ ...prev, ...settings }))}
          />

          {/* Compressor (Middle) */}
          <DynamicsCompressorControls
            settings={compressorSettings}
            gainReduction={gainReduction}
            onSettingsChange={(settings) =>
              setCompressorSettings({ ...compressorSettings, ...settings })
            }
          />

          {/* Visualizer - Now in right column, filling remaining height if needed or fixed height */}
          <div className="flex-1 min-h-[200px]">
            <VisualizerDisplay
              analyserNode={analyserNodeRef.current}
              isPlaying={isPlaying}
              mode={visualizerMode}
              onModeChange={setVisualizerMode}
            />
          </div>
        </div>
      </div>

    </div>
  );
};
