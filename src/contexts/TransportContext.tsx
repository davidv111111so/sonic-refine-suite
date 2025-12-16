import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface TransportState {
    masterDeckId: 'A' | 'B' | null;
    masterBpm: number;
    masterGridAnchor: number;
    isPlaying: boolean;
}

interface TransportContextType {
    state: TransportState;
    setMaster: (deckId: 'A' | 'B' | null, bpm: number, anchor: number) => void;
    updateMasterClock: (bpm: number, anchor: number) => void;
    togglePlay: () => void;
}

const TransportContext = createContext<TransportContextType | undefined>(undefined);

export const TransportProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<TransportState>({
        masterDeckId: null,
        masterBpm: 128,
        masterGridAnchor: 0,
        isPlaying: false
    });

    const setMaster = useCallback((deckId: 'A' | 'B' | null, bpm: number, anchor: number) => {
        setState(prev => ({
            ...prev,
            masterDeckId: deckId,
            masterBpm: bpm,
            masterGridAnchor: anchor
        }));
    }, []);

    const updateMasterClock = useCallback((bpm: number, anchor: number) => {
        setState(prev => ({
            ...prev,
            masterBpm: bpm,
            masterGridAnchor: anchor
        }));
    }, []);

    const togglePlay = useCallback(() => {
        setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }, []);

    return (
        <TransportContext.Provider value={{ state, setMaster, updateMasterClock, togglePlay }}>
            {children}
        </TransportContext.Provider>
    );
};

export const useTransport = () => {
    const context = useContext(TransportContext);
    if (!context) {
        throw new Error('useTransport must be used within a TransportProvider');
    }
    return context;
};
