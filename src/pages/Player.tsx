import React, { useState, useEffect } from 'react';
import { AdvancedMediaPlayer } from '@/components/media-player/AdvancedMediaPlayer';
import { AudioFile } from '@/types/audio';

const PlayerPage = () => {
    const [playlist, setPlaylist] = useState<AudioFile[]>([]);

    // Load playlist from localStorage on mount
    useEffect(() => {
        const savedPlaylist = localStorage.getItem('external_player_playlist');
        if (savedPlaylist) {
            try {
                const parsed = JSON.parse(savedPlaylist);
                // Rehydrate dates and ensure types
                const rehydrated = parsed.map((file: any) => ({
                    ...file,
                    lastModified: file.lastModified || Date.now()
                }));
                setPlaylist(rehydrated);
            } catch (e) {
                console.error("Failed to load playlist", e);
            }
        }
    }, []);

    // Save playlist to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('external_player_playlist', JSON.stringify(playlist));
    }, [playlist]);

    const handleFilesAdded = (newFiles: AudioFile[]) => {
        setPlaylist(prev => [...prev, ...newFiles]);
    };

    const handleFileDelete = (fileId: string) => {
        setPlaylist(prev => prev.filter(f => f.id !== fileId));
    };

    return (
        <AdvancedMediaPlayer
            files={playlist}
            onFilesAdded={handleFilesAdded}
            onFileDelete={handleFileDelete}
        />
    );
};

export default PlayerPage;
