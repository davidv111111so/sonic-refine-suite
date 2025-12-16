import { useEffect, useRef, useState, useCallback } from 'react';

export type FXType = 'filter' | 'filter-lfo' | 'delay' | 'tape-delay' | 'reverb' | 'flanger' | 'phaser' | 'tremolo' | 'ringmod' | 'distortion' | 'gater' | 'none';

interface FXSlotState {
    type: FXType;
    amount: number; // 0 to 1
    isOn: boolean;
}

interface FXChainState {
    masterMix: number; // 0 to 1
    masterOn: boolean;
    slots: [FXSlotState, FXSlotState, FXSlotState];
}

interface FXInstance {
    input: AudioNode;
    output: AudioNode;
    setAmount: (val: number, time: number) => void;
    nodes: AudioNode[]; // Keep track for disconnection
}

export interface FXChainControls {
    state: {
        active: boolean; // mapped to masterOn
        amount: number; // mapped to masterMix
        activeEffect: string; // Not used in Group mode really, but present in FXPanel interface
        parameter: number; // Not used in Group mode
    };
    toggleActive: () => void;
    setAmount: (val: number) => void;
    setParameter: (val: number) => void;
    setEffect: (type: string) => void;
    // Group Specific
    setMasterMix: (val: number) => void;
    setMasterOn: (val: boolean) => void;
    setSlotType: (index: number, type: FXType) => void;
    setSlotAmount: (index: number, val: number) => void;
    setSlotOn: (index: number, val: boolean) => void;
}

