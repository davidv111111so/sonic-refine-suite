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

    // ─── Professional Sync Engine (Phase + Tempo) ───
    const handleSync = useCallback((deckId: 'A' | 'B') => {
        if (!masterDeckId) return;
        if (deckId === masterDeckId) return;

        const targetDeck = deckId === 'A' ? deckA : deckB;
        const masterDeck = masterDeckId === 'A' ? deckA : deckB;

        if (!masterDeck.state.bpm || !targetDeck.state.bpm || !masterDeck.state.buffer) return;

        // 1. Tempo Match immediately
        const masterEffectiveBPM = masterDeck.state.bpm * masterDeck.state.playbackRate;
        const requiredRate = masterEffectiveBPM / targetDeck.state.bpm;
        targetDeck.setRate(requiredRate);

        // 2. Phase Alignment (Snap to Grid)
        const beatDur = 60 / masterEffectiveBPM;
        const masterTime = masterDeck.state.currentTime;
        const followerTime = targetDeck.state.currentTime;

        let targetTime = followerTime;

        // Use Advanced Beatgrid if available
        if (masterDeck.state.grid && masterDeck.state.grid.length > 0 &&
            targetDeck.state.grid && targetDeck.state.grid.length > 0) {

            // Find current beat in Master
            let mIndex = masterDeck.state.grid.findIndex(t => t > masterTime) - 1;
            if (mIndex < 0) mIndex = 0;
            const masterBeatStart = masterDeck.state.grid[mIndex];
            const masterPhaseOffset = masterTime - masterBeatStart;
            const masterBeatInBar = mIndex % 4; // 0=downbeat, 1, 2, 3

            // Find current beat in Follower
            let fIndex = targetDeck.state.grid.findIndex(t => t > followerTime) - 1;
            if (fIndex < 0) fIndex = 0;

            // Shift follower index to match the same beat in the bar as the master
            const followerBeatInBar = fIndex % 4;
            const beatShift = masterBeatInBar - followerBeatInBar;

            let alignedFollowerIndex = fIndex + beatShift;
            if (alignedFollowerIndex < 0) alignedFollowerIndex += 4;
            if (alignedFollowerIndex >= targetDeck.state.grid.length) alignedFollowerIndex = targetDeck.state.grid.length - 1;

            const followerBeatStart = targetDeck.state.grid[alignedFollowerIndex];
            targetTime = followerBeatStart + masterPhaseOffset;

        } else {
            // Precise Math-based Phase Alignment
            const masterPhase = masterTime % beatDur;
            const followerPhase = followerTime % beatDur;

            let phaseShift = masterPhase - followerPhase;
            if (phaseShift < -(beatDur / 2)) phaseShift += beatDur;
            if (phaseShift > (beatDur / 2)) phaseShift -= beatDur;

            targetTime = followerTime + phaseShift;
        }

        // Snap to Phase
        targetDeck.seek(Math.max(0, targetTime));

        console.log(`[Sync] Match phase shift: ${(targetTime - followerTime).toFixed(3)}s, to ${targetTime.toFixed(3)}s`);
    }, [masterDeckId, deckA, deckB]);

    // ─── Continuous Phase Correction (Tempo Bend / Phase-Lock) ───
    useEffect(() => {
        if (syncModeRef.current !== 'beat' || !masterDeckId) {
            if (phaseLockRef.current) {
                cancelAnimationFrame(phaseLockRef.current);
                phaseLockRef.current = null;
            }
            return;
        }

        const targetDeck = masterDeckId === 'A' ? deckB : deckA;
        const masterDeck = masterDeckId === 'A' ? deckA : deckB;

        const PHASE_THRESHOLD_MS = 5; // Tighter tolerance: 5ms
        const CORRECTION_RATE = 0.005; // ±0.5% micro-nudge for prompt alignment
        const CORRECTION_DURATION_MS = 150; 

        const phaseLockLoop = () => {
            if (syncModeRef.current !== 'beat') return;
            if (!masterDeck.state.isPlaying || !targetDeck.state.isPlaying || correctionActiveRef.current) {
                phaseLockRef.current = requestAnimationFrame(phaseLockLoop);
                return;
            }

            const masterEffectiveBPM = masterDeck.state.bpm * masterDeck.state.playbackRate;
            if (!masterEffectiveBPM) {
                phaseLockRef.current = requestAnimationFrame(phaseLockLoop);
                return;
            }

            const beatDur = 60 / masterEffectiveBPM;
            const masterTime = masterDeck.state.currentTime;
            const followerTime = targetDeck.state.currentTime;

            const masterPhase = (masterTime % beatDur) / beatDur;
            const followerPhase = (followerTime % beatDur) / beatDur;

            let phaseDiff = masterPhase - followerPhase;
            if (phaseDiff > 0.5) phaseDiff -= 1;
            if (phaseDiff < -0.5) phaseDiff += 1;

            const driftMs = Math.abs(phaseDiff) * beatDur * 1000;

            if (driftMs > PHASE_THRESHOLD_MS) {
                correctionActiveRef.current = true;
                const direction = phaseDiff > 0 ? 1 : -1; // Positive = follower is behind

                const currentBaseRate = targetDeck.state.playbackRate;
                const nudgeRate = currentBaseRate * (1 + (direction * CORRECTION_RATE));
                
                targetDeck.setRate(nudgeRate);

                setTimeout(() => {
                    // Restore original rate (which should be the BPM-matched rate)
                    const masterBpm = masterDeck.state.bpm * masterDeck.state.playbackRate;
                    const restoredRate = masterBpm / targetDeck.state.bpm;
                    targetDeck.setRate(restoredRate);
                    correctionActiveRef.current = false;
                }, CORRECTION_DURATION_MS);
            }

            phaseLockRef.current = requestAnimationFrame(phaseLockLoop);
        };

        phaseLockRef.current = requestAnimationFrame(phaseLockLoop);
        return () => {
            if (phaseLockRef.current) cancelAnimationFrame(phaseLockRef.current);
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
