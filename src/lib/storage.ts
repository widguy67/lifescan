import type { IdentificationResult, ScanRecord } from "./types";

const KEY = "scany.history.v1";

function read(): ScanRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ScanRecord[]) : [];
  } catch {
    return [];
  }
}

function write(records: ScanRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    // storage full — drop oldest records and retry
    try {
      localStorage.setItem(KEY, JSON.stringify(records.slice(0, 30)));
    } catch {
      /* ignore */
    }
  }
  window.dispatchEvent(new Event("scany:update"));
}

export function getLocalHistory(): ScanRecord[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getLocalRecord(id: string): ScanRecord | undefined {
  return read().find((r) => r.id === id);
}

/** Build a fresh scan record from an identification result. */
export function buildRecord(result: IdentificationResult, image: string): ScanRecord {
  return {
    ...result,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    image,
    favorite: false,
  };
}

export function addLocalRecord(record: ScanRecord) {
  const records = read();
  records.unshift(record);
  write(records.slice(0, 200));
}

export function toggleLocalFavorite(id: string): boolean {
  const records = read();
  const rec = records.find((r) => r.id === id);
  if (!rec) return false;
  rec.favorite = !rec.favorite;
  write(records);
  return rec.favorite;
}

export function deleteLocalRecord(id: string) {
  write(read().filter((r) => r.id !== id));
}

export function clearLocalHistory() {
  write([]);
}
