// Web Worker for Audio Decoding
/// <reference lib="webworker" />

self.onmessage = async (e: MessageEvent) => {
    const { file, fileId } = e.data;

    try {
        let arrayBuffer;
        if (file instanceof File) {
            arrayBuffer = await file.arrayBuffer();
        } else if (typeof file === 'string') {
            const response = await fetch(file);
            arrayBuffer = await response.arrayBuffer();
        } else {
            throw new Error("Invalid file format");
        }

        // We cannot decodeAudioData in a worker in all browsers reliably without resizing
        // and usually it requires sending back to main thread or using a WASM decoder.
        // However, we can just return the ArrayBuffer for main thread decoding if we are just fetching.
        // Or if we want to do heavy lifting like peak detection (waveform).

        // For now, let's just return the buffer to main thread for decoding until we have a WASM decoder.
        // This worker is mainly a placeholder for offloading fetch/file read.

        self.postMessage({ type: 'SUCCESS', fileId, buffer: arrayBuffer }, [arrayBuffer]);

    } catch (error) {
        self.postMessage({ type: 'ERROR', fileId, error: (error as Error).message });
    }
};

export { };
