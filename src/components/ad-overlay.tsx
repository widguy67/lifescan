import { useEffect, useState } from "react";
import { Sparkles, X, Crown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface AdOverlayProps {
  /** "interstitial" plays before showing a result; "rewarded" grants a bonus scan. */
  variant: "interstitial" | "rewarded";
  /** Seconds before the ad can be dismissed. */
  duration?: number;
  onComplete: () => void;
  onClose?: () => void;
}

export function AdOverlay({ variant, duration = 5, onComplete, onClose }: AdOverlayProps) {
  const [left, setLeft] = useState(duration);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const done = left <= 0;
  const rewarded = variant === "rewarded";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Sponsored
          </span>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close ad"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <Play className="h-7 w-7 text-primary-foreground" />
          </span>
          <div>
            <p className="font-display text-lg font-bold">
              {rewarded ? "Watch to earn 1 free scan" : "Your result is almost ready"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {rewarded
                ? "Watch this short ad and unlock one extra identification today."
                : "A quick message from our sponsor while we finish your identification."}
            </p>
          </div>

          <Button
            variant="hero"
            size="lg"
            className="w-full"
            disabled={!done}
            onClick={onComplete}
          >
            {done ? (rewarded ? "Claim my scan" : "See my result") : `Please wait ${left}s…`}
          </Button>

          <Link
            to="/premium"
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <Crown className="h-3.5 w-3.5" />
            Go Premium to remove ads
          </Link>
        </div>
      </div>
    </div>
  );
}
