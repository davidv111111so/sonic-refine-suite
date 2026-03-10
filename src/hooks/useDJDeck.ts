import { useState, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { FXType, useGroupFXChain, FXChainControls } from './useGroupFXChain';
import { useHotCues, HotCue } from './useHotCues';
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
    beatOffset: number;
    grid: number[];
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
    url: string | null;
    baseRate: number; // Persistent rate (Sync/Buttons)
    tempoBend: number; // Temporary bend 0-1 (Fader)
    pitchRange: number; // ±% range: 0.04, 0.08, 0.16, 0.50
    // New DJ features
    quantize: boolean; // Snap all actions to beatgrid
    slipMode: boolean; // Background playback continues during scratch
    slipPosition: number; // Hidden playback position during slip
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
    setPitchRange: (range: number) => void;
    // Beat Jump & Quantize
    beatJump: (beats: number) => void; // ±1, ±2, ±4, ±8, ±16, ±32
    toggleQuantize: () => void;
    toggleSlipMode: () => void;
    quantizeSeek: (time: number) => void; // Seek snapped to grid
    state: DeckState;
    analyser: AnalyserNode | null;
    // Outputs
    masterOutput: Tone.ToneAudioNode | null; // Post-Fader
    cueOutput: Tone.Gain | null;    // Pre-Fader
    // FX Controls
    fx: FXChainControls;
    hotCues: {
        cues: (HotCue | null)[];
        setCue: (index: number, time: number) => void;
        deleteCue: (index: number) => void;
        jumpToCue: (index: number) => void;
        clearAll: () => void;
    };
}

