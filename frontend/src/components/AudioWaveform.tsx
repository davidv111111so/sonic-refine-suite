import { useEffect, useRef } from "react";

interface AudioWaveformProps {
  audioUrl: string;
  color?: string;
  height?: number;
  playing?: boolean;
}

export const AudioWaveform = ({
  audioUrl,
  color = "#3b82f6",
  height = 40,
  playing = false,
}: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioUrl) return;

    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    audioRef.current.src = audioUrl;
    audioRef.current.crossOrigin = "anonymous";

    if (playing) {
      audioRef.current
        .play()
        .catch((err) => console.error("Playback error:", err));
    } else {
      audioRef.current.pause();
    }

    // Clean up and create new audio context
    if (audioContextRef.current) {
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
    }

    // Create audio context
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    sourceRef.current = audioContextRef.current.createMediaElementSource(
      audioRef.current,
    );

    // Connect audio graph
    sourceRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);

    // Configure analyzer
    analyserRef.current.fftSize = 256;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Get canvas context and start drawing
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) return;

    // Function to draw waveform
    const draw = () => {
      if (!analyserRef.current || !canvasCtx) return;

      animationRef.current = requestAnimationFrame(draw);

      analyserRef.current.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the waveform
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        canvasCtx.fillStyle = color;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    // Start the animation
    draw();

    return () => {
      // Clean up
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      audioRef.current?.pause();
    };
  }, [audioUrl, color, playing]);

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        height={height}
        className="w-full rounded-md"
      ></canvas>
    </div>
  );
};
