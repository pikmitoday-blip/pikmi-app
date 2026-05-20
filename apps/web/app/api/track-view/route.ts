import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { pitchLinkId, currentViews, device, referrer } = await req.json();
    if (!pitchLinkId) return NextResponse.json({ ok: false });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabaseAdmin.from("link_views").insert({
      pitch_link_id: pitchLinkId,
      viewed_at: new Date().toISOString(),
      device,
      referrer: referrer || null,
    });

    await supabaseAdmin
      .from("pitch_links")
      .update({ views: (currentViews ?? 0) + 1 })
      .eq("id", pitchLinkId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Track view error:", err);
    return NextResponse.json({ ok: false });
  }
}
