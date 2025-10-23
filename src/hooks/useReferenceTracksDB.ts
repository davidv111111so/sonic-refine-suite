import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ReferenceTrack {
  genre: string;
  data: ArrayBuffer;
  filename: string;
  size: number;
  uploadedAt: number;
}

interface ReferenceDB extends DBSchema {
  references: {
    key: string;
    value: ReferenceTrack;
  };
}

const DB_NAME = 'spectrum-references';
const STORE_NAME = 'references';
const DB_VERSION = 1;

export const useReferenceTracksDB = () => {
  const initDB = async (): Promise<IDBPDatabase<ReferenceDB>> => {
    return openDB<ReferenceDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  };

  const saveReference = async (genre: string, file: File) => {
    const db = await initDB();
    const arrayBuffer = await file.arrayBuffer();
    
    const track: ReferenceTrack = {
      genre,
      data: arrayBuffer,
      filename: file.name,
      size: file.size,
      uploadedAt: Date.now(),
    };

    await db.put(STORE_NAME, track, genre);
    console.log(`✅ Reference saved for genre: ${genre}`);
    return track;
  };

  const getReference = async (genre: string): Promise<ReferenceTrack | undefined> => {
    const db = await initDB();
    return await db.get(STORE_NAME, genre);
  };

  const deleteReference = async (genre: string) => {
    const db = await initDB();
    await db.delete(STORE_NAME, genre);
  };

  const getAllReferences = async (): Promise<Record<string, ReferenceTrack>> => {
    const db = await initDB();
    const keys = await db.getAllKeys(STORE_NAME);
    const values = await db.getAll(STORE_NAME);
    
    const result: Record<string, ReferenceTrack> = {};
    keys.forEach((key, index) => {
      result[key] = values[index];
    });
    
    return result;
  };

  return {
    saveReference,
    getReference,
    deleteReference,
    getAllReferences,
  };
};
