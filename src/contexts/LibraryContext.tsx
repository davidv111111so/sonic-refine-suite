import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Types
export interface LibraryTrack {
    id: string;
    title: string;
    artist: string;
    bpm: number;
    key: string;
    time: string;
    url: string;
    file: File;
    duration: number;
}

interface FolderNode {
    name: string;
    handle: FileSystemDirectoryHandle;
    children: FolderNode[];
    isOpen: boolean;
}

interface LibraryState {
    rootHandle: FileSystemDirectoryHandle | null;
    fileTree: FolderNode | null;
    currentTracks: LibraryTrack[];
    loading: boolean;
    searchQuery: string;
    analyzingCount: number;
}

type Action =
    | { type: 'SET_ROOT'; payload: { handle: FileSystemDirectoryHandle; tree: FolderNode } }
    | { type: 'SET_TRACKS'; payload: LibraryTrack[] }
    | { type: 'ADD_TRACK'; payload: LibraryTrack }
    | { type: 'UPDATE_TRACK_METADATA'; payload: { id: string; metadata: Partial<LibraryTrack> } }
    | { type: 'TOGGLE_FOLDER'; payload: string }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_SEARCH'; payload: string }
    | { type: 'INCREMENT_ANALYZING' }
    | { type: 'DECREMENT_ANALYZING' }
    | { type: 'ADD_TRACKS'; payload: LibraryTrack[] }
    | { type: 'UPDATE_TREE_NODE'; payload: { tree: FolderNode } };

const initialState: LibraryState = {
    rootHandle: null,
    fileTree: null,
    currentTracks: [],
    loading: false,
    searchQuery: '',
    analyzingCount: 0
};

const LibraryContext = createContext<{
    state: LibraryState;
    mountLibrary: () => Promise<void>;
    importFiles: () => Promise<void>;
    navigateToFolder: (handle: FileSystemDirectoryHandle) => Promise<void>;
    toggleFolder: (node: FolderNode) => Promise<void>;
    setSearch: (query: string) => void;
} | undefined>(undefined);

// Reducer
function libraryReducer(state: LibraryState, action: Action): LibraryState {
    switch (action.type) {
        case 'SET_ROOT':
            return { ...state, rootHandle: action.payload.handle, fileTree: action.payload.tree };
        case 'SET_TRACKS':
            return { ...state, currentTracks: action.payload };
        case 'ADD_TRACK':
            return { ...state, currentTracks: [...state.currentTracks, action.payload] };
        case 'UPDATE_TRACK_METADATA':
            return {
                ...state,
                currentTracks: state.currentTracks.map(t =>
                    t.id === action.payload.id ? { ...t, ...action.payload.metadata } : t
                )
            };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_SEARCH':
            return { ...state, searchQuery: action.payload };
        case 'INCREMENT_ANALYZING':
            return { ...state, analyzingCount: state.analyzingCount + 1 };
        case 'DECREMENT_ANALYZING':
            return { ...state, analyzingCount: Math.max(0, state.analyzingCount - 1) };
        case 'UPDATE_TREE_NODE':
            return { ...state, fileTree: action.payload.tree };
        case 'ADD_TRACKS':
            return {
                ...state,
                currentTracks: [...state.currentTracks, ...action.payload]
            };
        default:
            return state;
    }
}

