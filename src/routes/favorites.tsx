import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { ScanCard } from "@/components/scan-card";
import { useHistory } from "@/hooks/use-history";
import { toggleFavorite, deleteRecord } from "@/lib/storage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Favorites — LifeScan AI" },
      { name: "description", content: "Your saved species and identifications, ready to revisit anytime." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const favorites = useHistory().filter((r) => r.favorite);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Favorites</h1>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-destructive">
            <Heart className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">No favorites yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Tap the heart on any scan to keep it here for quick access.
          </p>
          <Button asChild variant="hero">
            <Link to="/">Start scanning</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {favorites.map((r) => (
            <ScanCard key={r.id} record={r} onToggleFavorite={toggleFavorite} onDelete={deleteRecord} />
          ))}
        </div>
      )}
    </div>
  );
}