export const useGroupFXChain = (audioContext: AudioContext | null, sourceNode: AudioNode | null, destinationNode: AudioNode | null) => {
    // Audio Graph Refs
    const graphRef = useRef<{
        input: GainNode;
        output: GainNode;
        splitter: GainNode;
        dryGain: GainNode;
        wetGain: GainNode;

        // Slot Infrastructure
        slotInputs: GainNode[];
        slotOutputs: GainNode[];

        // Active Effects
        fxInstances: (FXInstance | null)[];
    } | null>(null);

    // State
    const [state, setState] = useState<FXChainState>({
        masterMix: 0,
        masterOn: true,
        slots: [
            { type: 'none', amount: 0.5, isOn: false },
            { type: 'none', amount: 0.5, isOn: false },
            { type: 'none', amount: 0.5, isOn: false }
        ]
    });

    // Initialize Graph
    useEffect(() => {
        if (!audioContext) return;

        const ctx = audioContext;

        // Main Architecture Nodes
        const input = ctx.createGain();       // Entry Point
        const output = ctx.createGain();      // Exit Point
        const splitter = ctx.createGain();    // Splitter (after Input)
        const dryGain = ctx.createGain();     // Dry Path Gain
        const wetGain = ctx.createGain();     // Wet Path Gain (at end of chain)

        // Slot Containers (Series Chain Anchors)
        // Slot1_In -> ... -> Slot1_Out -> Slot2_In -> ... -> Slot2_Out -> Slot3_In -> ... -> Slot3_Out
        const slotInputs = [ctx.createGain(), ctx.createGain(), ctx.createGain()];
        const slotOutputs = [ctx.createGain(), ctx.createGain(), ctx.createGain()];

        // --- Topology Connections ---

        // 1. Input Side
        input.connect(splitter);

        // 2. Parallel Paths
        // Dry Path
        splitter.connect(dryGain);
        dryGain.connect(output);

        // Wet Path (Series Chain)
        splitter.connect(slotInputs[0]);

        // Slot 1
        slotInputs[0].connect(slotOutputs[0]); // Default Through
        slotOutputs[0].connect(slotInputs[1]);

        // Slot 2
        slotInputs[1].connect(slotOutputs[1]); // Default Through
        slotOutputs[1].connect(slotInputs[2]);

        // Slot 3
        slotInputs[2].connect(slotOutputs[2]); // Default Through
        slotOutputs[2].connect(wetGain);

        // Wet Exit
        wetGain.connect(output);

        // Store Graph
        graphRef.current = {
            input,
            output,
            splitter,
            dryGain,
            wetGain,
            slotInputs,
            slotOutputs,
            fxInstances: [null, null, null]
        };

        return () => {
            input.disconnect();
            output.disconnect();
            splitter.disconnect();
            dryGain.disconnect();
            wetGain.disconnect();
            slotInputs.forEach(n => n.disconnect());
            slotOutputs.forEach(n => n.disconnect());
        };
    }, [audioContext]);

    // Connect to Source/Dest
    useEffect(() => {
        if (!sourceNode || !destinationNode || !graphRef.current) return;

        // Context Safety Check
        if (sourceNode.context !== graphRef.current.input.context) {
            console.warn("useGroupFXChain: Source context mismatch. Skipping.");
            return;
        }

        try {
            sourceNode.connect(graphRef.current.input);
            graphRef.current.output.connect(destinationNode);
        } catch (e) {
            console.error("useGroupFXChain: Connection error", e);
        }

        return () => {
            try {
                if (sourceNode.context === graphRef.current!.input.context) {
                    sourceNode.disconnect(graphRef.current!.input);
                }
                // Don't disconnect output from destination usually, but beneficial for cleanup
                graphRef.current!.output.disconnect(destinationNode);
            } catch (e) { }
        };
    }, [sourceNode, destinationNode, graphRef]);

    // Cleanup Instances on Unmount
    useEffect(() => {
        return () => {
            graphRef.current?.fxInstances.forEach(inst => {
                if (inst) inst.nodes.forEach(n => n.disconnect());
            });
        };
    }, []);


    // Master Mix Logic (Equal Power Crossfade)
    useEffect(() => {
        if (!graphRef.current || !audioContext) return;
        const { dryGain, wetGain } = graphRef.current;
        const ctx = audioContext;
        const t = ctx.currentTime;
        const rampTime = 0.05; // 50ms smooth

        if (!state.masterOn) {
            // Bypass Mode: Dry = 1, Wet = 0
            dryGain.gain.linearRampToValueAtTime(1, t + rampTime);
            wetGain.gain.linearRampToValueAtTime(0, t + rampTime);
            return;
        }

        const mix = state.masterMix;
        // Equal Power Law: x^2 + y^2 = 1
        const dry = Math.cos(mix * 0.5 * Math.PI);
        const wet = Math.sin(mix * 0.5 * Math.PI);

        dryGain.gain.linearRampToValueAtTime(dry, t + rampTime);
        wetGain.gain.linearRampToValueAtTime(wet, t + rampTime);

    }, [state.masterMix, state.masterOn, audioContext]);


    // Effect Factory
    const createEffect = useCallback((type: FXType, ctx: AudioContext): FXInstance | null => {
        const t = ctx.currentTime;

        switch (type) {
            case 'filter': {
                // Low High Pass Filter
                const filter = ctx.createBiquadFilter();
                filter.type = 'highpass';
                filter.Q.value = 1;
                filter.frequency.value = 20; // Start open/low

                // Set Amount: Exponential Map 20 -> 20k
                const setAmount = (val: number, time: number) => {
                    // val 0 -> 20
                    // val 1 -> 20000
                    // exp(ln(20) + val * (ln(20000)-ln(20)))
                    const min = Math.log(20);
                    const max = Math.log(20000);
                    const v = Math.exp(min + val * (max - min));
                    filter.frequency.linearRampToValueAtTime(v, time + 0.05);
                };

                return { input: filter, output: filter, setAmount, nodes: [filter] };
            }
            case 'filter-lfo': {
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.Q.value = 5;
                filter.frequency.value = 2000;

                const lfo = ctx.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.value = 1;

                const lfoGain = ctx.createGain();
                lfoGain.gain.value = 1000;

                lfo.connect(lfoGain);
                lfoGain.connect(filter.frequency);
                lfo.start(t);

                const setAmount = (val: number, time: number) => {
                    // Map Amount to LFO Rate (0.1Hz to 10Hz)
                    const rate = 0.1 + (val * 9.9);
                    lfo.frequency.linearRampToValueAtTime(rate, time + 0.05);
                };

                return { input: filter, output: filter, setAmount, nodes: [filter, lfo, lfoGain] };
            }
            case 'delay': {
                const delay = ctx.createDelay(2.0);
                delay.delayTime.value = 0.375; // 3/8ths (default)
                const feedback = ctx.createGain();

                delay.connect(feedback);
                feedback.connect(delay);

                const setAmount = (val: number, time: number) => {
                    // Map Amount to Feedback (0 to 0.95)
                    const fb = val * 0.95;
                    feedback.gain.linearRampToValueAtTime(fb, time + 0.05);
                };

                return { input: delay, output: delay, setAmount, nodes: [delay, feedback] };
            }
            case 'reverb': {
                const convolver = ctx.createConvolver();
                // Create Impulse noise
                const rate = ctx.sampleRate;
                const length = rate * 2; // 2 sec
                const decay = 2.0;
                const buffer = ctx.createBuffer(2, length, rate);
                for (let c = 0; c < 2; c++) {
                    const data = buffer.getChannelData(c);
                    for (let i = 0; i < length; i++) {
                        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
                    }
                }
                convolver.buffer = buffer;

                const wetMix = ctx.createGain();
                convolver.connect(wetMix);

                const setAmount = (val: number, time: number) => {
                    // Map Amount to Wet Gain (0 to 1)
                    wetMix.gain.linearRampToValueAtTime(val, time + 0.05);
                };

                return { input: convolver, output: wetMix, setAmount, nodes: [convolver, wetMix] };
            }
            case 'distortion': {
                const shaper = ctx.createWaveShaper();
                // Create curve
                const k = 50;
                const n_samples = 44100;
                const curve = new Float32Array(n_samples);
                const deg = Math.PI / 180;
                for (let i = 0; i < n_samples; ++i) {
                    const x = i * 2 / n_samples - 1;
                    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
                }
                shaper.curve = curve;
                shaper.oversample = '4x';

                const drive = ctx.createGain();
                drive.connect(shaper);

                const setAmount = (val: number, time: number) => {
                    // Map Amount to Input Drive (1 to 20)
                    const gain = 1 + val * 19;
                    drive.gain.linearRampToValueAtTime(gain, time + 0.05);
                };

                return { input: drive, output: shaper, setAmount, nodes: [shaper, drive] };
            }
            case 'flanger': {
                const delay = ctx.createDelay(0.1);
                delay.delayTime.value = 0.005;
                const feedback = ctx.createGain();
                feedback.gain.value = 0.5;
                const lfo = ctx.createOscillator();
                lfo.frequency.value = 0.2;
                const lfoGain = ctx.createGain();
                lfoGain.gain.value = 0.002;

                lfo.connect(lfoGain);
                lfoGain.connect(delay.delayTime);
                delay.connect(feedback);
                feedback.connect(delay);
                lfo.start(t);

                const setAmount = (val: number, time: number) => {
                    const rate = 0.1 + val * 4.9;
                    lfo.frequency.linearRampToValueAtTime(rate, time + 0.05);
                };
                return { input: delay, output: delay, setAmount, nodes: [delay, feedback, lfo, lfoGain] };
            }
            case 'phaser': {
                const ap1 = ctx.createBiquadFilter(); ap1.type = 'allpass'; ap1.frequency.value = 1000;
                const ap2 = ctx.createBiquadFilter(); ap2.type = 'allpass'; ap2.frequency.value = 1000;
                ap1.connect(ap2);

                const lfo = ctx.createOscillator(); lfo.frequency.value = 0.5;
                const lfoGain = ctx.createGain(); lfoGain.gain.value = 800; // Sweep depth

                lfo.connect(lfoGain);
                lfoGain.connect(ap1.frequency);
                lfoGain.connect(ap2.frequency);
                lfo.start(t);

                const setAmount = (val: number, time: number) => {
                    const rate = 0.1 + val * 7.9;
                    lfo.frequency.linearRampToValueAtTime(rate, time + 0.05);
                };
                return { input: ap1, output: ap2, setAmount, nodes: [ap1, ap2, lfo, lfoGain] };
            }
            case 'tremolo': {
                const gain = ctx.createGain();
                gain.gain.value = 0.5;
                const lfo = ctx.createOscillator(); lfo.frequency.value = 5;
                const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.5; // Modulates +/- 0.5
                lfo.connect(gain.gain);
                lfo.start(t);

                const setAmount = (val: number, time: number) => {
                    const rate = 1 + val * 19;
                    lfo.frequency.linearRampToValueAtTime(rate, time + 0.05);
                };
                return { input: gain, output: gain, setAmount, nodes: [gain, lfo, lfoGain] };
            }
            case 'ringmod': {
                const gain = ctx.createGain();
                gain.gain.value = 0;
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = 500;
                osc.connect(gain.gain);
                osc.start(t);

                const setAmount = (val: number, time: number) => {
                    const freq = 100 + val * 1900;
                    osc.frequency.linearRampToValueAtTime(freq, time + 0.05);
                };
                return { input: gain, output: gain, setAmount, nodes: [gain, osc] };
            }
            case 'gater': {
                const gain = ctx.createGain();
                const osc = ctx.createOscillator();
                osc.type = 'square';
                osc.frequency.value = 4;
                gain.gain.value = 0.5;

                // Square wave Gater logic
                // Square is -1 to 1.
                // We want modulation.
                const depth = ctx.createGain();
                depth.gain.value = 0.5;
                osc.connect(depth);
                depth.connect(gain.gain);
                osc.start(t);

                const setAmount = (val: number, time: number) => {
                    const rate = 1 + val * 19;
                    osc.frequency.linearRampToValueAtTime(rate, time + 0.05);
                };
                return { input: gain, output: gain, setAmount, nodes: [gain, osc, depth] };
            }
            case 'tape-delay': {
                const delay = ctx.createDelay(2.0);
                delay.delayTime.value = 0.5;
                const feedback = ctx.createGain();
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 2500; // Dark repeats

                delay.connect(filter);
                filter.connect(feedback);
                feedback.connect(delay);

                const setAmount = (val: number, time: number) => {
                    const fb = val * 0.95;
                    feedback.gain.linearRampToValueAtTime(fb, time + 0.05);
                };
                return { input: delay, output: delay, setAmount, nodes: [delay, feedback, filter] };
            }
            // For others, return simple passthrough placeholder or unimplemented
            default:
                return null;
        }
    }, []);

    // Slot Management Logic
    const updateSlot = useCallback((index: number, newState: FXSlotState) => {
        if (!graphRef.current || !audioContext) return;
        const { slotInputs, slotOutputs, fxInstances } = graphRef.current;
        const ctx = audioContext;

        const currentInstance = fxInstances[index];
        const currentType = state.slots[index].type;

        // 1. Check for Type Change
        if (newState.type !== currentType) {
            // Cleanup Old
            if (currentInstance) {
                // Disconnect Physical Links
                slotInputs[index].disconnect();

                // Disconnect Internal Nodes
                currentInstance.nodes.forEach(n => n.disconnect());
                fxInstances[index] = null;

                // Restore Passthrough (until new one is ready)
                slotInputs[index].connect(slotOutputs[index]);
            }

            // Create New
            if (newState.type !== 'none') {
                const newFX = createEffect(newState.type, ctx);
                if (newFX) {
                    // Update Ref
                    fxInstances[index] = newFX;

                    // Route: Input -> FX -> Output
                    slotInputs[index].disconnect(); // Remove passthrough / old

                    // If On, connect through. If Off, connect passthrough.
                    if (newState.isOn) {
                        slotInputs[index].connect(newFX.input);
                        newFX.output.connect(slotOutputs[index]);
                    } else {
                        slotInputs[index].connect(slotOutputs[index]);
                    }

                    // Set Initial Param
                    newFX.setAmount(newState.amount, ctx.currentTime);
                }
            }
        }
        // 2. Check for Parameter Change
        else if (currentInstance) {
            if (newState.amount !== state.slots[index].amount) {
                currentInstance.setAmount(newState.amount, ctx.currentTime);
            }
        }

        // 3. Check for Bypass Change
        // Re-routing logic
        if (newState.isOn !== state.slots[index].isOn) {
            const inst = fxInstances[index];
            if (inst) {
                slotInputs[index].disconnect();
                if (newState.isOn) {
                    slotInputs[index].connect(inst.input);
                    inst.output.connect(slotOutputs[index]);
                } else {
                    slotInputs[index].connect(slotOutputs[index]);
                }
            }
        }

        // Update State
        setState(prev => {
            const newSlots = [...prev.slots] as [FXSlotState, FXSlotState, FXSlotState];
            newSlots[index] = newState;
            return { ...prev, slots: newSlots };
        });

    }, [audioContext, createEffect, state.slots]);


    return {
        state, // { masterMix, masterOn, slots }
        toggleActive: () => setState(s => ({ ...s, masterOn: !s.masterOn })),
        setAmount: (val) => setState(s => ({ ...s, masterMix: val })),

        // Group Controls
        setMasterMix: (val: number) => setState(s => ({ ...s, masterMix: val })),
        setMasterOn: (val: boolean) => setState(s => ({ ...s, masterOn: val })),
        setSlotType: (index: number, type: FXType) => updateSlot(index, { ...state.slots[index], type }),
        setSlotAmount: (index: number, val: number) => updateSlot(index, { ...state.slots[index], amount: val }),
        setSlotOn: (index: number, val: boolean) => updateSlot(index, { ...state.slots[index], isOn: val }),
    };
};
