import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  portfolioStatus, formatSectionList, portfolioEmail, trialEmail, type TrialKind,
} from "../../../../lib/trial-emails";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Hobby plan dozvoljava do 60s

const SITE = "https://www.pikmi.today";
const REPLY_TO = "hello@pikmi.today";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ── Datum u Europe/Belgrade kao "YYYY-MM-DD" (izbegava UTC/DST zabune) ──
function bgDateStr(d: Date): string {
  // en-CA daje YYYY-MM-DD format
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Belgrade", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

// Razlika u celim danima između dva "YYYY-MM-DD" stringa (b - a).
function dayDiff(aStr: string, bStr: string): number {
  const a = Date.parse(`${aStr}T00:00:00Z`);
  const b = Date.parse(`${bStr}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

async function sendResend(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error("[cron/trial-emails] RESEND_API_KEY missing"); return false; }
  const from = process.env.RESEND_FROM ?? "pikmi <noreply@pikmi.today>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to, reply_to: REPLY_TO, subject, html }),
    });
    if (!res.ok) {
      console.error("[cron/trial-emails] Resend error", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[cron/trial-emails] Resend fetch failed", e);
    return false;
  }
}

interface ProfileRow {
  user_id: string;
  email: string | null;
  first_name: string | null;
  plan: string | null;
  trial_ends_at: string | null;
  created_at: string | null;
  profile_url: string | null;
  profile_data: Record<string, any> | null;
  trial_email_2d_sent: boolean | null;
  trial_email_1d_sent: boolean | null;
  trial_email_expired_sent: boolean | null;
  portfolio_reminder_count: number | null;
  portfolio_reminder_last_date: string | null;
}

async function run() {
  const db = admin();
  const now = new Date();
  const todayStr = bgDateStr(now);

  const stats = { scanned: 0, portfolio: 0, trialA: 0, trialB: 0, trialC: 0, failed: 0 };

  // Paginacija (Supabase vraća max 1000 redova po pozivu)
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("profiles")
      .select("user_id,email,first_name,plan,trial_ends_at,created_at,profile_url,profile_data,trial_email_2d_sent,trial_email_1d_sent,trial_email_expired_sent,portfolio_reminder_count,portfolio_reminder_last_date")
      .or("plan.is.null,plan.neq.pro")
      .range(from, from + PAGE - 1);

    if (error) { console.error("[cron/trial-emails] query error", error); break; }
    const rows = (data ?? []) as ProfileRow[];
    if (rows.length === 0) break;

    for (const r of rows) {
      stats.scanned++;
      if (!r.email) continue;

      // Datum isteka trial-a: trial_ends_at, u suprotnom created_at + 7 dana
      let trialEnd: Date | null = null;
      if (r.trial_ends_at) trialEnd = new Date(r.trial_ends_at);
      else if (r.created_at) trialEnd = new Date(new Date(r.created_at).getTime() + 7 * 86400000);
      if (!trialEnd || isNaN(trialEnd.getTime())) continue;

      const diff = dayDiff(todayStr, bgDateStr(trialEnd)); // >0 aktivan, 0 ističe danas, <0 istekao
      const updates: Partial<ProfileRow> = {};
      let sentExpiryToday = false;

      // ── DEO 2: podsetnici za istek (vezani za datum, idempotentni preko flagova) ──
      if (diff === 2 && !r.trial_email_2d_sent) {
        const m = trialEmail("A", { name: r.first_name, ctaUrl: `${SITE}/account?tab=subscription` });
        if (await sendResend(r.email, m.subject, m.html)) {
          updates.trial_email_2d_sent = true; sentExpiryToday = true; stats.trialA++;
        } else stats.failed++;
      } else if (diff === 1 && !r.trial_email_1d_sent) {
        const m = trialEmail("B", { name: r.first_name, ctaUrl: `${SITE}/account?tab=subscription` });
        if (await sendResend(r.email, m.subject, m.html)) {
          updates.trial_email_1d_sent = true; sentExpiryToday = true; stats.trialB++;
        } else stats.failed++;
      } else if (diff <= 0 && !r.trial_email_expired_sent) {
        // Na dan isteka (ili catch-up ako je cron pao) → popup sa paketima iskoči u app-u.
        const m = trialEmail("C", { name: r.first_name, ctaUrl: `${SITE}/dashboard` });
        if (await sendResend(r.email, m.subject, m.html)) {
          updates.trial_email_expired_sent = true; sentExpiryToday = true; stats.trialC++;
        } else stats.failed++;
      }

      // ── DEO 1: podsetnik za portfolio (samo dok trial traje, max 1/dan, ne istog dana kao istek) ──
      if (!sentExpiryToday && diff > 0 && (r.portfolio_reminder_last_date ?? "") !== todayStr) {
        const st = portfolioStatus(r.profile_data);
        if (!st.complete) {
          const variation = r.portfolio_reminder_count ?? 0; // Dan 1 → varijacija index 0
          const ctaUrl = r.profile_url ? `${SITE}/moj-profil` : `${SITE}/onboarding`;
          const m = portfolioEmail(variation, {
            name: r.first_name, percent: st.percent, count: st.emptyKeys.length,
            list: formatSectionList(st.emptyLabels), ctaUrl,
          });
          if (await sendResend(r.email, m.subject, m.html)) {
            updates.portfolio_reminder_count = variation + 1;
            updates.portfolio_reminder_last_date = todayStr;
            stats.portfolio++;
          } else stats.failed++;
        }
      }

      if (Object.keys(updates).length > 0) {
        const { error: upErr } = await db.from("profiles").update(updates).eq("user_id", r.user_id);
        if (upErr) console.error("[cron/trial-emails] update error", r.user_id, upErr);
      }
    }

    if (rows.length < PAGE) break;
  }

  return stats;
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // bez tajne nikad ne dozvoli (sprečava slanje sa neautorizovanog poziva)
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const stats = await run();
    console.log("[cron/trial-emails] done", stats);
    return NextResponse.json({ ok: true, ...stats });
  } catch (e) {
    console.error("[cron/trial-emails] fatal", e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}

// Dozvoli i POST (manuelno okidanje sa istom tajnom)
export const POST = GET;
