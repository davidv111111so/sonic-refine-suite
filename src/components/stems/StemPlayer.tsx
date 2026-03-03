import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Headphones, Play, Pause } from 'lucide-react';

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

export const StemPlayerComponent = ({ url, name, color, isMuted, isSoloed, onMute, onSolo, onReady }: StemPlayerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const urlRef = useRef<string>(url);
    const [isPlaying, setIsPlaying] = useState(false);

    // Track the URL for cleanup
    useEffect(() => {
        urlRef.current = url;
    }, [url]);

    useEffect(() => {
        if (!containerRef.current) return;

        console.log(`[StemPlayer] Initializing for ${name}`, { url, color });

        // Destroy previous instance if it exists
        if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
            wavesurferRef.current = null;
        }

        const wavesurfer = WaveSurfer.create({
            container: containerRef.current,
            waveColor: color,
            progressColor: 'rgba(255, 255, 255, 0.2)',
            cursorColor: 'transparent',
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 48,
            normalize: true,
            fillParent: true,
            interact: true,
            hideScrollbar: true,
            url: url,
        });

        wavesurferRef.current = wavesurfer;

        wavesurfer.on('ready', () => {
            onReady(wavesurfer);
            wavesurfer.setMuted(isMuted);
        });

        wavesurfer.on('play', () => setIsPlaying(true));
        wavesurfer.on('pause', () => setIsPlaying(false));
        wavesurfer.on('finish', () => setIsPlaying(false));

        wavesurfer.on('interaction', () => {
            // Allows seeking in this individual stem
        });

        wavesurfer.on('error', (err: Error) => {
            console.error("WaveSurfer error:", err);
        });

        return () => {
            try {
                if (wavesurferRef.current) {
                    wavesurferRef.current.destroy();
                }
            } catch (e) {
                // Ignore abort errors during cleanup
            }
            wavesurferRef.current = null;
        };
    }, [url, color]); // Re-create if URL or color changes

    // React to mute/solo changes without re-creating
    useEffect(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.setMuted(isMuted);
        }
    }, [isMuted]);

    const togglePlay = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    };

    return (
        <div className="flex items-center gap-4 bg-slate-950/50 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors h-[76px] w-full">
            <div className="flex items-center gap-3 w-32 flex-shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                    onClick={togglePlay}
                >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <p className="text-sm font-medium text-slate-200 truncate" title={name}>{name}</p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
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

            <div className="flex-1 min-w-[200px] w-full h-full opacity-80 hover:opacity-100 transition-opacity" ref={containerRef} />
        </div>
    );
};

export const StemPlayer = React.memo(StemPlayerComponent);
