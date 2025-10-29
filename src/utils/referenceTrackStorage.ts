/**
 * IndexedDB utility for storing and retrieving reference tracks by genre
 */

const DB_NAME = 'LevelAudioDB';
const STORE_NAME = 'referenceTracks';
const DB_VERSION = 1;

export interface ReferenceTrack {
  genre: string;
  file: File;
  uploadedAt: number;
  name: string;
  size: number;
}

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'genre' });
      }
    };
  });
}

/**
 * Save a reference track for a specific genre
 */
export async function saveReferenceTrack(genre: string, file: File): Promise<void> {
  const db = await openDB();
  
  const track: ReferenceTrack = {
    genre,
    file,
    uploadedAt: Date.now(),
    name: file.name,
    size: file.size,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(track);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get a reference track for a specific genre
 */
export async function getReferenceTrack(genre: string): Promise<ReferenceTrack | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(genre);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get all reference tracks
 */
export async function getAllReferenceTracks(): Promise<ReferenceTrack[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Delete a reference track for a specific genre
 */
export async function deleteReferenceTrack(genre: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(genre);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Check if a reference track exists for a genre
 */
export async function hasReferenceTrack(genre: string): Promise<boolean> {
  const track = await getReferenceTrack(genre);
  return track !== null;
}
