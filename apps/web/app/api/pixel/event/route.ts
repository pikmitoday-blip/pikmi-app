import { NextRequest, NextResponse } from "next/server";
import { sendCAPIEvent } from "../../../../lib/capi";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { eventName, params, eventId, userId, userEmail, fbc, fbp } = await req.json();

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    // fbc/fbp — prefer values sent from the client; fall back to cookies on the request
    const cookieFbc = req.cookies.get("_fbc")?.value;
    const cookieFbp = req.cookies.get("_fbp")?.value;

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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[pixel/event] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
