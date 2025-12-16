import { LibraryTrack } from '@/contexts/LibraryContext';

const DB_NAME = 'SonicRefineDB';
const STORE_NAME = 'library_tracks';
const DB_VERSION = 1;

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

export const saveTrackToDB = async (track: LibraryTrack) => {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        // We need to ensure we don't store the ephemeral URL, but regenerate it on load.
        // Cloning the object to avoid mutating the state
        const trackToStore = { ...track, url: '' };
        const request = store.put(trackToStore);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const saveAllTracksToDB = async (tracks: LibraryTrack[]) => {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // Clear existing? Or just add/update? 
        // If we want to sync state exactly (deletions too), we should probably clear first or handle diffs.
        // For simplicity: clear and write all.
        store.clear();

        tracks.forEach(track => {
            const trackToStore = { ...track, url: '' };
            store.put(trackToStore);
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const loadTracksFromDB = async (): Promise<LibraryTrack[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const tracks = request.result as LibraryTrack[];
            // Regenerate URLs
            const hydratedTracks = tracks.map(track => ({
                ...track,
                url: URL.createObjectURL(track.file)
            }));
            resolve(hydratedTracks);
        };
        request.onerror = () => reject(request.error);
    });
};
