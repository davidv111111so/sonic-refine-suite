import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type SyncMode = 'beat' | 'tempo';

interface SyncContextType {
    masterDeckId: string | null;
    setMasterDeckId: (id: string | null) => void;
    syncMode: SyncMode;
    setSyncMode: (mode: SyncMode) => void;
    masterBpm: number;
    setMasterBpm: (bpm: number) => void;
    reportBpm: (deckId: string, bpm: number) => void;
    registerDeck: (id: string) => void;
}

const SyncContext = createContext<SyncContextType | null>(null);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [masterDeckId, setMasterDeckId] = useState<string | null>(null);
    const [syncMode, setSyncMode] = useState<SyncMode>('beat');
    const [masterBpm, setMasterBpm] = useState<number>(120);
    const [deckBpms, setDeckBpms] = useState<Record<string, number>>({});

    const reportBpm = useCallback((deckId: string, bpm: number) => {
        setDeckBpms(prev => {
            if (prev[deckId] === bpm) return prev;
            return { ...prev, [deckId]: bpm };
        });

        // If this deck is master, update master BPM
        if (deckId === masterDeckId) {
            setMasterBpm(bpm);
        }
    }, [masterDeckId]);

    const registerDeck = useCallback((id: string) => {
        // Auto-assign master if none exists
        setMasterDeckId(prev => (prev === null ? id : prev));
    }, []);

    return (
        <SyncContext.Provider value={{
            masterDeckId,
            setMasterDeckId,
            syncMode,
            setSyncMode,
            masterBpm,
            setMasterBpm,
            reportBpm,
            registerDeck
        }}>
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => {
    const context = useContext(SyncContext);
    if (!context) throw new Error("useSync must be used within SyncProvider");
    return context;
};
