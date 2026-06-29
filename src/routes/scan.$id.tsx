import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Camera } from "lucide-react";
import { ScanResult } from "@/components/scan-result";
import { getRecord, toggleFavorite } from "@/lib/storage";
import type { ScanRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/scan/$id")({
  head: () => ({
    meta: [
      { title: "Identification Result — Lifescan" },
      { name: "description", content: "Detailed AI identification result with confidence score, expert facts and similar species." },
    ],
  }),
  component: ScanDetail,
});

function ScanDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<ScanRecord | null | undefined>(undefined);

  useEffect(() => {
    setRecord(getRecord(id) ?? null);
  }, [id]);

  if (record === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (record === null) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border py-20 text-center">
        <p className="font-display text-lg font-semibold">Result not found</p>
        <p className="max-w-xs text-sm text-muted-foreground">This scan may have been removed from this device.</p>
        <Button asChild variant="hero">
          <Link to="/">
            <Camera className="h-4 w-4" />
            New scan
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/" })}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <Button asChild variant="hero" size="sm">
          <Link to="/">
            <Camera className="h-4 w-4" />
            New scan
          </Link>
        </Button>
      </div>

      <ScanResult
        record={record}
        onToggleFavorite={() => {
          toggleFavorite(record.id);
          setRecord(getRecord(record.id) ?? null);
        }}
      />
    </div>
  );
}
