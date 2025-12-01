import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { AudioFile } from '@/types/audio';
import { getAudioContext } from '@/utils/audioContextManager';
import { useAuth } from './AuthContext';

interface PlayerContextType {
    currentTrack: AudioFile | null;
    isPlaying: boolean;
    volume: number;
    duration: number;
    currentTime: number;
    playlist: AudioFile[];
    audioElement: HTMLAudioElement | null;
    mediaSourceNode: MediaElementAudioSourceNode | null;
    loadTrack: (track: AudioFile) => void;
    playPause: () => void;
    setVolume: (vol: number) => void;
    seekTo: (time: number) => void;
    addToPlaylist: (files: AudioFile[]) => void;
    removeFromPlaylist: (id: string) => void;
    clearPlaylist: () => void;
    playNext: () => void;
    playPrevious: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [currentTrack, setCurrentTrack] = useState<AudioFile | null>(null);
    const [playlist, setPlaylist] = useState<AudioFile[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [mediaSourceNode, setMediaSourceNode] = useState<MediaElementAudioSourceNode | null>(null);

    // Global Audio Element
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Clear playlist and stop playback when user logs out
    useEffect(() => {
        if (!user) {
            console.log("🔒 User logged out - Clearing player state");
            setPlaylist([]);
            setCurrentTrack(null);
            setIsPlaying(false);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        }
    }, [user]);

    useEffect(() => {
        const audio = new Audio();
        // Enable cross origin for potential CORS issues with visualizers
        audio.crossOrigin = "anonymous";
        audioRef.current = audio;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        // Initialize Source Node
        const initAudioNode = () => {
            const ctx = getAudioContext();
            // Check if we already have a source for this element
            if (ctx && !mediaSourceNode && !(audio as any)._source) {
                try {
                    const source = ctx.createMediaElementSource(audio);
                    source.connect(ctx.destination); // Default connection
                    (audio as any)._source = source; // Mark as initialized
                    setMediaSourceNode(source);
                    console.log("✅ Global MediaElementSourceNode created");
                } catch (e) {
                    console.error("Error creating MediaElementSourceNode:", e);
                }
            }
        };

        // Try to init immediately, or wait for interaction if context is missing/suspended
        initAudioNode();
        window.addEventListener('click', initAudioNode, { once: true });

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            window.removeEventListener('click', initAudioNode);
            audio.pause();
            audio.src = '';
        };
    }, []);

    // Auto-play next when track ends
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = () => {
            if (currentTrack && playlist.length > 0) {
                const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
                if (currentIndex < playlist.length - 1) {
                    loadTrack(playlist[currentIndex + 1]);
                }
            }
        };

        audio.addEventListener('ended', handleEnded);
        return () => audio.removeEventListener('ended', handleEnded);
    }, [currentTrack, playlist]);

    const loadTrack = useCallback((track: AudioFile) => {
        if (!audioRef.current) return;

        // Create a URL for the file if it doesn't have one (e.g. from File object)
        let src = track.enhancedUrl || track.originalUrl;
        if (!src && track.originalFile) {
            src = URL.createObjectURL(track.originalFile);
        }

        if (src) {
            audioRef.current.src = src;
            audioRef.current.load();
            setCurrentTrack(track);
            audioRef.current.play().catch(e => console.error("Play failed:", e));
        }
    }, []);

    const playPause = useCallback(() => {
        if (!audioRef.current) return;
        if (audioRef.current.paused) {
            audioRef.current.play();
        } else {
            audioRef.current.pause();
        }
    }, []);

    const handleSetVolume = useCallback((vol: number) => {
        setVolume(vol);
        if (audioRef.current) {
            audioRef.current.volume = vol;
        }
    }, []);

    const seekTo = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    }, []);

    const addToPlaylist = useCallback((files: AudioFile[]) => {
        setPlaylist(prev => [...prev, ...files]);
        // If no track is playing, load the first one? Optional.
    }, []);

    const removeFromPlaylist = useCallback((id: string) => {
        setPlaylist(prev => prev.filter(f => f.id !== id));
        if (currentTrack?.id === id) {
            // Stop if the removed track is playing
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
            setCurrentTrack(null);
        }
    }, [currentTrack]);

    const clearPlaylist = useCallback(() => {
        setPlaylist([]);
        setCurrentTrack(null);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
    }, []);

    const playNext = useCallback(() => {
        if (!currentTrack || playlist.length === 0) return;
        const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
        if (currentIndex < playlist.length - 1) {
            loadTrack(playlist[currentIndex + 1]);
        }
    }, [currentTrack, playlist, loadTrack]);

    const playPrevious = useCallback(() => {
        if (!currentTrack || playlist.length === 0) return;
        const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
        if (currentIndex > 0) {
            loadTrack(playlist[currentIndex - 1]);
        }
    }, [currentTrack, playlist, loadTrack]);

    return (
        <PlayerContext.Provider value={{
            currentTrack,
            isPlaying,
            volume,
            duration,
            currentTime,
            playlist,
            audioElement: audioRef.current,
            mediaSourceNode,
            loadTrack,
            playPause,
            setVolume: handleSetVolume,
            seekTo,
            addToPlaylist,
            removeFromPlaylist,
            clearPlaylist,
            playNext,
            playPrevious
        }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};
