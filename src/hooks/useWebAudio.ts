import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import AudioWorker from '../workers/audioDecoder.worker.ts?worker';
import { useDJDeck, DeckControls, DeckState } from './useDJDeck';
import { useSync } from '@/contexts/SyncContext';
import { useAudioRecorder } from './useAudioRecorder';
import { useBeatSync } from './useBeatSync';

// Re-export types
export type { DeckControls, DeckState };

export type CrossfaderCurve = 'smooth' | 'sharp' | 'constantPower' | 'cut';

export const useWebAudio = () => {
    const isReadyRef = useRef(false);
    const [isReady, setIsReady] = useState(false);
    const [routingMode, setRoutingMode] = useState<'stereo' | 'split' | 'multichannel'>('stereo');
    const [crossfader, setCrossfader] = useState(0.5);
    const [crossfaderCurve, setCrossfaderCurve] = useState<CrossfaderCurve>('smooth');
    const [headphoneMix, setHeadphoneMix] = useState(0);
    const [headphoneVol, setHeadphoneVol] = useState(0.5);
    const [cueA, setCueA] = useState(false);
    const [cueB, setCueB] = useState(false);

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
        cueMono: null,
    });

    // Initialize Decks (Custom Hooks)
    const deckA = useDJDeck();
    const deckB = useDJDeck();

    // Secondary Hooks
    const { initRecorder, isRecording, startRecording, stopRecording, elapsedSeconds, maxDuration, isConverting } = useAudioRecorder(mixerRef.current.limiter);
    const { handleSync, masterDeckId, setMasterDeckId } = useBeatSync(deckA, deckB);

    // Callbacks
    const applyCrossfaderCurve = useCallback((value: number, curve: CrossfaderCurve) => {
        switch (curve) {
            case 'smooth':
                return { a: Math.cos(value * Math.PI / 2), b: Math.sin(value * Math.PI / 2) };
            case 'sharp':
                return { a: 1 - value, b: value };
            case 'constantPower':
                return { a: Math.sqrt(1 - value), b: Math.sqrt(value) };
            case 'cut':
                return {
                    a: value < 0.05 ? 1 : (value < 0.5 ? 1 - (value - 0.05) / 0.45 * 0.1 : (value > 0.95 ? 0 : 0.9 - (value - 0.5) / 0.45 * 0.9)),
                    b: value > 0.95 ? 1 : (value > 0.5 ? 1 - (0.95 - value) / 0.45 * 0.1 : (value < 0.05 ? 0 : 0.9 - (0.5 - value) / 0.45 * 0.9))
                };
            default:
                return { a: 1 - value, b: value };
        }
    }, []);

    const updateCrossfader = useCallback((value: number) => {
        setCrossfader(value);
        if (mixerRef.current.crossfade) {
            const { a, b } = applyCrossfaderCurve(value, crossfaderCurve);
            if (deckA.masterOutput) (deckA.masterOutput as any).gain?.rampTo?.(a * deckA.state.volume * 0.75, 0.03);
            if (deckB.masterOutput) (deckB.masterOutput as any).gain?.rampTo?.(b * deckB.state.volume * 0.75, 0.03);
            mixerRef.current.crossfade.fade.rampTo(value, 0.05);
        }
    }, [crossfaderCurve, applyCrossfaderCurve, deckA, deckB]);

    const nudgeCrossfader = useCallback((direction: 'left' | 'right') => {
        setCrossfader(prev => {
            const delta = direction === 'left' ? -0.1 : 0.1;
            const next = Math.max(0, Math.min(1, prev + delta));
            if (mixerRef.current.crossfade) mixerRef.current.crossfade.fade.rampTo(next, 0.1);
            return next;
        });
    }, []);

    const autoFade = useCallback((target: 0 | 1) => {
        if (mixerRef.current.crossfade) {
            mixerRef.current.crossfade.fade.rampTo(target, 4);
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

    const updateHeadphoneMix = useCallback((val: number) => {
        setHeadphoneMix(val);
        if (mixerRef.current.cueMix) mixerRef.current.cueMix.fade.rampTo(val, 0.1);
    }, []);

    const updateHeadphoneVol = useCallback((val: number) => {
        setHeadphoneVol(val);
        if (mixerRef.current.cueVolume) mixerRef.current.cueVolume.gain.rampTo(val, 0.1);
    }, []);

    // Initialize Tone Context & Mixer
    useEffect(() => {
        const initAudio = async () => {
            if (isReadyRef.current) return;

            try {
                (Tone.context as any).latencyHint = 'interactive';
            } catch (e) {
                console.warn("Could not set Tone.js latencyHint:", e);
            }

            const crossfade = new Tone.CrossFade(0.5);
            const masterBus = new Tone.Gain(0.5);
            const limiter = new Tone.Limiter(-2);

            const cueBus = new Tone.Gain(0.5);
            const cueVolume = new Tone.Gain(0.5);
            const cueMix = new Tone.CrossFade(0);

            crossfade.connect(masterBus);
            masterBus.connect(limiter);
            limiter.toDestination();

            cueBus.connect(cueMix.a);
            masterBus.connect(cueMix.b);
            cueMix.connect(cueVolume);
            cueVolume.toDestination();

            const splitMerger = new Tone.Merge();
            const masterMono = new Tone.Mono();
            const cueMono = new Tone.Mono();

            mixerRef.current = {
                crossfade, limiter, masterBus, cueBus, cueVolume, cueMix,
                splitMerger, masterMono, cueMono,
            };

            isReadyRef.current = true;
            setIsReady(true);
        };

        if (typeof window !== 'undefined') {
            initAudio();
        }
    }, []);

    useEffect(() => {
        if (isReady && mixerRef.current.cueVolume && mixerRef.current.cueMix) {
            mixerRef.current.cueVolume.gain.value = headphoneVol;
            mixerRef.current.cueMix.fade.value = headphoneMix;
        }
    }, [isReady, headphoneVol, headphoneMix]); // Added headphoneMix to dependencies

    useEffect(() => {
        if (isReady && mixerRef.current.limiter) {
            initRecorder();
        }
    }, [isReady, mixerRef.current.limiter, initRecorder]);

    // Graph Connection
    useEffect(() => {
        if (!isReady || !mixerRef.current.crossfade) return;

        if (deckA.masterOutput) {
            deckA.masterOutput.disconnect();
            deckA.masterOutput.connect(mixerRef.current.crossfade.a);
        }
        if (deckB.masterOutput) {
            deckB.masterOutput.disconnect();
            deckB.masterOutput.connect(mixerRef.current.crossfade.b);
        }
        if (deckA.cueOutput && mixerRef.current.cueBus) {
            deckA.cueOutput.disconnect();
            deckA.cueOutput.connect(mixerRef.current.cueBus);
        }
        if (deckB.cueOutput && mixerRef.current.cueBus) {
            deckB.cueOutput.disconnect();
            deckB.cueOutput.connect(mixerRef.current.cueBus);
        }
    }, [deckA.masterOutput, deckB.masterOutput, deckA.cueOutput, deckB.cueOutput, isReady]);

    // Routing Mode logic
    useEffect(() => {
        if (!isReady || !mixerRef.current.limiter || !mixerRef.current.cueVolume) return;
        const { limiter, cueVolume, masterMono, cueMono, splitMerger, masterBus } = mixerRef.current;

        limiter.disconnect();
        cueVolume.disconnect();
        masterMono?.disconnect();
        cueMono?.disconnect();
        splitMerger?.disconnect();

        if (routingMode === 'split') {
            limiter.connect(masterMono!);
            masterMono!.connect(splitMerger!, 0, 0);
            cueVolume.connect(cueMono!);
            cueMono!.connect(splitMerger!, 0, 1);
            splitMerger!.toDestination();
        } else if (routingMode === 'multichannel') {
            const rawCtx = Tone.getContext().rawContext as AudioContext;
            const multichannel = rawCtx.createChannelMerger(4);
            const limiterNative = (limiter as any).output || limiter;
            const cueNative = (cueVolume as any).output || cueVolume;
            limiterNative.connect(multichannel, 0, 0);
            limiterNative.connect(multichannel, 0, 1);
            cueNative.connect(multichannel, 0, 2);
            cueNative.connect(multichannel, 0, 3);
            multichannel.connect(rawCtx.destination);
        } else {
            if (masterBus) masterBus.gain.rampTo(0.4, 0.1);
            cueVolume.gain.rampTo(0.3 * headphoneVol, 0.1);
            limiter.toDestination();
            cueVolume.toDestination();
        }
    }, [routingMode, isReady, headphoneVol]);

    useEffect(() => {
        if (!deckA.cueOutput) return;
        deckA.cueOutput.gain.rampTo(cueA ? 1 : 0, 0.05);
    }, [cueA, deckA.cueOutput]);

    useEffect(() => {
        if (!deckB.cueOutput) return;
        deckB.cueOutput.gain.rampTo(cueB ? 1 : 0, 0.05);
    }, [cueB, deckB.cueOutput]);

    return {
        deckA, deckB, crossfader, setCrossfader: updateCrossfader,
        headphoneMix, setHeadphoneMix: updateHeadphoneMix,
        headphoneVol, setHeadphoneVol: updateHeadphoneVol,
        nudgeCrossfader, autoFade, handleSync, masterDeckId, setMaster: setMasterDeckId,
        cueA, setCueA, cueB, setCueB, routingMode, setRoutingMode,
        crossfaderCurve, setCrossfaderCurve, analysers: { A: deckA.analyser, B: deckB.analyser },
        context: Tone.getContext().rawContext as AudioContext,
        isRecording, startRecording, stopRecording, elapsedSeconds, maxDuration, isConverting
    };
};
