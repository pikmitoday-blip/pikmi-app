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
    const { userId, userEmail, priceId, fbp, fbc } = await req.json();

    if (!userId || !userEmail) {
      return NextResponse.json({ error: "Missing userId or userEmail" }, { status: 400 });
    }

    // Capture client signals so the webhook can send a high-quality Subscribe event
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") || "";
    const userAgent = req.headers.get("user-agent") || "";
    const cookieFbc = req.cookies.get("_fbc")?.value || "";
    const cookieFbp = req.cookies.get("_fbp")?.value || "";

    // Resolve plan value for ROAS: 2190 (3-month) or 990 (monthly)
    const threeMPrice = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_3M;
    const resolvedPrice = priceId ?? process.env.STRIPE_PRICE_ID!;
    const planValue = threeMPrice && resolvedPrice === threeMPrice ? 2190 : 990;

    const capiMeta = {
      supabase_user_id: userId,
      capi_value: String(planValue),
      capi_fbp: (fbp || cookieFbp || "").slice(0, 200),
      capi_fbc: (fbc || cookieFbc || "").slice(0, 200),
      capi_ip:  ipAddress.slice(0, 64),
      capi_ua:  userAgent.slice(0, 400),
    };

    // Provjeri postoji li već Stripe customer
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", userId);
    }

    // Kreiraj Checkout sesiju
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId ?? process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      mode: "subscription",
      // Prikaži "Add promotion code" polje na checkout-u (važi za oba Pro plana)
      allow_promotion_codes: true,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?tab=subscription&success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?tab=subscription&cancelled=1`,
      metadata: capiMeta,
      // Persist signals on the subscription so the webhook can read them
      subscription_data: { metadata: capiMeta },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
