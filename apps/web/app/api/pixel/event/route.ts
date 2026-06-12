import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendCAPIEvent } from "../../../../lib/capi";

export const dynamic = "force-dynamic";

// once-per-user events → DB flag column on `profiles`
const ONCE_COLUMNS: Record<string, string> = {
  registration: "capi_registration_sent",
  trial:        "capi_trial_sent",
};

export async function POST(req: NextRequest) {
  try {
    const { eventName, params, eventId, userId, userEmail, fbc, fbp, onceKey } = await req.json();

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    // fbc/fbp — prefer values sent from the client; fall back to cookies on the request
    const cookieFbc = req.cookies.get("_fbc")?.value;
    const cookieFbp = req.cookies.get("_fbp")?.value;

    // ── Server-side once-per-user guard (cross-device) ──
    // If this event already has its DB flag set for the user, skip the CAPI send.
    let admin: ReturnType<typeof createClient> | null = null;
    const col = onceKey ? ONCE_COLUMNS[onceKey] : undefined;
    if (col && userId) {
      try {
        admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data } = await admin.from("profiles").select(col).eq("user_id", userId).maybeSingle();
        if (data && (data as any)[col]) {
          return NextResponse.json({ ok: true, skipped: true });
        }
      } catch (e) {
        // If the column/table check fails, fall through and still send the event.
        console.warn("[pixel/event] once-check failed:", e);
      }
    }

    await sendCAPIEvent({
      eventName,
      eventId,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      fbc: fbc || cookieFbc || undefined,
      fbp: fbp || cookieFbp || undefined,
      currency: params?.currency,
      value: params?.value,
    });

    // Mark the once-per-user flag after a successful send
    if (col && userId && admin) {
      try { await (admin as any).from("profiles").update({ [col]: true }).eq("user_id", userId); } catch {}
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[pixel/event] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
