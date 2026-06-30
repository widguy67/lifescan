import { Crown, Play, Sparkles, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PRICING } from "@/lib/quota";

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Triggered when the user opts to watch a rewarded ad for +1 scan. */
  onWatchAd: () => void;
}

export function PaywallDialog({ open, onOpenChange, onWatchAd }: PaywallDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center font-display text-xl">
            You've used your 2 free scans today
          </DialogTitle>
          <DialogDescription className="text-center">
            Watch a short ad for one more scan, or go Premium for unlimited, ad-free identifications.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <Button variant="outline" size="lg" className="w-full" onClick={onWatchAd}>
            <Play className="h-4 w-4" />
            Watch ad — get 1 free scan
          </Button>

          <div className="rounded-2xl border border-primary/30 bg-secondary/40 p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <span className="font-display text-sm font-bold">Scany Premium</span>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Unlimited scans
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> No ads, ever
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Priority high-accuracy AI
              </li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              {PRICING.monthly.price}/{PRICING.monthly.period} · {PRICING.yearly.price}/
              {PRICING.yearly.period}
            </p>
            <Button asChild variant="hero" size="lg" className="mt-3 w-full">
              <Link to="/premium" onClick={() => onOpenChange(false)}>
                <Crown className="h-4 w-4" />
                Go Premium
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
