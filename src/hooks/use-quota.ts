import { useCallback, useEffect, useState } from "react";
import { getQuota, type QuotaState } from "@/lib/quota";

export function useQuota(): QuotaState {
  const [state, setState] = useState<QuotaState>(() => getQuota());

  const refresh = useCallback(() => setState(getQuota()), []);

  useEffect(() => {
    refresh();
    window.addEventListener("lifescan:quota", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("lifescan:quota", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  return state;
}
