import React from "react";
import { TrackList } from "./TrackList";
import { Controls } from "./Controls";

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

interface MainContentProps {
  tracks: Track[];
  selectedTrackId?: string;
  onTrackSelect: (trackId: string) => void;
  onTrackRemove: (trackId: string) => void;
  onTrackExport: (trackId: string) => void;
  isProcessing: boolean;
  className?: string;
}

export const MainContent: React.FC<MainContentProps> = ({
  tracks,
  selectedTrackId,
  onTrackSelect,
  onTrackRemove,
  onTrackExport,
  isProcessing,
  className = "",
}) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Left Column - TrackList (2/3 width on large screens) */}
      <div className="lg:col-span-2">
        <TrackList
          tracks={tracks}
          selectedTrackId={selectedTrackId}
          onTrackSelect={onTrackSelect}
          onTrackRemove={onTrackRemove}
          onTrackExport={onTrackExport}
        />
      </div>

      {/* Right Column - Controls (1/3 width on large screens) */}
      <div className="lg:col-span-1">
        <Controls
          selectedTrack={tracks.find((t) => t.id === selectedTrackId)}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
};