export const useDJDeck = (contextOverride: any = null): DeckControls => {
    // Tone.js uses global context usually, but we can respect overrides if needed.
    // We kept the contextOverride argument for API compatibility, though Tone handles context internally.

    const [analyserState, setAnalyserState] = useState<AnalyserNode | null>(null);

    const nodes = useRef<{
        player: Tone.Player | null;
        pitchShift: Tone.PitchShift | null;
        stems?: { [key: string]: Tone.Player };
        trim: Tone.Gain | null;
        eq: Tone.EQ3 | null;
        lpf: Tone.Filter | null;
        hpf: Tone.Filter | null;
        volume: Tone.Gain | null;
        limiter: Tone.Limiter | null;
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
        pitchShift: null,
        trim: null,
        eq: null,
        analyser: null,
        split: null,
        lpf: null,
        hpf: null,
        volume: null,
        limiter: null,
        cueGate: null,
        meter: null,
        stemFilters: null,
        stemGains: null
    });

    // ... (rest of fxMock) ...
    const rawCtx = Tone.getContext().rawContext as AudioContext;
    const [fxInput, setFxInput] = useState<AudioNode | null>(null);
    const [fxOutput, setFxOutput] = useState<AudioNode | null>(null);
    const fx = useGroupFXChain(rawCtx, fxInput, fxOutput);


    const [state, setState] = useState<DeckState>({
        buffer: null,
        stems: null,
        isPlaying: false,
        isSynced: false,
        currentTime: 0,
        duration: 0,
        playbackRate: 1,
        bpm: null,
        beatOffset: 0,
        grid: [],
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
        url: null,
        baseRate: 1,
        tempoBend: 0.5,
        pitchRange: 0.08, // Default ±8% like Traktor
        quantize: false,
        slipMode: false,
        slipPosition: 0,
    });

    // Timing Refs (Robust Sync)
    const startTime = useRef<number>(0);
    const offsetTime = useRef<number>(0);

    // Sync Playback Rate with BaseRate and TempoBend
    // Exponential curve: small moves near center = subtle, extreme = dramatic
    useEffect(() => {
        if (!nodes.current.player) return;

        // Exponential pitch bend (Traktor-style)
        // tempoBend is 0-1, center is 0.5
        // normalized: -1 to +1
        const normalized = (state.tempoBend - 0.5) * 2;
        const range = state.pitchRange; // e.g. 0.08 for ±8%

        // Pow curve: center = 1.0, edges = (1 ± range)
        // Using exponential: 2^(normalized * log2(1+range))
        const bendFactor = Math.pow(2, normalized * Math.log2(1 + range));
        const finalRate = state.baseRate * bendFactor;

        // Apply to Tone player
        nodes.current.player.playbackRate = finalRate;

        // Sync state playbackRate for timing calculations
        setState(p => ({ ...p, playbackRate: finalRate }));
    }, [state.baseRate, state.tempoBend, state.pitchRange]);

    // Initialize Tone Graph
    useEffect(() => {
        // Create Nodes
        const player = new Tone.Player();
        const pitchShift = new Tone.PitchShift({
            windowSize: 0.03 // Lower latency, good for rhythm preservation (30ms)
        });
        const trim = new Tone.Gain(1);
        const eq = new Tone.EQ3({
            lowFrequency: 300,
            highFrequency: 3200
        });
        eq.low.value = 0;
        eq.mid.value = 0;
        eq.high.value = 0;

        const lpf = new Tone.Filter(20000, "lowpass");
        const hpf = new Tone.Filter(10, "highpass");

        const volume = new Tone.Gain(0);
        const cueGate = new Tone.Gain(0);

        // Native Analyser for Visualizer Compatibility (Meter.tsx expects getByteFrequencyData)
        // Access raw context from Tone
        const rawCtx = Tone.getContext().rawContext as AudioContext;
        const analyser = rawCtx.createAnalyser();
        analyser.fftSize = 2048;

        const meter = new Tone.Meter();

        const limiter = new Tone.Limiter(-1);

        // Native FX Nodes for routing into the Tone graph
        const fxInNode = rawCtx.createGain();
        const fxOutNode = rawCtx.createGain();
        setFxInput(fxInNode);
        setFxOutput(fxOutNode);

        player.connect(pitchShift);
        pitchShift.connect(trim);
        trim.connect(eq);
        Tone.connect(eq, fxInNode);
        Tone.connect(fxOutNode, lpf);
        lpf.connect(hpf);
        hpf.connect(limiter);
        limiter.connect(volume);

        // Cue Path (Pre-Fader)
        hpf.connect(cueGate);

        // Analysis: Connect the hpf output (pre-fader, post-EQ/Filter) to the native AnalyserNode.
        // This ensures VU meters work even when the fader is down.
        try {
            const nativeHpfOutput = (hpf as any).output?.input ?? (hpf as any)._filters?.[0] ?? (hpf as any).input ?? hpf;
            if (nativeHpfOutput && typeof nativeHpfOutput.connect === 'function') {
                nativeHpfOutput.connect(analyser);
            } else {
                Tone.connect(hpf, analyser);
            }
        } catch (e) {
            try { Tone.connect(hpf, analyser); } catch (_) { }
        }
        nodes.current = {
            player,
            pitchShift,
            trim,
            eq,
            volume,
            limiter,
            cueGate,
            meter,
            analyser,
            lpf,
            hpf,
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
        // Expose analyser via state so React consumers re-render when it's ready
        setAnalyserState(analyser);

        // Pre-wire static Stem Routing Engine (Filters -> Gains -> Trim)
        // We only dynamically route the player to these inputs when stems are active
        Object.keys(nodes.current.stemFilters).forEach((key) => {
            const k = key as keyof typeof nodes.current.stemFilters;
            nodes.current.stemFilters![k].connect(nodes.current.stemGains![k]);
            nodes.current.stemGains![k].connect(trim);
        });

        return () => {
            // Dispose Tone nodes
            player.dispose();
            pitchShift.dispose();
            trim.dispose();
            eq.dispose();
            lpf.dispose();
            hpf.dispose();
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

    // EQ Logic (Traktor-Style Smooth Curve)
    // Avoid aggressive cuts/boosts that cause distortion
    // DJ mixers generally have +6dB max boost, and -24dB to -26dB max cut.
    const mapToDB = (val: number, isMid: boolean = false) => {
        if (val <= 0.05) return -Infinity; // Hard Kill near zero
        if (val >= 0.48 && val <= 0.52) return 0; // Center detent flat response

        if (val > 0.5) {
            // Smooth boost up to +4dB (reduced from +6dB to avoid clipping/distortion)
            const norm = (val - 0.5) * 2; // 0 to 1
            // Use a slight curve so the initial turn isn't a massive jump
            return (norm * norm) * 4;
        } else {
            // Smooth cut down to -24dB before the hard kill
            const norm = (0.5 - val) * 2; // 0 to 1
            // Mids cut slightly less aggressively than lows/highs for smoother vocals
            const maxCut = isMid ? 20 : 26;
            return -(Math.pow(norm, 1.5)) * maxCut;
        }
    };

    useEffect(() => {
        if (!nodes.current.eq) return;
        // Faster, smoother ramp (0.1s)
        const rampTime = 0.1;
        nodes.current.eq.low.rampTo(state.eqKills.low ? -Infinity : mapToDB(state.eq.low, false), rampTime);
        nodes.current.eq.mid.rampTo(state.eqKills.mid ? -Infinity : mapToDB(state.eq.mid, true), rampTime);
        nodes.current.eq.high.rampTo(state.eqKills.high ? -Infinity : mapToDB(state.eq.high, false), rampTime);
    }, [state.eq, state.eqKills]);

    // Dual-Filter Logic (audio-perf-analyzer optimization)
    useEffect(() => {
        const { lpf, hpf } = nodes.current;
        if (!lpf || !hpf) return;

        const val = state.filter; // 0.0 to 1.0, 0.5 = Neutral

        if (val < 0.45) {
            // LowPass Mode
            // Use a higher power (4) to keep frequency high near the center, making it 'smoother'
            const norm = val / 0.45; // 0 to 1
            const freq = Math.max(20, 20 + 19980 * Math.pow(norm, 4));

            lpf.frequency.rampTo(freq, 0.15);
            hpf.frequency.rampTo(10, 0.15);
            lpf.Q.value = 0.5; // Softer resonance
            hpf.Q.value = 0;
        } else if (val > 0.55) {
            // HighPass Mode
            const norm = (1.0 - val) / 0.45; // 0 (at 1.0) to 1 (at 0.55)
            // freq should be 20000 at 1.0, and 20 at 0.55
            const freq = Math.max(10, 20000 - 19980 * Math.pow(norm, 4));

            lpf.frequency.rampTo(20000, 0.15);
            hpf.frequency.rampTo(freq, 0.15);
            lpf.Q.value = 0;
            hpf.Q.value = 0.5; // Softer resonance
        } else {
            // Neutral (0.45 - 0.55)
            lpf.frequency.rampTo(20000, 0.15);
            hpf.frequency.rampTo(10, 0.15);
            lpf.Q.value = 0;
            hpf.Q.value = 0;
        }
    }, [state.filter]);

    // Playback Rate & Key Shift (Key Lock / Master Tempo)
    useEffect(() => {
        if (!nodes.current.player || !nodes.current.pitchShift) return;

        // Base playback rate assignment
        nodes.current.player.playbackRate = state.playbackRate;

        // Effective pitch shift logic
        // 1. User manual pitch override (state.pitch) is expected in semitones (e.g. from Key Sync)
        let effectiveShift = state.pitch;

        // 2. Key Lock: Counteract the vinyl resampling pitch shift if active
        if (state.keyLock) {
            // Playback rate 1.05 = ~0.84 semitones up. We need to shift -0.84 to correct it.
            const autoCorrection = -12 * Math.log2(state.playbackRate);
            effectiveShift += autoCorrection;
        }

        // Only apply if it's significant to avoid artifacts
        if (Math.abs(effectiveShift) < 0.01) {
            nodes.current.pitchShift.pitch = 0;
        } else {
            nodes.current.pitchShift.pitch = effectiveShift;
        }
    }, [state.playbackRate, state.keyLock, state.pitch]);

    // ─── Metadata Cache (Internal to hook) ───
    const metadataCache = useRef<Map<string, { bpm: number, grid: number[], offset: number, key: string | null }>>(new Map());

    // Methods
    const loadTrack = useCallback(async (source: AudioBuffer | File | string, bpm?: number, key?: string, providedMeta?: any) => {
        if (!nodes.current.player) return;

        // Identification for caching
        const trackId = providedMeta?.title || (source instanceof File ? source.name : typeof source === 'string' ? source : 'unknown');

        // Fast path: cached metadata
        const cached = metadataCache.current.get(trackId);
        const finalBpm = bpm || cached?.bpm || 0;
        const finalKey = key || cached?.key || null;

        // Reset current player state IMMEDIATELY to stop old audio and clear UI
        nodes.current.player.stop();
        startTime.current = 0;
        offsetTime.current = 0;
        setState(prev => ({ 
            ...prev, 
            buffer: null, 
            stems: null, 
            duration: 0, 
            currentTime: 0, 
            isPlaying: false, 
            url: null,
            meta: { title: 'Loading...' }
        }));

        try {
            // Load buffer asynchronously
            let buffer: Tone.ToneAudioBuffer | null = null;
            if (source instanceof AudioBuffer) {
                buffer = new Tone.ToneAudioBuffer(source);
            } else if (source instanceof File || typeof source === 'string') {
                const url = source instanceof File ? URL.createObjectURL(source) : source;
                // Faster fetching and loading
                buffer = await new Tone.ToneAudioBuffer().load(url);
            }

            if (buffer) {
                const duration = buffer.duration;
                nodes.current.player.buffer = buffer;

                // 1. Initial State Update (UI update before deep analysis)
                setState(prev => ({
                    ...prev,
                    buffer: buffer?.get() || null,
                    duration,
                    currentTime: 0,
                    isPlaying: false,
                    meta: providedMeta || { title: 'Unknown' },
                    url: typeof source === 'string' ? source : (source instanceof File ? source.name : null),
                    bpm: finalBpm || (prev.bpm || 120), // Fallback if no bpm
                    key: finalKey,
                    isStemsActive: false // Auto-reset stems for new track
                }));

                // 2. Perform Analysis IF no BPM was provided or cached
                if (!finalBpm) {
                    // Don't wait (await) here if we want instant feedback, 
                    // though for DJing the BPM is crucial for the grid.
                    // We'll analyze in the background.
                    (async () => {
                        try {
                            const nativeBuf = buffer!.get();
                            const analysis = await detectBPMFromBuffer(nativeBuf);
                            const roundedBPM = Math.round(analysis.bpm * 100) / 100;

                            metadataCache.current.set(trackId, {
                                bpm: roundedBPM,
                                grid: analysis.grid,
                                offset: analysis.offset,
                                key: finalKey
                            });

                            setState(prev => ({
                                ...prev,
                                bpm: roundedBPM,
                                beatOffset: analysis.offset,
                                grid: analysis.grid
                            }));
                        } catch (e) {
                            console.error("BG Analysis failed:", e);
                        }
                    })();
                } else if (cached) {
                    // Use cached analysis
                    setState(prev => ({
                        ...prev,
                        bpm: cached.bpm,
                        beatOffset: cached.offset,
                        grid: cached.grid
                    }));
                } else {
                    // bpm provided but no grid - generate one fast
                    const interval = 60.0 / finalBpm;
                    const grid: number[] = [];
                    let curr = 0;
                    while (curr < duration) { grid.push(curr); curr += interval; }
                    setState(prev => ({ ...prev, grid, bpm: finalBpm }));
                }
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

    const seek = useCallback((time: number, forcePause = false) => {
        const wasPlaying = state.isPlaying && !forcePause;
        offsetTime.current = time;
        if (wasPlaying) {
            nodes.current.player?.stop();
            startTime.current = Tone.now();
            nodes.current.player?.start(startTime.current, offsetTime.current);
        } else if (forcePause && nodes.current.player) {
            nodes.current.player.stop();
        }
        setState(prev => ({ ...prev, currentTime: time, isPlaying: wasPlaying }));
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
        const { player, pitchShift, trim, stemFilters, stemGains, lpf } = nodes.current;
        if (!player || !pitchShift || !trim || !stemFilters || !stemGains || !lpf) return;

        // Ensure player is connected to pitchShift
        player.disconnect();
        player.connect(pitchShift);

        // Disconnect pitchShift from downstream to avoid duplicates or mixing
        pitchShift.disconnect();

        if (state.isStemsActive) {
            // pitchShift -> StemFilters
            // COMPENSATE: Sum of parallel filters often exceeds 1.0. Applied a 0.70x (-3dB) pad.
            Object.keys(stemFilters).forEach((key) => {
                const k = key as keyof typeof stemFilters;
                pitchShift.connect(stemFilters[k]);
                // Ensure stem gains are initialized
                if (nodes.current.stemGains) {
                    nodes.current.stemGains[k].gain.value = state.stemVolumes[k] * 0.70;
                }
            });
        } else {
            // Direct Route
            pitchShift.connect(trim);
        }
    }, [state.isStemsActive]);

    const setStemVolume = useCallback((stem: keyof DeckState['stemVolumes'], value: number) => {
        setState(prev => ({
            ...prev,
            stemVolumes: { ...prev.stemVolumes, [stem]: value },
            isStemsActive: true // Auto-activate stems when adjusting
        }));
        if (nodes.current.stemGains) {
            // COMPENSATE: Sum of parallel filters often exceeds 1.0. Applied a 0.70x (-3dB) pad.
            nodes.current.stemGains[stem].gain.rampTo(value * 0.70, 0.1);
        }
    }, []);

    const toggleStems = useCallback(() => {
        setState(prev => ({ ...prev, isStemsActive: !prev.isStemsActive }));
    }, []);

    const snapToGrid = useCallback((time: number, grid: number[]): number => {
        if (!grid || grid.length === 0) return time;
        let closest = grid[0];
        let minDiff = Math.abs(time - closest);
        for (let i = 1; i < grid.length; i++) {
            const diff = Math.abs(time - grid[i]);
            if (diff < minDiff) {
                minDiff = diff;
                closest = grid[i];
            }
            if (grid[i] > time + 1) break;
        }
        return closest;
    }, []);

    const loopIn = useCallback(() => {
        setState(prev => {
            let start = prev.currentTime;
            if (prev.quantize && prev.grid.length > 0) {
                start = snapToGrid(start, prev.grid);
            }
            return {
                ...prev,
                loop: { ...prev.loop, start }
            };
        });
    }, [snapToGrid]);

    const loopOut = useCallback(() => {
        setState(prev => {
            let end = prev.currentTime;
            if (prev.quantize && prev.grid.length > 0) {
                end = snapToGrid(end, prev.grid);
            }
            if (end <= prev.loop.start) return prev; // Cannot end before start
            return {
                ...prev,
                loop: { ...prev.loop, end, active: true }
            };
        });
    }, [snapToGrid]);

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
    const setPitchRange = (r: number) => setState(p => ({ ...p, pitchRange: r }));

    // ─── Beat Jump (±N beats) ───
    const beatJump = useCallback((beats: number) => {
        setState(prev => {
            if (!prev.bpm || prev.bpm === 0) return prev;
            const beatDuration = 60 / prev.bpm;
            const jumpTime = beats * beatDuration;
            let newTime = prev.currentTime + jumpTime;
            // Clamp to valid range
            newTime = Math.max(0, Math.min(newTime, prev.duration));
            // Actually seek
            seek(newTime);
            return { ...prev, currentTime: newTime };
        });
    }, [seek]);

    // ─── Quantize Mode (snap to nearest grid point) ───
    const toggleQuantize = useCallback(() => {
        setState(p => ({ ...p, quantize: !p.quantize }));
    }, []);



    const quantizeSeek = useCallback((time: number) => {
        setState(prev => {
            if (prev.quantize && prev.grid.length > 0) {
                const snapped = snapToGrid(time, prev.grid);
                seek(snapped);
                return { ...prev, currentTime: snapped };
            }
            seek(time);
            return { ...prev, currentTime: time };
        });
    }, [seek, snapToGrid]);

    // ─── Slip Mode ───
    const toggleSlipMode = useCallback(() => {
        setState(p => ({ ...p, slipMode: !p.slipMode, slipPosition: p.currentTime }));
    }, []);

    const hotCuesState = useHotCues(8);


    return {
        play, pause, cue, seek, setRate, setVolume, setTrim, setPitch, setEQ, toggleEQKill, setFilter, setStemVolume,
        toggleLoop, loopIn, loopOut, loopHalf, loopDouble, loopShift, setLoopPoints, quantizedLoop, loadTrack, loadStems: () => { },
        toggleStems,
        setKeyLock, setTempoBend, setPitchRange, toggleSync,
        // New DJ features
        beatJump, toggleQuantize, toggleSlipMode, quantizeSeek,
        state,
        analyser: analyserState,
        masterOutput: nodes.current.volume,
        cueOutput: nodes.current.cueGate,
        fx: fx as FXChainControls,
        hotCues: {
            cues: hotCuesState.cues,
            setCue: hotCuesState.setCue,
            deleteCue: hotCuesState.deleteCue,
            jumpToCue: (index: number) => {
                const time = hotCuesState.getCueTime(index);
                if (time !== null) {
                    // Respect quantize mode for hot cues too
                    if (state.quantize && state.grid.length > 0) {
                        const snapped = snapToGrid(time, state.grid);
                        seek(snapped);
                    } else {
                        seek(time);
                    }
                }
            },
            clearAll: hotCuesState.clearAll,
        }
    };
};
