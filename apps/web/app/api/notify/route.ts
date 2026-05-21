import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { pitchLinkId, pitchLinkTitle, ownerUserId, slug, device, referrer } = await req.json();

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!ownerUserId || !RESEND_KEY) {
      console.error("[notify] Missing ownerUserId or RESEND_API_KEY", {
        hasOwnerId: !!ownerUserId,
        hasKey: !!RESEND_KEY,
      });
      return NextResponse.json({ ok: false, reason: "missing_config" });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Dohvati email vlasnika linka
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(ownerUserId);
    const ownerEmail = userData?.user?.email;
    if (!ownerEmail) {
      console.error("[notify] Could not get owner email", userError);
      return NextResponse.json({ ok: false, reason: "no_owner_email" });
    }

    // Pročitaj ukupan broj pregleda za taj link
    const { data: linkData } = await supabaseAdmin
      .from("pitch_links")
      .select("views")
      .eq("id", pitchLinkId)
      .single();
    const totalViews = linkData?.views ?? 1;

    // Datum i uređaj
    const now = new Date().toLocaleString("sr-Latn", {
      timeZone: "Europe/Belgrade",
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    const deviceLabel = device === "mobile" ? "📱 Mobilni" : device === "desktop" ? "🖥️ Desktop" : "Nepoznat";
    const referrerLabel = referrer
      ? (() => { try { return new URL(referrer).hostname; } catch { return referrer; } })()
      : "Direktan posjet";

    const from = process.env.RESEND_FROM ?? "pikmi <onboarding@resend.dev>";

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: ownerEmail,
        subject: `👁 Neko je otvorio "${pitchLinkTitle}"`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:32px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7C3AED,#5B21B6);padding:28px 32px;">
            <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">pikmi</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <div style="font-size:36px;margin-bottom:12px;">👁</div>
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111;">Neko je otvorio tvoj pitch link!</h2>
            <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
              Tvoj link <strong style="color:#7C3AED;">${pitchLinkTitle}</strong> je upravo pogledao novi posjetilac.
            </p>

            <!-- Stats box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F5FF;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#888;">🕐 Kada</td>
                      <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111;text-align:right;">${now}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#888;">${deviceLabel.includes("Mobilni") ? "📱" : "🖥️"} Uređaj</td>
                      <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111;text-align:right;">${deviceLabel.replace("📱 ", "").replace("🖥️ ", "")}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#888;">🔗 Izvor</td>
                      <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111;text-align:right;">${referrerLabel}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#888;">📊 Ukupno pregleda</td>
                      <td style="padding:6px 0;font-size:13px;font-weight:600;color:#7C3AED;text-align:right;">${totalViews}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:8px;">
                  <a href="https://pikmi.today/analytics"
                     style="display:inline-block;background:#7C3AED;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
                    Vidi analitiku →
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <a href="https://pikmi.today/${slug}"
                     style="font-size:13px;color:#7C3AED;text-decoration:none;">
                    Pogledaj pitch link ↗
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F8F5FF;padding:16px 32px;text-align:center;border-top:1px solid #EDE9FE;">
            <p style="margin:0;font-size:11px;color:#AAA;">
              pikmi.today · Notifikacije možeš isključiti u podešavanjima naloga
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
        `,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("[notify] Resend API error:", resendRes.status, resendData);
      return NextResponse.json({ ok: false, reason: "resend_error", detail: resendData });
    }

    console.log("[notify] Email sent to", ownerEmail, "id:", resendData.id);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[notify] Unexpected error:", err);
    return NextResponse.json({ ok: false });
  }
}
