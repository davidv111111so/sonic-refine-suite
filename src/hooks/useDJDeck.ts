import { useState, useRef, useEffect, useCallback } from 'react';
import { useGroupFXChain, FXType } from './useGroupFXChain';
import { detectBPMFromBuffer } from '../utils/bpmDetector';

export interface DeckState {
    buffer: AudioBuffer | null;
    stems: { [key: string]: AudioBuffer } | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    playbackRate: number;
    bpm: number | null;
    volume: number;
    trim: number; // Input Gain
    pitch: number;
    eq: { low: number; mid: number; high: number };
    eqKills: { low: boolean; mid: boolean; high: boolean };
    filter: number; // 0.0 to 1.0, 0.5 = Neutral
    loop: { active: boolean; start: number; end: number };
    stemVolumes: { vocals: number; drums: number; bass: number; other: number };
    keyLock: boolean;
    key: string | null;
    meta?: { title?: string; artist?: string;[key: string]: any };
    baseRate: number; // Persistent rate (Sync/Buttons)
    tempoBend: number; // Temporary bend 0-1 (Fader)
}

export interface DeckControls {
    play: () => void;
    pause: () => void;
    cue: () => void;
    seek: (time: number) => void;
    setRate: (rate: number) => void;
    setVolume: (val: number) => void;
    setTrim: (val: number) => void;
    setPitch: (cents: number) => void;
    setEQ: (band: 'low' | 'mid' | 'high', value: number) => void;
    toggleEQKill: (band: 'low' | 'mid' | 'high') => void;
    setFilter: (val: number) => void;
    setStemVolume: (stem: 'vocals' | 'drums' | 'bass' | 'other', value: number) => void;
    toggleLoop: () => void;
    loopIn: () => void;
    loopOut: () => void;
    loopShift: (direction: 'fwd' | 'back') => void;
    setLoopPoints: (start: number, end: number) => void;
    quantizedLoop: (beats: number) => void;
    loadTrack: (source: AudioBuffer | File | string, bpm?: number, key?: string, providedMeta?: { title?: string, artist?: string }) => void | Promise<void>;
    loadStems: (stems: { [key: string]: AudioBuffer }, bpm?: number) => void;
    setKeyLock: (lock: boolean) => void;
    setTempoBend: (val: number) => void;
    state: DeckState;
    analyser: AnalyserNode | null;
    // Outputs
    masterOutput: AudioNode | null; // Post-Fader
    cueOutput: GainNode | null;    // Pre-Fader
    // FX Controls
    fx: {
        masterMix: number;
        setMasterMix: (val: number) => void;
        masterOn: boolean;
        setMasterOn: (val: boolean) => void;
        slots: { type: FXType; amount: number; isOn: boolean }[];
        setSlotType: (index: number, type: FXType) => void;
        setSlotAmount: (index: number, val: number) => void;
        setSlotOn: (index: number, val: boolean) => void;
    };
}

