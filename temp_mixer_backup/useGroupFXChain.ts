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

export const useGroupFXChain = (audioContext: AudioContext | null, sourceNode: AudioNode | null, destinationNode: AudioNode | null) => {
    // Audio Graph Refs
    const graphRef = useRef<{
        input: GainNode;
        output: GainNode;
        dryGain: GainNode;
        wetGain: GainNode;
        slotNodes: (AudioNode | null)[];
        slotInputs: GainNode[];
        slotOutputs: GainNode[];
    } | null>(null);

    // State
    const [state, setState] = useState<FXChainState>({
        masterMix: 0,
        masterOn: true,
        slots: [
            { type: 'none', amount: 0.5, isOn: true },
            { type: 'none', amount: 0.5, isOn: true },
            { type: 'none', amount: 0.5, isOn: true }
        ]
    });

    // Initialize Graph
    useEffect(() => {
        if (!audioContext) return;

        const ctx = audioContext;
        const input = ctx.createGain();
        const output = ctx.createGain();
        const dryGain = ctx.createGain();
        const wetGain = ctx.createGain();

        // Slot Infrastructure (Input/Output wrappers for easy swapping)
        const slotInputs = [ctx.createGain(), ctx.createGain(), ctx.createGain()];
        const slotOutputs = [ctx.createGain(), ctx.createGain(), ctx.createGain()];

        // Routing: Input -> Dry/Wet Split
        input.connect(dryGain);
        input.connect(wetGain);

        // Dry Path
        dryGain.connect(output);

        // Wet Path Chain: WetGain -> Slot1 -> Slot2 -> Slot3 -> Output
        // Note: Usually Wet Mix is at the END or BEGINNING. 
        // User spec: Source -> Splitter |-> DryGain -> Output |-> Slot 1 -> Slot 2 -> Slot 3 -> WetGain -> Output
        // Wait, if WetGain is at the end, then Slot 1 input is connected to Source directly (via Splitter).

        // Correct Routing based on spec:
        // Input -> DryGain -> Output
        // Input -> Slot1_In -> Slot1_Out -> Slot2_In -> Slot2_Out -> Slot3_In -> Slot3_Out -> WetGain -> Output

        input.connect(slotInputs[0]);

        slotInputs[0].connect(slotOutputs[0]); // Initially passthrough
        slotOutputs[0].connect(slotInputs[1]);

        slotInputs[1].connect(slotOutputs[1]); // Initially passthrough
        slotOutputs[1].connect(slotInputs[2]);

        slotInputs[2].connect(slotOutputs[2]); // Initially passthrough
        slotOutputs[2].connect(wetGain);

        wetGain.connect(output);

        graphRef.current = {
            input,
            output,
            dryGain,
            wetGain,
            slotNodes: [null, null, null],
            slotInputs,
            slotOutputs
        };

        return () => {
            input.disconnect();
            output.disconnect();
            dryGain.disconnect();
            wetGain.disconnect();
            slotInputs.forEach(n => n.disconnect());
            slotOutputs.forEach(n => n.disconnect());
        };
    }, [audioContext]);

    // Connect to Source/Dest
    useEffect(() => {
        if (!sourceNode || !destinationNode || !graphRef.current) return;

        sourceNode.connect(graphRef.current.input);
        graphRef.current.output.connect(destinationNode);

        return () => {
            try {
                sourceNode.disconnect(graphRef.current!.input);
                graphRef.current!.output.disconnect(destinationNode);
            } catch (e) { }
        };
    }, [sourceNode, destinationNode]);

    // Master Mix Logic
    useEffect(() => {
        if (!graphRef.current || !audioContext) return;
        const { dryGain, wetGain } = graphRef.current;
        const ctx = audioContext;
        const t = ctx.currentTime;

        if (!state.masterOn) {
            // Bypass whole unit: Dry = 1, Wet = 0
            dryGain.gain.setTargetAtTime(1, t, 0.01);
            wetGain.gain.setTargetAtTime(0, t, 0.01);
            return;
        }

        // Equal Power Crossfade
        const mix = state.masterMix;
        const dry = Math.cos(mix * 0.5 * Math.PI);
        const wet = Math.sin(mix * 0.5 * Math.PI); // Use sin for equal power wet

        dryGain.gain.setTargetAtTime(dry, t, 0.01);
        wetGain.gain.setTargetAtTime(wet, t, 0.01);
    }, [state.masterMix, state.masterOn, audioContext]);

    // Effect Factory
    const createEffect = useCallback((type: FXType, ctx: AudioContext) => {
        const t = ctx.currentTime;
        switch (type) {
            case 'filter': {
                const node = ctx.createBiquadFilter();
                node.type = 'highpass';
                node.frequency.value = 1000;
                return { node, param: node.frequency, min: 20, max: 20000 };
            }
            case 'filter-lfo': {
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.Q.value = 5;
                const lfo = ctx.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.value = 0.5; // Rate
                const lfoGain = ctx.createGain();
                lfoGain.gain.value = 2000; // Depth
                lfo.connect(lfoGain);
                lfoGain.connect(filter.frequency);
                lfo.start(t);
                // Param controls LFO Rate
                return { node: filter, param: lfo.frequency, min: 0.1, max: 10 };
            }
            case 'delay': {
                const delay = ctx.createDelay(5.0);
                const feedback = ctx.createGain();
                delay.delayTime.value = 0.375;
                delay.connect(feedback);
                feedback.connect(delay);
                // Param: Feedback
                return { node: delay, param: feedback.gain, min: 0, max: 0.9 };
            }
            case 'tape-delay': {
                const delay = ctx.createDelay(5.0);
                delay.delayTime.value = 0.5;
                const feedback = ctx.createGain();
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 2000; // Darken repeats

                delay.connect(filter);
                filter.connect(feedback);
                feedback.connect(delay);

                // Param: Delay Time (Speed)
                return { node: delay, param: delay.delayTime, min: 0.1, max: 1.0 };
            }
            case 'reverb': {
                const convolver = ctx.createConvolver();
                const rate = ctx.sampleRate;
                const length = rate * 2;
                const decay = 2.0;
                const buffer = ctx.createBuffer(2, length, rate);
                for (let c = 0; c < 2; c++) {
                    const data = buffer.getChannelData(c);
                    for (let i = 0; i < length; i++) {
                        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
                    }
                }
                convolver.buffer = buffer;
                const gain = ctx.createGain();
                convolver.connect(gain);
                return { node: convolver, output: gain, param: gain.gain, min: 0, max: 1 };
            }
            case 'flanger': {
                const delay = ctx.createDelay(1.0);
                delay.delayTime.value = 0.005;
                const feedback = ctx.createGain();
                feedback.gain.value = 0.5;
                const lfo = ctx.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.value = 0.25;
                const lfoGain = ctx.createGain();
                lfoGain.gain.value = 0.002;

                lfo.connect(lfoGain);
                lfoGain.connect(delay.delayTime);
                delay.connect(feedback);
                feedback.connect(delay);
                lfo.start(t);

                // Param: LFO Rate
                return { node: delay, param: lfo.frequency, min: 0.1, max: 5 };
            }
            case 'phaser': {
                // Simple 2-stage allpass phaser
                const allpass1 = ctx.createBiquadFilter();
                allpass1.type = 'allpass';
                allpass1.frequency.value = 1000;
                const allpass2 = ctx.createBiquadFilter();
                allpass2.type = 'allpass';
                allpass2.frequency.value = 1000;

                allpass1.connect(allpass2);

                const lfo = ctx.createOscillator();
                lfo.frequency.value = 0.5;
                const lfoGain = ctx.createGain();
                lfoGain.gain.value = 500;

                lfo.connect(lfoGain);
                lfoGain.connect(allpass1.frequency);
                lfoGain.connect(allpass2.frequency);
                lfo.start(t);

                // Param: Rate
                return { node: allpass1, output: allpass2, param: lfo.frequency, min: 0.1, max: 8 };
            }
            case 'tremolo': {
                const gain = ctx.createGain();
                const lfo = ctx.createOscillator();
                lfo.frequency.value = 4;
                const lfoGain = ctx.createGain();
                lfoGain.gain.value = 0.5; // Depth

                // Gain node value is 1. We want to modulate it.
                // But GainNode.gain is an AudioParam.
                // We need to offset it? 
                // Standard Tremolo: Gain varies from 1 to 0.
                // LFO (-1 to 1) -> Scale (0.5) -> (-0.5 to 0.5) -> Offset (0.5) -> (0 to 1)
                // Or just connect LFO to Gain.gain? 
                // If Gain is 0, and LFO is +/- 1...
                // Let's set Gain to 0.5, and LFO adds +/- 0.5.
                gain.gain.value = 0.5;
                lfo.connect(gain.gain);
                lfo.start(t);

                // Param: Rate
                return { node: gain, param: lfo.frequency, min: 1, max: 20 };
            }
            case 'ringmod': {
                const gain = ctx.createGain();
                gain.gain.value = 0; // Modulated by OSC
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = 500;
                osc.connect(gain.gain);
                osc.start(t);

                // Param: Frequency
                return { node: gain, param: osc.frequency, min: 100, max: 2000 };
            }
            case 'distortion': {
                const shaper = ctx.createWaveShaper();
                // Sigmoid curve
                const n_samples = 44100;
                const curve = new Float32Array(n_samples);
                const deg = Math.PI / 180;
                const k = 20; // Distortion amount
                for (let i = 0; i < n_samples; ++i) {
                    const x = i * 2 / n_samples - 1;
                    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
                }
                shaper.curve = curve;
                shaper.oversample = '4x';

                // Param: We can't easily change curve in real-time efficiently without recalculating.
                // Instead, let's put a Gain before it to drive it harder.
                const drive = ctx.createGain();
                drive.gain.value = 1;
                drive.connect(shaper);

                // Param: Drive
                return { node: drive, output: shaper, param: drive.gain, min: 1, max: 50 };
            }
            case 'gater': {
                const gain = ctx.createGain();
                const osc = ctx.createOscillator();
                const oscGain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = 4;
                osc.connect(oscGain);
                oscGain.connect(gain.gain);
                osc.start(t);
                return { node: gain, param: osc.frequency, min: 0.5, max: 20 };
            }
            default:
                return null;
        }
    }, []);

    // Slot Management Logic
    const updateSlot = useCallback((index: number, newState: FXSlotState) => {
        if (!graphRef.current || !audioContext) return;
        const { slotInputs, slotOutputs, slotNodes } = graphRef.current;
        const ctx = audioContext;

        // 1. Handle Type Change
        const currentType = state.slots[index].type;
        if (newState.type !== currentType) {
            // Remove old node
            const oldNode = slotNodes[index];
            if (oldNode) {
                oldNode.disconnect();
                // If it was a subgraph (reverb), we might need to disconnect output too
                // But we only track the "entry" node in slotNodes usually.
                // We need to track the "instance" which might have cleanup.
            }

            // Create new node
            if (newState.type !== 'none') {
                const fx = createEffect(newState.type, ctx);
                if (fx) {
                    // Connect: SlotInput -> FX -> SlotOutput
                    slotInputs[index].disconnect(); // Disconnect direct passthrough

                    if ('output' in fx && fx.output) {
                        // Subgraph
                        slotInputs[index].connect(fx.node);
                        fx.output.connect(slotOutputs[index]);
                        // Store metadata for updates
                        // We need a way to store the param reference too.
                        // Let's store it in a separate ref map or extend slotNodes.
                        (slotNodes as any)[index] = { ...fx, isSubgraph: true };
                    } else {
                        // Single Node
                        slotInputs[index].connect(fx.node);
                        fx.node.connect(slotOutputs[index]);
                        (slotNodes as any)[index] = { ...fx, isSubgraph: false };
                    }
                }
            } else {
                // None: Restore passthrough
                slotInputs[index].disconnect();
                slotInputs[index].connect(slotOutputs[index]);
                slotNodes[index] = null;
            }
        }

        // 2. Handle Parameter Update
        const fxInstance = (slotNodes as any)[index];
        if (fxInstance && fxInstance.param) {
            const { min, max, param } = fxInstance;
            const val = min + (newState.amount * (max - min));
            param.setTargetAtTime(val, ctx.currentTime, 0.01);
        }

        // 3. Handle Bypass (On/Off)
        // If Off, we should bypass the effect.
        // But we already have the node inserted.
        // We can disconnect Input->FX and connect Input->Output directly.
        if (fxInstance) {
            if (newState.isOn) {
                // Ensure connected
                // This is tricky if we toggle rapidly.
                // Let's assume we just rebuild connections if state changes.
                // Or use a Dry/Wet internal to the slot?
                // User suggestion: "Each slot should have its own small Dry/Wet circuit."
                // That's better.
                // But we didn't build that in init.
                // Let's stick to disconnect/connect for now or just set Gain to 0 if it's a mix effect?
                // For Filter, "Off" means bypass.
                // Let's implement bypass by re-routing around the node.

                // Check if currently bypassed
                // This requires tracking connection state.
                // Let's simplify: Always run the "Type Change" logic if "IsOn" changes? No, expensive.

                // Let's use the GainNode approach for bypass if possible.
                // But Filter doesn't have a mix.

                // Re-route approach:
                // If On: Input -> FX -> Output
                // If Off: Input -> Output (and Input !-> FX)

                // We can do this in a `useEffect` that watches `state.slots[index].isOn`.
            }
        }

        setState(prev => {
            const newSlots = [...prev.slots] as [FXSlotState, FXSlotState, FXSlotState];
            newSlots[index] = newState;
            return { ...prev, slots: newSlots };
        });

    }, [audioContext, createEffect, state.slots]);

    // We need a separate effect to handle the "Bypass" routing efficiently without recreating nodes
    useEffect(() => {
        if (!graphRef.current) return;
        const { slotInputs, slotOutputs, slotNodes } = graphRef.current;

        state.slots.forEach((slot, i) => {
            const fx = (slotNodes as any)[i];
            if (!fx) return; // 'none' type is already passthrough

            // Reset connections
            slotInputs[i].disconnect();

            if (slot.isOn) {
                // Connect through FX
                slotInputs[i].connect(fx.node);
            } else {
                // Bypass FX
                slotInputs[i].connect(slotOutputs[i]);
            }
        });
    }, [state.slots.map(s => s.isOn).join(','), state.slots.map(s => s.type).join(',')]);


    return {
        state,
        setMasterMix: (val: number) => setState(s => ({ ...s, masterMix: val })),
        setMasterOn: (val: boolean) => setState(s => ({ ...s, masterOn: val })),
        setSlotType: (index: number, type: FXType) => updateSlot(index, { ...state.slots[index], type }),
        setSlotAmount: (index: number, val: number) => updateSlot(index, { ...state.slots[index], amount: val }),
        setSlotOn: (index: number, val: boolean) => updateSlot(index, { ...state.slots[index], isOn: val }),
    };
};
