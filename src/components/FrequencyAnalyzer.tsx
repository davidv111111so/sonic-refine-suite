
import { useEffect, useRef } from 'react';

interface FrequencyAnalyzerProps {
  audioUrl?: string;
  playing?: boolean;
  height?: number;
}

export const FrequencyAnalyzer = ({ audioUrl, playing = false, height = 120 }: FrequencyAnalyzerProps) => {
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
    audioRef.current.crossOrigin = 'anonymous';
    
    if (playing) {
      audioRef.current.play().catch(err => console.error("Playback error:", err));
    } else {
      audioRef.current.pause();
    }

    // Clean up and create new audio context
    if (audioContextRef.current) {
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
    }

    // Create audio context
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
    
    // Connect audio graph
    sourceRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);
    
    // Configure analyzer
    analyserRef.current.fftSize = 2048;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Get canvas context and start drawing
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    // Function to draw spectrum analyzer
    const draw = () => {
      if (!analyserRef.current || !canvasCtx) return;
      
      animationRef.current = requestAnimationFrame(draw);
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the spectrum
      const barWidth = (canvas.width / bufferLength) * 8;
      let x = 0;
      
      // Create gradient
      const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 200, 255, 1)');
      gradient.addColorStop(0.5, 'rgba(0, 100, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(0, 50, 200, 0.6)');

      for (let i = 0; i < bufferLength; i += 4) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        canvasCtx.fillStyle = gradient;
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
  }, [audioUrl, playing]);

  return (
    <div className="w-full bg-slate-900/60 rounded-md p-2">
      <canvas 
        ref={canvasRef} 
        height={height} 
        className="w-full rounded"
      ></canvas>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>20 Hz</span>
        <span>1 kHz</span>
        <span>20 kHz</span>
      </div>
    </div>
  );
};
