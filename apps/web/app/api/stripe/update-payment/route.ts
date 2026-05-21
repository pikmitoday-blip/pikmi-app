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
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("user_id", userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
    }

    // Kreiraj Checkout sesiju u setup modu za promenu kartice
    const session = await stripe.checkout.sessions.create({
      customer: profile.stripe_customer_id,
      payment_method_types: ["card"],
      mode: "setup",
      setup_intent_data: profile.stripe_subscription_id
        ? { metadata: { subscription_id: profile.stripe_subscription_id } }
        : undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?payment_updated=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Update payment error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
