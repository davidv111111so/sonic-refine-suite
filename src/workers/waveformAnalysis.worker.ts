// Web Worker for Waveform Analysis
// Calculates peaks for the DetailWaveform component

export interface WaveformChunk {
    min: number;
    max: number;
    rms: number;
    isBass: boolean;
}

self.onmessage = (e: MessageEvent) => {
    const { channelData, sampleRate, samplesPerPixel } = e.data;

    // channelData is a Float32Array
    // We need to verify data validity
    if (!channelData || channelData.length === 0) {
        self.postMessage({ error: 'No data provided' });
        return;
    }

    const peaks: WaveformChunk[] = [];
    const len = channelData.length;

    // Process in chunks (each pixel represents N samples)
    for (let i = 0; i < len; i += samplesPerPixel) {
        let min = 0;
        let max = 0;
        let rmsSum = 0;
        let count = 0;

        // Analyze the chunk
        for (let j = 0; j < samplesPerPixel; j++) {
            if (i + j >= len) break;
            const val = channelData[i + j];

            if (val < min) min = val;
            if (val > max) max = val;

            rmsSum += val * val;
            count++;
        }

        const rms = Math.sqrt(rmsSum / count);

        // Simple bass detection heuristic: high energy + low frequency dominance
        // (Without FFT, we just assume high RMS might be a beat in electronic music, 
        // but real bass detection needs FFT. For visualizer, simple RMS threshold is often "good enough" for color variation)
        const isBass = rms > 0.5;

        peaks.push({
            min,
            max,
            rms,
            isBass
        });
    }

    self.postMessage({ peaks });
};

export { };
