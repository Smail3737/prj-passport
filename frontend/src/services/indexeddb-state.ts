import type { PersistedPassportState } from '../types';

const DB_NAME = 'project-passport-react-db';
const DB_VERSION = 1;
const STORE_NAME = 'kv';
const PASSPORT_STATE_KEY = 'passport-state';

interface StoredValue {
  key: string;
  value: unknown;
}

function isIndexedDbAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB database'));
    };
  });
}

function readStoreValue(database: IDBDatabase, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result as StoredValue | undefined;
      resolve(result?.value);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to read from IndexedDB'));
    };
  });
}

function writeStoreValue(database: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ key, value } as StoredValue);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to write to IndexedDB'));
    };
  });
}

function normalizePersistedState(raw: unknown): PersistedPassportState | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as PersistedPassportState;
  const projects = Array.isArray(record.projects) ? record.projects : [];
  const selectedProjectId = typeof record.selectedProjectId === 'string' ? record.selectedProjectId : null;

  return {
    projects,
    selectedProjectId,
  };
}

export async function loadPersistedStateFromIndexedDb(): Promise<PersistedPassportState | null> {
  if (!isIndexedDbAvailable()) {
    return null;
  }

  let database: IDBDatabase | null = null;
  try {
    database = await openDatabase();
    const value = await readStoreValue(database, PASSPORT_STATE_KEY);
    return normalizePersistedState(value);
  } catch {
    return null;
  } finally {
    database?.close();
  }
}

export async function savePersistedStateToIndexedDb(payload: PersistedPassportState): Promise<void> {
  if (!isIndexedDbAvailable()) {
    return;
  }

  let database: IDBDatabase | null = null;
  try {
    database = await openDatabase();
    await writeStoreValue(database, PASSPORT_STATE_KEY, payload);
  } finally {
    database?.close();
  }
}
