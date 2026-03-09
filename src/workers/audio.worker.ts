import MusicTempo from 'music-tempo';

// Define message types
type WorkerMessage =
    | { type: 'ANALYZE_BPM'; buffer: Float32Array; sampleRate: number }
    | { type: 'ANALYZE_KEY'; buffer: Float32Array; sampleRate: number };

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const { type } = e.data;

    try {
        if (type === 'ANALYZE_BPM') {
            const { buffer, sampleRate } = e.data as any;

            // Reconstruct AudioBuffer is not possible, using pure JS 'music-tempo'
            // To save CPU and memory, we process a downsampled version if needed or just process directly.
            // music-tempo works best on mono Float32Array

            // Offload analysis to music-tempo
            const mt = new MusicTempo(buffer);

            self.postMessage({
                type: 'BPM_RESULT',
                bpm: Math.round(mt.tempo),
                offset: mt.beats.length > 0 ? mt.beats[0] : 0,
                beats: mt.beats
            });
        }
    } catch (error) {
        self.postMessage({ type: 'ERROR', error: String(error) });
    }
};
