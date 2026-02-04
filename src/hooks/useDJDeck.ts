import { useState, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { useGroupFXChain, FXType } from './useGroupFXChain';
import { detectBPMFromBuffer } from '../utils/bpmDetector';

export interface DeckState {
    buffer: AudioBuffer | null;
    stems: { [key: string]: AudioBuffer } | null;
    isPlaying: boolean;
    isSynced: boolean;
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
    isStemsActive: boolean;
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
    loopHalf: () => void;
    loopDouble: () => void;
    loopShift: (direction: 'fwd' | 'back') => void;
    setLoopPoints: (start: number, end: number) => void;
    quantizedLoop: (beats: number) => void;
    toggleSync: () => void;
    toggleStems: () => void;
    loadTrack: (source: AudioBuffer | File | string, bpm?: number, key?: string, providedMeta?: { title?: string, artist?: string }) => void | Promise<void>;
    loadStems: (stems: { [key: string]: AudioBuffer }, bpm?: number) => void;
    setKeyLock: (lock: boolean) => void;
    setTempoBend: (val: number) => void;
    state: DeckState;
    analyser: AnalyserNode | null;
    // Outputs
    masterOutput: Tone.ToneAudioNode | null; // Post-Fader
    cueOutput: Tone.Gain | null;    // Pre-Fader
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

export const useDJDeck = (contextOverride: any = null): DeckControls => {
    // Tone.js uses global context usually, but we can respect overrides if needed.
    // We kept the contextOverride argument for API compatibility, though Tone handles context internally.

    const nodes = useRef<{
        player: Tone.Player | null;
        stems?: { [key: string]: Tone.Player };
        trim: Tone.Gain | null;
        eq: Tone.EQ3 | null;
        filter: Tone.Filter | null; // One-knob filter
        volume: Tone.Gain | null;
        cueGate: Tone.Gain | null;
        meter: Tone.Meter | null;
        analyser: AnalyserNode | null; // Native Node
        split: Tone.Split | null;
        stemFilters: {
            drums: Tone.Filter;
            bass: Tone.Filter;
            vocals: Tone.Filter;
            other: Tone.Filter;
        } | null;
        stemGains: {
            drums: Tone.Gain;
            bass: Tone.Gain;
            vocals: Tone.Gain;
            other: Tone.Gain;
        } | null;
    }>({
        player: null,
        trim: null,
        eq: null,
        filter: null,
        volume: null,
        cueGate: null,
        meter: null,
        analyser: null,
        split: null,
        stemFilters: null,
        stemGains: null
    });

    // ... (rest of fxMock) ...
    // We don't implement full FX chain prop logic for now as 'useGroupFXChain' is native. 
    // We assume we'll just expose nodes for mixer connection.
    // Or we should mock the FX controls to avoid breaking UI.
    const fxMock = {
        masterMix: 0,
        setMasterMix: () => { },
        masterOn: false,
        setMasterOn: () => { },
        slots: [],
        setSlotType: () => { },
        setSlotAmount: () => { },
        setSlotOn: () => { }
    };


    const [state, setState] = useState<DeckState>({
        buffer: null,
        stems: null,
        isPlaying: false,
        isSynced: false,
        currentTime: 0,
        duration: 0,
        playbackRate: 1,
        bpm: null,
        volume: 1.0, // Default to 100% so it sounds on play
        trim: 1,
        pitch: 0,
        eq: { low: 0.5, mid: 0.5, high: 0.5 },
        eqKills: { low: false, mid: false, high: false },
        filter: 0.5,
        loop: { active: false, start: 0, end: 0 },
        stemVolumes: { vocals: 1, drums: 1, bass: 1, other: 1 },
        keyLock: false,
        key: null,
        isStemsActive: false,
        baseRate: 1,
        tempoBend: 0.5
    });

    // Timing Refs (Robust Sync)
    const startTime = useRef<number>(0);
    const offsetTime = useRef<number>(0);

    // Sync Playback Rate with BaseRate and TempoBend
    useEffect(() => {
        if (!nodes.current.player) return;

        // Sensitivity: +/- 8% range for nudge
        const Sensitivity = 0.08;
        const bendFactor = 1 + (state.tempoBend - 0.5) * Sensitivity * 2;
        const finalRate = state.baseRate * bendFactor;

        // Apply to Tone player
        nodes.current.player.playbackRate = finalRate;

        // Sync state playbackRate for timing calculations
        setState(p => ({ ...p, playbackRate: finalRate }));
    }, [state.baseRate, state.tempoBend]);

    // Initialize Tone Graph
    useEffect(() => {
        // Create Nodes
        const player = new Tone.Player();
        const trim = new Tone.Gain(1);
        const eq = new Tone.EQ3({
            lowFrequency: 300,
            highFrequency: 3200
        });
        eq.low.value = 0;
        eq.mid.value = 0;
        eq.high.value = 0;

        const filter = new Tone.Filter(20000, "lowpass");

        const volume = new Tone.Gain(0);
        const cueGate = new Tone.Gain(0);

        // Native Analyser for Visualizer Compatibility (Meter.tsx expects getByteFrequencyData)
        // Access raw context from Tone
        const rawCtx = Tone.getContext().rawContext as AudioContext;
        const analyser = rawCtx.createAnalyser();
        analyser.fftSize = 2048;

        const meter = new Tone.Meter();

        // Connect Chain: Player -> Trim -> EQ -> Filter -> Volume -> MasterOutput
        //                                            |-> CueGate -> CueOutput

        player.connect(trim);
        trim.connect(eq);
        eq.connect(filter);
        filter.connect(volume);

        // Cue Path (Pre-Fader)
        filter.connect(cueGate);

        // Analysis
        // Tone.connect handles connecting Tone Node -> Native Node
        volume.connect(analyser);
        nodes.current = {
            player,
            trim,
            eq,
            filter,
            volume,
            cueGate,
            meter,
            analyser,
            split: null,
            stemFilters: {
                drums: new Tone.Filter({ frequency: 250, type: "lowpass", Q: 1 }),
                bass: new Tone.Filter({ frequency: 150, type: "lowpass", Q: 2 }),
                vocals: new Tone.Filter({ frequency: 1200, type: "bandpass", Q: 1 }),
                other: new Tone.Filter({ frequency: 3000, type: "highpass", Q: 1 })
            },
            stemGains: {
                drums: new Tone.Gain(1),
                bass: new Tone.Gain(1),
                vocals: new Tone.Gain(1),
                other: new Tone.Gain(1)
            }
        };

        // Stem Routing (Parallel)
        // Player -> StemFilters -> StemGains -> Trim
        // For now, we only connect them if stems are active. Default is direct.

        return () => {
            // Dispose Tone nodes
            player.dispose();
            trim.dispose();
            eq.dispose();
            filter.dispose();
            volume.dispose();
            cueGate.dispose();
            meter.dispose();

            // Disconnect native node
            try { analyser.disconnect(); } catch (e) { }

            // Dispose stem nodes
            if (nodes.current.stemFilters) {
                Object.values(nodes.current.stemFilters).forEach(f => f.dispose());
            }
            if (nodes.current.stemGains) {
                Object.values(nodes.current.stemGains).forEach(g => g.dispose());
            }
        };
    }, []);

    // Sync state with nodes
    useEffect(() => {
        if (!nodes.current.trim) return;
        nodes.current.trim.gain.rampTo(state.trim, 0.1);
    }, [state.trim]);

    useEffect(() => {
        if (!nodes.current.volume) return;
        // Enforce Gain Staging: Cap at 0.75 (-2.5dB) to provide headroom for summing
        const cappedVolume = state.volume * 0.75;
        nodes.current.volume.gain.rampTo(cappedVolume, 0.05);
    }, [state.volume]);

    // EQ Logic (Professional Logarithmic Curve)
    // 0.5 -> 1.0 (Boost +6dB) - Linear for clarity
    // 0.0 -> 0.5 (Cut -Inf) - Smooth Log for blending
    const mapToDB = (val: number) => {
        if (val <= 0.02) return -Infinity; // Hard Kill
        if (val === 0.5) return 0;

        if (val > 0.5) {
            // Map 0.5-1.0 to 0-6dB (Linear)
            return (val - 0.5) * 12;
        } else {
            // Map 0.02-0.5 to -Inf to 0dB (Smooth Power-Log)
            // Normalized 0 to 1
            const norm = val / 0.5;
            // curve: 40 * log10(norm ^ 1.2) for a slightly deeper mid-cut
            return 48 * Math.log10(norm);
        }
    };

    useEffect(() => {
        if (!nodes.current.eq) return;
        // Faster, smoother ramp (0.1s)
        const rampTime = 0.1;
        nodes.current.eq.low.rampTo(state.eqKills.low ? -Infinity : mapToDB(state.eq.low), rampTime);
        nodes.current.eq.mid.rampTo(state.eqKills.mid ? -Infinity : mapToDB(state.eq.mid), rampTime);
        nodes.current.eq.high.rampTo(state.eqKills.high ? -Infinity : mapToDB(state.eq.high), rampTime);
    }, [state.eq, state.eqKills]);

    // Filter Logic
    useEffect(() => {
        if (!nodes.current.filter) return;
        const val = state.filter;
        // 0.5 = Neutral
        // <0.5 = LowPass
        // >0.5 = HighPass

        // Tone.Filter doesn't support changing type effectively without artifacts sometimes, 
        // but we can try. Or use two filters.
        if (val < 0.45) {
            nodes.current.filter.type = "lowpass";
            // Map 0.0-0.5 to 0Hz-20kHz
            // Log scale preferred
            const freq = Math.max(20, 20000 * (val * 2));
            nodes.current.filter.frequency.rampTo(freq, 0.1);
            nodes.current.filter.Q.value = 1;
        } else if (val > 0.55) {
            nodes.current.filter.type = "highpass";
            // Map 0.5-1.0 to 0Hz-20kHz
            const norm = (val - 0.5) * 2;
            const freq = Math.max(20, 20000 * norm);
            nodes.current.filter.frequency.rampTo(freq, 0.1);
            nodes.current.filter.Q.value = 1;
        } else {
            // Neutral - open up LPF or bypass
            nodes.current.filter.type = "lowpass";
            nodes.current.filter.frequency.rampTo(20000, 0.1);
            nodes.current.filter.Q.value = 0;
        }
    }, [state.filter]);

    // Playback Rate
    useEffect(() => {
        if (!nodes.current.player) return;
        nodes.current.player.playbackRate = state.playbackRate;
        // Tone.js Detune is in cents.
        // Pitch shift separate from Rate? Tone.Player usually links them (resampling).
        // If KeyLock is needed, Tone.Player has "grainPlayer" mode or we use Tone.PitchShift.
        // For now, vinyl mode (resampling) is default.
    }, [state.playbackRate]);


    // Methods
    const loadTrack = useCallback(async (source: AudioBuffer | File | string, bpm?: number, key?: string, providedMeta?: any) => {
        if (!nodes.current.player) return;

        // Load buffer
        let buffer: Tone.ToneAudioBuffer | null = null;
        let bufferDuration = 0;

        try {
            if (source instanceof AudioBuffer) {
                // Wrap native buffer
                buffer = new Tone.ToneAudioBuffer(source);
            } else if (source instanceof File || typeof source === 'string') {
                const url = source instanceof File ? URL.createObjectURL(source) : source;
                buffer = await new Tone.ToneAudioBuffer().load(url);
            }

            if (buffer) {
                bufferDuration = buffer.duration;
                nodes.current.player.buffer = buffer;

                // Stop if previously playing
                if (state.isPlaying) {
                    nodes.current.player.stop();
                }

                // Internal State Reset
                startTime.current = 0;
                offsetTime.current = 0;

                // BPM Detection
                let detectedBPM = bpm || 0;
                if (!detectedBPM) {
                    try {
                        const nativeBuf = buffer.get();
                        const analysis = await detectBPMFromBuffer(nativeBuf);
                        detectedBPM = analysis.bpm;
                    } catch (e) { console.error(e); }
                }

                setState(prev => ({
                    ...prev,
                    buffer: buffer?.get() || null,
                    duration: bufferDuration,
                    bpm: detectedBPM || null,
                    key: key || null,
                    currentTime: 0,
                    isPlaying: false,
                    meta: providedMeta || { title: 'Unknown' },
                    playbackRate: 1,
                    baseRate: 1,
                    tempoBend: 0.5
                }));
            }
        } catch (e) {
            console.error("Load Track Error:", e);
        }
    }, [state.isPlaying]);

    const play = useCallback(async () => {
        if (!nodes.current.player || !nodes.current.player.loaded) return;
        await Tone.start();

        // Precise Sync Logic
        // We set 'startTime.current' to NOW.
        // We tell player to start 'offsetTime.current' into the track.
        startTime.current = Tone.now();

        nodes.current.player.start(startTime.current, offsetTime.current);
        setState(prev => ({ ...prev, isPlaying: true }));
    }, [state.currentTime]); // Using refs for internal logic, but state allows re-creation trigger?

    const pause = useCallback(() => {
        if (!nodes.current.player || !state.isPlaying) return;
        nodes.current.player.stop();

        // Calculate where we stopped
        const now = Tone.now();
        const elapsed = (now - startTime.current) * state.playbackRate;

        offsetTime.current = offsetTime.current + elapsed;

        // Bounds check
        if (state.duration && offsetTime.current > state.duration) offsetTime.current = state.duration;

        setState(prev => ({ ...prev, isPlaying: false, currentTime: offsetTime.current }));
    }, [state.isPlaying, state.playbackRate, state.duration]);

    const cue = useCallback(() => {
        if (nodes.current.player) nodes.current.player.stop();
        offsetTime.current = 0;
        setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    }, []);

    const seek = useCallback((time: number) => {
        const wasPlaying = state.isPlaying;
        offsetTime.current = time;
        if (wasPlaying) {
            nodes.current.player?.stop();
            startTime.current = Tone.now();
            nodes.current.player?.start(startTime.current, offsetTime.current);
        }
        setState(prev => ({ ...prev, currentTime: time }));
    }, [state.isPlaying]);


    // Loop Logic
    useEffect(() => {
        const player = nodes.current.player;
        if (!player) return;

        if (state.loop.active) {
            // Set points FIRST
            player.loopStart = state.loop.start;
            player.loopEnd = state.loop.end;
            player.loop = true;

            // If we are currently playing and PAST the loop end, jump back to start
            if (state.isPlaying && state.currentTime >= state.loop.end) {
                seek(state.loop.start);
            }
        } else {
            player.loop = false;
        }
    }, [state.loop.active, state.loop.start, state.loop.end]); // Removed state.loop object to be more granular

    const toggleLoop = useCallback(() => setState(prev => ({ ...prev, loop: { ...prev.loop, active: !prev.loop.active } })), []);

    // UI Animation Loop (Update currentTime)
    useEffect(() => {
        let frame: number;

        const update = () => {
            if (nodes.current.player && state.isPlaying) {
                const now = Tone.now();
                // Formula: time = offset + (now - startTime) * rate
                const elapsed = (now - startTime.current) * state.playbackRate;
                let current = offsetTime.current + elapsed;

                // Handle Loop Visual Wrap
                if (state.loop.active && current >= state.loop.end) {
                    const loopLen = state.loop.end - state.loop.start;
                    if (loopLen > 0) {
                        // Simple modulo for visual correctness
                        current = state.loop.start + ((current - state.loop.start) % loopLen);
                    }
                }

                // Bounds
                if (current > state.duration && !state.loop.active) {
                    current = state.duration;
                    // Optional: auto-pause if not looping
                }

                setState(prev => ({ ...prev, currentTime: current }));
            }
            frame = requestAnimationFrame(update);
        };

        if (state.isPlaying) {
            update();
        }

        return () => cancelAnimationFrame(frame);
    }, [state.isPlaying, state.loop, state.duration, state.playbackRate]);

    // Simple Setters (boilerplates)
    const setRate = (r: number) => setState(p => ({ ...p, baseRate: r })); // We let the update effect handle playbackRate calculation
    const setVolume = (v: number) => setState(p => ({ ...p, volume: v }));
    const setTrim = (v: number) => setState(p => ({ ...p, trim: v }));
    const setPitch = (c: number) => setState(p => ({ ...p, pitch: c }));
    const setEQ = (b: any, v: number) => setState(p => ({ ...p, eq: { ...p.eq, [b]: v } }));
    const toggleEQKill = (b: any) => setState(p => ({ ...p, eqKills: { ...p.eqKills, [b]: !p.eqKills[b] } }));
    const setFilter = (v: number) => setState(p => ({ ...p, filter: v }));


    // Reactive Stem Routing
    useEffect(() => {
        const { player, trim, stemFilters, stemGains } = nodes.current;
        if (!player || !trim || !stemFilters || !stemGains) return;

        // Disconnect player from previous inputs to avoid duplicates or mixing
        player.disconnect();

        if (state.isStemsActive) {
            // Connect Parallel Stem Filters -> Gains -> Trim
            Object.keys(stemFilters).forEach((key) => {
                const k = key as keyof typeof stemFilters;
                player.connect(stemFilters[k]);
                stemFilters[k].connect(stemGains[k]);
                stemGains[k].connect(trim);
            });
        } else {
            // Direct Route
            player.connect(trim);
        }
    }, [state.isStemsActive]);

    const setStemVolume = useCallback((stem: keyof DeckState['stemVolumes'], value: number) => {
        setState(prev => ({
            ...prev,
            stemVolumes: { ...prev.stemVolumes, [stem]: value },
            isStemsActive: true // Auto-activate stems when adjusting
        }));
        if (nodes.current.stemGains) {
            nodes.current.stemGains[stem].gain.rampTo(value, 0.1);
        }
    }, []);

    const toggleStems = useCallback(() => {
        setState(prev => ({ ...prev, isStemsActive: !prev.isStemsActive }));
    }, []);

    const loopIn = useCallback(() => {
        setState(prev => ({
            ...prev,
            loop: { ...prev.loop, start: prev.currentTime }
        }));
    }, []);

    const loopOut = useCallback(() => {
        setState(prev => {
            if (prev.currentTime <= prev.loop.start) return prev; // Cannot end before start
            return {
                ...prev,
                loop: { ...prev.loop, end: prev.currentTime, active: true }
            };
        });
    }, []);

    const loopHalf = useCallback(() => {
        setState(prev => {
            const currentLen = prev.loop.end - prev.loop.start;
            if (currentLen <= 0.001) return prev;
            const newLen = currentLen / 2;
            return {
                ...prev,
                loop: { ...prev.loop, end: prev.loop.start + newLen }
            };
        });
    }, []);

    const loopDouble = useCallback(() => {
        setState(prev => {
            const currentLen = prev.loop.end - prev.loop.start;
            if (currentLen <= 0) return prev;
            const newLen = currentLen * 2;
            const newEnd = Math.min(prev.duration || Infinity, prev.loop.start + newLen);
            return {
                ...prev,
                loop: { ...prev.loop, end: newEnd }
            };
        });
    }, []);

    const loopShift = useCallback((direction: 'fwd' | 'back') => {
        setState(prev => {
            const loopLen = prev.loop.end - prev.loop.start;
            if (loopLen <= 0) return prev;
            const shift = direction === 'fwd' ? loopLen : -loopLen;
            const newStart = Math.max(0, prev.loop.start + shift);
            const newEnd = Math.min(prev.duration || Infinity, prev.loop.end + shift);
            return {
                ...prev,
                loop: { ...prev.loop, start: newStart, end: newEnd }
            };
        });
    }, []);

    const setLoopPoints = useCallback((start: number, end: number) => {
        setState(prev => ({
            ...prev,
            loop: { ...prev.loop, start, end, active: true }
        }));
    }, []);

    const quantizedLoop = useCallback((beats: number) => {
        setState(prev => {
            if (!prev.bpm) return prev;
            const beatDuration = 60 / (prev.bpm * prev.playbackRate);
            const loopDuration = beats * beatDuration;
            const start = prev.currentTime;
            const end = Math.min(prev.duration || Infinity, start + loopDuration);
            return {
                ...prev,
                loop: { active: true, start, end }
            };
        });
    }, []);
    const toggleSync = () => { };
    const setKeyLock = (l: boolean) => setState(p => ({ ...p, keyLock: l }));
    const setTempoBend = (v: number) => setState(p => ({ ...p, tempoBend: v }));


    // FX Chain Integration
    const rawContext = Tone.getContext().rawContext as AudioContext;
    const fxChain = useGroupFXChain(rawContext, null, null);

    // Connect FX Chain dynamically
    useEffect(() => {
        const { filter, volume } = nodes.current;
        const { inputNode, outputNode } = fxChain;

        if (filter && volume && inputNode && outputNode) {
            // Disconnect old Direct Path
            try { filter.disconnect(volume); } catch (e) { }
            try { filter.disconnect(nodes.current.cueGate); } catch (e) { } // cueGate was also connected to filter

            // Route: Filter -> FX Input
            filter.connect(inputNode);

            // Route: FX Output -> Volume
            const nativeVolInput = (volume as any).input || (volume as any)._gainNode || volume;
            outputNode.connect(nativeVolInput);

            // Cue Path: Filter -> CueGate (Pre-FX? or Post-FX?)
            const nativeCueInput = (nodes.current.cueGate as any).input || (nodes.current.cueGate as any)._gainNode || nodes.current.cueGate;
            outputNode.connect(nativeCueInput);

        } else if (filter && volume) {
            // Fallback if FX not ready
        }

        return () => {
            // Cleanup connections?
        };
    }, [fxChain.inputNode, fxChain.outputNode]); // Re-run if FX nodes change (re-init)

    return {
        play, pause, cue, seek, setRate, setVolume, setTrim, setPitch, setEQ, toggleEQKill, setFilter, setStemVolume,
        toggleLoop, loopIn, loopOut, loopHalf, loopDouble, loopShift, setLoopPoints, quantizedLoop, loadTrack, loadStems: () => { },
        toggleStems,
        setKeyLock, setTempoBend, toggleSync,
        state,
        analyser: nodes.current.analyser,
        masterOutput: nodes.current.volume,
        cueOutput: nodes.current.cueGate,
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
