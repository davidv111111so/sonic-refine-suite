import { useCallback, useEffect, useRef } from 'react';
import { DeckControls } from './useDJDeck';
import { useTransport } from '@/contexts/TransportContext';

export const useSyncLogic = (
    deckId: 'A' | 'B',
    controls: DeckControls,
    nativeBpm: number | null
) => {
    const { state: transport, setMaster, updateMasterClock } = useTransport();
    const isMaster = transport.masterDeckId === deckId;

    // Broadcast Master State
    useEffect(() => {
        if (isMaster && nativeBpm) {
            // Calculate current effective BPM based on playback rate
            const effectiveBpm = nativeBpm * controls.state.playbackRate;
            updateMasterClock(effectiveBpm, 0);
        }
    }, [isMaster, nativeBpm, controls.state.playbackRate, updateMasterClock]);

    const handleSync = useCallback(() => {
        if (!nativeBpm || !transport.masterBpm) return;

        // 1. Tempo Sync
        const targetRate = transport.masterBpm / nativeBpm;
        controls.setSpeed(targetRate);

        // 2. Phase Sync (Snap)
        // We need the AudioContext time to calculate phase.
        // Assuming controls.state.currentTime is updated via RAF, but we need precise audio time.
        // Let's assume we have access to context via controls (we don't directly, but we can add it or use a ref).
        // For now, we'll just do Tempo Sync. Phase sync requires precise grid data.

        // If we want to implement Phase Sync:
        // const beatInterval = 60 / transport.masterBpm;
        // const masterPhase = (audioContext.currentTime - transport.beatGridOffset) % beatInterval;
        // const myPhase = (audioContext.currentTime - myStartTime) % beatInterval;
        // const delta = myPhase - masterPhase;
        // Apply correction...

    }, [nativeBpm, transport.masterBpm, controls]);

    const handleMaster = useCallback(() => {
        if (!nativeBpm) return;
        // Set this deck as master
        // We need the current AudioContext time for the offset.
        // Since we don't have direct access here, we might need to pass it or grab it from controls if exposed.
        // Let's assume offset 0 for now or implement properly later.
        setMaster(deckId, nativeBpm * controls.state.playbackRate, 0);
    }, [deckId, nativeBpm, controls.state.playbackRate, setMaster]);

    // Phase Meter Calculation
    const getPhaseOffset = () => {
        if (!nativeBpm || !transport.masterBpm) return 0;
        // Placeholder logic
        return 0;
    };

    return {
        handleSync,
        handleMaster,
        isMaster,
        getPhaseOffset
    };
};
