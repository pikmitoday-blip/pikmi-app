import { NextRequest, NextResponse } from "next/server";
import { sendCAPIEvent } from "../../../../lib/capi";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { eventName, params, eventId, userId, userEmail } = await req.json();

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    await sendCAPIEvent({
      eventName,
      eventId,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      currency: params?.currency,
      value: params?.value,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[pixel/event] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
