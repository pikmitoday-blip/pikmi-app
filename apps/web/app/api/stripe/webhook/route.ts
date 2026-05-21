import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
  });
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const getUserId = (obj: Stripe.Subscription | Stripe.Customer | null): string | null => {
    if (!obj || typeof obj === "string") return null;
    return (obj as Stripe.Subscription).metadata?.supabase_user_id ?? null;
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const subscriptionId = session.subscription as string;

      if (userId && subscriptionId) {
        await supabaseAdmin
          .from("profiles")
          .update({
            plan: "pro",
            stripe_subscription_id: subscriptionId,
          })
          .eq("user_id", userId);
      }
      break;
    }

    case "customer.subscription.deleted":
    case "customer.subscription.paused": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = getUserId(subscription);

      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null })
          .eq("user_id", userId);
      } else {
        // Pokušaj da nađeš po subscription_id
        await supabaseAdmin
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null })
          .eq("stripe_subscription_id", subscription.id);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = getUserId(subscription);
      const isActive = subscription.status === "active";

      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ plan: isActive ? "pro" : "free" })
          .eq("user_id", userId);
      }
      break;
    }

    case "setup_intent.succeeded": {
      // Kada korisnik uspješno unese novu karticu, postavi je kao default na pretplati
      const setupIntent = event.data.object as Stripe.SetupIntent;
      const subscriptionId = setupIntent.metadata?.subscription_id;
      const paymentMethodId = setupIntent.payment_method as string;

      if (subscriptionId && paymentMethodId) {
        try {
          await stripe.subscriptions.update(subscriptionId, {
            default_payment_method: paymentMethodId,
          });
        } catch (e) {
          console.error("Failed to update default payment method:", e);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
