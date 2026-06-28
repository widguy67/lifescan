import { Link } from "@tanstack/react-router";
import { Heart, Trash2 } from "lucide-react";
import type { ScanRecord } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ScanCard({
  record,
  onToggleFavorite,
  onDelete,
}: {
  record: ScanRecord;
  onToggleFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-elegant">
      <Link to="/scan/$id" params={{ id: record.id }} className="block">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={record.image}
            alt={record.commonName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
          <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur">
            {CATEGORY_LABELS[record.category]}
          </span>
          <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            {record.confidence}%
          </span>
          <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
            <p className="truncate text-sm font-semibold">{record.commonName}</p>
            {record.scientificName && <p className="truncate text-[11px] italic text-white/75">{record.scientificName}</p>}
          </div>
        </div>
      </Link>

      <div className="absolute right-2 bottom-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(record.id)}
            aria-label="Toggle favorite"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground backdrop-blur transition-colors hover:bg-background"
          >
            <Heart className={cn("h-4 w-4", record.favorite && "fill-destructive text-destructive")} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(record.id)}
            aria-label="Delete scan"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-destructive backdrop-blur transition-colors hover:bg-background"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
