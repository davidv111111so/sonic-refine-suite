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
                setMaster(deckId, nativeBpm * controls.state.playbackRate, controls.state.currentTime);
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
            updateMasterClock(effectiveBpm, controls.state.currentTime);
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
        const beatDur = 60 / transport.masterBpm;
        const masterAnchor = transport.masterGridAnchor;

        // Use more accurate timing if possible? 
        // controls.state.currentTime might be slightly lagged from the UI loop.
        // We calculate the target time relative to the master grid anchor.
        const myTime = controls.state.currentTime;

        const beatsFromAnchor = Math.round((myTime - masterAnchor) / beatDur);
        const targetTime = masterAnchor + (beatsFromAnchor * beatDur);

        // Immediate Seek to match phases
        controls.seek(targetTime);

        console.log(`[Sync] Match immediate: ${targetRate}x, to ${targetTime}s`);

    }, [nativeBpm, transport.masterBpm, transport.masterGridAnchor, controls]);

    const handleMaster = useCallback(() => {
        if (!nativeBpm) return;
        setMaster(deckId, nativeBpm * controls.state.playbackRate, controls.state.currentTime);
    }, [deckId, nativeBpm, controls.state.playbackRate, controls.state.currentTime, setMaster]);

    // Phase Meter Calculation
    const getPhaseOffset = () => {
        if (!nativeBpm || !transport.masterBpm) return 0;
        const beatDuration = 60 / transport.masterBpm;
        const masterAnchor = transport.masterGridAnchor;
        const myTime = controls.state.currentTime;

        // Offset relative to Master Grid
        const beatsFromAnchor = (myTime - masterAnchor) / beatDuration;
        const phase = beatsFromAnchor % 1;

        // Normalize -0.5 to 0.5 for meter
        if (phase > 0.5) return phase - 1;
        if (phase < -0.5) return phase + 1;
        return phase;
    };

    return {
        handleSync,
        handleMaster,
        isMaster,
        getPhaseOffset
    };
};
