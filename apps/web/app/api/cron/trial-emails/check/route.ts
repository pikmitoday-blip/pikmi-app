import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { portfolioStatus, trialEmail } from "../../../../../lib/trial-emails";

// ─────────────────────────────────────────────────────────────────────────────
// DIJAGNOSTIKA — bezbedna provera setapa (NE šalje mejlove pravim korisnicima).
//   GET /api/cron/trial-emails/check            → env + dry-run skan (ko BI dobio)
//   GET /api/cron/trial-emails/check?testTo=...  → pošalje JEDAN test mejl na tu adresu
// Zaštićeno istim CRON_SECRET-om kao i sam cron.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const REPLY_TO = "hello@pikmi.today";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
function bgDateStr(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Belgrade", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
function dayDiff(aStr: string, bStr: string): number {
  return Math.round((Date.parse(`${bStr}T00:00:00Z`) - Date.parse(`${aStr}T00:00:00Z`)) / 86400000);
}
function authorized(req: NextRequest): boolean {
  const s = process.env.CRON_SECRET;
  if (!s) return false;
  return req.headers.get("authorization") === `Bearer ${s}`;
}

async function dryScan() {
  const db = admin();
  const todayStr = bgDateStr(new Date());
  const out: any = {
    migrationOk: true, columnsError: null,
    scanned: 0, withEmail: 0,
    wouldSendToday: { portfolio: 0, trialA: 0, trialB: 0, trialC: 0 },
  };
  const { data, error } = await db
    .from("profiles")
    .select("user_id,email,first_name,plan,trial_ends_at,created_at,profile_url,profile_data,trial_email_2d_sent,trial_email_1d_sent,trial_email_expired_sent,portfolio_reminder_count,portfolio_reminder_last_date")
    .or("plan.is.null,plan.neq.pro")
    .range(0, 999);
  if (error) { out.migrationOk = false; out.columnsError = error.message; return out; }
  const rows = data ?? [];
  out.scanned = rows.length;
  for (const r of rows as any[]) {
    if (r.email) out.withEmail++;
    let trialEnd: Date | null = null;
    if (r.trial_ends_at) trialEnd = new Date(r.trial_ends_at);
    else if (r.created_at) trialEnd = new Date(new Date(r.created_at).getTime() + 7 * 86400000);
    if (!trialEnd || isNaN(trialEnd.getTime()) || !r.email) continue;
    const diff = dayDiff(todayStr, bgDateStr(trialEnd));
    let exp = false;
    if (diff === 2 && !r.trial_email_2d_sent) { out.wouldSendToday.trialA++; exp = true; }
    else if (diff === 1 && !r.trial_email_1d_sent) { out.wouldSendToday.trialB++; exp = true; }
    else if (diff <= 0 && diff >= -1 && !r.trial_email_expired_sent) { out.wouldSendToday.trialC++; exp = true; }
    if (!exp && diff > 0 && (r.portfolio_reminder_last_date ?? "") !== todayStr) {
      if (!portfolioStatus(r.profile_data).complete) out.wouldSendToday.portfolio++;
    }
  }
  return out;
}

async function testSend(to: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, detail: "RESEND_API_KEY nije postavljen" };
  const from = process.env.RESEND_FROM ?? "pikmi <noreply@pikmi.today>";
  const m = trialEmail("A", { name: "Test", ctaUrl: "https://www.pikmi.today/account?tab=subscription" });
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to, reply_to: REPLY_TO, subject: "[TEST] " + m.subject, html: m.html }),
    });
    const text = await res.text();
    let detail: any = text; try { detail = JSON.parse(text); } catch {}
    return { ok: res.ok, status: res.status, from, replyTo: REPLY_TO, detail };
  } catch (e) { return { ok: false, detail: String(e) }; }
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const env = {
    hasResendKey: !!process.env.RESEND_API_KEY,
    resendFrom: process.env.RESEND_FROM ?? "(nije postavljen — fallback noreply@pikmi.today)",
    hasCronSecret: !!process.env.CRON_SECRET,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  const testTo = new URL(req.url).searchParams.get("testTo");
  if (testTo) {
    const t = await testSend(testTo);
    return NextResponse.json({ ok: t.ok, env, testSend: t });
  }
  const scan = await dryScan();
  return NextResponse.json({ ok: true, env, scan });
}
export const POST = GET;
