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
    toggleSync: () => void;
    loadTrack: (source: AudioBuffer | File | string, bpm?: number, key?: string, providedMeta?: { title?: string, artist?: string }) => void | Promise<void>;
    loadStems: (stems: { [key: string]: AudioBuffer }, bpm?: number) => void;
    setKeyLock: (lock: boolean) => void;
    setTempoBend: (val: number) => void;
    state: DeckState;
    analyser: Tone.Analyser | null;
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
        analyser: Tone.Analyser | null;
        split: Tone.Split | null; // If needed, but Tone usually handles connection logic
    }>({
        player: null,
        trim: null,
        eq: null,
        filter: null,
        volume: null,
        cueGate: null,
        meter: null,
        analyser: null,
        split: null
    });

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
        volume: 0,
        trim: 1,
        pitch: 0,
        eq: { low: 0, mid: 0, high: 0 }, // Tone EQ3 is dB (-10 to 10 usually, or -Inf to 0)
        // Wait, native was using GainNode.gain (0 to X). Tone.EQ3 uses dB.
        // We'll need to map 0-1 inputs to dB.
        eqKills: { low: false, mid: false, high: false },
        filter: 0.5,
        loop: { active: false, start: 0, end: 0 },
        stemVolumes: { vocals: 1, drums: 1, bass: 1, other: 1 },
        keyLock: false,
        key: null,
        baseRate: 1,
        tempoBend: 0.5
    });

    // Initialize Tone Graph
    useEffect(() => {
        // Create Nodes
        const player = new Tone.Player();
        const trim = new Tone.Gain(1);
        const eq = new Tone.EQ3(0, 0, 0); // Low, Mid, High in dB

        // One-knob filter logic is complex, simpler to use discrete LP/HP or automation.
        // Tone.Filter defaults to 'lowpass'. 
        // We can use a LowPass and HighPass in series, bypassing one.
        // Or specific 'autoFilter' etc.
        // For simplicity: A single filter node that we reconfigure, or two.
        // Let's use a standard Tone.Filter as LowPass for now (most common), 
        // or a Biquad implementation via Tone.
        const filter = new Tone.Filter(20000, "lowpass");

        const volume = new Tone.Gain(0);
        const cueGate = new Tone.Gain(0);
        const analyser = new Tone.Analyser("fft", 2048);
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
        volume.connect(analyser);
        volume.connect(meter);

        nodes.current = {
            player,
            trim,
            eq,
            filter,
            volume,
            cueGate,
            meter,
            analyser,
            split: null
        };

        return () => {
            player.dispose();
            trim.dispose();
            eq.dispose();
            filter.dispose();
            volume.dispose();
            cueGate.dispose();
            meter.dispose();
            analyser.dispose();
        };
    }, []);

    // Sync state with nodes
    useEffect(() => {
        if (!nodes.current.trim) return;
        nodes.current.trim.gain.rampTo(state.trim, 0.1);
    }, [state.trim]);

    useEffect(() => {
        if (!nodes.current.volume) return;
        nodes.current.volume.gain.rampTo(state.volume, 0.05);
    }, [state.volume]);

    // EQ Logic (Mapping 0-1 UI to dB)
    // Assumes UI sends 0 (kill) to 1.5 (boost), center 1.0?
    // Native code was using GainNode: 1.0 = unity. 0.0 = silence (-Inf).
    // Tone.EQ3: 0 dB = unity. -Infinity = silence.
    // Map: 1.0 -> 0dB. 0.0 -> -60dB (virtual silence). 1.5 -> +6dB.
    // Formula: 20 * log10(val)
    const mapToDB = (val: number) => {
        if (val <= 0.01) return -Infinity; // Kill
        return 20 * Math.log10(val);
    };

    useEffect(() => {
        if (!nodes.current.eq) return;
        nodes.current.eq.low.value = state.eqKills.low ? -Infinity : mapToDB(state.eq.low);
        nodes.current.eq.mid.value = state.eqKills.mid ? -Infinity : mapToDB(state.eq.mid);
        nodes.current.eq.high.value = state.eqKills.high ? -Infinity : mapToDB(state.eq.high);
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

        try {
            if (source instanceof AudioBuffer) {
                // Wrap native buffer
                buffer = new Tone.ToneAudioBuffer(source);
            } else if (source instanceof File || typeof source === 'string') {
                const url = source instanceof File ? URL.createObjectURL(source) : source;
                buffer = await new Tone.ToneAudioBuffer().load(url);
            }

            if (buffer) {
                nodes.current.player.buffer = buffer;

                // BPM Detection
                let detectedBPM = bpm || 0;
                if (!detectedBPM) {
                    // Detect...
                    try {
                        const nativeBuf = buffer.get();
                        const analysis = await detectBPMFromBuffer(nativeBuf);
                        detectedBPM = analysis.bpm;
                    } catch (e) { console.error(e); }
                }

                setState(prev => ({
                    ...prev,
                    buffer: buffer?.get() || null,
                    duration: buffer?.duration || 0,
                    bpm: detectedBPM || null,
                    key: key || null,
                    currentTime: 0,
                    meta: providedMeta || { title: 'Unknown' },
                    playbackRate: 1,
                    baseRate: 1,
                    tempoBend: 0.5
                }));
            }
        } catch (e) {
            console.error("Load Track Error:", e);
        }
    }, []);

    const play = useCallback(async () => {
        if (!nodes.current.player || !nodes.current.player.loaded) return;
        await Tone.start();

        // Start from current time
        // Tone.Player.start arguments: time, offset, duration
        // We use offset = state.currentTime
        nodes.current.player.start(Tone.now(), state.currentTime);
        setState(prev => ({ ...prev, isPlaying: true }));
    }, [state.currentTime]);

    const pause = useCallback(() => {
        if (!nodes.current.player) return;
        nodes.current.player.stop();
        // Tone.Player doesn't report current position easily when stopped?
        // Actually, we must track time via loop or transport.
        // For simplicity:
        // nodes.current.player.stop() resets? Yes.
        // We need to calculate elapsed.
        // Or assume we track it in animation frame.
        setState(prev => ({ ...prev, isPlaying: false }));
    }, []);

    const cue = useCallback(() => {
        pause();
        setState(prev => ({ ...prev, currentTime: 0 }));
    }, [pause]);

    const seek = useCallback((time: number) => {
        const wasPlaying = state.isPlaying;
        if (wasPlaying) {
            nodes.current.player?.stop();
            nodes.current.player?.start(Tone.now(), time);
        }
        setState(prev => ({ ...prev, currentTime: time }));
    }, [state.isPlaying]);


    // Loop Logic
    useEffect(() => {
        if (!nodes.current.player) return;
        nodes.current.player.loop = state.loop.active;
        if (state.loop.active) {
            nodes.current.player.loopStart = state.loop.start;
            nodes.current.player.loopEnd = state.loop.end;
        }
    }, [state.loop]);

    const toggleLoop = useCallback(() => setState(prev => ({ ...prev, loop: { ...prev.loop, active: !prev.loop.active } })), []);

    // UI Animation Loop (Update currentTime)
    useEffect(() => {
        let frame: number;
        const update = () => {
            if (state.isPlaying && nodes.current.player) {
                // Ideally use Transport, but for now approximate
                // This is purely visual
                // Real precision requires Transport.
            }
            frame = requestAnimationFrame(update);
        };
        update();
        return () => cancelAnimationFrame(frame);
    }, [state.isPlaying]);

    // Simple Setters (boilerplates)
    const setRate = (r: number) => setState(p => ({ ...p, baseRate: r, playbackRate: r })); // Logic to combine bend needed
    const setVolume = (v: number) => setState(p => ({ ...p, volume: v }));
    const setTrim = (v: number) => setState(p => ({ ...p, trim: v }));
    const setPitch = (c: number) => setState(p => ({ ...p, pitch: c }));
    const setEQ = (b: any, v: number) => setState(p => ({ ...p, eq: { ...p.eq, [b]: v } }));
    const toggleEQKill = (b: any) => setState(p => ({ ...p, eqKills: { ...p.eqKills, [b]: !p.eqKills[b] } }));
    const setFilter = (v: number) => setState(p => ({ ...p, filter: v }));
    const setStemVolume = () => { }; // Todo: Stem player not fully rewritten for Tone yet
    const loopIn = () => { };
    const loopOut = () => { };
    const loopShift = () => { };
    const setLoopPoints = () => { };
    const quantizedLoop = () => { };
    const toggleSync = () => { };
    const setKeyLock = (l: boolean) => setState(p => ({ ...p, keyLock: l }));
    const setTempoBend = (v: number) => setState(p => ({ ...p, tempoBend: v }));


    return {
        play, pause, cue, seek, setRate, setVolume, setTrim, setPitch, setEQ, toggleEQKill, setFilter, setStemVolume,
        toggleLoop, loopIn, loopOut, loopShift, setLoopPoints, quantizedLoop, loadTrack, loadStems: () => { },
        setKeyLock, setTempoBend, toggleSync,
        state,
        analyser: nodes.current.analyser,
        masterOutput: nodes.current.volume,
        cueOutput: nodes.current.cueGate,
        fx: fxMock
    };
};
