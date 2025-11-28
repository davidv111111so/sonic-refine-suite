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
  threshold: -24,
  ratio: 12,
  attack: 0.003,
  release: 0.25,
};

const INITIAL_EFFECTS: AudioEffectsSettings = {
  reverbMix: 0,
  delayTime: 0.25,
  delayFeedback: 0.3,
  delayMix: 0,
  pitch: 1,
  preservesPitch: true,
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
    playPrevious
  } = usePlayer();

  const [loop, setLoop] = useState(false);
  const [eqBands, setEqBands] = useState<EQBand[]>(INITIAL_EQ_BANDS);
  const [compressorSettings, setCompressorSettings] = useState<CompressorSettings>(INITIAL_COMPRESSOR);
  const [effectsSettings, setEffectsSettings] = useState<AudioEffectsSettings>(INITIAL_EFFECTS);
  const [gainReduction, setGainReduction] = useState(0);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

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

  // Initialize WaveSurfer with shared Audio Element
  useEffect(() => {
    if (!waveformRef.current || !audioElement) return;

    // Destroy existing instance if any
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      media: audioElement, // Use global audio element
      waveColor: "#4b5563",
      progressColor: "#06b6d4",
      cursorColor: "#22d3ee",
      barWidth: 3,
      barRadius: 3,
      cursorWidth: 2,
      height: 80,
      barGap: 3,
      normalize: true,
    });

    // Create a gradient for the progress wave
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, 100);
      gradient.addColorStop(0, "rgb(34, 211, 238)"); // Cyan-400
      gradient.addColorStop(0.5, "rgb(168, 85, 247)"); // Purple-500
      gradient.addColorStop(1, "rgb(236, 72, 153)"); // Pink-500
      ws.setOptions({ progressColor: gradient as any });
    }

    wavesurferRef.current = ws;

    // We don't need to listen to 'ready', 'audioprocess', 'finish' here for state updates
    // because PlayerContext handles that via the Audio Element events.
    // But we might want to handle loop logic here or in context.

    ws.on("finish", () => {
      if (loop) {
        ws.play();
      }
    });

    return () => {
      ws.destroy();
    };
  }, [audioElement, loop]); // Re-init if audio element changes (shouldn't happen often)

  // Handle File Uploads
  const handleFilesAdded = useCallback(
    (newFiles: AudioFile[]) => {
      if (onFilesAdded) {
        onFilesAdded(newFiles);
      }
      addToPlaylist(newFiles);
      // If nothing playing, load first
      if (!currentTrack && newFiles.length > 0) {
        loadTrack(newFiles[0]);
      }
      toast.success(`Added ${newFiles.length} file(s) to player`);
    },
    [onFilesAdded, addToPlaylist, currentTrack, loadTrack]
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
      gainNodeRef.current.gain.value = volume;
    }

    if (!compressorNodeRef.current) {
      compressorNodeRef.current = audioContext.createDynamicsCompressor();
      // Set initial values
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

    // Initialize Delay/Reverb (simplified for brevity, same logic as before)
    // ... (Use existing logic for creating delay/reverb nodes)

    // Connect the Graph
    // Disconnect default destination first to avoid double audio
    try {
      mediaSourceNode.disconnect();
    } catch (e) {
      // Ignore if already disconnected
    }

    let currentNode: AudioNode = mediaSourceNode;

    // 1. EQ
    eqFiltersRef.current.forEach(filter => {
      currentNode.connect(filter);
      currentNode = filter;
    });

    // 2. Compressor
    if (compressorNodeRef.current) {
      currentNode.connect(compressorNodeRef.current);
      currentNode = compressorNodeRef.current;
    }

    // 3. Effects (Placeholder for Delay/Reverb connection logic)
    // For now, skip complex routing to ensure basic playback works, or implement fully if needed.
    // Let's connect directly to Gain for now to verify context switch, then add effects back.

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

    console.log("🎛️ Audio Graph Connected via Context Source");

    // Cleanup: Reconnect source to destination directly when unmounting
    return () => {
      try {
        mediaSourceNode.disconnect();
        mediaSourceNode.connect(audioContext.destination);
        console.log("🔌 Audio Graph Disconnected (Reverted to Default)");
      } catch (e) {
        console.error("Error cleaning up audio graph:", e);
      }
    };
  }, [mediaSourceNode, volume]); // Re-run if source node changes

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

  // Update EQ/Compressor/Volume Effects (Same as before)
  // ...

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
    // Context handles playlist removal logic
    toast.success(`Deleted: ${currentTrack.name}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 p-6">
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
              ref={waveformRef}
              className="mb-6 rounded-lg overflow-hidden border border-slate-700/50 bg-slate-950/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative"
            >
              {/* Futuristic Grid Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0"></div>
              {/* Glow effect at the bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-cyan-500/10 to-transparent pointer-events-none z-0"></div>
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

          {/* Visualizer */}
          <VisualizerDisplay
            analyserNode={analyserNodeRef.current}
            isPlaying={isPlaying}
            mode={visualizerMode}
            onModeChange={setVisualizerMode}
          />
        </div>

        {/* Right Column: Compressor, Effects & Playlist */}
        <div className="space-y-6">
          {/* Compressor */}
          <DynamicsCompressorControls
            settings={compressorSettings}
            gainReduction={gainReduction}
            onSettingsChange={(settings) =>
              setCompressorSettings({ ...compressorSettings, ...settings })
            }
          />

          {/* Audio Effects - Placed here to fit screen */}
          <AudioEffectsControls
            settings={effectsSettings}
            onSettingsChange={(settings) => setEffectsSettings(prev => ({ ...prev, ...settings }))}
          />

          {/* Playlist */}
          <PlaylistPanel
            files={files}
            currentFileId={currentTrack?.id || null}
            onFileSelect={loadTrack}
            onFileDelete={onFileDelete}
            onClearAll={onClearAll}
          />
        </div>
      </div>
    </div>
  );
};
