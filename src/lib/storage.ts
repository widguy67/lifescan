import type { IdentificationResult, ScanRecord } from "./types";

const KEY = "lifescan.history.v1";

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
  window.dispatchEvent(new Event("lifescan:update"));
}

export function getHistory(): ScanRecord[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getRecord(id: string): ScanRecord | undefined {
  return read().find((r) => r.id === id);
}

export function addScan(result: IdentificationResult, image: string): ScanRecord {
  const record: ScanRecord = {
    ...result,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    image,
    favorite: false,
  };
  const records = read();
  records.unshift(record);
  write(records.slice(0, 200));
  return record;
}

export function toggleFavorite(id: string): boolean {
  const records = read();
  const rec = records.find((r) => r.id === id);
  if (!rec) return false;
  rec.favorite = !rec.favorite;
  write(records);
  return rec.favorite;
}

export function deleteRecord(id: string) {
  write(read().filter((r) => r.id !== id));
}

export function clearHistory() {
  write([]);
}
