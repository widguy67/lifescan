import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

const SUBSCRIPTION_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
]);

function planForVariant(variantId: string | null): string | null {
  if (!variantId) return null;
  if (variantId === process.env.LEMONSQUEEZY_VARIANT_MONTHLY) return "monthly";
  if (variantId === process.env.LEMONSQUEEZY_VARIANT_YEARLY) return "yearly";
  return null;
}

export const Route = createFileRoute("/api/public/webhooks/lemonsqueezy")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
        if (!secret) {
          return new Response("Webhook not configured", { status: 500 });
        }

        const signature = request.headers.get("x-signature") ?? "";
        const body = await request.text();

        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const sig = Buffer.from(signature, "utf8");
        const exp = Buffer.from(expected, "utf8");
        if (sig.length !== exp.length || !timingSafeEqual(sig, exp)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any;
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const eventName: string = payload?.meta?.event_name ?? "";
        if (!SUBSCRIPTION_EVENTS.has(eventName)) {
          // Acknowledge non-subscription events without acting on them.
          return new Response("ignored", { status: 200 });
        }

        const userId: string | undefined = payload?.meta?.custom_data?.user_id;
        const attrs = payload?.data?.attributes ?? {};
        const subscriptionId: string | null = payload?.data?.id ? String(payload.data.id) : null;
        const variantId: string | null = attrs.variant_id ? String(attrs.variant_id) : null;

        if (!userId) {
          return new Response("Missing user reference", { status: 200 });
        }

        const record = {
          user_id: userId,
          email: attrs.user_email ?? null,
          ls_customer_id: attrs.customer_id ? String(attrs.customer_id) : null,
          ls_subscription_id: subscriptionId,
          ls_order_id: attrs.order_id ? String(attrs.order_id) : null,
          variant_id: variantId,
          plan: planForVariant(variantId),
          status: attrs.status ?? "inactive",
          renews_at: attrs.renews_at ?? null,
          ends_at: attrs.ends_at ?? null,
        };

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("subscribers")
          .upsert(record, { onConflict: "user_id" });

        if (error) {
          console.error("Failed to upsert subscription", error);
          return new Response("Database error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
