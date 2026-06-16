import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

// ── Real client IP from the proxy headers (Vercel sets x-forwarded-for) ──
function clientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") || null;
}

// Hash the IP so we never store raw addresses (privacy / GDPR).
function hashIp(ip: string): string {
  const salt = process.env.TRIAL_IP_SALT ?? "pikmi-trial";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { action, userId } = await req.json();
    const ip = clientIp(req);

    // No resolvable IP (rare) → don't block, just allow.
    if (!ip) return NextResponse.json({ used: false, granted: true });

    const ipHash = hashIp(ip);
    const db = admin();

    // ── STATUS: is this IP already tied to a started trial? (UX pre-check) ──
    if (action === "status") {
      const { data } = await db
        .from("trial_ips")
        .select("user_id")
        .eq("ip_hash", ipHash)
        .maybeSingle();
      // "used" only if a DIFFERENT user (or unknown) already claimed this IP.
      const used = !!data && (!userId || (data as any).user_id !== userId);
      return NextResponse.json({ used });
    }

    // ── CLAIM: record this IP for the user, or deny if already used elsewhere ──
    if (action === "claim") {
      if (!userId) return NextResponse.json({ granted: false }, { status: 400 });

      const { data: existing } = await db
        .from("trial_ips")
        .select("user_id")
        .eq("ip_hash", ipHash)
        .maybeSingle();

      if (existing) {
        // Same user re-claiming (refresh, OAuth + email, etc.) → fine.
        if ((existing as any).user_id === userId) {
          return NextResponse.json({ granted: true });
        }
        // Different account already used a trial from this IP → deny the trial.
        // Expire it immediately so the platform lock kicks in.
        await db
          .from("profiles")
          .update({ plan: "free", trial_ends_at: new Date(0).toISOString() })
          .eq("user_id", userId);
        return NextResponse.json({ granted: false });
      }

      await db.from("trial_ips").insert({ ip_hash: ipHash, user_id: userId });
      return NextResponse.json({ granted: true });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[api/trial] error:", err);
    // On error, fail open so we never block a legitimate signup by accident.
    return NextResponse.json({ used: false, granted: true });
  }
}
