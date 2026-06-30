import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { IdentificationResult, ScanCategory, ScanRecord } from "./types";

interface ScanRow {
  id: string;
  created_at: string;
  favorite: boolean;
  category: string;
  common_name: string;
  scientific_name: string;
  confidence: number;
  image: string | null;
  payload: IdentificationResult;
}

function rowToRecord(row: ScanRow): ScanRecord {
  return {
    ...row.payload,
    category: row.category as ScanCategory,
    commonName: row.common_name,
    scientificName: row.scientific_name,
    confidence: row.confidence,
    id: row.id,
    createdAt: new Date(row.created_at).getTime(),
    image: row.image ?? "",
    favorite: row.favorite,
  };
}

/** List the signed-in user's scans, newest first. */
export const listCloudScans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ScanRecord[]> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as ScanRow[]).map(rowToRecord);
  });

/** Insert (or upsert) one scan for the signed-in user. */
export const saveCloudScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { record: ScanRecord }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const r = data.record;
    const payload: IdentificationResult = {
      category: r.category,
      commonName: r.commonName,
      scientificName: r.scientificName,
      confidence: r.confidence,
      summary: r.summary,
      badges: r.badges,
      sections: r.sections,
      similar: r.similar,
      funFact: r.funFact,
    };
    const { error } = await supabase.from("scans").upsert({
      id: r.id,
      user_id: userId,
      created_at: new Date(r.createdAt).toISOString(),
      favorite: r.favorite,
      category: r.category,
      common_name: r.commonName,
      scientific_name: r.scientificName ?? "",
      confidence: Math.round(r.confidence) || 0,
      image: r.image || null,
      payload,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Upload many scans at once (used when migrating local history to the cloud). */
export const bulkSaveCloudScans = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { records: ScanRecord[] }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.records.length === 0) return { ok: true };
    const rows = data.records.map((r) => ({
      id: r.id,
      user_id: userId,
      created_at: new Date(r.createdAt).toISOString(),
      favorite: r.favorite,
      category: r.category,
      common_name: r.commonName,
      scientific_name: r.scientificName ?? "",
      confidence: Math.round(r.confidence) || 0,
      image: r.image || null,
      payload: {
        category: r.category,
        commonName: r.commonName,
        scientificName: r.scientificName,
        confidence: r.confidence,
        summary: r.summary,
        badges: r.badges,
        sections: r.sections,
        similar: r.similar,
        funFact: r.funFact,
      } satisfies IdentificationResult,
    }));
    const { error } = await supabase.from("scans").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setCloudScanFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; favorite: boolean }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("scans")
      .update({ favorite: data.favorite })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCloudScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("scans").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearCloudScans = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("scans")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
