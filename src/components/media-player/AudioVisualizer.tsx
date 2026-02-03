import React, { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import * as Tone from 'tone';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | Tone.Analyser | null;
  isPlaying: boolean;
}
export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyserNode,
  isPlaying
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const vuMeterLeftRef = useRef<number>(0);
  const vuMeterRightRef = useRef<number>(0);
  useEffect(() => {
    if (!analyserNode || !canvasRef.current || !isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Tone vs Native
    const isTone = analyserNode instanceof Tone.Analyser;
    const fftSize = isTone ? (analyserNode as Tone.Analyser).size : (analyserNode as AnalyserNode).fftSize;
    const binCount = isTone ? fftSize : (analyserNode as AnalyserNode).frequencyBinCount;

    // We only need a subset for viz usually, but let's match binCount
    const bufferLength = binCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      if (isTone) {
        const vals = (analyserNode as Tone.Analyser).getValue();
        // vals is Float32Array of dB (-Inf to 0 usually)
        // Map to 0-255
        for (let i = 0; i < bufferLength; i++) {
          let db = vals[i] as number;
          // Range: -100dB (silence) to 0dB (max)
          if (db < -100) db = -100;
          if (db > 0) db = 0;
          // Norm 0-1
          const norm = (db + 100) / 100;
          dataArray[i] = Math.floor(norm * 255);
        }
      } else {
        (analyserNode as AnalyserNode).getByteFrequencyData(dataArray);
      }

      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      gradient.addColorStop(1, 'rgba(30, 41, 59, 0.95)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw spectrum bars
      const barWidth = canvas.width / bufferLength * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 255 * canvas.height;

        // Create gradient for each bar
        const barGradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        barGradient.addColorStop(0, '#06b6d4');
        barGradient.addColorStop(0.5, '#3b82f6');
        barGradient.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = barGradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }

      // Calculate VU meter values (average of frequency data)
      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      const average = sum / bufferLength;
      vuMeterLeftRef.current = average / 255 * 100;
      vuMeterRightRef.current = (average + Math.random() * 20 - 10) / 255 * 100; // Simulate stereo
    };
    draw();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, isPlaying]);
  return <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 p-6 space-y-4">
    <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
      <span className="text-2xl">📊</span>
      Real-time Analysis
    </h3>

    {/* Spectrum Analyzer */}
    <div>
      <label className="text-sm mb-2 block text-orange-300">Spectrum Analyzer</label>
      <canvas ref={canvasRef} width={800} height={200} className="w-full rounded-lg border border-slate-700 shadow-inner" />
    </div>

    {/* dB Meters */}
    <div className="space-y-3">
      <label className="text-sm block text-orange-300">dB Meters</label>

      {/* Left Channel */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white font-medium">L</span>
          <span className="text-cyan-400 font-mono">{vuMeterLeftRef.current.toFixed(0)}%</span>
        </div>
        <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100" style={{
            width: `${vuMeterLeftRef.current}%`
          }} />
        </div>
      </div>

      {/* Right Channel */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white font-medium">R</span>
          <span className="text-cyan-400 font-mono">{vuMeterRightRef.current.toFixed(0)}%</span>
        </div>
        <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100" style={{
            width: `${vuMeterRightRef.current}%`
          }} />
        </div>
      </div>
    </div>
  </Card>;
};