export const useDJDeck = (context: AudioContext | null): DeckControls => {
    // Audio Graph Refs
    const nodes = useRef<{
        sources: AudioBufferSourceNode[];
        trim: GainNode | null;
        eq: {
            low: BiquadFilterNode | null;
            mid: BiquadFilterNode | null;
            high: BiquadFilterNode | null;
        };
        filter: {
            low: BiquadFilterNode | null; // LowPass (cuts highs)
            high: BiquadFilterNode | null; // HighPass (cuts lows)
        };
        fxInput: GainNode | null;
        fxOutput: GainNode | null;
        splitter: GainNode | null; // The Fork
        channelFader: GainNode | null;
        cueGate: GainNode | null;
        stemGains: { [key: string]: GainNode };
        analyser: AnalyserNode | null;
        timeStretch: AudioWorkletNode | null;
        startTime: number;
        pauseTime: number;
    }>({
        sources: [],
        trim: null,
        eq: { low: null, mid: null, high: null },
        filter: { low: null, high: null },
        fxInput: null,
        fxOutput: null,
        splitter: null,
        channelFader: null,
        cueGate: null,
        stemGains: {},
        analyser: null,
        timeStretch: null,
        startTime: 0,
        pauseTime: 0,
    });

    // Initialize FX Chain
    // ... (unchanged)

    const [anchors, setAnchors] = useState<{ input: GainNode | null, output: GainNode | null }>({ input: null, output: null });

    useEffect(() => {
        if (!context) return;
        const input = context.createGain();
        const output = context.createGain();
        setAnchors({ input, output });
        nodes.current.fxInput = input;
        nodes.current.fxOutput = output;
        return () => { input.disconnect(); output.disconnect(); };
    }, [context]);

    const fxChain = useGroupFXChain(context, anchors.input, anchors.output);

    // State
    const [state, setState] = useState<DeckState>({
        buffer: null,
        stems: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        playbackRate: 1,
        bpm: null,
        volume: 0,
        trim: 1,
        pitch: 0,
        eq: { low: 0, mid: 0, high: 0 },
        eqKills: { low: false, mid: false, high: false },
        filter: 0.5,
        loop: { active: false, start: 0, end: 0 },
        stemVolumes: { vocals: 1, drums: 1, bass: 1, other: 1 },
        keyLock: false,
        key: null,
        baseRate: 1,
        tempoBend: 0.5
    });

    // Initialize Deck Graph
    useEffect(() => {
        if (!context || !nodes.current.fxInput || !nodes.current.fxOutput) return;

        // 1. Create Nodes
        const trim = context.createGain(); // Input Trim
        const splitter = context.createGain(); // Splitter Point (Pre-Fader)
        const channelFader = context.createGain(); // Volume Fader
        channelFader.gain.value = state.volume; // Initialize to state (0)

        const cueGate = context.createGain(); // Cue Switch
        const analyser = context.createAnalyser();
        analyser.fftSize = 2048;

        // Time Stretch Node
        let timeStretch: AudioWorkletNode | null = null;
        try {
            timeStretch = new AudioWorkletNode(context, 'time-stretch-processor');
        } catch (e) {
            // Can fail if module not loaded yet or worklet error
        }

        // EQ Chain
        const high = context.createBiquadFilter();
        // ... (EQ setup code, assuming lines 156-167 exist in source, checking view...)
        high.type = 'highshelf';
        high.frequency.value = 2500;

        const mid = context.createBiquadFilter();
        mid.type = 'peaking';
        mid.frequency.value = 1000;
        mid.Q.value = 1;

        const low = context.createBiquadFilter();
        low.type = 'lowshelf';
        low.frequency.value = 250;

        // Filter Chain (One-Knob)
        const filterHigh = context.createBiquadFilter();
        filterHigh.type = 'highpass';
        filterHigh.frequency.value = 0;
        filterHigh.Q.value = 1;

        const filterLow = context.createBiquadFilter();
        filterLow.type = 'lowpass';
        filterLow.frequency.value = 22000;
        filterLow.Q.value = 1;

        // 2. Connect Graph
        // Source -> Trim -> [TimeStretch] -> EQ High -> Mid -> Low -> FilterHP -> FilterLP -> FX Input

        if (timeStretch) {
            trim.connect(timeStretch);
            timeStretch.connect(high);
        } else {
            trim.connect(high);
        }

        high.connect(mid);
        mid.connect(low);
        low.connect(filterHigh);
        filterHigh.connect(filterLow);
        filterLow.connect(nodes.current.fxInput!);

        // FX Output -> Splitter
        nodes.current.fxOutput!.connect(splitter);

        // Path 1: Master (Splitter -> Channel Fader -> Analyser -> Output)
        splitter.connect(channelFader);
        channelFader.connect(analyser);

        // Path 2: Cue (Splitter -> Cue Gate -> Output)
        splitter.connect(cueGate);

        nodes.current = {
            ...nodes.current,
            trim,
            eq: { low, mid, high },
            filter: { low: filterLow, high: filterHigh },
            splitter,
            channelFader,
            cueGate,
            analyser,
            timeStretch
        };

        // Trigger re-render to expose nodes
        setState(prev => ({ ...prev }));

        return () => {
            trim.disconnect();
            if (timeStretch) timeStretch.disconnect();
            high.disconnect();
            mid.disconnect();
            low.disconnect();
            filterHigh.disconnect();
            filterLow.disconnect();
            splitter.disconnect();
            channelFader.disconnect();
            cueGate.disconnect();
            analyser.disconnect();
        };
    }, [context, nodes.current.fxInput, nodes.current.fxOutput]);

    // Update Playback Rate & Key Lock
    useEffect(() => {
        if (nodes.current.sources.length > 0) {
            nodes.current.sources.forEach(source => {
                source.playbackRate.value = state.playbackRate;
            });
        }

        // Update Time Stretch Worklet
        const ts = nodes.current.timeStretch;
        if (ts && context) {
            const lockParam = ts.parameters.get('isKeyLocked');
            const pitchParam = ts.parameters.get('pitchFactor');

            if (lockParam) lockParam.setValueAtTime(state.keyLock ? 1 : 0, context.currentTime);

            if (pitchParam && state.keyLock) {
                // If Locked, PitchFactor = 1 / Rate (to Cancel out Rate change)
                // Avoid divide by zero
                const rate = state.playbackRate || 0.001;
                pitchParam.setValueAtTime(1 / rate, context.currentTime);
            } else if (pitchParam) {
                pitchParam.setValueAtTime(1.0, context.currentTime);
            }
        }

    }, [state.playbackRate, state.keyLock, context]);

    // ... Play function ...


    const play = useCallback(() => {
        if (!context || !nodes.current.trim) return;
        if (context.state === 'suspended') context.resume();

        // Stop existing sources
        nodes.current.sources.forEach(s => { try { s.stop(); } catch (e) { } });
        nodes.current.sources = [];

        const startSource = (buffer: AudioBuffer, destination: AudioNode) => {
            const source = context.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.value = state.playbackRate;
            source.loop = state.loop.active;
            if (state.loop.active) {
                source.loopStart = state.loop.start;
                source.loopEnd = state.loop.end;
            }

            // Key Lock
            if ('preservesPitch' in source) {
                // @ts-ignore
                source.preservesPitch = state.keyLock;
            }

            source.connect(destination);
            return source;
        };

        const offset = nodes.current.pauseTime % (state.duration || 1);
        const startTime = context.currentTime - offset;

        // Connect Sources to Trim Node (Input)
        if (state.stems) {
            Object.entries(state.stems).forEach(([name, buffer]) => {
                if (!buffer) return;
                if (!nodes.current.stemGains[name]) {
                    const g = context.createGain();
                    g.gain.value = state.stemVolumes[name as keyof typeof state.stemVolumes];
                    g.connect(nodes.current.trim!);
                    nodes.current.stemGains[name] = g;
                }
                const source = startSource(buffer, nodes.current.stemGains[name]);
                source.start(0, offset);
                nodes.current.sources.push(source);
            });
        } else if (state.buffer) {
            const source = startSource(state.buffer, nodes.current.trim!);
            source.start(0, offset);
            nodes.current.sources.push(source);
        }

        nodes.current.startTime = startTime;
        setState(prev => ({ ...prev, isPlaying: true }));
    }, [context, state.buffer, state.stems, state.playbackRate, state.loop, state.duration, state.stemVolumes, state.keyLock]);

    const pause = useCallback(() => {
        if (!context) return;
        nodes.current.sources.forEach(s => { try { s.stop(); } catch (e) { } });

        const elapsed = (context.currentTime - nodes.current.startTime) * state.playbackRate;
        nodes.current.pauseTime = elapsed % (state.duration || 1);

        setState(prev => ({ ...prev, isPlaying: false }));
    }, [context, state.playbackRate, state.duration]);

    const cue = useCallback(() => {
        pause();
        nodes.current.pauseTime = 0;
        setState(prev => ({ ...prev, currentTime: 0 }));
    }, [pause]);

    const seek = useCallback((time: number) => {
        const wasPlaying = state.isPlaying;
        if (wasPlaying) pause();
        nodes.current.pauseTime = time;
        setState(prev => ({ ...prev, currentTime: time }));
        if (wasPlaying) play();
    }, [state.isPlaying, pause, play]);

    const setTempoBend = useCallback((val: number) => {
        setState(prev => {
            const bendFactor = 1 + (val - 0.5) * 0.16; // +/- 8%
            const effective = prev.baseRate * bendFactor;
            return {
                ...prev,
                tempoBend: val,
                playbackRate: effective
            };
        });
    }, []);

    const setRate = useCallback((rate: number) => {
        setState(prev => {
            // rate passed here is the NEW base rate
            const bendFactor = 1 + (prev.tempoBend - 0.5) * 0.16;
            const effective = rate * bendFactor;
            return {
                ...prev,
                baseRate: rate,
                playbackRate: effective
            };
        });
    }, []);

    const setVolume = useCallback((val: number) => {
        setState(prev => ({ ...prev, volume: val }));
        if (nodes.current.channelFader && context) {
            nodes.current.channelFader.gain.setTargetAtTime(val, context.currentTime, 0.01);
        }
    }, [context]);

    const setTrim = useCallback((val: number) => {
        setState(prev => ({ ...prev, trim: val }));
        if (nodes.current.trim && context) {
            nodes.current.trim.gain.setTargetAtTime(val, context.currentTime, 0.01);
        }
    }, [context]);

    const setEQ = useCallback((band: 'low' | 'mid' | 'high', value: number) => {
        setState(prev => ({ ...prev, eq: { ...prev.eq, [band]: value } }));
        // Only apply if not killed
        if (nodes.current.eq[band] && context && !state.eqKills[band]) {
            nodes.current.eq[band]!.gain.setTargetAtTime(value, context.currentTime, 0.01);
        }
    }, [context, state.eqKills]);

    const toggleEQKill = useCallback((band: 'low' | 'mid' | 'high') => {
        const newKilled = !state.eqKills[band];
        setState(prev => ({ ...prev, eqKills: { ...prev.eqKills, [band]: newKilled } }));

        if (nodes.current.eq[band] && context) {
            const targetGain = newKilled ? -100 : state.eq[band];
            nodes.current.eq[band]!.gain.setTargetAtTime(targetGain, context.currentTime, 0.01);
        }
    }, [context, state.eq, state.eqKills]);

    const setFilter = useCallback((val: number) => {
        setState(prev => ({ ...prev, filter: val }));

        const ctx = context;
        if (!ctx || !nodes.current.filter.low || !nodes.current.filter.high) return;

        // Logic: 0.5 = Neutral
        // < 0.5 = Low Pass (Closing from 22k down to 20Hz)
        // > 0.5 = High Pass (Opening from 20Hz up to 22k)

        let targetLP = 22000;
        let targetHP = 0;

        // Logarithmic Mapping preferred for audio frequencies
        const minFreq = 20;
        const maxFreq = 20000;
        const logMin = Math.log(minFreq);
        const logMax = Math.log(maxFreq);
        const scale = (logMax - logMin);

        // Clamping to ensure clean behavior
        const safeVal = Math.max(0, Math.min(1, val));

        if (safeVal < 0.49) {
            // LPF Mode (0.0 to 0.5 -> Freq max to min)
            // Normalized range 0 to 1 for this half
            // val 0 -> Freq Min
            // val 0.5 -> Freq Max
            const normalized = safeVal * 2; // 0 to 1 (approx)
            // Freq = exp(logMin + scale * normalized)
            targetLP = Math.exp(logMin + scale * normalized);
            targetHP = 0; // Bypass HPF
        } else if (safeVal > 0.51) {
            // HPF Mode (0.5 to 1.0 -> Freq min to max)
            const normalized = (safeVal - 0.5) * 2; // 0 to 1
            targetHP = Math.exp(logMin + scale * normalized);
            targetLP = 22000; // Bypass LPF
        } else {
            // Deadzone (Neutral)
            targetLP = 22000;
            targetHP = 0;
        }

        nodes.current.filter.low.frequency.setTargetAtTime(targetLP, ctx.currentTime, 0.05);
        nodes.current.filter.high.frequency.setTargetAtTime(targetHP, ctx.currentTime, 0.05);
    }, [context]);

    const setStemVolume = useCallback((stem: 'vocals' | 'drums' | 'bass' | 'other', value: number) => {
        setState(prev => ({ ...prev, stemVolumes: { ...prev.stemVolumes, [stem]: value } }));
        if (nodes.current.stemGains[stem] && context) {
            nodes.current.stemGains[stem].gain.setTargetAtTime(value, context.currentTime, 0.01);
        }
    }, [context]);

    const setPitch = useCallback((cents: number) => {
        setState(prev => ({ ...prev, pitch: cents }));
        nodes.current.sources.forEach(s => {
            s.detune.setTargetAtTime(cents, context?.currentTime || 0, 0.01);
        });
    }, [context]);

    const toggleLoop = useCallback(() => {
        const newActive = !state.loop.active;
        setState(prev => ({ ...prev, loop: { ...prev.loop, active: newActive } }));
        nodes.current.sources.forEach(s => {
            s.loop = newActive;
            if (newActive) {
                s.loopStart = state.loop.start;
                s.loopEnd = state.loop.end;
            }
        });
    }, [state.loop]);

    const loopIn = useCallback(() => {
        if (!context) return;
        const elapsed = (context.currentTime - nodes.current.startTime) * state.playbackRate;
        const current = elapsed % (state.duration || 1);

        setState(prev => ({ ...prev, loop: { ...prev.loop, start: current } }));
        nodes.current.sources.forEach(s => { s.loopStart = current; });
    }, [context, state.playbackRate, state.duration]);

    const loopOut = useCallback(() => {
        if (!context) return;
        const elapsed = (context.currentTime - nodes.current.startTime) * state.playbackRate;
        const current = elapsed % (state.duration || 1);

        if (current > state.loop.start) {
            setState(prev => ({ ...prev, loop: { ...prev.loop, end: current, active: true } }));
            nodes.current.sources.forEach(s => {
                s.loopEnd = current;
                s.loop = true;
            });
        }
    }, [context, state.playbackRate, state.duration, state.loop.start]);

    const loopShift = useCallback((direction: 'fwd' | 'back') => {
        const loopLen = state.loop.end - state.loop.start;
        if (loopLen <= 0) return;

        const shift = direction === 'fwd' ? loopLen : -loopLen;
        let newStart = state.loop.start + shift;
        let newEnd = state.loop.end + shift;

        if (newStart < 0) { newStart = 0; newEnd = loopLen; }
        if (newEnd > state.duration) { newEnd = state.duration; newStart = state.duration - loopLen; }

        setState(prev => ({ ...prev, loop: { ...prev.loop, start: newStart, end: newEnd } }));
        nodes.current.sources.forEach(s => {
            s.loopStart = newStart;
            s.loopEnd = newEnd;
        });
    }, [state.loop, state.duration]);

    const quantizedLoop = useCallback((beats: number) => {
        if (!context || !state.bpm) return;

        // Calculate Beat Grid
        const effectiveBPM = state.bpm; // We loop relative to original file time, logic uses playbackRate for speed
        const beatDuration = 60 / effectiveBPM;

        // Current Track position
        const elapsed = (context.currentTime - nodes.current.startTime) * state.playbackRate;
        // Adjust for pauses? nodes.current.startTime changes on play, pauseTime tracks position.
        // If playing:
        // current = (ctx.now - start) * rate
        // If paused: 
        // current = pauseTime

        let current = 0;
        if (state.isPlaying) {
            current = (context.currentTime - nodes.current.startTime) * state.playbackRate;
        } else {
            current = nodes.current.pauseTime;
        }

        // Quantize to nearest beat
        // Using Floor to catch the beat "we are in"
        const currentBeatIndex = Math.floor(current / beatDuration);

        // Smart Snap: If we are > 90% through a beat, snap to NEXT beat to catch it?
        // Standard Pioneer behavior: Snap to the beat immediately preceding or extremely close.
        // Let's stick to Math.floor + tolerance? 
        // Simple Floor is robust for "Catching the loop now".

        const loopStart = currentBeatIndex * beatDuration;
        const loopDuration = beats * beatDuration;
        const loopEnd = loopStart + loopDuration;

        setState(prev => ({
            ...prev,
            loop: { active: true, start: loopStart, end: loopEnd }
        }));

        nodes.current.sources.forEach(s => {
            s.loopStart = loopStart;
            s.loopEnd = loopEnd;
            s.loop = true;
        });

    }, [context, state.bpm, state.isPlaying, state.playbackRate]);

    const setLoopPoints = useCallback((start: number, end: number) => {
        setState(prev => ({ ...prev, loop: { ...prev.loop, start, end } }));
        nodes.current.sources.forEach(s => {
            s.loopStart = start;
            s.loopEnd = end;
        });
    }, []);

    const loadTrack = useCallback(async (source: AudioBuffer | File | string, bpm?: number, key?: string, providedMeta?: { title?: string, artist?: string }) => {
        console.log("useDJDeck: loadTrack called with", source);
        if (!context) {
            console.error("useDJDeck: AudioContext is null!");
            return;
        }

        let buffer: AudioBuffer | null = null;
        // Default Meta or Provided Override
        let meta = {
            title: providedMeta?.title || 'Unknown Track',
            artist: providedMeta?.artist || 'Unknown Artist'
        };

        try {
            if (source instanceof AudioBuffer) {
                buffer = source;
            } else if (source instanceof File) {
                console.log("useDJDeck: Decoding File...");
                const arrayBuffer = await source.arrayBuffer();
                buffer = await context.decodeAudioData(arrayBuffer);
                // Only overwrite if not provided
                if (!providedMeta?.title) meta.title = source.name.replace(/\.[^/.]+$/, "");
                console.log("useDJDeck: File Decoded", buffer);
            } else if (typeof source === 'string') {
                console.log("useDJDeck: Fetching URL...");
                const response = await fetch(source);
                const arrayBuffer = await response.arrayBuffer();
                buffer = await context.decodeAudioData(arrayBuffer);
                // Only overwrite if not provided
                if (!providedMeta?.title) {
                    const filename = source.split('/').pop()?.replace(/\.[^/.]+$/, "") || "Stream";
                    meta.title = filename;
                }
            }

            if (buffer) {
                console.log("useDJDeck: Setting State with new buffer");

                let detectedBPM = bpm || 0;
                if (!detectedBPM && buffer) {
                    // ... (keep existing BPM detection logic)
                    console.log("useDJDeck: No BPM provided, analyzing...");
                    try {
                        const analysis = await detectBPMFromBuffer(buffer);
                        detectedBPM = analysis.bpm;
                        console.log("useDJDeck: Detected BPM:", detectedBPM);
                    } catch (bpmErr) {
                        console.error("useDJDeck: BPM detection failed", bpmErr);
                    }
                }

                setState(prev => ({
                    ...prev,
                    buffer,
                    stems: null,
                    duration: buffer!.duration,
                    bpm: detectedBPM || null,
                    key: key || null,
                    currentTime: 0,
                    meta,
                    baseRate: 1,
                    tempoBend: 0.5,
                    playbackRate: 1
                }));
                nodes.current.pauseTime = 0;
            } else {
                console.warn("useDJDeck: Buffer is null after processing");
            }
        } catch (err) {
            console.error("Failed to load track:", err);
        }
    }, [context]);

    const loadStems = useCallback((stems: { [key: string]: AudioBuffer }, bpm?: number) => {
        const firstStem = Object.values(stems)[0];
        if (!firstStem) return;

        setState(prev => ({
            ...prev,
            buffer: null,
            stems,
            duration: firstStem.duration,
            bpm: bpm || null,
            currentTime: 0
        }));
        nodes.current.pauseTime = 0;
    }, []);

    const setKeyLock = useCallback((lock: boolean) => {
        setState(prev => ({ ...prev, keyLock: lock }));
    }, []);

    // Animation Loop for Time
    useEffect(() => {
        if (!state.isPlaying || !context) return;
        let frame: number;
        const update = () => {
            const elapsed = (context.currentTime - nodes.current.startTime) * state.playbackRate;
            setState(prev => ({ ...prev, currentTime: elapsed % (prev.duration || 1) }));
            frame = requestAnimationFrame(update);
        };
        update();
        return () => cancelAnimationFrame(frame);
    }, [state.isPlaying, context, state.playbackRate, state.duration]);

    return {
        play, pause, cue, seek, setRate, setVolume, setTrim, setPitch, setEQ, toggleEQKill, setFilter, setStemVolume,
        toggleLoop, loopIn, loopOut, loopShift, setLoopPoints, quantizedLoop, loadTrack, loadStems,
        setKeyLock, setTempoBend,
        state,
        analyser: nodes.current.analyser,
        masterOutput: nodes.current.analyser, // Post-Fader Output
        cueOutput: nodes.current.cueGate,     // Pre-Fader Output
        fx: {
            masterMix: fxChain.state.masterMix,
            setMasterMix: fxChain.setMasterMix,
            masterOn: fxChain.state.masterOn,
            setMasterOn: fxChain.setMasterOn,
            slots: fxChain.state.slots,
            setSlotType: fxChain.setSlotType,
            setSlotAmount: fxChain.setSlotAmount,
            setSlotOn: fxChain.setSlotOn
        }
    };
};
