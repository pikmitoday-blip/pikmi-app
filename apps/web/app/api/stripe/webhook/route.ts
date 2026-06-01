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
          .update({ plan: "pro", stripe_subscription_id: subscriptionId })
          .eq("user_id", userId);

        // ── Meta CAPI: Purchase event ───────────────────────────────────────
        try {
          const PIXEL_ID = "980912031509026";
          const CAPI_TOKEN = process.env.META_CAPI_TOKEN;
          if (CAPI_TOKEN) {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
            const userEmail = userData?.user?.email ?? "";
            await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                data: [{
                  event_name: "Purchase",
                  event_time: Math.floor(Date.now() / 1000),
                  action_source: "website",
                  user_data: {
                    em: userEmail ? [require("crypto").createHash("sha256").update(userEmail.toLowerCase()).digest("hex")] : [],
                    external_id: userId,
                  },
                  custom_data: { currency: "RSD", value: 990 },
                }],
                access_token: CAPI_TOKEN,
              }),
            });
          }
        } catch (capiErr) {
          console.error("[webhook] Meta CAPI error:", capiErr);
        }

        // ── Dobrodošlica email ──────────────────────────────────────────────
        try {
          const RESEND_KEY = process.env.RESEND_API_KEY;
          const from = process.env.RESEND_FROM ?? "pikmi <onboarding@resend.dev>";

          if (RESEND_KEY) {
            // Dohvati email korisnika
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
            const userEmail = userData?.user?.email;

            // Dohvati period pretplate iz Stripe-a
            // Cast to any: newer Stripe API versions moved current_period_end
            // off the top-level Subscription type
            const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
            const periodEnd: number = sub.current_period_end
              ?? sub.items?.data?.[0]?.current_period_end
              ?? Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
            const subscribedAt = new Date((sub.start_date ?? Math.floor(Date.now() / 1000)) * 1000).toLocaleString("sr-Latn", {
              timeZone: "Europe/Belgrade",
              day: "2-digit", month: "2-digit", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            });
            const validUntil = new Date(periodEnd * 1000).toLocaleString("sr-Latn", {
              timeZone: "Europe/Belgrade",
              day: "2-digit", month: "long", year: "numeric",
            });

            if (userEmail) {
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${RESEND_KEY}`,
                },
                body: JSON.stringify({
                  from,
                  to: userEmail,
                  subject: "Dobrodošao u pikmi Pro! ⚡",
                  html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:32px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7C3AED,#5B21B6);padding:28px 32px;">
            <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">pikmi</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px;">
            <div style="font-size:42px;margin-bottom:16px;">⚡</div>
            <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111;line-height:1.3;">
              Hvala što si deo Pikmi ekipe.
            </h2>
            <p style="margin:0 0 28px;color:#444;font-size:16px;line-height:1.7;">
              Puno klijenata ti želimo 🙌
            </p>

            <!-- Detalji pretplate -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F5FF;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:7px 0;font-size:13px;color:#888;border-bottom:1px solid #EDE9FE;">📅 Pretplaćen</td>
                      <td style="padding:7px 0;font-size:13px;font-weight:600;color:#111;text-align:right;border-bottom:1px solid #EDE9FE;">${subscribedAt}</td>
                    </tr>
                    <tr>
                      <td style="padding:7px 0;font-size:13px;color:#888;">⏳ Važi do</td>
                      <td style="padding:7px 0;font-size:13px;font-weight:600;color:#7C3AED;text-align:right;">${validUntil}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="https://pikmi.today/moj-profil"
                     style="display:inline-block;background:#7C3AED;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
                    Otvori pikmi →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F8F5FF;padding:16px 32px;text-align:center;border-top:1px solid #EDE9FE;">
            <p style="margin:0;font-size:11px;color:#AAA;">
              pikmi.today · Hvala na poverenju
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
                }),
              });
            }
          }
        } catch (emailErr) {
          console.error("[webhook] Welcome email error:", emailErr);
        }
      }
      break;
    }

    case "customer.subscription.deleted":
    case "customer.subscription.paused": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = getUserId(subscription);
      const churnedAt = new Date().toISOString();

      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null, plan_churned_at: churnedAt })
          .eq("user_id", userId);
      } else {
        await supabaseAdmin
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null, plan_churned_at: churnedAt })
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
