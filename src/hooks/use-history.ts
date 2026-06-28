import { useCallback, useEffect, useState } from "react";
import { getHistory } from "@/lib/storage";
import type { ScanRecord } from "@/lib/types";

export function useHistory(): ScanRecord[] {
  const [records, setRecords] = useState<ScanRecord[]>([]);

  const refresh = useCallback(() => setRecords(getHistory()), []);

  useEffect(() => {
    refresh();
    window.addEventListener("lifescan:update", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("lifescan:update", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return records;
}
