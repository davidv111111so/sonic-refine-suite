export interface WaveformChunk {
    min: number;
    max: number;
    rms?: number;
    low?: number;      // Bass Energy
    midHigh?: number;  // Treble Energy
    isBass?: boolean;  // Legacy compatibility
}

self.onmessage = (e: MessageEvent) => {
    const { channelData, sampleRate, samplesPerPixel } = e.data;

    if (!channelData || channelData.length === 0) {
        self.postMessage({ error: 'No data provided' });
        return;
    }

    const len = channelData.length;
    const peakCount = Math.ceil(len / samplesPerPixel);
    const resultBuffer = new Float32Array(peakCount * 5); // 5 fields per peak

    // Simple 1-pole LowPass Filter state
    let lastOut = 0;
    const alpha = 0.15; // Cutoff coefficient (~100-200Hz depending on sample rate)

    // Process in chunks
    for (let i = 0; i < len; i += samplesPerPixel) {
        let min = 0;
        let max = 0;
        let rmsSum = 0;
        let lowSum = 0;
        let midHighSum = 0;
        let count = 0;

        for (let j = 0; j < samplesPerPixel; j++) {
            if (i + j >= len) break;
            const original = channelData[i + j];

            // Low Pass Filter (Bass)
            const low = lastOut + alpha * (original - lastOut);
            lastOut = low;

            // High Pass (Original - Bass)
            const high = original - low;

            if (original < min) min = original;
            if (original > max) max = original;

            rmsSum += original * original;
            lowSum += low * low;
            midHighSum += high * high;

            count++;
        }

        // Pack into Float32Array: [min, max, rms, low, midHigh]
        // Flattened structure is much faster to transfer and iterate
        const offset = (i / samplesPerPixel) * 5;
        // Ensure we fit (in case of rounding)
        if (offset + 5 <= resultBuffer.length) {
            resultBuffer[offset] = min;
            resultBuffer[offset + 1] = max;
            resultBuffer[offset + 2] = Math.sqrt(rmsSum / count);
            resultBuffer[offset + 3] = Math.sqrt(lowSum / count);
            resultBuffer[offset + 4] = Math.sqrt(midHighSum / count);
        }
    }

    self.postMessage({ peaks: resultBuffer }, [resultBuffer.buffer]);
};

export { };
