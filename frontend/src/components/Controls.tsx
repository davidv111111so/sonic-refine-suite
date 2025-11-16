import React from "react";
import { AudioPlayer } from "./AudioPlayer";
import { SettingsPanel } from "./SettingsPanel";
import { Equalizer } from "./Equalizer";

interface Track {
  id: string;
  name: string;
  originalFile: File;
  audioBuffer?: AudioBuffer;
  status: "loading" | "ready" | "processing" | "error";
  metadata?: {
    duration: number;
    sampleRate: number;
    channels: number;
  };
}

interface ControlsProps {
  selectedTrack?: Track;
  isProcessing: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  selectedTrack,
  isProcessing,
}) => {
  return (
    <div className="space-y-6">
      {/* Audio Player */}
      <AudioPlayer track={selectedTrack} disabled={isProcessing} />

      {/* Settings Panel */}
      <SettingsPanel track={selectedTrack} disabled={isProcessing} />

      {/* Equalizer */}
      <Equalizer track={selectedTrack} disabled={isProcessing} />
    </div>
  );
};
