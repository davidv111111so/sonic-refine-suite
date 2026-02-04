import React from 'react';

interface MeterProps {
    active?: boolean;
    analyser?: AnalyserNode | null;
}

export const Meter = ({ active, analyser }: MeterProps) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!analyser || !active) {
            // Clear canvas if inactive
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Draw empty/dim state?
            // Just clear is fine for "0%"
            return;
        }

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Use a more responsive smoothing internally
        analyser.smoothingTimeConstant = 0.4;

        let animationId: number;
        let lastLevel = 0;
        let peakLevel = 0;
        let peakHoldTime = 0;

        const draw = () => {
            animationId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            // Calculate RMS-like value from frequency data
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            const rms = Math.sqrt(sum / bufferLength);

            // Map RMS to level (Improved non-linear scaling for better visibility)
            // Using a power scale (0.5) makes it feel more like a real VU meter
            const targetLevel = Math.pow(rms / 255, 0.6) * 35;

            // Fast Attack, Slow Release logic
            const attack = 0.8;
            const release = 0.1;
            let currentLevel;

            if (targetLevel > lastLevel) {
                currentLevel = lastLevel + (targetLevel - lastLevel) * attack;
            } else {
                currentLevel = lastLevel - (lastLevel - targetLevel) * release;
            }
            lastLevel = currentLevel;

            // Clip Detection & Hold (Level > 28 is red/clip)
            if (currentLevel >= 28) {
                peakLevel = currentLevel;
                peakHoldTime = Date.now() + 750; // Hold for 750ms as per research
            }

            const showClip = Date.now() < peakHoldTime;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const segmentHeight = canvas.height / 30;
            const gap = 1;

            for (let i = 0; i < 30; i++) {
                const isActive = i < currentLevel;
                const isClipSegment = i >= 28;

                // Base Colors (Dimmed)
                let baseColor = '#1a1a1a';
                if (i < 18) baseColor = '#064e3b'; // Very dark green
                else if (i < 26) baseColor = '#451a03'; // Very dark orange
                else baseColor = '#450a0a'; // Very dark red

                let litColor = null;
                if (isActive || (isClipSegment && showClip)) {
                    if (i < 18) litColor = '#22c55e'; // Vibrant Green
                    else if (i < 26) litColor = '#f97316'; // Vibrant Orange
                    else litColor = '#ef4444'; // Vibrant Red (Clip)
                }

                ctx.fillStyle = litColor || baseColor;
                ctx.fillRect(0, canvas.height - ((i + 1) * segmentHeight) + gap, canvas.width, segmentHeight - gap);
            }
        };

        draw();
        return () => cancelAnimationFrame(animationId);
    }, [active, analyser]);

    return (
        <div className="flex-1 w-3 bg-[#09090b] rounded-sm p-[1px] relative overflow-hidden border border-[#27272a]">
            <canvas ref={canvasRef} width={12} height={200} className="w-full h-full" />
        </div>
    );
};
