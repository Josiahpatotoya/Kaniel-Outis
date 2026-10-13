const DB_NAME = 'civiTimer';
const STORE_NAME = 'files';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSoundBlob(file: Blob, name: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ name, blob: file }, 'alarm');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    req.onerror = () => reject(req.error);
  });
}

export async function loadSoundBlob(): Promise<{ name: string; blob: Blob } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('alarm');
      tx.oncomplete = () => resolve(req.result || null);
      tx.onerror = () => reject(tx.error);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function removeSoundBlob(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete('alarm');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}
