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

  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_subscription_id, stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ subscription: null });
    }

    const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id, {
      expand: ["default_payment_method", "latest_invoice"],
    });

    const pm = sub.default_payment_method as Stripe.PaymentMethod | null;
    const invoice = sub.latest_invoice as Stripe.Invoice | null;

    // In Stripe API >= 2025-03-31, current_period_end/start moved to subscription items
    const subItem = sub.items.data[0] as any;
    const periodEnd: number =
      (sub as any).current_period_end ??
      subItem?.current_period_end ??
      subItem?.billing_cycle_anchor ??
      Math.floor(Date.now() / 1000);
    const periodStart: number =
      (sub as any).current_period_start ??
      subItem?.current_period_start ??
      Math.floor(Date.now() / 1000);

    const cancelAt: number | null =
      (sub as any).cancel_at ?? null;

    return NextResponse.json({
      subscription: {
        status: sub.status,
        cancelAtPeriodEnd: (sub as any).cancel_at_period_end ?? false,
        cancelAt: cancelAt ? new Date(cancelAt * 1000).toISOString() : null,
        currentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
        currentPeriodStart: new Date(periodStart * 1000).toISOString(),
        amount: subItem?.price?.unit_amount ?? 0,
        currency: subItem?.price?.currency ?? "rsd",
        card: pm?.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        } : null,
        lastInvoiceAmount: invoice?.amount_paid ?? null,
        lastInvoiceDate: invoice?.created ? new Date(invoice.created * 1000).toISOString() : null,
        lastInvoicePdf: (invoice as any)?.invoice_pdf ?? null,
      },
    });
  } catch (err: any) {
    console.error("Subscription fetch error:", err);
    return NextResponse.json({ subscription: null });
  }
}
