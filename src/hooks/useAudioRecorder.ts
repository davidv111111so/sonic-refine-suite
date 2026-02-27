import { useState, useCallback } from 'react';
import * as Tone from 'tone';

export const useAudioRecorder = (limiterNode: Tone.Limiter | null) => {
    const [recorder, setRecorder] = useState<Tone.Recorder | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    // Initialize recorder when node is available
    const initRecorder = useCallback(() => {
        if (!limiterNode || recorder) return;
        const newRecorder = new Tone.Recorder();
        limiterNode.connect(newRecorder);
        setRecorder(newRecorder);
    }, [limiterNode, recorder]);

    const startRecording = useCallback(() => {
        if (!recorder) return;
        recorder.start();
        setIsRecording(true);
        console.log("[useAudioRecorder] Started Master Recording");
    }, [recorder]);

    const stopRecording = useCallback(async () => {
        if (!recorder || !isRecording) return;
        console.log("[useAudioRecorder] Stopping Master Recording...");
        try {
            const recording = await recorder.stop();
            setIsRecording(false);

            // Create a download link for the recording
            const url = URL.createObjectURL(recording);
            const anchor = document.createElement('a');
            anchor.download = `sonic-refine-mix-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
            anchor.href = url;
            anchor.click();
            console.log("[useAudioRecorder] Download triggered");
        } catch (err) {
            console.error("[useAudioRecorder] Error stopping recording:", err);
            setIsRecording(false);
        }
    }, [recorder, isRecording]);

    return {
        recorder,
        initRecorder,
        isRecording,
        startRecording,
        stopRecording
    };
};
