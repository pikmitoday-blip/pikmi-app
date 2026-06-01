import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Dohvati stripe_subscription_id iz baze
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .single();

    // Ako ima aktivnu Stripe pretplatu, odmah je otkazi
    if (profile?.stripe_subscription_id) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-04-22.dahlia",
      });
      try {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id);
      } catch (stripeErr: any) {
        // Ako je pretplata već otkazana, ignoriši grešku
        if (!stripeErr?.message?.includes("No such subscription")) {
          console.error("Stripe cancel error:", stripeErr);
        }
      }
    }

    // Ažuriraj bazu — plan na free, obriši subscription ID
    await supabaseAdmin
      .from("profiles")
      .update({
        plan: "free",
        stripe_subscription_id: null,
        plan_churned_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("cancel-subscription error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
