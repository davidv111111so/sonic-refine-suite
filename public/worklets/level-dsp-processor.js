/**
 * LevelDSPProcessor — Audio Worklet for Real-time DSP
 * 
 * 3-Layer Architecture (Layer 3: Audio Worklets)
 * Handles: Real-time filters, EQ, effects on the audio rendering thread
 * 
 * IMPORTANT: This file MUST be plain JavaScript (no TypeScript).
 * AudioWorklet files are loaded via addModule() and cannot use TypeScript.
 * 
 * Performance: Reuses Float32Array buffers (no allocation in process loop),
 * uses manual memory management to avoid GC on the audio thread.
 */

class LevelDSPProcessor extends AudioWorkletProcessor {
    constructor() {
        super();

        // Pre-allocate all buffers once (avoid GC on audio thread)
        this._filterStatesL = new Float64Array(80); // 4 states × 2 × 10 bands
        this._filterStatesR = new Float64Array(80);
        this._eqGains = new Float32Array(10);
        this._eqCoeffs = new Float64Array(50); // 5 coefficients × 10 bands
        this._isActive = true;
        this._processCallCount = 0;

        this._initializeEQ();

        // Listen for parameter updates from main thread
        this.port.onmessage = (event) => {
            const { type, data } = event.data;
            switch (type) {
                case 'setEQ':
                    if (data.gains && data.gains.length === 10) {
                        for (let i = 0; i < 10; i++) {
                            this._eqGains[i] = data.gains[i];
                        }
                        this._recalculateEQCoeffs();
                    }
                    break;
                case 'bypass':
                    this._isActive = data.active !== false;
                    break;
                case 'reset':
                    this._filterStatesL.fill(0);
                    this._filterStatesR.fill(0);
                    break;
            }
        };
    }

    _initializeEQ() {
        this._eqGains.fill(0); // Flat
        this._recalculateEQCoeffs();
    }

    _recalculateEQCoeffs() {
        const frequencies = [31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
        const Q = 1.414;

        for (let band = 0; band < 10; band++) {
            const freq = frequencies[band];
            const gain = this._eqGains[band];
            const offset = band * 5;

            if (Math.abs(gain) < 0.01) {
                this._eqCoeffs[offset] = 1;     // b0
                this._eqCoeffs[offset + 1] = 0; // b1
                this._eqCoeffs[offset + 2] = 0; // b2
                this._eqCoeffs[offset + 3] = 0; // a1
                this._eqCoeffs[offset + 4] = 0; // a2
            } else {
                const A = Math.pow(10, gain / 40);
                const w0 = 2 * Math.PI * freq / sampleRate;
                const sinW0 = Math.sin(w0);
                const cosW0 = Math.cos(w0);
                const alpha = sinW0 / (2 * Q);

                const a0 = 1 + alpha / A;
                this._eqCoeffs[offset] = (1 + alpha * A) / a0;
                this._eqCoeffs[offset + 1] = (-2 * cosW0) / a0;
                this._eqCoeffs[offset + 2] = (1 - alpha * A) / a0;
                this._eqCoeffs[offset + 3] = (-2 * cosW0) / a0;
                this._eqCoeffs[offset + 4] = (1 - alpha / A) / a0;
            }
        }
    }

    process(inputs, outputs, parameters) {
        this._processCallCount++;

        const input = inputs[0];
        const output = outputs[0];

        if (!input || !input[0]) {
            return true;
        }

        const numSamples = input[0].length;

        // Passthrough if not active
        if (!this._isActive) {
            for (let ch = 0; ch < output.length; ch++) {
                if (input[ch]) {
                    output[ch].set(input[ch]);
                }
            }
            return true;
        }

        // Process left channel
        if (input[0] && output[0]) {
            this._processChannel(input[0], output[0], this._filterStatesL, numSamples);
        }

        // Process right channel
        if (input[1] && output[1]) {
            this._processChannel(input[1], output[1], this._filterStatesR, numSamples);
        } else if (output[1] && output[0]) {
            output[1].set(output[0]);
        }

        // Periodic health report (~every 5 seconds)
        if (this._processCallCount % 1720 === 0) {
            this.port.postMessage({
                type: 'health',
                processCount: this._processCallCount,
                timestamp: currentTime,
            });
        }

        return true;
    }

    _processChannel(input, output, states, numSamples) {
        output.set(input);

        for (let band = 0; band < 10; band++) {
            if (Math.abs(this._eqGains[band]) < 0.01) continue;

            const cOffset = band * 5;
            const sOffset = band * 8;

            const b0 = this._eqCoeffs[cOffset];
            const b1 = this._eqCoeffs[cOffset + 1];
            const b2 = this._eqCoeffs[cOffset + 2];
            const a1 = this._eqCoeffs[cOffset + 3];
            const a2 = this._eqCoeffs[cOffset + 4];

            let z1 = states[sOffset];
            let z2 = states[sOffset + 1];

            for (let i = 0; i < numSamples; i++) {
                const x = output[i];
                const y = b0 * x + z1;
                z1 = b1 * x - a1 * y + z2;
                z2 = b2 * x - a2 * y;
                output[i] = y;
            }

            states[sOffset] = z1;
            states[sOffset + 1] = z2;
        }
    }
}

registerProcessor('level-dsp-processor', LevelDSPProcessor);
