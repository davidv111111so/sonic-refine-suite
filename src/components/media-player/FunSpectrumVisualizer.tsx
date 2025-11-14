import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface FunSpectrumVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
}

type VisualizerMode = 'bars' | 'wave' | 'circular' | 'particles';

export const FunSpectrumVisualizer: React.FC<FunSpectrumVisualizerProps> = ({
  analyserNode,
  isPlaying
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const [mode, setMode] = useState<VisualizerMode>('bars');
  const [colorScheme, setColorScheme] = useState(0);
  const timeRef = useRef(0);

  const colorSchemes = [
    ['#ff006e', '#8338ec', '#3a86ff'], // Pink, Purple, Blue
    ['#ffbe0b', '#fb5607', '#ff006e'], // Yellow, Orange, Pink
    ['#06ffa5', '#06d6a0', '#118ab2'], // Green, Teal, Blue
    ['#f72585', '#b5179e', '#7209b7'], // Magenta gradient
    ['#ff9f1c', '#ffbf69', '#cbf3f0'], // Warm sunset
    ['#06a77d', '#d5e68d', '#f1a208'], // Nature
  ];

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

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);
      analyserNode.getByteTimeDomainData(timeDataArray);
      
      timeRef.current += 0.02;
      const colors = colorSchemes[colorScheme % colorSchemes.length];

      // Clear canvas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      switch (mode) {
        case 'bars':
          // Animated bars with gradient
          const barCount = 64;
          const barWidth = canvas.width / barCount;
          for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor((i / barCount) * bufferLength);
            const barHeight = (dataArray[dataIndex] / 255) * canvas.height * 0.8;
            const x = i * barWidth;
            
            // Color based on frequency and time
            const hue = (i / barCount) * 360 + timeRef.current * 50;
            const gradient = ctx.createLinearGradient(x, canvas.height - barHeight, x, canvas.height);
            gradient.addColorStop(0, `hsl(${hue}, 100%, 60%)`);
            gradient.addColorStop(1, colors[2]);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
            
            // Add glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
            ctx.shadowBlur = 0;
          }
          break;

        case 'wave':
          // Smooth waveform
          ctx.strokeStyle = colors[0];
          ctx.lineWidth = 3;
          ctx.beginPath();
          
          const sliceWidth = canvas.width / bufferLength;
          let x = 0;
          
          for (let i = 0; i < bufferLength; i++) {
            const v = timeDataArray[i] / 128.0;
            const y = v * canvas.height / 2;
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
          }
          
          ctx.stroke();
          
          // Add mirror effect
          ctx.strokeStyle = colors[1];
          ctx.beginPath();
          x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = timeDataArray[i] / 128.0;
            const y = canvas.height - (v * canvas.height / 2);
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
          }
          ctx.stroke();
          break;

        case 'circular':
          // Circular spectrum
          const radius = Math.min(canvas.width, canvas.height) * 0.3;
          const angleStep = (Math.PI * 2) / bufferLength;
          
          for (let i = 0; i < bufferLength; i += 2) {
            const angle = i * angleStep + timeRef.current;
            const dataValue = dataArray[i] / 255;
            const barLength = dataValue * radius * 0.8;
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barLength);
            const y2 = centerY + Math.sin(angle) * (radius + barLength);
            
            const hue = (i / bufferLength) * 360 + timeRef.current * 30;
            ctx.strokeStyle = `hsl(${hue}, 100%, ${50 + dataValue * 50}%)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
          break;

        case 'particles':
          // Particle system
          const particleCount = 128;
          for (let i = 0; i < particleCount; i++) {
            const dataIndex = Math.floor((i / particleCount) * bufferLength);
            const intensity = dataArray[dataIndex] / 255;
            
            const angle = (i / particleCount) * Math.PI * 2 + timeRef.current;
            const distance = intensity * radius * 1.5;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            const size = 2 + intensity * 8;
            const hue = (i / particleCount) * 360 + timeRef.current * 20;
            
            ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, isPlaying, mode, colorScheme]);

  // Auto-cycle modes and colors
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setMode(prev => {
        const modes: VisualizerMode[] = ['bars', 'wave', 'circular', 'particles'];
        const currentIndex = modes.indexOf(prev);
        return modes[(currentIndex + 1) % modes.length];
      });
      setColorScheme(prev => (prev + 1) % colorSchemes.length);
    }, 8000); // Change every 8 seconds

    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!isPlaying) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
          <span className="text-xl">🎨</span>
          Fun Visualizer
        </h3>
        <div className="text-center py-8 text-slate-500 text-sm">
          Start playing music to see the visualizer
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
          <span className="text-xl">🎨</span>
          Fun Visualizer
        </h3>
        <div className="flex gap-1">
          {(['bars', 'wave', 'circular', 'particles'] as VisualizerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                mode === m
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {m[0].toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className="w-full rounded-lg border border-slate-700 shadow-lg"
      />
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>Mode: {mode}</span>
        <button
          onClick={() => setColorScheme(prev => (prev + 1) % colorSchemes.length)}
          className="hover:text-purple-400 transition-colors"
        >
          🎨 Change Colors
        </button>
      </div>
    </Card>
  );
};

