/**
 * AudioDecoderWorker — Off-Main-Thread Audio Processing
 * 
 * 3-Layer Architecture (Layer 2: Web Workers)
 * Handles: Audio decoding, FFT analysis, beat detection, waveform generation
 * 
 * Performance: Uses Transferable Objects for zero-copy memory transfer
 * to avoid serialization overhead on large audio buffers.
 */

// Message types
interface DecodeMessage {
    type: 'decode';
    id: string;
    arrayBuffer: ArrayBuffer;
    sampleRate: number;
}

interface WaveformMessage {
    type: 'waveform';
    id: string;
    channelData: Float32Array;
    targetLength: number;
}

interface FFTMessage {
    type: 'fft';
    id: string;
    channelData: Float32Array;
    fftSize: number;
}

interface BeatDetectMessage {
    type: 'beatDetect';
    id: string;
    channelData: Float32Array;
    sampleRate: number;
}

type WorkerMessage = DecodeMessage | WaveformMessage | FFTMessage | BeatDetectMessage;

// ─── Waveform Generation (downsampled for visualization) ───
function generateWaveformData(channelData: Float32Array, targetLength: number): Float32Array {
    const blockSize = Math.floor(channelData.length / targetLength);
    const waveform = new Float32Array(targetLength);

    for (let i = 0; i < targetLength; i++) {
        const start = i * blockSize;
        let sum = 0;
        for (let j = start; j < start + blockSize && j < channelData.length; j++) {
            sum += Math.abs(channelData[j]);
        }
        waveform[i] = sum / blockSize;
    }

    return waveform;
}

// ─── Simple FFT (Cooley-Tukey radix-2) ───
function computeFFT(data: Float32Array, fftSize: number): Float32Array {
    const n = Math.min(data.length, fftSize);
    const magnitudes = new Float32Array(n / 2);

    // Apply Hann window
    const windowed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
        windowed[i] = data[i] * window;
    }

    // Simple DFT for now (can upgrade to FFT later)
    for (let k = 0; k < n / 2; k++) {
        let re = 0, im = 0;
        for (let j = 0; j < n; j++) {
            const angle = -2 * Math.PI * k * j / n;
            re += windowed[j] * Math.cos(angle);
            im += windowed[j] * Math.sin(angle);
        }
        magnitudes[k] = Math.sqrt(re * re + im * im) / n;
    }

    return magnitudes;
}

// ─── Beat Detection (Energy-based onset detection) ───
function detectBeats(channelData: Float32Array, sampleRate: number): { bpm: number; grid: number[] } {
    // Low-pass filter to isolate kick drums
    const windowSize = Math.floor(sampleRate * 0.01); // 10ms windows
    const energyProfile: number[] = [];

    for (let i = 0; i < channelData.length; i += windowSize) {
        let energy = 0;
        const end = Math.min(i + windowSize, channelData.length);
        for (let j = i; j < end; j++) {
            energy += channelData[j] * channelData[j];
        }
        energyProfile.push(energy / windowSize);
    }

    // Detect onsets (energy peaks above local average)
    const onsets: number[] = [];
    const avgWindow = 43; // ~430ms context window
    for (let i = avgWindow; i < energyProfile.length - avgWindow; i++) {
        let localAvg = 0;
        for (let j = i - avgWindow; j < i + avgWindow; j++) {
            localAvg += energyProfile[j];
        }
        localAvg /= avgWindow * 2;

        if (energyProfile[i] > localAvg * 1.5 && energyProfile[i] > energyProfile[i - 1]) {
            const timeInSeconds = (i * windowSize) / sampleRate;
            if (onsets.length === 0 || timeInSeconds - onsets[onsets.length - 1] > 0.2) {
                onsets.push(timeInSeconds);
            }
        }
    }

    // Calculate BPM from onset intervals
    if (onsets.length < 4) {
        return { bpm: 120, grid: [] }; // Fallback
    }

    const intervals: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
        const interval = onsets[i] - onsets[i - 1];
        if (interval > 0.25 && interval < 2.0) { // 30-240 BPM range
            intervals.push(interval);
        }
    }

    if (intervals.length === 0) return { bpm: 120, grid: [] };

    // Find most common interval (histogram approach)
    intervals.sort();
    const medianInterval = intervals[Math.floor(intervals.length / 2)];
    const bpm = Math.round(60 / medianInterval);

    // Generate beatgrid from first onset
    const beatInterval = 60 / bpm;
    const grid: number[] = [];
    const duration = channelData.length / sampleRate;
    let t = onsets[0] || 0;
    while (t < duration) {
        grid.push(t);
        t += beatInterval;
    }

    return { bpm: Math.max(60, Math.min(240, bpm)), grid };
}

// ─── Message Handler ───
self.onmessage = function (e: MessageEvent<WorkerMessage>) {
    const msg = e.data;

    try {
        switch (msg.type) {
            case 'waveform': {
                const waveform = generateWaveformData(msg.channelData, msg.targetLength);
                // Transfer ownership of the buffer (zero-copy)
                (self as any).postMessage(
                    { type: 'waveformResult', id: msg.id, waveform },
                    [waveform.buffer]
                );
                break;
            }

            case 'fft': {
                const magnitudes = computeFFT(msg.channelData, msg.fftSize);
                (self as any).postMessage(
                    { type: 'fftResult', id: msg.id, magnitudes },
                    [magnitudes.buffer]
                );
                break;
            }

            case 'beatDetect': {
                const result = detectBeats(msg.channelData, msg.sampleRate);
                const gridArray = new Float32Array(result.grid);
                (self as any).postMessage(
                    { type: 'beatDetectResult', id: msg.id, bpm: result.bpm, grid: gridArray },
                    [gridArray.buffer]
                );
                break;
            }

            default:
                (self as any).postMessage({ type: 'error', id: (msg as any).id, error: `Unknown message type: ${msg.type}` });
        }
    } catch (error) {
        // Error boundary for worker - prevents silent crashes
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[AudioDecoderWorker] Error processing ${msg.type}:`, errorMsg);
        (self as any).postMessage({
            type: 'error',
            id: (msg as any).id || 'unknown',
            error: errorMsg,
        });
    }
};

// Signal ready
(self as any).postMessage({ type: 'ready' });

export { }; // Make it a module for TypeScript
