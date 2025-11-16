import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX, Settings } from "lucide-react";
import { AudioFile } from "@/types/audio";

interface EnhancedMiniPlayerProps {
  file: AudioFile;
  onAudioElementRef?: (audioElement: HTMLAudioElement | null) => void;
}

export const EnhancedMiniPlayer = ({
  file,
  onAudioElementRef,
}: EnhancedMiniPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Pass audio element reference to parent
    if (onAudioElementRef) {
      onAudioElementRef(audio);
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoaded(true);
      console.log("Audio loaded successfully:", file.name);
    };

    const handleLoadedData = () => {
      setIsLoaded(true);
    };

    const handleError = (e: any) => {
      console.error("Audio loading error for", file.name, ":", e);
      setIsLoaded(false);
    };

    const handleCanPlay = () => {
      setIsLoaded(true);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    // Set audio source with error handling
    try {
      if (file.enhancedUrl) {
        audio.src = file.enhancedUrl;
      } else if (file.originalFile) {
        audio.src = URL.createObjectURL(file.originalFile);
      }
      audio.load();
    } catch (error) {
      console.error("Error setting audio source:", error);
      setIsLoaded(false);
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);

      // Clean up audio element reference
      if (onAudioElementRef) {
        onAudioElementRef(null);
      }
    };
  }, [file, onAudioElementRef]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const timeUpdateHandler = () => {
      setCurrentTime(audioElement.currentTime);
    };

    const endedHandler = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audioElement.addEventListener("timeupdate", timeUpdateHandler);
    audioElement.addEventListener("ended", endedHandler);

    return () => {
      audioElement.removeEventListener("timeupdate", timeUpdateHandler);
      audioElement.removeEventListener("ended", endedHandler);
    };
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current || !isLoaded) {
      console.warn("Audio not ready for playback");
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Stop other audio players
        const allAudioElements = document.querySelectorAll("audio");
        allAudioElements.forEach((audio) => {
          if (audio !== audioRef.current) {
            audio.pause();
          }
        });

        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Playback failed:", error);
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  const handleTimeChange = (value: number[]) => {
    if (audioRef.current && isLoaded) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white flex items-center gap-2">
          <Settings className="h-4 w-4 text-blue-400" />
          Preview: {file.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlay}
            disabled={!isLoaded}
            className="h-8 w-8 p-0 text-white hover:bg-slate-700"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <div className="flex items-center gap-2 flex-1 mx-3">
            <span className="text-xs text-slate-400 font-mono">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1">
              <Slider
                value={[currentTime]}
                onValueChange={handleTimeChange}
                max={duration || 100}
                step={1}
                className="w-full"
                disabled={!isLoaded}
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
            >
              {volume === 0 ? (
                <VolumeX className="h-3 w-3" />
              ) : (
                <Volume2 className="h-3 w-3" />
              )}
            </Button>
            <div className="w-16">
              <Slider
                value={[volume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <audio ref={audioRef} preload="metadata" />
      </CardContent>
    </Card>
  );
};
