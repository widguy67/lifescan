import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Leaf, Flower2, TreePine, Apple, Carrot, Sprout, PawPrint, Bird,
  Bug, Fish, Shell, UtensilsCrossed, Gem, ShieldCheck, Sparkles, History,
} from "lucide-react";
import { Scanner } from "@/components/scanner";
import { ScanCard } from "@/components/scan-card";
import { useScans } from "@/hooks/use-scans";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Scany — Instant Plant, Animal & Nature Identifier" },
      {
        name: "description",
        content:
          "Scan with your camera or import a photo to instantly identify plants, animals, fish, birds, insects, mushrooms, food and minerals with AI-powered accuracy.",
      },
    ],
  }),
  component: Index,
});

const CATEGORIES = [
  { icon: Leaf, label: "Plants" },
  { icon: Flower2, label: "Flowers" },
  { icon: TreePine, label: "Trees" },
  { icon: Apple, label: "Fruits" },
  { icon: Carrot, label: "Vegetables" },
  { icon: Sprout, label: "Seeds" },
  { icon: PawPrint, label: "Animals" },
  { icon: Bird, label: "Birds" },
  { icon: Bug, label: "Insects" },
  { icon: Fish, label: "Fish" },
  { icon: Shell, label: "Mushrooms" },
  { icon: UtensilsCrossed, label: "Food" },
  { icon: Gem, label: "Minerals" },
];

const HIGHLIGHTS = [
  { icon: Sparkles, title: "High-accuracy AI", text: "Confidence-scored identification across 14+ living and natural categories." },
  { icon: ShieldCheck, title: "Trusted details", text: "Toxicity, care, nutrition, conservation status and safety guidance." },
  { icon: History, title: "Your library", text: "Every scan saved with search, favorites and side-by-side comparisons." },
];

function Index() {
  const { records, toggleFavorite } = useScans();
  const recent = records.slice(0, 6);

  return (
    <div className="space-y-10">
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-hero" />
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Powered by advanced vision AI
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-5xl">
            Identify <span className="text-gradient">anything</span> in nature
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            From a single photo, Scany tells you exactly what you're looking at — with expert-level detail you can trust.
          </p>
        </div>
        <Scanner />
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold">What can you scan?</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
          {CATEGORIES.map((c) => (
            <div
              key={c.label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <c.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium">{c.label}</span>
            </div>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Recent scans</h2>
            <Link to="/history" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {recent.map((r) => (
              <ScanCard key={r.id} record={r} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {HIGHLIGHTS.map((h) => (
          <div key={h.title} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <h.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-display text-base font-bold">{h.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{h.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
