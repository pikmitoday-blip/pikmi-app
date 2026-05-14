import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { pitchLinkId, pitchLinkTitle, ownerUserId, slug } = await req.json();

    if (!ownerUserId || !process.env.RESEND_API_KEY) {
      return NextResponse.json({ ok: false });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Dohvati email vlasnika
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(ownerUserId);
    const ownerEmail = userData?.user?.email;
    if (!ownerEmail) return NextResponse.json({ ok: false });

    // Pošalji email via Resend
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "pikmi <onboarding@resend.dev>",
        to: ownerEmail,
        subject: `👁 Neko je otvorio tvoj pitch link — ${pitchLinkTitle}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <div style="font-size: 28px; font-weight: 900; color: #7C3AED; margin-bottom: 24px;">pikmi</div>
            <div style="background: #F3F0FF; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <div style="font-size: 32px; margin-bottom: 8px;">👁</div>
              <h2 style="margin: 0 0 8px; font-size: 20px; color: #1a1a1a;">Neko je otvorio tvoj pitch link!</h2>
              <p style="margin: 0; color: #666; font-size: 15px;">
                Tvoj pitch link <strong>${pitchLinkTitle}</strong> je upravo pogledao/la novi posjetioc.
              </p>
            </div>
            <a href="https://pikmi.today/${slug}"
               style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-bottom: 24px;">
              Pogledaj pitch link →
            </a>
            <p style="color: #999; font-size: 12px;">
              Prijaviš se na <a href="https://pikmi.today/dashboard" style="color: #7C3AED;">dashboard</a> da vidiš sve analitike.
            </p>
            <p style="color: #ccc; font-size: 11px; margin-top: 16px;">
              pikmi.today · Možeš isključiti notifikacije u podešavanjima
            </p>
          </div>
        `,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Notify error:", err);
    return NextResponse.json({ ok: false });
  }
}
