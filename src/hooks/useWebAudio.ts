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
        cueMix: Tone.CrossFade | null; // Mix between Cues and Master
    }>({
        crossfade: null,
        limiter: null,
        masterBus: null,
        cueBus: null,
        cueVolume: null,
        cueMix: null
    });

    // Initialize Tone Context & Mixer
    useEffect(() => {
        const initAudio = async () => {
            if (isReadyRef.current) return;

            // Start Tone (user interaction usually required, but we init nodes first)
            // Note: Tone.start() should be called on first user click.

            // 1. Create Nodes
            const crossfade = new Tone.CrossFade(0.5);
            const masterBus = new Tone.Gain(0.8);
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

            mixerRef.current = {
                crossfade,
                limiter,
                masterBus,
                cueBus,
                cueVolume,
                cueMix
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

    // Pass context for visualizers if needed, though they should use Tone.Analyser from decks
    const handleSync = () => { };

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
        analysers: { A: deckA.analyser, B: deckB.analyser },
        context: Tone.getContext().rawContext as AudioContext
    };
};