// Helper: Worker Factory - using inline worker to avoid build issues
const createWorker = () => {
    const workerCode = `
        self.onmessage = async (e) => {
            const { id, file } = e.data;
            try {
                const arrayBuffer = await file.arrayBuffer();
                const audioCtx = new OfflineAudioContext(2, 44100 * 10, 44100);
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                const duration = audioBuffer.duration;
                const minutes = Math.floor(duration / 60);
                const seconds = Math.floor(duration % 60);
                self.postMessage({
                    type: 'success',
                    payload: {
                        id,
                        title: file.name.replace(/\\.[^/.]+$/, ""),
                        artist: 'Unknown Artist',
                        bpm: 120,
                        key: '-',
                        time: minutes + ':' + (seconds < 10 ? '0' : '') + seconds,
                        duration
                    }
                });
            } catch (err) {
                self.postMessage({ type: 'error', payload: { id, error: err.message } });
            }
        };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
};

import { saveAllTracksToDB, loadTracksFromDB } from '@/utils/libraryPersistence';

// ...

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(libraryReducer, initialState);
    const workerRef = React.useRef<Worker | null>(null);
    const [initialized, setInitialized] = React.useState(false);

    // Init Worker
    React.useEffect(() => {
        workerRef.current = createWorker();
        workerRef.current.onmessage = (e) => {
            const { type, payload } = e.data;
            if (type === 'success') {
                dispatch({
                    type: 'UPDATE_TRACK_METADATA',
                    payload: {
                        id: payload.id,
                        metadata: {
                            title: payload.title,
                            artist: payload.artist,
                            bpm: payload.bpm,
                            key: payload.key,
                            time: payload.time,
                            duration: payload.duration
                        }
                    }
                });
            }
            dispatch({ type: 'DECREMENT_ANALYZING' });
        };

        return () => workerRef.current?.terminate();
    }, []);

    // Load persisted tracks on mount
    React.useEffect(() => {
        loadTracksFromDB().then(tracks => {
            if (tracks.length > 0) {
                dispatch({ type: 'SET_TRACKS', payload: tracks });
            }
            setInitialized(true);
        }).catch(err => {
            console.error("Failed to load tracks from DB:", err);
            setInitialized(true);
        });
    }, []);

    // Save tracks to DB when changed
    React.useEffect(() => {
        if (initialized) {
            saveAllTracksToDB(state.currentTracks).catch(err => {
                console.error("Failed to save tracks to DB:", err);
            });
        }
    }, [state.currentTracks, initialized]);

    const navigateToFolder = useCallback(async (handle: FileSystemDirectoryHandle) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_TRACKS', payload: [] }); // Clear current view

        const newTracks: LibraryTrack[] = [];

        try {
            // @ts-ignore
            for await (const entry of handle.values()) {
                if (entry.kind === 'file') {
                    const file = await entry.getFile();
                    // Robust check: MIME type OR Extension
                    const isAudio = file.type.startsWith('audio/') ||
                        /\.(mp3|wav|flac|m4a|aac|ogg|aiff)$/i.test(file.name);

                    if (isAudio) {
                        const id = `lib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        const track: LibraryTrack = {
                            id,
                            title: file.name.replace(/\.[^/.]+$/, ""),
                            artist: 'Loading...',
                            bpm: 0,
                            key: '?',
                            time: '--:--',
                            url: URL.createObjectURL(file),
                            file: file,
                            duration: 0
                        };
                        newTracks.push(track);

                        // Send to worker
                        dispatch({ type: 'INCREMENT_ANALYZING' });
                        workerRef.current?.postMessage({ id, file });
                    }
                }
            }
            dispatch({ type: 'SET_TRACKS', payload: newTracks });
        } catch (e) {
            console.error("Error reading folder:", e);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const mountLibrary = useCallback(async () => {
        try {
            // @ts-ignore - native FS API
            const handle = await window.showDirectoryPicker({
                id: 'mixer-library',
                mode: 'read'
            });

            const tree: FolderNode = {
                name: handle.name,
                handle: handle,
                children: [],
                isOpen: true
            };

            dispatch({ type: 'SET_ROOT', payload: { handle, tree } });
            navigateToFolder(handle); // Load root immediately
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error("Failed to mount library:", err);
            }
        }
    }, [navigateToFolder]);

    const importFiles = useCallback(async () => {
        try {
            // @ts-ignore
            const handles = await window.showOpenFilePicker({
                id: 'mixer-import',
                multiple: true,
                types: [{
                    description: 'Audio Files',
                    accept: {
                        'audio/*': ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.aiff']
                    }
                }]
            });

            dispatch({ type: 'SET_LOADING', payload: true });

            const newTracks: LibraryTrack[] = [];

            for (const handle of handles) {
                const file = await handle.getFile();
                const id = `lib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const track: LibraryTrack = {
                    id,
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    artist: 'Loading...',
                    bpm: 0,
                    key: '?',
                    time: '--:--',
                    url: URL.createObjectURL(file), // Create blob URL for playback
                    file: file,
                    duration: 0
                };
                newTracks.push(track);

                dispatch({ type: 'INCREMENT_ANALYZING' });
                workerRef.current?.postMessage({ id, file });
            }

            dispatch({ type: 'ADD_TRACKS', payload: newTracks });
            // Clear root handle as we are not in a folder anymore
            dispatch({ type: 'SET_ROOT', payload: { handle: null as any, tree: null as any } });

        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error("Failed to import files:", err);
            }
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const toggleFolder = useCallback(async (node: FolderNode) => {
        if (!node.isOpen && node.children.length === 0) {
            // Load children
            const subFolders: FolderNode[] = [];
            try {
                // @ts-ignore
                for await (const entry of node.handle.values()) {
                    if (entry.kind === 'directory') {
                        subFolders.push({
                            name: entry.name,
                            handle: entry,
                            children: [],
                            isOpen: false
                        });
                    }
                }
                node.children = subFolders.sort((a, b) => a.name.localeCompare(b.name));
            } catch (e) {
                console.error("Failed to load subfolders:", e);
            }
        }

        node.isOpen = !node.isOpen;

        // Force a tree update by creating a new root reference
        if (state.fileTree) {
            dispatch({ type: 'UPDATE_TREE_NODE', payload: { tree: { ...state.fileTree } } });
        }

        // Also navigate to it to show tracks
        navigateToFolder(node.handle);
    }, [state.fileTree, navigateToFolder]);

    const setSearch = useCallback((query: string) => {
        dispatch({ type: 'SET_SEARCH', payload: query });
    }, []);

    return (
        <LibraryContext.Provider value={{ state, mountLibrary, importFiles, navigateToFolder, toggleFolder, setSearch }}>
            {children}
        </LibraryContext.Provider>
    );
};

export const useLibrary = () => {
    const context = useContext(LibraryContext);
    if (!context) throw new Error("useLibrary must be used within LibraryProvider");
    return context;
};
