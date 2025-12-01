import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Headphones } from 'lucide-react';

interface StemPlayerProps {
    url: string;
    name: string;
    color: string;
    isMuted: boolean;
    isSoloed: boolean;
    onMute: () => void;
    onSolo: () => void;
    onReady: (wavesurfer: WaveSurfer) => void;
}

export const StemPlayer = ({ url, name, color, isMuted, isSoloed, onMute, onSolo, onReady }: StemPlayerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const wavesurfer = WaveSurfer.create({
            container: containerRef.current,
            waveColor: color,
            progressColor: 'rgba(255, 255, 255, 0.2)', // Subtle progress
            cursorColor: 'transparent',
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 48,
            normalize: true,
            minPxPerSec: 50,
            interact: false, // Disable interaction to keep sync simple for now
            hideScrollbar: true,
        });

        wavesurfer.load(url);
        wavesurferRef.current = wavesurfer;

        wavesurfer.on('ready', () => {
            onReady(wavesurfer);
        });

        return () => {
            try {
                wavesurfer.destroy();
            } catch (e) {
                // Ignore abort errors during cleanup
                console.debug('WaveSurfer destroy error:', e);
            }
        };
    }, [url, color, onReady]);

    useEffect(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.setMuted(isMuted);
        }
    }, [isMuted]);

    return (
        <div className="flex items-center gap-4 bg-slate-950/50 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-24 flex-shrink-0">
                <p className="text-sm font-medium text-slate-200 truncate" title={name}>{name}</p>
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${isMuted ? 'text-red-400 bg-red-950/30' : 'text-slate-400 hover:text-slate-200'}`}
                    onClick={onMute}
                    title="Mute"
                >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${isSoloed ? 'text-yellow-400 bg-yellow-950/30' : 'text-slate-400 hover:text-slate-200'}`}
                    onClick={onSolo}
                    title="Solo"
                >
                    <Headphones className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 opacity-80 hover:opacity-100 transition-opacity" ref={containerRef} />
        </div>
    );
};
