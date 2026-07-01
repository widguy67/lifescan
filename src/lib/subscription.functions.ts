import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHost } from "@tanstack/react-start/server";

export type SubscriptionPlan = "monthly" | "yearly";

export interface SubscriptionStatus {
  active: boolean;
  plan: SubscriptionPlan | null;
  status: string;
  renewsAt: string | null;
  endsAt: string | null;
}

const LS_API = "https://api.lemonsqueezy.com/v1";

/** Statuses from Lemon Squeezy that grant Premium access. */
const ACTIVE_STATUSES = new Set(["active", "on_trial", "past_due", "cancelled"]);

/** Read the current user's subscription status from the database. */
export const getSubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionStatus> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("subscribers")
      .select("plan, status, renews_at, ends_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return { active: false, plan: null, status: "inactive", renewsAt: null, endsAt: null };
    }

    // A cancelled sub still grants access until the end date passes.
    const notExpired = !data.ends_at || new Date(data.ends_at).getTime() > Date.now();
    const active = ACTIVE_STATUSES.has(data.status) && notExpired;

    return {
      active,
      plan: (data.plan as SubscriptionPlan) ?? null,
      status: data.status,
      renewsAt: data.renews_at,
      endsAt: data.ends_at,
    };
  });

/** Create a Lemon Squeezy checkout for the selected plan and return its URL. */
export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { plan: SubscriptionPlan }) => {
    if (!data || (data.plan !== "monthly" && data.plan !== "yearly")) {
      throw new Error("A valid plan is required.");
    }
    return { plan: data.plan };
  })
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const variantId =
      data.plan === "monthly"
        ? process.env.LEMONSQUEEZY_VARIANT_MONTHLY
        : process.env.LEMONSQUEEZY_VARIANT_YEARLY;

    if (!apiKey || !storeId || !variantId) {
      throw new Error(
        "Premium checkout isn't configured yet. Please add the Lemon Squeezy keys and variant IDs.",
      );
    }

    const { userId, claims } = context;
    const email = (claims?.email as string | undefined) ?? undefined;

    let origin = "https://scany.lovable.app";
    try {
      const host = getRequestHost();
      if (host) origin = `https://${host}`;
    } catch {
      /* fall back to default origin */
    }

    const res = await fetch(`${LS_API}/checkouts`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email,
              custom: { user_id: userId },
            },
            product_options: {
              redirect_url: `${origin}/premium?checkout=success`,
            },
          },
          relationships: {
            store: { data: { type: "stores", id: String(storeId) } },
            variant: { data: { type: "variants", id: String(variantId) } },
          },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Checkout creation failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const json = await res.json();
    const url: string | undefined = json?.data?.attributes?.url;
    if (!url) throw new Error("Checkout URL was not returned by the payment provider.");
    return { url };
  });
