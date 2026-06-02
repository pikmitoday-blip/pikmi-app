import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const RESEND_KEY  = process.env.RESEND_API_KEY ?? "";
const FROM        = process.env.RESEND_FROM ?? "pikmi <onboarding@resend.dev>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "podrska@pikmi.today";

export async function POST(req: NextRequest) {
  try {
    const { message, userEmail, userName } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: "Poruka je prazna" }, { status: 400 });

    // Pokušaj dohvatiti korisnika iz Bearer tokena (opciono)
    let senderEmail = userEmail ?? "nepoznat korisnik";
    let senderName  = userName  ?? "";
    try {
      const token = req.headers.get("authorization")?.replace("Bearer ", "");
      if (token) {
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user } } = await sb.auth.getUser(token);
        if (user?.email) senderEmail = user.email;
      }
    } catch {}

    if (!RESEND_KEY) {
      console.warn("[bug-report] RESEND_API_KEY nije postavljen");
      return NextResponse.json({ ok: true });
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to:   [ADMIN_EMAIL],
        subject: `🐛 Bug report od ${senderName || senderEmail}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#7C3AED">🐛 Novi bug report</h2>
            <p><strong>Od:</strong> ${senderName ? `${senderName} (${senderEmail})` : senderEmail}</p>
            <p><strong>Poruka:</strong></p>
            <div style="background:#f5f5f5;padding:16px;border-radius:8px;border-left:4px solid #7C3AED;white-space:pre-wrap">${message.replace(/</g, "&lt;")}</div>
            <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
            <p style="color:#999;font-size:12px">Poslano sa pikmi.today dashboard-a</p>
          </div>
        `,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("[bug-report] Resend greška:", resendRes.status, errBody);
      return NextResponse.json({ error: `Email greška: ${errBody}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[bug-report]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
