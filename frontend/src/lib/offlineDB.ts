// IndexedDB wrapper for offline pending bookings — no external deps

const DB_NAME    = "ee_offline";
const DB_VERSION = 1;
const STORE      = "pending_bookings";

export type PendingBooking = {
  id:          string;                       // temp offline id
  method?:     string;                       // "POST" | "PATCH" | "DELETE" — defaults to "POST"
  endpoint:    string;                       // e.g. "/api/vendor/bookings"
  accessToken: string;
  payload:     Record<string, unknown>;
  createdAt:   number;
  retries:     number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function addPending(
  data: Omit<PendingBooking, "id" | "retries">,
): Promise<string> {
  const db = await openDB();
  const id = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).add({ ...data, id, retries: 0 });
    req.onsuccess = () => resolve(id);
    req.onerror   = () => reject(req.error);
  });
}

export async function getAllPending(): Promise<PendingBooking[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as PendingBooking[]);
    req.onerror   = () => reject(req.error);
  });
}

export async function deletePending(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

export async function getPendingCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result as number);
    req.onerror   = () => reject(req.error);
  });
}

export async function incrementRetries(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx      = db.transaction(STORE, "readwrite");
    const store   = tx.objectStore(STORE);
    const getReq  = store.get(id);
    getReq.onsuccess = () => {
      const item = getReq.result as PendingBooking | undefined;
      if (!item) { resolve(); return; }
      const putReq = store.put({ ...item, retries: item.retries + 1 });
      putReq.onsuccess = () => resolve();
      putReq.onerror   = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}
