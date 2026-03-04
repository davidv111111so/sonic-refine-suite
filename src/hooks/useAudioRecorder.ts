import { useState, useCallback, useRef, useEffect } from 'react';
import * as Tone from 'tone';

const MAX_DURATION_SECONDS = 7200; // 2 hours

/**
 * Encode an AudioBuffer as a WAV Blob (PCM 16-bit, stereo).
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataLength = buffer.length * numChannels * (bitsPerSample / 8);
    const headerLength = 44;
    const totalLength = headerLength + dataLength;

    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);

    // WAV Header
    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (PCM)
    view.setUint16(20, 1, true);  // AudioFormat (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Interleave channels and write PCM samples
    const channels: Float32Array[] = [];
    for (let ch = 0; ch < numChannels; ch++) {
        channels.push(buffer.getChannelData(ch));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
            const sample = Math.max(-1, Math.min(1, channels[ch][i]));
            const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset, int16, true);
            offset += 2;
        }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export const useAudioRecorder = (limiterNode: Tone.Limiter | null) => {
    const [recorder, setRecorder] = useState<Tone.Recorder | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isConverting, setIsConverting] = useState(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);

    // Initialize recorder when limiter node is available
    const initRecorder = useCallback(() => {
        if (!limiterNode || recorder) return;
        const newRecorder = new Tone.Recorder();
        limiterNode.connect(newRecorder);
        setRecorder(newRecorder);
    }, [limiterNode, recorder]);

    // Auto-stop when 2 hours is reached
    useEffect(() => {
        if (isRecording && elapsedSeconds >= MAX_DURATION_SECONDS) {
            console.log("[useAudioRecorder] 2-hour limit reached, auto-stopping...");
            stopRecording();
        }
    }, [elapsedSeconds, isRecording]);

    const startRecording = useCallback(() => {
        if (!recorder) return;
        recorder.start();
        setIsRecording(true);
        setElapsedSeconds(0);
        startTimeRef.current = Date.now();

        // Start elapsed timer
        timerRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setElapsedSeconds(elapsed);
        }, 500);

        console.log("[useAudioRecorder] Started Master Recording");
    }, [recorder]);

    const stopRecording = useCallback(async () => {
        if (!recorder || !isRecording) return;
        console.log("[useAudioRecorder] Stopping Master Recording...");

        // immediately update state so UI switches to Converted state instead of unmounting
        setIsRecording(false);
        setIsConverting(true);

        // Clear timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        try {
            const webmBlob = await recorder.stop();

            let finalBlob = webmBlob;
            let ext = 'webm';

            try {
                // Convert WebM → WAV
                console.log("[useAudioRecorder] Converting to WAV...");
                const arrayBuffer = await webmBlob.arrayBuffer();
                const audioCtx = Tone.getContext().rawContext as AudioContext;

                // Note: decodeAudioData doesn't strictly need a fresh context. 
                // We use Tone's existing, unlocked context to decode safely.
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                finalBlob = audioBufferToWav(audioBuffer);
                ext = 'wav';
            } catch (decodeErr) {
                console.warn("[useAudioRecorder] WAV conversion failed, falling back to original WEBM format.", decodeErr);
            }

            // Trigger download
            const url = URL.createObjectURL(finalBlob);
            const anchor = document.createElement('a');
            anchor.download = `sonic-refine-mix-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${ext}`;
            anchor.href = url;
            document.body.appendChild(anchor); // ensure it's in DOM for some browsers
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);

            setIsConverting(false);
            console.log(`[useAudioRecorder] ${ext.toUpperCase()} download triggered`);
        } catch (err) {
            console.error("[useAudioRecorder] Error stopping recording:", err);
            setIsConverting(false);
        }
    }, [recorder, isRecording]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return {
        recorder,
        initRecorder,
        isRecording,
        isConverting,
        startRecording,
        stopRecording,
        elapsedSeconds,
        maxDuration: MAX_DURATION_SECONDS
    };
};
