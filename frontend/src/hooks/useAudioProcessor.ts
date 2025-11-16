import { useState, useCallback } from "react";
import { AudioFile } from "@/types/audio";

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

export const useAudioProcessor = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize AudioContext
  const createAudioContext = useCallback(() => {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("AudioContext not supported in this browser");
    }
    return new AudioContextClass();
  }, []);

  // Add track function that reads File as ArrayBuffer and decodes with Web Audio API
  const addTrack = useCallback(
    async (file: File): Promise<string> => {
      const trackId = Math.random().toString(36).substring(7);

      const newTrack: Track = {
        id: trackId,
        name: file.name,
        originalFile: file,
        status: "loading",
      };

      setTracks((prev) => [...prev, newTrack]);

      try {
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Create AudioContext and decode audio data
        const audioContext = createAudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Update track with decoded audio buffer and metadata
        setTracks((prev) =>
          prev.map((track) =>
            track.id === trackId
              ? {
                  ...track,
                  audioBuffer,
                  status: "ready" as const,
                  metadata: {
                    duration: audioBuffer.duration,
                    sampleRate: audioBuffer.sampleRate,
                    channels: audioBuffer.numberOfChannels,
                  },
                }
              : track,
          ),
        );

        // Close AudioContext to free resources
        await audioContext.close();

        return trackId;
      } catch (error) {
        console.error("Error processing audio file:", error);

        setTracks((prev) =>
          prev.map((track) =>
            track.id === trackId
              ? { ...track, status: "error" as const }
              : track,
          ),
        );

        throw error;
      }
    },
    [createAudioContext],
  );

  // Export track as WAV file
  const exportTrackAsWav = useCallback(
    async (trackId: string): Promise<Blob> => {
      const track = tracks.find((t) => t.id === trackId);

      if (!track || !track.audioBuffer) {
        throw new Error("Track not found or not ready");
      }

      setIsProcessing(true);

      try {
        const audioBuffer = track.audioBuffer;
        const length = audioBuffer.length;
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;

        // WAV file parameters
        const bitsPerSample = 16;
        const bytesPerSample = 2;
        const blockAlign = numberOfChannels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;

        // Calculate file size
        const headerLength = 44;
        const dataLength = length * blockAlign;
        const fileLength = headerLength + dataLength;

        // Create ArrayBuffer for WAV file
        const arrayBuffer = new ArrayBuffer(fileLength);
        const view = new DataView(arrayBuffer);

        let offset = 0;

        // WAV header
        // RIFF chunk descriptor
        view.setUint32(offset, 0x52494646, false);
        offset += 4; // "RIFF"
        view.setUint32(offset, fileLength - 8, true);
        offset += 4; // File size - 8
        view.setUint32(offset, 0x57415645, false);
        offset += 4; // "WAVE"

        // fmt sub-chunk
        view.setUint32(offset, 0x666d7420, false);
        offset += 4; // "fmt "
        view.setUint32(offset, 16, true);
        offset += 4; // Subchunk1Size (16 for PCM)
        view.setUint16(offset, 1, true);
        offset += 2; // AudioFormat (1 for PCM)
        view.setUint16(offset, numberOfChannels, true);
        offset += 2; // NumChannels
        view.setUint32(offset, sampleRate, true);
        offset += 4; // SampleRate
        view.setUint32(offset, byteRate, true);
        offset += 4; // ByteRate
        view.setUint16(offset, blockAlign, true);
        offset += 2; // BlockAlign
        view.setUint16(offset, bitsPerSample, true);
        offset += 2; // BitsPerSample

        // data sub-chunk
        view.setUint32(offset, 0x64617461, false);
        offset += 4; // "data"
        view.setUint32(offset, dataLength, true);
        offset += 4; // Subchunk2Size

        // Convert audio samples to 16-bit PCM
        const maxValue = 32767; // 16-bit signed integer max value

        for (let i = 0; i < length; i++) {
          for (let channel = 0; channel < numberOfChannels; channel++) {
            const sample = audioBuffer.getChannelData(channel)[i];
            // Clamp to [-1, 1] range and convert to 16-bit integer
            const clampedSample = Math.max(-1, Math.min(1, sample));
            const intSample = Math.round(clampedSample * maxValue);
            view.setInt16(offset, intSample, true);
            offset += 2;
          }
        }

        const blob = new Blob([arrayBuffer], { type: "audio/wav" });
        return blob;
      } finally {
        setIsProcessing(false);
      }
    },
    [tracks],
  );

  // Remove track
  const removeTrack = useCallback((trackId: string) => {
    setTracks((prev) => prev.filter((track) => track.id !== trackId));
  }, []);

  // Clear all tracks
  const clearTracks = useCallback(() => {
    setTracks([]);
  }, []);

  // Get track by ID
  const getTrack = useCallback(
    (trackId: string) => {
      return tracks.find((track) => track.id === trackId);
    },
    [tracks],
  );

  return {
    tracks,
    addTrack,
    removeTrack,
    clearTracks,
    exportTrackAsWav,
    getTrack,
    isProcessing,
  };
};
