import { useCallback } from 'react';
import { useDJDeck } from './useDJDeck';
import { useSync } from '@/contexts/SyncContext';

export const useBeatSync = (deckA: ReturnType<typeof useDJDeck>, deckB: ReturnType<typeof useDJDeck>) => {
    const { masterDeckId, setMasterDeckId } = useSync();

    const handleSync = useCallback((deckId: 'A' | 'B') => {
        if (!masterDeckId) return;
        if (deckId === masterDeckId) return;

        const targetDeck = deckId === 'A' ? deckA : deckB;
        const masterDeck = masterDeckId === 'A' ? deckA : deckB;

        if (!masterDeck.state.bpm || !targetDeck.state.bpm || !masterDeck.state.buffer) return;

        // 1. Tempo Sync
        const masterEffectiveBPM = masterDeck.state.bpm * masterDeck.state.playbackRate;
        const requiredRate = masterEffectiveBPM / targetDeck.state.bpm;

        // 2. Phase Sync (Beat Alignment)
        // We calculate where the Master is within its beat and force the Target to match.
        const beatDuration = 60 / masterEffectiveBPM;
        const masterTime = masterDeck.state.currentTime;
        const followerTime = targetDeck.state.currentTime;

        // How far into the beat is the master? (0 to beatDuration)
        const masterPhase = masterTime % beatDuration;

        // Where should the follower be to match?
        // Since we are matching BPM, beatDuration is now the same for both.
        let targetTime = Math.floor(followerTime / beatDuration) * beatDuration + masterPhase;

        // If the jump is too far (> 0.5 beat), move it to the closest beat
        if (Math.abs(targetTime - followerTime) > beatDuration / 2) {
            if (targetTime > followerTime) targetTime -= beatDuration;
            else targetTime += beatDuration;
        }

        // Apply both simultaneously
        targetDeck.setRate(requiredRate);
        targetDeck.seek(Math.max(0, targetTime));

        console.log(`[Sync] Deck ${deckId} matched to ${masterEffectiveBPM.toFixed(2)} BPM. Phase shifted by ${(targetTime - followerTime).toFixed(3)}s`);
    }, [masterDeckId, deckA, deckB]);

    return {
        masterDeckId,
        setMasterDeckId,
        handleSync
    };
};
