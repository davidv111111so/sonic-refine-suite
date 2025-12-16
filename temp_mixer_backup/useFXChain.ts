import { useEffect, useRef, useState, useCallback } from 'react';

export type FXType = 'delay' | 'reverb' | 'filter';

export interface FXState {
    activeEffect: FXType | null;
    amount: number; // 0-1 (Dry/Wet)
    parameter: number; // 0-1 (Effect specific)
    active: boolean; // Bypass switch
}

export interface FXChainControls {
    setEffect: (type: FXType) => void;
    setAmount: (val: number) => void;
    setParameter: (val: number) => void;
    toggleActive: () => void;
    state: FXState;
    inputNode: GainNode | null;
    outputNode: GainNode | null;
}

export const useFXChain = (context: AudioContext | null): FXChainControls => {
    const nodes = useRef<{
        input: GainNode | null;
        output: GainNode | null;
        dryGain: GainNode | null;
        wetGain: GainNode | null;
        // Effects
        delay: DelayNode | null;
        feedback: GainNode | null;
        reverb: ConvolverNode | null;
        filter: BiquadFilterNode | null;
    }>({
        input: null,
        output: null,
        dryGain: null,
        wetGain: null,
        delay: null,
        feedback: null,
        reverb: null,
        filter: null
    });

    const [state, setState] = useState<FXState>({
        activeEffect: 'filter',
        amount: 0,
        parameter: 0.5,
        active: false
    });

    // Initialize Chain
    useEffect(() => {
        if (!context) return;

        const input = context.createGain();
        const output = context.createGain();
        const dryGain = context.createGain();
        const wetGain = context.createGain();

        // Default routing: Input -> Dry/Wet -> Output
        input.connect(dryGain);
        dryGain.connect(output);

        // Wet path will be connected dynamically based on effect
        wetGain.connect(output);

        // Initialize Effects Nodes
        // 1. Delay
        const delay = context.createDelay(5.0);
        const feedback = context.createGain();
        delay.connect(feedback);
        feedback.connect(delay); // Loop

        // 2. Reverb
        const reverb = context.createConvolver();
        // Load default IR
        fetch('/assets/hall-reverb.wav')
            .then(res => res.arrayBuffer())
            .then(buffer => context.decodeAudioData(buffer))
            .then(decoded => { if (reverb) reverb.buffer = decoded; })
            .catch(() => console.warn("Reverb IR not found"));

        // 3. Filter
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 20000;

        nodes.current = {
            input, output, dryGain, wetGain,
            delay, feedback, reverb, filter
        };

        // Trigger re-render to expose nodes
        setState(prev => ({ ...prev }));

        return () => {
            input.disconnect();
            output.disconnect();
            dryGain.disconnect();
            wetGain.disconnect();
        };
    }, [context]);

    // Update Routing & Parameters
    useEffect(() => {
        if (!context || !nodes.current.input) return;
        const { input, wetGain, delay, feedback, reverb, filter } = nodes.current;

        // Disconnect previous wet path
        try { input.disconnect(delay!); } catch (e) { }
        try { input.disconnect(reverb!); } catch (e) { }
        try { input.disconnect(filter!); } catch (e) { }
        try { delay!.disconnect(wetGain!); } catch (e) { }
        try { reverb!.disconnect(wetGain!); } catch (e) { }
        try { filter!.disconnect(wetGain!); } catch (e) { }

        if (!state.active) {
            // Bypass: Dry = 1, Wet = 0
            nodes.current.dryGain!.gain.setTargetAtTime(1, context.currentTime, 0.01);
            nodes.current.wetGain!.gain.setTargetAtTime(0, context.currentTime, 0.01);
            return;
        }

        // Apply Dry/Wet (Equal Power)
        // Amount 0 = Dry, 1 = Wet
        const dry = Math.cos(state.amount * 0.5 * Math.PI);
        const wet = Math.sin(state.amount * 0.5 * Math.PI);
        nodes.current.dryGain!.gain.setTargetAtTime(dry, context.currentTime, 0.01);
        nodes.current.wetGain!.gain.setTargetAtTime(wet, context.currentTime, 0.01);

        // Connect Active Effect
        if (state.activeEffect === 'delay' && delay && feedback) {
            input.connect(delay);
            delay.connect(wetGain!);

            // Parameter = Feedback Amount (0-0.9)
            feedback.gain.value = state.parameter * 0.9;
            // Fixed time for now (could be BPM synced)
            delay.delayTime.value = 0.375; // ~128 BPM dotted 8th
        }
        else if (state.activeEffect === 'reverb' && reverb) {
            input.connect(reverb);
            reverb.connect(wetGain!);
            // Reverb doesn't have simple parameters on ConvolverNode besides buffer
        }
        else if (state.activeEffect === 'filter' && filter) {
            input.connect(filter);
            filter.connect(wetGain!);

            // Filter Sweep Logic
            // 0.5 = Neutral
            // < 0.5 = Lowpass closing
            // > 0.5 = Highpass opening
            const val = state.parameter;
            if (val < 0.45) {
                filter.type = 'lowpass';
                // Map 0.45 -> 0 to 20000 -> 20
                const freq = 20 * Math.pow(1000, val / 0.45);
                filter.frequency.setTargetAtTime(freq, context.currentTime, 0.01);
                filter.Q.value = 5;
            } else if (val > 0.55) {
                filter.type = 'highpass';
                // Map 0.55 -> 1 to 20 -> 20000
                const freq = 20 * Math.pow(1000, (val - 0.55) / 0.45);
                filter.frequency.setTargetAtTime(freq, context.currentTime, 0.01);
                filter.Q.value = 5;
            } else {
                // Neutral
                filter.type = 'allpass'; // or lowpass open
                filter.frequency.value = 20000;
                filter.Q.value = 0;
            }
        }

    }, [context, state, nodes.current.input]); // Re-run when state changes

    const setEffect = useCallback((type: FXType) => setState(s => ({ ...s, activeEffect: type })), []);
    const setAmount = useCallback((val: number) => setState(s => ({ ...s, amount: val })), []);
    const setParameter = useCallback((val: number) => setState(s => ({ ...s, parameter: val })), []);
    const toggleActive = useCallback(() => setState(s => ({ ...s, active: !s.active })), []);

    return {
        setEffect, setAmount, setParameter, toggleActive,
        state,
        inputNode: nodes.current.input,
        outputNode: nodes.current.output
    };
};
