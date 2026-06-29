import { useState } from "react";
import { toast } from "sonner";
import { Heart, Share2, Sparkles, GitCompareArrows } from "lucide-react";
import type { ScanRecord } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { ConfidenceRing } from "./confidence-ring";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const toneClasses: Record<string, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  danger: "bg-destructive/15 text-destructive",
};

export function ScanResult({
  record,
  onToggleFavorite,
}: {
  record: ScanRecord;
  onToggleFavorite?: () => void;
}) {
  const [fav, setFav] = useState(record.favorite);

  const handleShare = async () => {
    const text = `${record.commonName}${record.scientificName ? ` (${record.scientificName})` : ""} — identified with Lifescan at ${record.confidence}% confidence.\n\n${record.summary}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Lifescan — ${record.commonName}`, text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Result copied to clipboard");
      }
    } catch {
      /* user cancelled */
    }
  };

  const handleFav = () => {
    setFav((f) => !f);
    onToggleFavorite?.();
  };

  return (
    <div className="space-y-6 animate-float-up">
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
        <div className="relative">
          <img
            src={record.image}
            alt={`${record.commonName} — identified by Lifescan`}
            className="h-64 w-full object-cover sm:h-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute left-4 top-4">
            <span className="rounded-full bg-background/85 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground backdrop-blur">
              {CATEGORY_LABELS[record.category]}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-5">
            <div className="min-w-0 text-white">
              <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">{record.commonName}</h1>
              {record.scientificName && <p className="truncate text-sm italic text-white/80">{record.scientificName}</p>}
            </div>
            <div className="shrink-0 rounded-2xl bg-background/85 p-1.5 backdrop-blur">
              <ConfidenceRing value={record.confidence} size={76} stroke={7} />
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {record.badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {record.badges.map((b, i) => (
                <span
                  key={i}
                  className={cn("rounded-full px-3 py-1 text-xs font-semibold", toneClasses[b.tone] ?? toneClasses.neutral)}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}

          <p className="text-sm leading-relaxed text-muted-foreground">{record.summary}</p>

          <div className="flex flex-wrap gap-2">
            <Button variant={fav ? "default" : "outline"} size="sm" onClick={handleFav}>
              <Heart className={cn("h-4 w-4", fav && "fill-current")} />
              {fav ? "Saved" : "Save"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {record.sections.map((section, i) => (
          <section key={i} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 font-display text-base font-bold">{section.title}</h2>
            <dl className="space-y-2.5">
              {section.items.map((item, j) => (
                <div key={j} className="flex flex-col gap-0.5 border-b border-border/60 pb-2.5 last:border-0 last:pb-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</dt>
                  <dd className="text-sm text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      {record.similar.length > 0 && (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold">
            <GitCompareArrows className="h-4 w-4 text-primary" />
            Compare similar species
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {record.similar.map((s, i) => (
              <div key={i} className="rounded-2xl border border-border bg-gradient-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{s.commonName}</p>
                  <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                    {s.confidence}%
                  </span>
                </div>
                {s.scientificName && <p className="text-xs italic text-muted-foreground">{s.scientificName}</p>}
                <p className="mt-2 text-sm text-muted-foreground">{s.distinction}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {record.funFact && (
        <section className="rounded-3xl border border-primary/30 bg-primary/5 p-5">
          <h2 className="mb-1.5 flex items-center gap-2 font-display text-base font-bold text-primary">
            <Sparkles className="h-4 w-4" />
            Did you know?
          </h2>
          <p className="text-sm leading-relaxed text-foreground/90">{record.funFact}</p>
        </section>
      )}
    </div>
  );
}
