// src/utils/audioCache.ts

const DB_NAME = 'level-audio-cache';
const DB_VERSION = 1;
const STORE_NAME = 'waveform-peaks';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error("IndexedDB error:", request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });

    return dbPromise;
}

export async function getCachedPeaks(bufferKey: string): Promise<Float32Array | null> {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(bufferKey);

            request.onsuccess = () => {
                resolve(request.result as Float32Array || null);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    } catch (e) {
        console.warn("Failed to get cached peaks:", e);
        return null; // Graceful degradation
    }
}

export async function setCachedPeaks(bufferKey: string, peaks: Float32Array): Promise<void> {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(peaks, bufferKey);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    } catch (e) {
        console.warn("Failed to cache peaks:", e);
    }
}

export function generateBufferKey(buffer: AudioBuffer): string {
    // Generate a reasonably unique key based on audio characteristics
    return `peaks_${buffer.length}_${buffer.sampleRate}_${Math.floor(buffer.duration * 1000)}`;
}
