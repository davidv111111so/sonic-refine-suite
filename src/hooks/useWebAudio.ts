import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import AudioWorker from '../workers/audioDecoder.worker.ts?worker';
import { useDJDeck, DeckControls, DeckState } from './useDJDeck';
import { useSync } from '@/contexts/SyncContext';

// Re-export types
export type { DeckControls, DeckState };

export const useWebAudio = () => {
    const isReadyRef = useRef(false);
    const [isReady, setIsReady] = useState(false);

    // Mixer Nodes
    const mixerRef = useRef<{
        crossfade: Tone.CrossFade | null;
        limiter: Tone.Limiter | null;
        masterBus: Tone.Gain | null;
        cueBus: Tone.Gain | null;
        cueVolume: Tone.Gain | null;
        cueMix: Tone.CrossFade | null;
        splitMerger: Tone.Merge | null;
        masterMono: Tone.Mono | null;
        cueMono: Tone.Mono | null;
    }>({
        crossfade: null,
        limiter: null,
        masterBus: null,
        cueBus: null,
        cueVolume: null,
        cueMix: null,
        splitMerger: null,
        masterMono: null,
        cueMono: null
    });

    const [routingMode, setRoutingMode] = useState<'stereo' | 'split' | 'multichannel'>('stereo');

    // Initialize Tone Context & Mixer
    useEffect(() => {
        const initAudio = async () => {
            if (isReadyRef.current) return;

            // Start Tone (user interaction usually required, but we init nodes first)
            // Note: Tone.start() should be called on first user click.

            // 1. Create Nodes
            const crossfade = new Tone.CrossFade(0.5);
            const masterBus = new Tone.Gain(0.5); // Lowered from 0.8
            const limiter = new Tone.Limiter(-2); // Threshold -2dB

            const cueBus = new Tone.Gain(1); // Accumulates Cue Signals
            const cueVolume = new Tone.Gain(1);

            // Cue Mix: Fade between CueBus (0) and MasterBus (1)
            const cueMix = new Tone.CrossFade(0);

            // 2. Connect Master Path
            // Decks connect to Crossfade A/B externally
            crossfade.connect(masterBus);
            masterBus.connect(limiter);
            limiter.toDestination();

            // 3. Connect Monitor Path
            // Cue Bus -> Cue Mix A
            // Master Bus -> Cue Mix B
            cueBus.connect(cueMix.a);
            masterBus.connect(cueMix.b);

            cueMix.connect(cueVolume);
            cueVolume.toDestination(); // In browser, same output, but logic separates them

            // 4. Advanced Routing Nodes
            const splitMerger = new Tone.Merge();
            const masterMono = new Tone.Mono();
            const cueMono = new Tone.Mono();

            mixerRef.current = {
                crossfade,
                limiter,
                masterBus,
                cueBus,
                cueVolume,
                cueMix,
                splitMerger,
                masterMono,
                cueMono
            };

            isReadyRef.current = true;
            setIsReady(true);
        };

        initAudio();

        return () => {
            // Cleanup (?)
            // Tone.Context is global, disposing nodes might be safer if component unmounts
            // but usually this hook sits at app root.
        };
    }, []);

    // Initialize Decks
    const deckA = useDJDeck();
    const deckB = useDJDeck();

    // Connect Decks to Mixer
    useEffect(() => {
        if (!isReady || !mixerRef.current.crossfade) return;

        // 1. Connect Master Outputs -> Crossfader
        if (deckA.masterOutput) {
            deckA.masterOutput.disconnect(); // Safety
            deckA.masterOutput.connect(mixerRef.current.crossfade.a);
        }

        if (deckB.masterOutput) {
            deckB.masterOutput.disconnect();
            deckB.masterOutput.connect(mixerRef.current.crossfade.b);
        }

        // 2. Connect Cue Outputs -> Cue Bus
        if (deckA.cueOutput && mixerRef.current.cueBus) {
            deckA.cueOutput.disconnect();
            deckA.cueOutput.connect(mixerRef.current.cueBus);
        }

        if (deckB.cueOutput && mixerRef.current.cueBus) {
            deckB.cueOutput.disconnect();
            deckB.cueOutput.connect(mixerRef.current.cueBus);
        }

    }, [deckA.masterOutput, deckB.masterOutput, deckA.cueOutput, deckB.cueOutput, isReady]);

    // Handle Output Routing
    useEffect(() => {
        if (!isReady || !mixerRef.current.limiter || !mixerRef.current.cueVolume) return;
        const { limiter, cueVolume, masterMono, cueMono, splitMerger } = mixerRef.current;

        // Disconnect everything first
        limiter.disconnect();
        cueVolume.disconnect();
        masterMono?.disconnect();
        cueMono?.disconnect();
        splitMerger?.disconnect();

        if (routingMode === 'split') {
            // Master -> Left (Channel 0)
            limiter.connect(masterMono!);
            masterMono!.connect(splitMerger!, 0, 0);

            // Cue -> Right (Channel 1)
            cueVolume.connect(cueMono!);
            cueMono!.connect(splitMerger!, 0, 1);

            splitMerger!.toDestination();
        } else if (routingMode === 'multichannel') {
            // Requires 4 channels. 
            const rawCtx = Tone.getContext().rawContext as AudioContext;
            const multichannel = rawCtx.createChannelMerger(4);

            // Connect through native nodes
            const limiterNative = (limiter as any).output || limiter;
            const cueNative = (cueVolume as any).output || cueVolume;

            limiterNative.connect(multichannel, 0, 0); // L
            limiterNative.connect(multichannel, 0, 1); // R
            cueNative.connect(multichannel, 0, 2); // Cue L
            cueNative.connect(multichannel, 0, 3); // Cue R

            multichannel.connect(rawCtx.destination);
        } else {
            // Normal Stereo (Both to 1-2)
            limiter.toDestination();
            cueVolume.toDestination();
        }
    }, [routingMode, isReady]);

    // Crossfader Logic
    const [crossfader, setCrossfader] = useState(0.5);

    const updateCrossfader = useCallback((value: number) => {
        setCrossfader(value);
        if (mixerRef.current.crossfade) {
            // Tone.CrossFade.fade is 0 to 1
            mixerRef.current.crossfade.fade.rampTo(value, 0.05);
        }
    }, []);

    // Nudge & AutoFade (Simplified with Tone Ramps)
    const nudgeCrossfader = useCallback((direction: 'left' | 'right') => {
        setCrossfader(prev => {
            const delta = direction === 'left' ? -0.1 : 0.1;
            const next = Math.max(0, Math.min(1, prev + delta));
            if (mixerRef.current.crossfade) {
                mixerRef.current.crossfade.fade.rampTo(next, 0.1);
            }
            return next;
        });
    }, []);

    const autoFade = useCallback((target: 0 | 1) => {
        if (mixerRef.current.crossfade) {
            mixerRef.current.crossfade.fade.rampTo(target, 4); // 4 seconds
            // Animate State
            const start = crossfader;
            const startTime = Date.now();
            const duration = 4000;

            const interval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const p = Math.min(1, elapsed / duration);
                const current = start + (target - start) * p;
                setCrossfader(current);
                if (p >= 1) clearInterval(interval);
            }, 50);
        }
    }, [crossfader]);

    // Headphone Logic
    const [headphoneMix, setHeadphoneMix] = useState(0);
    const [headphoneVol, setHeadphoneVol] = useState(0.5);

    const updateHeadphoneMix = useCallback((val: number) => {
        setHeadphoneMix(val); // 0 = Cue, 1 = Master
        if (mixerRef.current.cueMix) {
            mixerRef.current.cueMix.fade.rampTo(val, 0.1);
        }
    }, []);

    const updateHeadphoneVol = useCallback((val: number) => {
        setHeadphoneVol(val);
        if (mixerRef.current.cueVolume) {
            mixerRef.current.cueVolume.gain.rampTo(val, 0.1);
        }
    }, []);

    // Sync Helper
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

    // Cue Switch Logic handled in deck (gain gate)
    // We control the gate here
    const [cueA, setCueA] = useState(false);
    const [cueB, setCueB] = useState(false);

    useEffect(() => {
        if (!deckA.cueOutput) return;
        // rampTo is Tone.Param method. deck.cueOutput is Tone.Gain
        deckA.cueOutput.gain.rampTo(cueA ? 1 : 0, 0.05);
    }, [cueA, deckA.cueOutput]);

    useEffect(() => {
        if (!deckB.cueOutput) return;
        deckB.cueOutput.gain.rampTo(cueB ? 1 : 0, 0.05);
    }, [cueB, deckB.cueOutput]);

    return {
        deckA,
        deckB,
        crossfader,
        setCrossfader: updateCrossfader,
        headphoneMix,
        setHeadphoneMix: updateHeadphoneMix,
        headphoneVol,
        setHeadphoneVol: updateHeadphoneVol,
        nudgeCrossfader,
        autoFade,
        handleSync,
        masterDeckId,
        setMaster: setMasterDeckId,
        cueA,
        setCueA,
        cueB,
        setCueB,
        routingMode,
        setRoutingMode,
        analysers: { A: deckA.analyser, B: deckB.analyser },
        context: Tone.getContext().rawContext as AudioContext
    };
};
