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

    const peaks: WaveformChunk[] = [];
    const len = channelData.length;

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

        peaks.push({
            min,
            max,
            rms: Math.sqrt(rmsSum / count),
            low: Math.sqrt(lowSum / count),
            midHigh: Math.sqrt(midHighSum / count)
        });
    }

    self.postMessage({ peaks });
};

export { };
