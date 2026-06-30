import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "./use-auth";
import {
  addLocalRecord,
  buildRecord,
  clearLocalHistory,
  deleteLocalRecord,
  getLocalHistory,
  toggleLocalFavorite,
} from "@/lib/storage";
import {
  bulkSaveCloudScans,
  clearCloudScans,
  deleteCloudScan,
  listCloudScans,
  saveCloudScan,
  setCloudScanFavorite,
} from "@/lib/scans.functions";
import type { IdentificationResult, ScanRecord } from "@/lib/types";

interface ScansContextValue {
  records: ScanRecord[];
  loading: boolean;
  /** True when the history is being synced to the cloud for this account. */
  cloud: boolean;
  addScan: (result: IdentificationResult, image: string) => Promise<ScanRecord>;
  getRecord: (id: string) => ScanRecord | undefined;
  toggleFavorite: (id: string) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const ScansContext = createContext<ScansContextValue | undefined>(undefined);

export function ScansProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const cloud = !!user;

  const fetchCloud = useServerFn(listCloudScans);
  const saveCloud = useServerFn(saveCloudScan);
  const bulkSave = useServerFn(bulkSaveCloudScans);
  const setFavCloud = useServerFn(setCloudScanFavorite);
  const deleteCloud = useServerFn(deleteCloudScan);
  const clearCloud = useServerFn(clearCloudScans);

  const migratedFor = useRef<string | null>(null);

  // Keep local history reflected for signed-out users.
  useEffect(() => {
    if (cloud || authLoading) return;
    setRecords(getLocalHistory());
    setLoading(false);
    const refresh = () => setRecords(getLocalHistory());
    window.addEventListener("scany:update", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("scany:update", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [cloud, authLoading]);

  // Load (and migrate) cloud history when signed in.
  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        // One-time migration of this device's local scans into the cloud.
        if (migratedFor.current !== user.id) {
          const local = getLocalHistory();
          if (local.length > 0) {
            try {
              await bulkSave({ data: { records: local } });
              clearLocalHistory();
            } catch {
              /* migration is best-effort */
            }
          }
          migratedFor.current = user.id;
        }
        const cloudRecords = await fetchCloud();
        if (active) setRecords(cloudRecords);
      } catch {
        if (active) toast.error("Could not load your cloud history.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, fetchCloud, bulkSave]);

  const addScan = useCallback(
    async (result: IdentificationResult, image: string) => {
      const record = buildRecord(result, image);
      setRecords((prev) => [record, ...prev]);
      if (cloud) {
        try {
          await saveCloud({ data: { record } });
        } catch {
          toast.error("Saved on this device — cloud sync failed.");
        }
      } else {
        addLocalRecord(record);
      }
      return record;
    },
    [cloud, saveCloud],
  );

  const getRecord = useCallback((id: string) => records.find((r) => r.id === id), [records]);

  const toggleFavorite = useCallback(
    async (id: string) => {
      let next = false;
      setRecords((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          next = !r.favorite;
          return { ...r, favorite: next };
        }),
      );
      if (cloud) {
        try {
          await setFavCloud({ data: { id, favorite: next } });
        } catch {
          toast.error("Could not sync favorite.");
        }
      } else {
        toggleLocalFavorite(id);
      }
    },
    [cloud, setFavCloud],
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (cloud) {
        try {
          await deleteCloud({ data: { id } });
        } catch {
          toast.error("Could not delete from cloud.");
        }
      } else {
        deleteLocalRecord(id);
      }
    },
    [cloud, deleteCloud],
  );

  const clearHistory = useCallback(async () => {
    setRecords([]);
    if (cloud) {
      try {
        await clearCloud();
      } catch {
        toast.error("Could not clear cloud history.");
      }
    } else {
      clearLocalHistory();
    }
  }, [cloud, clearCloud]);

  return (
    <ScansContext.Provider
      value={{ records, loading, cloud, addScan, getRecord, toggleFavorite, deleteRecord, clearHistory }}
    >
      {children}
    </ScansContext.Provider>
  );
}

export function useScans(): ScansContextValue {
  const ctx = useContext(ScansContext);
  if (!ctx) throw new Error("useScans must be used within a ScansProvider");
  return ctx;
}
