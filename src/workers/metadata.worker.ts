/// <reference lib="webworker" />
import { parseBlob, selectCover } from 'music-metadata';

self.onmessage = async (e: MessageEvent) => {
    const { id, file } = e.data;

    try {
        const metadata = await parseBlob(file);

        // Extract useful info
        const title = metadata.common.title || file.name.replace(/\.[^/.]+$/, "");
        const artist = metadata.common.artist || "Unknown Artist";
        let bpm = metadata.common.bpm || 0;
        let key = metadata.common.key || "?";
        const duration = metadata.format.duration || 0;

        // Camelot Conversion
        const convertToCamelot = (k: string): string => {
            if (!k || k === "?") return "?";
            const clean = k.trim().toLowerCase().replace(/\s+/g, ' ');
            const map: { [key: string]: string } = {
                // Major (B)
                'b': '1B', 'b maj': '1B', 'b major': '1B',
                'f#': '2B', 'gb': '2B', 'f# maj': '2B', 'gb maj': '2B', 'f# major': '2B', 'gb major': '2B',
                'db': '3B', 'c#': '3B', 'db maj': '3B', 'c# maj': '3B', 'db major': '3B', 'c# major': '3B',
                'ab': '4B', 'g#': '4B', 'ab maj': '4B', 'g# maj': '4B', 'ab major': '4B', 'g# major': '4B',
                'eb': '5B', 'd#': '5B', 'eb maj': '5B', 'd# maj': '5B', 'eb major': '5B', 'd# major': '5B',
                'bb': '6B', 'a#': '6B', 'bb maj': '6B', 'a# maj': '6B', 'bb major': '6B', 'a# major': '6B',
                'f': '7B', 'f maj': '7B', 'f major': '7B',
                'c': '8B', 'c maj': '8B', 'c major': '8B',
                'g': '9B', 'g maj': '9B', 'g major': '9B',
                'd': '10B', 'd maj': '10B', 'd major': '10B',
                'a': '11B', 'a maj': '11B', 'a major': '11B',
                'e': '12B', 'e maj': '12B', 'e major': '12B',
                // Minor (A)
                'abm': '1A', 'g#m': '1A', 'ab minor': '1A', 'g# minor': '1A',
                'ebm': '2A', 'd#m': '2A', 'eb minor': '2A', 'd# minor': '2A',
                'bbm': '3A', 'a#m': '3A', 'bb minor': '3A', 'a# minor': '3A',
                'fm': '4A', 'f minor': '4A',
                'cm': '5A', 'c minor': '5A',
                'gm': '6A', 'g minor': '6A',
                'dm': '7A', 'd minor': '7A',
                'am': '8A', 'a minor': '8A',
                'em': '9A', 'e minor': '9A',
                'bm': '10A', 'b minor': '10A',
                'f#m': '11A', 'gbm': '11A', 'f# minor': '11A', 'gb minor': '11A',
                'dbm': '12A', 'c#m': '12A', 'db minor': '12A', 'c# minor': '12A'
            };
            return map[clean] || k;
        };
        const camelotKey = convertToCamelot(key);

        // Format time
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        const time = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        self.postMessage({
            type: 'success',
            payload: {
                id,
                title,
                artist,
                bpm: Math.round(bpm * 100) / 100, // Keep 2 decimals
                key: camelotKey,
                time,
                duration,
                // We avoid sending the Blob back, just metadata
            }
        });

    } catch (error) {
        console.error("Metadata parse error:", error);
        // Fallback to basic file info
        self.postMessage({
            type: 'error',
            payload: {
                id,
                title: file.name,
                error: (error as Error).message
            }
        });
    }
};
