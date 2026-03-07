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

    // Broadcast Master State (Grid Anchor)
    useEffect(() => {
        // AUTO Mode Logic
        if (transport.autoMasterMode && controls.state.isPlaying && !stateRef.current.wasPlaying) {
            // We just started playing. Take Master.
            if (nativeBpm) {
                setMaster(deckId, nativeBpm * controls.state.playbackRate, controls.state.currentTime, controls.state.playbackRate);
            }
        }

        if (isMaster && nativeBpm && controls.state.isPlaying) {
            const effectiveBpm = nativeBpm * controls.state.playbackRate;
            const beatDuration = 60 / effectiveBpm;

            // Interval to update anchor? 
            // Better: update anchor once on Play, and assumes perfect clock?
            // Drift is real. 
            // Let's update casually or on major changes.
            // For now, we update on mount/change.

            // Anchor = currentTime (assuming we started ON beat or just establishing grid now)
            // Real DJ software sets anchor on First Downbeat.
            // We'll set anchor to NOW.

            // To prevent spamming context, we only set if not set? 
            // Or just set continually?
            // Actually, we should just update master clock if Rate changes.
            updateMasterClock(effectiveBpm, controls.state.currentTime, controls.state.playbackRate);
        }
    }, [isMaster, nativeBpm, controls.state.playbackRate, controls.state.isPlaying, updateMasterClock, transport.autoMasterMode, deckId, setMaster]);

    // Ref to track previous play state for edge detection
    const stateRef = useRef({ wasPlaying: false });
    useEffect(() => {
        stateRef.current.wasPlaying = controls.state.isPlaying;
    }, [controls.state.isPlaying]);

    const handleSync = useCallback(() => {
        if (!nativeBpm || !transport.masterBpm) return;

        // 1. Tempo Match immediately
        const targetRate = transport.masterBpm / nativeBpm;
        controls.setRate(targetRate);

        // 2. Phase Alignment (Professional Sync Logic)
        const beatDur = 60 / transport.masterBpm; // This is the master beat duration

        // Calculate exactly where the Master is right now:
        const elapsedRealSeconds = (Date.now() - transport.masterSystemTime) / 1000;
        const masterCurrentTimeNow = transport.masterGridAnchor + (elapsedRealSeconds * transport.masterPlaybackRate);

        const masterPhase = masterCurrentTimeNow % beatDur;
        const myPhase = controls.state.currentTime % beatDur;

        let phaseShift = masterPhase - myPhase;
        if (phaseShift < -(beatDur / 2)) phaseShift += beatDur;
        if (phaseShift > (beatDur / 2)) phaseShift -= beatDur;

        // Apply phase shift directly to my current time
        let targetTime = controls.state.currentTime + phaseShift;
        targetTime = Math.max(0, targetTime); // Prevent seeking below zero

        // Immediate Seek to match phases
        controls.seek(targetTime);

        console.log(`[Sync] Match phase shift: ${phaseShift.toFixed(3)}s, to ${targetTime.toFixed(3)}s`);

    }, [nativeBpm, transport, controls]);

    const handleMaster = useCallback(() => {
        if (!nativeBpm) return;
        setMaster(deckId, nativeBpm * controls.state.playbackRate, controls.state.currentTime, controls.state.playbackRate);
    }, [deckId, nativeBpm, controls.state.playbackRate, controls.state.currentTime, setMaster]);

    // Phase Meter Calculation
    const getPhaseOffset = () => {
        if (!nativeBpm || !transport.masterBpm) return 0;
        const beatDur = 60 / transport.masterBpm;

        const elapsedRealSeconds = (Date.now() - transport.masterSystemTime) / 1000;
        const masterCurrentTimeNow = transport.masterGridAnchor + (elapsedRealSeconds * transport.masterPlaybackRate);

        const masterPhase = masterCurrentTimeNow % beatDur;
        const myPhase = controls.state.currentTime % beatDur;

        // Phase difference normalized -0.5 to 0.5
        let phaseDiff = (myPhase - masterPhase) / beatDur;
        if (phaseDiff > 0.5) phaseDiff -= 1;
        if (phaseDiff < -0.5) phaseDiff += 1;

        return phaseDiff;
    };

    return {
        handleSync,
        handleMaster,
        isMaster,
        getPhaseOffset
    };
};
