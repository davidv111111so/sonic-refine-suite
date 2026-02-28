import { useCallback, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { useDJDeck } from './useDJDeck';
import { useSync } from '@/contexts/SyncContext';

export type SyncMode = 'off' | 'tempo' | 'beat';

/**
 * Traktor-Style Beat Sync Engine
 * 
 * Modes:
 * - `off`: No sync. Manual mixing.
 * - `tempo`: Match BPM only. DJ handles phase manually.
 * - `beat`: Match BPM + continuous phase correction (Traktor "Beat Sync").
 * 
 * Phase correction uses micro-nudge strategy: when phase drift exceeds
 * a threshold, apply a subtle ±0.3% rate bump for ~100ms to pull the
 * follower back in phase without audible pitch artifacts.
 */
export const useBeatSync = (deckA: ReturnType<typeof useDJDeck>, deckB: ReturnType<typeof useDJDeck>) => {
    const { masterDeckId, setMasterDeckId } = useSync();
    const phaseLockRef = useRef<number | null>(null);
    const correctionActiveRef = useRef(false);
    const syncModeRef = useRef<SyncMode>('off');

    // One-shot tempo + phase align (triggered by Sync button press)
    const handleSync = useCallback((deckId: 'A' | 'B') => {
        if (!masterDeckId) return;
        if (deckId === masterDeckId) return;

        const targetDeck = deckId === 'A' ? deckA : deckB;
        const masterDeck = masterDeckId === 'A' ? deckA : deckB;

        if (!masterDeck.state.bpm || !targetDeck.state.bpm || !masterDeck.state.buffer) return;

        // 1. Tempo Sync — Match BPM
        const masterEffectiveBPM = masterDeck.state.bpm * masterDeck.state.playbackRate;
        const requiredRate = masterEffectiveBPM / targetDeck.state.bpm;

        // 2. Phase Sync — Beat Alignment
        const beatDuration = 60 / masterEffectiveBPM;
        const masterTime = masterDeck.state.currentTime;
        const followerTime = targetDeck.state.currentTime;

        // Bar-aware: align to downbeat (every 4 beats)
        const barDuration = beatDuration * 4;
        const masterPhase = masterTime % barDuration;

        let targetTime = Math.floor(followerTime / barDuration) * barDuration + masterPhase;

        // Nearest bar boundary check
        if (Math.abs(targetTime - followerTime) > barDuration / 2) {
            if (targetTime > followerTime) targetTime -= barDuration;
            else targetTime += barDuration;
        }

        // Apply both simultaneously
        targetDeck.setRate(requiredRate);
        targetDeck.seek(Math.max(0, targetTime));

        console.log(`[BeatSync] Deck ${deckId} synced to ${masterEffectiveBPM.toFixed(2)} BPM. Phase shifted by ${(targetTime - followerTime).toFixed(3)}s`);
    }, [masterDeckId, deckA, deckB]);

    // Continuous Phase-Lock Engine (Traktor "Beat Sync" mode)
    // Runs every animation frame while beat sync is active
    useEffect(() => {
        if (syncModeRef.current !== 'beat' || !masterDeckId) {
            // Stop phase lock loop
            if (phaseLockRef.current) {
                cancelAnimationFrame(phaseLockRef.current);
                phaseLockRef.current = null;
            }
            return;
        }

        const PHASE_THRESHOLD_MS = 10; // 10ms drift tolerance
        const CORRECTION_RATE = 0.003; // ±0.3% micro-nudge
        const CORRECTION_DURATION_MS = 100; // Apply for 100ms then restore

        const targetDeck = masterDeckId === 'A' ? deckB : deckA;
        const masterDeck = masterDeckId === 'A' ? deckA : deckB;

        const phaseLockLoop = () => {
            if (syncModeRef.current !== 'beat') return;
            if (!masterDeck.state.isPlaying || !targetDeck.state.isPlaying) {
                phaseLockRef.current = requestAnimationFrame(phaseLockLoop);
                return;
            }
            if (!masterDeck.state.bpm || !targetDeck.state.bpm) {
                phaseLockRef.current = requestAnimationFrame(phaseLockLoop);
                return;
            }
            if (correctionActiveRef.current) {
                phaseLockRef.current = requestAnimationFrame(phaseLockLoop);
                return;
            }

            const masterEffectiveBPM = masterDeck.state.bpm * masterDeck.state.playbackRate;
            const beatDuration = 60 / masterEffectiveBPM;
            const masterPhase = (masterDeck.state.currentTime % beatDuration) / beatDuration; // 0-1
            const followerPhase = (targetDeck.state.currentTime % beatDuration) / beatDuration; // 0-1

            // Phase difference (-0.5 to +0.5)
            let phaseDiff = masterPhase - followerPhase;
            if (phaseDiff > 0.5) phaseDiff -= 1;
            if (phaseDiff < -0.5) phaseDiff += 1;

            const driftMs = Math.abs(phaseDiff) * beatDuration * 1000;

            if (driftMs > PHASE_THRESHOLD_MS) {
                // Apply micro-nudge correction
                correctionActiveRef.current = true;
                const direction = phaseDiff > 0 ? 1 : -1; // Positive = follower is behind

                // Temporarily bump the rate
                const currentRate = targetDeck.state.baseRate;
                const correctedRate = currentRate * (1 + direction * CORRECTION_RATE);
                targetDeck.setRate(correctedRate);

                // Restore after correction duration
                setTimeout(() => {
                    targetDeck.setRate(currentRate);
                    correctionActiveRef.current = false;
                }, CORRECTION_DURATION_MS);
            }

            phaseLockRef.current = requestAnimationFrame(phaseLockLoop);
        };

        phaseLockRef.current = requestAnimationFrame(phaseLockLoop);

        return () => {
            if (phaseLockRef.current) {
                cancelAnimationFrame(phaseLockRef.current);
                phaseLockRef.current = null;
            }
        };
    }, [masterDeckId, deckA, deckB]);

    const setSyncMode = useCallback((mode: SyncMode) => {
        syncModeRef.current = mode;

        // If switching to beat mode, perform initial snap first
        if (mode === 'beat' && masterDeckId) {
            const followerDeckId = masterDeckId === 'A' ? 'B' : 'A';
            handleSync(followerDeckId);
        }
    }, [masterDeckId, handleSync]);

    return {
        masterDeckId,
        setMasterDeckId,
        handleSync,
        syncMode: syncModeRef.current,
        setSyncMode
    };
};
