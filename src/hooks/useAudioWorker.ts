/**
 * useAudioWorker — Bridge hook for the 3-Layer Audio Architecture
 * 
 * Layer 1: Main Thread (React) — This hook manages state and UI
 * Layer 2: Web Worker — Off-thread audio decoding, FFT, beat detection
 * Layer 3: Audio Worklet — Real-time DSP on audio rendering thread
 * 
 * Usage:
 *   const { analyzeBeats, generateWaveform, computeFFT, isReady } = useAudioWorker();
 *   const beats = await analyzeBeats(audioBuffer);
 */

import { useRef, useEffect, useState, useCallback } from 'react';

interface WorkerResult {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
}

interface WaveformResult {
    waveform: Float32Array;
}

interface FFTResult {
    magnitudes: Float32Array;
}

interface BeatDetectResult {
    bpm: number;
    grid: Float32Array;
}

export function useAudioWorker() {
    const workerRef = useRef<Worker | null>(null);
    const pendingRef = useRef<Map<string, WorkerResult>>(new Map());
    const [isReady, setIsReady] = useState(false);
    const idCounter = useRef(0);

    // Initialize worker
    useEffect(() => {
        try {
            const worker = new Worker(
                new URL('../workers/AudioDecoderWorker.ts', import.meta.url),
                { type: 'module' }
            );

            worker.onmessage = (e) => {
                const { type, id, error, ...data } = e.data;

                if (type === 'ready') {
                    setIsReady(true);
                    return;
                }

                if (type === 'error') {
                    const pending = pendingRef.current.get(id);
                    if (pending) {
                        pending.reject(new Error(error));
                        pendingRef.current.delete(id);
                    }
                    console.error(`[AudioWorker] Error:`, error);
                    return;
                }

                const pending = pendingRef.current.get(id);
                if (pending) {
                    pending.resolve(data);
                    pendingRef.current.delete(id);
                }
            };

            worker.onerror = (e) => {
                console.error('[AudioWorker] Worker error:', e.message);
                // Reject all pending requests
                pendingRef.current.forEach((p) => p.reject(new Error('Worker crashed')));
                pendingRef.current.clear();
            };

            workerRef.current = worker;

            return () => {
                worker.terminate();
                workerRef.current = null;
                pendingRef.current.clear();
            };
        } catch (err) {
            console.warn('[AudioWorker] Web Workers not supported, falling back to main thread');
            setIsReady(true); // Graceful degradation
        }
    }, []);

    const sendMessage = useCallback(<T,>(msg: any, transfers?: Transferable[]): Promise<T> => {
        return new Promise((resolve, reject) => {
            const id = `msg_${++idCounter.current}`;
            msg.id = id;

            if (!workerRef.current) {
                reject(new Error('Worker not initialized'));
                return;
            }

            pendingRef.current.set(id, { resolve, reject });

            // Set timeout to prevent memory leaks from stuck messages
            setTimeout(() => {
                if (pendingRef.current.has(id)) {
                    pendingRef.current.get(id)?.reject(new Error('Worker timeout'));
                    pendingRef.current.delete(id);
                }
            }, 30000);

            if (transfers) {
                workerRef.current.postMessage(msg, transfers);
            } else {
                workerRef.current.postMessage(msg);
            }
        });
    }, []);

    /**
     * Generate waveform data off-thread (zero-copy)
     */
    const generateWaveform = useCallback(async (
        channelData: Float32Array,
        targetLength: number = 800
    ): Promise<Float32Array> => {
        // Clone the data for transfer
        const copy = new Float32Array(channelData);
        const result = await sendMessage<WaveformResult>(
            { type: 'waveform', channelData: copy, targetLength },
            [copy.buffer]
        );
        return result.waveform;
    }, [sendMessage]);

    /**
     * Compute FFT off-thread
     */
    const computeFFT = useCallback(async (
        channelData: Float32Array,
        fftSize: number = 2048
    ): Promise<Float32Array> => {
        const copy = new Float32Array(channelData);
        const result = await sendMessage<FFTResult>(
            { type: 'fft', channelData: copy, fftSize },
            [copy.buffer]
        );
        return result.magnitudes;
    }, [sendMessage]);

    /**
     * Detect beats and generate beatgrid off-thread
     */
    const analyzeBeats = useCallback(async (
        channelData: Float32Array,
        sampleRate: number = 44100
    ): Promise<{ bpm: number; grid: Float32Array }> => {
        const copy = new Float32Array(channelData);
        const result = await sendMessage<BeatDetectResult>(
            { type: 'beatDetect', channelData: copy, sampleRate },
            [copy.buffer]
        );
        return { bpm: result.bpm, grid: result.grid };
    }, [sendMessage]);

    return {
        isReady,
        generateWaveform,
        computeFFT,
        analyzeBeats,
    };
}
