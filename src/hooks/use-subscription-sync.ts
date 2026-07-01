import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getSubscription } from "@/lib/subscription.functions";
import { activatePremium, cancelPremium, isPremium } from "@/lib/quota";

/**
 * Keeps the local Premium flag in sync with the real Lemon Squeezy
 * subscription stored in the cloud whenever the user is signed in.
 */
export function useSubscriptionSync() {
  const { user } = useAuth();
  const fetchSubscription = useServerFn(getSubscription);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;

    (async () => {
      try {
        const sub = await fetchSubscription();
        if (cancelled) return;
        if (sub.active && sub.plan) {
          activatePremium(sub.plan);
        } else if (isPremium()) {
          cancelPremium();
        }
      } catch {
        /* ignore — keep whatever local state exists */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, fetchSubscription]);
}
