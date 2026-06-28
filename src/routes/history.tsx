import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, History as HistoryIcon, Trash2 } from "lucide-react";
import { ScanCard } from "@/components/scan-card";
import { useHistory } from "@/hooks/use-history";
import { toggleFavorite, deleteRecord, clearHistory } from "@/lib/storage";
import { CATEGORY_LABELS, type ScanCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Scan History — LifeScan AI" },
      { name: "description", content: "Browse, search and manage every species and object you've identified with LifeScan AI." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const history = useHistory();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ScanCategory | "all">("all");

  const categories = useMemo(() => {
    const set = new Set<ScanCategory>();
    history.forEach((r) => set.add(r.category));
    return Array.from(set);
  }, [history]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history.filter((r) => {
      if (filter !== "all" && r.category !== filter) return false;
      if (!q) return true;
      return (
        r.commonName.toLowerCase().includes(q) ||
        r.scientificName.toLowerCase().includes(q) ||
        CATEGORY_LABELS[r.category].toLowerCase().includes(q)
      );
    });
  }, [history, query, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Scan history</h1>
        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm("Clear your entire scan history?")) clearHistory();
            }}
          >
            <Trash2 className="h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="h-11 rounded-xl pl-10"
        />
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          {categories.map((c) => (
            <FilterChip key={c} active={filter === c} onClick={() => setFilter(c)}>
              {CATEGORY_LABELS[c]}
            </FilterChip>
          ))}
        </div>
      )}

      {results.length === 0 ? (
        <EmptyState hasHistory={history.length > 0} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((r) => (
            <ScanCard key={r.id} record={r} onToggleFavorite={toggleFavorite} onDelete={deleteRecord} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ hasHistory }: { hasHistory: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <HistoryIcon className="h-7 w-7" />
      </span>
      <p className="font-display text-lg font-semibold">{hasHistory ? "No matches found" : "No scans yet"}</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        {hasHistory ? "Try a different search or filter." : "Your identified species and objects will appear here."}
      </p>
      {!hasHistory && (
        <Button asChild variant="hero">
          <Link to="/">Start scanning</Link>
        </Button>
      )}
    </div>
  );
}
