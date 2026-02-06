import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { AudioFile } from '@/types/audio';
import { getAudioContext } from '@/utils/audioContextManager';
import { useAuth } from './AuthContext';
import { saveAudioFile, getAllAudioFiles, deleteAudioFile, clearAllAudioFiles } from '@/utils/audioStorage';

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
    setIsDirectOutputEnabled: (enabled: boolean) => void;
    stop: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { profile } = useAuth();
    const [currentTrack, setCurrentTrack] = useState<AudioFile | null>(null);
    const [playlist, setPlaylist] = useState<AudioFile[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [mediaSourceNode, setMediaSourceNode] = useState<MediaElementAudioSourceNode | null>(null);
    const [isDirectOutputEnabled, setIsDirectOutputEnabled] = useState(true);

    // Global Audio Element
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Clear playlist and stop playback when user logs out
    useEffect(() => {
        if (!profile) {
            console.log("🔒 User logged out - Clearing player state");
            setPlaylist([]);
            setCurrentTrack(null);
            setIsPlaying(false);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        }
    }, [profile]);

    // Initial Audio Setup
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
            if (ctx && !mediaSourceNode && !(audioRef.current as any)._source) {
                try {
                    const source = ctx.createMediaElementSource(audioRef.current!);
                    (audioRef.current as any)._source = source;
                    setMediaSourceNode(source);

                    // Connect to destination by default if enabled
                    if (isDirectOutputEnabled) {
                        source.connect(ctx.destination);
                    }

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

    // Manage Direct Output Connection
    useEffect(() => {
        const ctx = getAudioContext();
        if (!mediaSourceNode || !ctx) return;

        try {
            if (isDirectOutputEnabled) {
                mediaSourceNode.connect(ctx.destination);
            } else {
                mediaSourceNode.disconnect(ctx.destination);
            }
        } catch (e) {
            // Ignore connection errors if already connected/disconnected
        }
    }, [isDirectOutputEnabled, mediaSourceNode]);

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

    // Load saved playlist on mount
    useEffect(() => {
        const loadSavedFiles = async () => {
            try {
                const storedFiles = await getAllAudioFiles();
                if (storedFiles.length > 0) {
                    const hydratedFiles: AudioFile[] = storedFiles.map(f => {
                        // Reconstruct Blob with explicit type
                        const safeBlob = new Blob([f.blob], { type: f.type || 'audio/mpeg' });
                        const safeUrl = URL.createObjectURL(safeBlob);

                        return {
                            id: f.id,
                            name: f.name,
                            size: f.size,
                            type: f.type,
                            fileType: f.metadata?.fileType || 'mp3',
                            status: 'uploaded',
                            originalUrl: safeUrl,
                            originalFile: new File([safeBlob], f.name, { type: f.type }),
                            enhancedUrl: f.metadata?.enhancedUrl
                        };
                    });

                    setPlaylist(hydratedFiles);
                    console.log(`💾 Restored ${hydratedFiles.length} files from IndexedDB`);
                }
            } catch (e) {
                console.error("Failed to load saved audio:", e);
            }
        };
        loadSavedFiles();
    }, []);

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

    const addToPlaylist = useCallback(async (files: AudioFile[]) => {
        setPlaylist(prev => [...prev, ...files]);

        // Persist
        for (const file of files) {
            if (file.originalFile) {
                try {
                    await saveAudioFile(
                        file.originalFile,
                        file.id,
                        file.name,
                        file.type,
                        file.size,
                        { fileType: file.fileType }
                    );
                } catch (e) {
                    console.error("Failed to save to DB:", e);
                }
            }
        }
    }, []);

    const removeFromPlaylist = useCallback(async (id: string) => {
        setPlaylist(prev => prev.filter(f => f.id !== id));
        if (currentTrack?.id === id) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
            setCurrentTrack(null);
        }
        // Remove from DB
        try {
            await deleteAudioFile(id);
        } catch (e) {
            console.error("Failed to delete from DB:", e);
        }
    }, [currentTrack]);

    const clearPlaylist = useCallback(async () => {
        setPlaylist([]);
        setCurrentTrack(null);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        await clearAllAudioFiles();
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

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        setCurrentTrack(null);
        setIsPlaying(false);
    }, []);

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
            playPrevious,
            setIsDirectOutputEnabled,
            stop
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
