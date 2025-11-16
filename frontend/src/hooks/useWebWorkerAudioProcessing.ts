import { useCallback, useState } from "react";
import { AudioFile } from "@/types/audio";

export const useWebWorkerAudioProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{
    [key: string]: { progress: number; stage: string };
  }>({});

  const processAudioFile = useCallback(
    async (
      file: AudioFile,
      settings: any,
      onProgressUpdate?: (progress: number, stage: string) => void,
    ): Promise<Blob> => {
      return new Promise(async (resolve, reject) => {
        try {
          console.log(
            "Starting REAL Web Worker audio enhancement for:",
            file.name,
          );
          console.log("Enhancement settings:", settings);

          // Validate settings for professional enhancement
          const validationIssues = validateEnhancementSettings(settings);
          if (validationIssues.length > 0) {
            console.warn("Settings validation issues:", validationIssues);
          }

          // Create Web Worker
          const worker = new Worker(
            new URL("../workers/audioEnhancement.worker.ts", import.meta.url),
            { type: "module" },
          );

          // Read file data
          const arrayBuffer = await file.originalFile.arrayBuffer();

          // Log original file characteristics
          console.log("Original file size:", arrayBuffer.byteLength, "bytes");
          console.log(
            "Expected enhanced size:",
            calculateExpectedSize(arrayBuffer.byteLength, settings),
          );

          // Set up worker message handler
          worker.onmessage = (e) => {
            const { type, fileId, progress, stage, result, error, metadata } =
              e.data;

            if (type === "progress") {
              if (onProgressUpdate) {
                onProgressUpdate(progress, stage);
              }
              setProcessingProgress((prev) => ({
                ...prev,
                [fileId]: { progress, stage },
              }));
            } else if (type === "complete") {
              worker.terminate();

              console.log("Enhancement completed successfully!");
              console.log("Enhancement metadata:", metadata);

              // Log file size comparison
              if (metadata) {
                console.log("Original size:", metadata.originalSize, "bytes");
                console.log("Enhanced size:", metadata.enhancedSize, "bytes");
                console.log(
                  "Size increase:",
                  (
                    (metadata.enhancedSize / metadata.originalSize - 1) *
                    100
                  ).toFixed(1),
                  "%",
                );
                console.log(
                  "Sample rate:",
                  metadata.originalSampleRate,
                  "->",
                  metadata.enhancedSampleRate,
                );
              }

              const enhancedBlob = new Blob([result], {
                type: getOutputMimeType(settings.outputFormat),
              });

              console.log(
                "Final enhanced blob size:",
                enhancedBlob.size,
                "bytes",
              );

              resolve(enhancedBlob);
            } else if (type === "error") {
              worker.terminate();
              console.error("Worker enhancement error:", error);

              // Don't fallback - throw error to show real issues
              reject(new Error(`Audio enhancement failed: ${error}`));
            }
          };

          worker.onerror = (error) => {
            console.error("Worker error:", error);
            worker.terminate();
            reject(new Error("Worker failed to process audio"));
          };

          // Send data to worker with enhanced settings
          worker.postMessage({
            fileData: arrayBuffer,
            settings: {
              ...settings,
              // Ensure high quality settings
              targetBitrate: Math.max(settings.targetBitrate, 320),
              sampleRate: Math.max(settings.sampleRate, 48000),
            },
            fileId: file.id,
          });
        } catch (error) {
          console.error("Audio processing setup error:", error);
          reject(error);
        }
      });
    },
    [],
  );

  const getProgressInfo = useCallback(
    (fileId: string) => {
      return (
        processingProgress[fileId] || { progress: 0, stage: "Preparing..." }
      );
    },
    [processingProgress],
  );

  return {
    processAudioFile,
    isProcessing,
    setIsProcessing,
    getProgressInfo,
  };
};

// Validate settings for professional audio enhancement
const validateEnhancementSettings = (settings: any): string[] => {
  const issues: string[] = [];

  if (settings.targetBitrate < 320) {
    issues.push("Bitrate below 320 kbps may not provide professional quality");
  }

  if (settings.sampleRate < 48000) {
    issues.push("Sample rate below 48 kHz may limit enhancement quality");
  }

  if (settings.noiseReductionLevel > 80) {
    issues.push("High noise reduction may introduce artifacts");
  }

  if (Math.abs(settings.gainAdjustment) > 6) {
    issues.push("Excessive gain adjustment may cause distortion");
  }

  return issues;
};

// Calculate expected file size after enhancement
const calculateExpectedSize = (originalSize: number, settings: any): number => {
  let multiplier = 1;

  // Sample rate increase
  multiplier *= settings.sampleRate / 44100;

  // Bit depth increase (from 16-bit to 24-bit)
  multiplier *= 1.5;

  // Format-specific adjustments
  switch (settings.outputFormat) {
    case "flac":
      multiplier *= 0.6; // FLAC compression
      break;
    case "wav":
      multiplier *= 1.0; // Uncompressed
      break;
    case "mp3":
      multiplier = (settings.targetBitrate / 128) * 0.8; // MP3 compression
      break;
  }

  return Math.round(originalSize * multiplier);
};

const getOutputMimeType = (format: string): string => {
  switch (format) {
    case "mp3":
      return "audio/mpeg";
    case "flac":
      return "audio/flac";
    case "ogg":
      return "audio/ogg";
    case "wav":
      return "audio/wav";
    default:
      return "audio/wav";
  }
};
