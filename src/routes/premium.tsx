import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Crown, Check, ScanLine, BadgeCheck, Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuota } from "@/hooks/use-quota";
import { activatePremium, cancelPremium, PRICING, type PremiumPlan } from "@/lib/quota";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Scany Premium — Unlimited Ad-Free Identification" },
      {
        name: "description",
        content:
          "Upgrade to Scany Premium for unlimited scans and an ad-free experience. €5.99/month or €49.99/year.",
      },
    ],
  }),
  component: Premium,
});

const PERKS = [
  { icon: ScanLine, text: "Unlimited identifications every day" },
  { icon: Zap, text: "No ads — instant results, every time" },
  { icon: BadgeCheck, text: "Priority access to high-accuracy AI" },
  { icon: Crown, text: "Support continued development & new categories" },
];

function Premium() {
  const navigate = useNavigate();
  const quota = useQuota();
  const [selected, setSelected] = useState<PremiumPlan>("yearly");

  function subscribe() {
    activatePremium(selected);
    toast.success("Welcome to Premium! Enjoy unlimited, ad-free scans.");
    navigate({ to: "/" });
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <button
        onClick={() => navigate({ to: "/" })}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <header className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
          <Crown className="h-8 w-8 text-primary-foreground" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold">
          Scany <span className="text-gradient">Premium</span>
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Scan without limits and skip every ad. Identify nature the moment you're curious.
        </p>
      </header>

      {quota.premium ? (
        <div className="rounded-3xl border border-primary/30 bg-secondary/40 p-6 text-center">
          <BadgeCheck className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-3 font-display text-lg font-bold">You're a Premium member</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Active plan: {quota.plan === "yearly" ? "Yearly" : "Monthly"} · Unlimited ad-free scans.
          </p>
          <Button
            variant="outline"
            size="lg"
            className="mt-5"
            onClick={() => {
              cancelPremium();
              toast("Premium cancelled. You're back on the free plan.");
            }}
          >
            Cancel Premium
          </Button>
        </div>
      ) : (
        <>
          <ul className="space-y-3 rounded-3xl border border-border bg-card p-6 shadow-sm">
            {PERKS.map((p) => (
              <li key={p.text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary">
                  <p.icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-sm font-medium">{p.text}</span>
              </li>
            ))}
          </ul>

          <div className="grid gap-3 sm:grid-cols-2">
            <PlanCard
              plan="monthly"
              selected={selected === "monthly"}
              onSelect={() => setSelected("monthly")}
            />
            <PlanCard
              plan="yearly"
              selected={selected === "yearly"}
              onSelect={() => setSelected("yearly")}
            />
          </div>

          <Button variant="hero" size="xl" className="w-full" onClick={subscribe}>
            <Crown className="h-5 w-5" />
            Subscribe — {PRICING[selected].price}/{PRICING[selected].period}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Cancel anytime. Free plan includes 2 scans per day plus rewarded ads.
          </p>
        </>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: PremiumPlan;
  selected: boolean;
  onSelect: () => void;
}) {
  const info = PRICING[plan];
  const yearly = plan === "yearly";
  const monthlyEquivalent = yearly ? (info.amount / 12).toFixed(2) : null;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative rounded-3xl border p-5 text-left transition-all",
        selected
          ? "border-primary bg-secondary/40 shadow-glow"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      {yearly && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-glow">
          Best value · save 30%
        </span>
      )}
      <div className="flex items-center justify-between">
        <span className="font-display text-base font-bold capitalize">{plan}</span>
        {selected && <Check className="h-5 w-5 text-primary" />}
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold">
        {info.price}
        <span className="text-sm font-medium text-muted-foreground">/{info.period}</span>
      </p>
      {monthlyEquivalent && (
        <p className="mt-1 text-xs text-muted-foreground">Just €{monthlyEquivalent}/month, billed yearly</p>
      )}
    </button>
  );
}
