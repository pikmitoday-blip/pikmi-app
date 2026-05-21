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
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .single();

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }

    // Otkaži na kraju perioda (korisnik zadržava pristup do kraja plaćenog perioda)
    const subscription = await stripe.subscriptions.update(
      profile.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    const cancelAtRaw: number | null = (subscription as any).cancel_at ?? null;
    const cancelAt = cancelAtRaw
      ? new Date(cancelAtRaw * 1000).toISOString()
      : null;

    return NextResponse.json({ ok: true, cancelAt });
  } catch (err: any) {
    console.error("Cancel error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
