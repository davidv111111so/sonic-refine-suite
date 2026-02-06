export interface WaveformChunk {
    min: number;
    max: number;
    rms: number;
    low: number;      // Bass Energy
    midHigh: number;  // Treble Energy
}

self.onmessage = (e: MessageEvent) => {
    const { channelData, sampleRate, samplesPerPixel } = e.data;

    if (!channelData || channelData.length === 0) {
        self.postMessage({ error: 'No data provided' });
        return;
    }

    const len = channelData.length;
    const numChunks = Math.ceil(len / samplesPerPixel);

    // Create Float32Array with 5 values per chunk: min, max, rms, low, midHigh
    const peaks = new Float32Array(numChunks * 5);

    // Simple 1-pole LowPass Filter state
    let lastOut = 0;
    const alpha = 0.15; // Cutoff coefficient (~100-200Hz depending on sample rate)

    // Process in chunks
    let chunkIndex = 0;
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

        // Store in interleaved Float32Array format
        const baseIndex = chunkIndex * 5;
        peaks[baseIndex] = min;
        peaks[baseIndex + 1] = max;
        peaks[baseIndex + 2] = Math.sqrt(rmsSum / count);
        peaks[baseIndex + 3] = Math.sqrt(lowSum / count);
        peaks[baseIndex + 4] = Math.sqrt(midHighSum / count);

        chunkIndex++;
    }

    // Transfer the Float32Array to avoid copying
    self.postMessage({ peaks }, [peaks.buffer]);
};

export { };
