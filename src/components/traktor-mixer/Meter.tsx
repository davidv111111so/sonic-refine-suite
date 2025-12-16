import React from 'react';

interface MeterProps {
    active?: boolean;
    analyser?: AnalyserNode | null;
}

export const Meter = ({ active, analyser }: MeterProps) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        if (!analyser || !active) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.smoothingTimeConstant = 0.8;

        let animationId: number;

        const draw = () => {
            animationId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const level = (average / 255) * 30 * 2;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const segmentHeight = canvas.height / 30;
            const gap = 1;

            for (let i = 0; i < 30; i++) {
                if (i < level) {
                    let color = '#14532d';
                    if (i > 18) color = '#7c2d12';
                    if (i > 24) color = '#7f1d1d';

                    if (active) {
                        color = '#22c55e';
                        if (i > 18) color = '#f97316';
                        if (i > 24) color = '#ef4444';
                    }

                    ctx.fillStyle = color;
                    ctx.fillRect(0, canvas.height - ((i + 1) * segmentHeight) + gap, canvas.width, segmentHeight - gap);
                }
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
