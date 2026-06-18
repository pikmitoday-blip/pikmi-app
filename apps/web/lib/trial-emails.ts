// ─────────────────────────────────────────────────────────────────────────────
// Trial / onboarding email templates + portfolio-completeness helpers.
//
// Pure functions only (no I/O) so they can be unit-tested and reused.
// Slanje ide kroz Resend u app/api/cron/trial-emails/route.ts.
// ─────────────────────────────────────────────────────────────────────────────

/** Obavezne sekcije portfolija — 1:1 sa moj-profil/page.tsx (REQUIRED_SECTIONS).
 *  "Prethodni radovi" (portfolio/caseStudies) NIJE obavezna pa se ne računa. */
export const REQUIRED_SECTIONS = ["avatar", "service", "pricing", "stack", "experience", "testimonial"] as const;
export type SectionKey = (typeof REQUIRED_SECTIONS)[number];

/** Lepa imena sekcija za prikaz u mejlu (kao u editoru). */
export const SECTION_LABELS: Record<SectionKey, string> = {
  avatar: "Profilna slika",
  service: "Šta radim",
  pricing: "Paketi",
  stack: "Veštine",
  experience: "Iskustvo",
  testimonial: "Reči klijenata",
};

type AnyObj = Record<string, any>;

/** Da li je pojedina obavezna sekcija popunjena — ista logika kao `done` u editoru. */
export function sectionDone(pd: AnyObj | null | undefined, key: SectionKey): boolean {
  const src: AnyObj = pd ?? {};
  switch (key) {
    case "avatar":
      return !!(src.avatarUrl && String(src.avatarUrl).trim());
    case "service":
      return !!(src.serviceTitle && String(src.serviceTitle).trim());
    case "pricing":
      return (src.pricing ?? []).some((t: AnyObj) => t?.name?.trim() && t?.price?.trim());
    case "stack":
      return !!(src.stack && String(src.stack).trim());
    case "experience":
      return (src.experience ?? []).some((e: AnyObj) => e?.company?.trim() || e?.role?.trim());
    case "testimonial":
      return (src.testimonials ?? []).some((t: AnyObj) => t?.quote?.trim() && t?.name?.trim());
  }
}

export interface PortfolioStatus {
  /** Procenat popunjenosti (umnožak 20: 0,20,40,60,80,100). */
  percent: number;
  /** Ključevi praznih obaveznih sekcija. */
  emptyKeys: SectionKey[];
  /** Lepa imena praznih sekcija. */
  emptyLabels: string[];
  /** Da li su sve obavezne sekcije popunjene. */
  complete: boolean;
}

/** Izračunaj stanje portfolija iz profile_data JSON-a. */
export function portfolioStatus(pd: AnyObj | null | undefined): PortfolioStatus {
  const emptyKeys = REQUIRED_SECTIONS.filter(k => !sectionDone(pd, k));
  const filled = REQUIRED_SECTIONS.length - emptyKeys.length;
  return {
    percent: Math.round((filled / REQUIRED_SECTIONS.length) * 100),
    emptyKeys,
    emptyLabels: emptyKeys.map(k => SECTION_LABELS[k]),
    complete: emptyKeys.length === 0,
  };
}

/** "Veštine" · "Veštine i Reči klijenata" · "Veštine, Iskustvo i Reči klijenata" */
export function formatSectionList(labels: string[]): string {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} i ${labels[labels.length - 1]}`;
}

// ── HTML shell (isti vizuelni jezik kao postojeći notify mejl) ───────────────
function shell(opts: { bodyHtml: string; ctaText: string; ctaUrl: string }): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:32px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#7C3AED,#5B21B6);padding:24px 32px;">
            <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">pikmi</div>
          </td>
        </tr>
        <tr>
          <td style="padding:30px 32px;">
            ${opts.bodyHtml}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
              <tr><td align="center">
                <a href="${opts.ctaUrl}" style="display:inline-block;background:#7C3AED;color:#fff;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
                  ${opts.ctaText}
                </a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#F8F5FF;padding:16px 32px;text-align:center;border-top:1px solid #EDE9FE;">
            <p style="margin:0;font-size:11px;color:#AAA;">pikmi.today · Ako ti ovo ne treba, samo ignoriši mejl.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;color:#222;font-size:15px;line-height:1.6;">${text}</p>`;
}

function greeting(name?: string | null): string {
  const n = (name ?? "").trim();
  return n ? `Zdravo ${escapeHtml(n)},` : "Zdravo,";
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

export interface PortfolioVars {
  name?: string | null;
  percent: number;
  count: number;           // broj praznih sekcija
  list: string;            // formatirana lista praznih sekcija
  ctaUrl: string;
}

const CTA_PORTFOLIO = "Završi portfolio →";

/** 6 varijacija (Dan 1..6) — ista struktura, drugačiji ton. index 0..5 */
export function portfolioEmail(variation: number, v: PortfolioVars): { subject: string; html: string } {
  const g = greeting(v.name);
  const variants: Array<{ subject: string; body: string }> = [
    { // Dan 1
      subject: `Tvoj portfolio je ${v.percent}% gotov`,
      body: p(g) + p(`Tvoj portfolio je skoro spreman — popunjeno je <strong>${v.percent}%</strong>.`) +
        p(`Ostalo ti je još: <strong>${v.list}</strong>.`) + p(`Završi i možeš odmah da ga šalješ klijentima.`),
    },
    { // Dan 2
      subject: `Još ${v.count} ${v.count === 1 ? "sekcija" : "sekcije/sekcija"} do gotovog portfolija`,
      body: p(g) + p(`Fali ti samo još malo — portfolio ti je <strong>${v.percent}%</strong> gotov.`) +
        p(`Nepopunjeno: <strong>${v.list}</strong>.`) + p(`Treba ti par minuta da završiš.`),
    },
    { // Dan 3
      subject: `Tvoj portfolio te čeka`,
      body: p(g) + p(`Portfolio ti stoji na <strong>${v.percent}%</strong>. Šteta da ostane nedovršen.`) +
        p(`Da završiš, ostalo je: <strong>${v.list}</strong>.`),
    },
    { // Dan 4
      subject: `${v.percent}% — skoro pa gotovo`,
      body: p(g) + p(`Već si odradio <strong>${v.percent}%</strong> — najteži deo je iza tebe.`) +
        p(`Ostalo: <strong>${v.list}</strong>.`) + p(`Završi danas i portfolio je spreman.`),
    },
    { // Dan 5
      subject: `Ne daj da ti portfolio ostane nedovršen`,
      body: p(g) + p(`Portfolio ti je <strong>${v.percent}%</strong> popunjen i čeka samo: <strong>${v.list}</strong>.`) +
        p(`Par minuta i gotov je.`),
    },
    { // Dan 6
      subject: `Poslednji korak do tvog portfolija`,
      body: p(g) + p(`Ostalo ti je samo <strong>${v.list}</strong> da kompletiraš portfolio (<strong>${v.percent}%</strong> gotov).`) +
        p(`Završi sada dok ti je trial još aktivan.`),
    },
  ];
  const chosen = variants[((variation % 6) + 6) % 6];
  return {
    subject: chosen.subject,
    html: shell({ bodyHtml: chosen.body, ctaText: CTA_PORTFOLIO, ctaUrl: v.ctaUrl }),
  };
}

export type TrialKind = "A" | "B" | "C";

export interface TrialVars {
  name?: string | null;
  ctaUrl: string;
}

/** Mejlovi pred/na istek trial-a. */
export function trialEmail(kind: TrialKind, v: TrialVars): { subject: string; html: string } {
  const g = greeting(v.name);
  if (kind === "A") {
    return {
      subject: `Tvoj Pikmi trial ističe za 2 dana`,
      html: shell({
        bodyHtml: p(g) + p(`Tvoj besplatni trial ističe za <strong>2 dana</strong>.`) +
          p(`Ako želiš da nastaviš da koristiš Pikmi — pitch linkove, tracking i sve ostalo — izaberi plan i nastavi bez prekida.`),
        ctaText: "Pogledaj planove →", ctaUrl: v.ctaUrl,
      }),
    };
  }
  if (kind === "B") {
    return {
      subject: `Tvoj Pikmi trial ističe sutra`,
      html: shell({
        bodyHtml: p(g) + p(`Još samo dan i tvoj trial ističe.`) +
          p(`Pretplati se danas da ti portfolio i pitch linkovi ostanu aktivni.`),
        ctaText: "Nastavi sa Pikmi →", ctaUrl: v.ctaUrl,
      }),
    };
  }
  return {
    subject: `Tvoj Pikmi trial je danas istekao`,
    html: shell({
      bodyHtml: p(g) + p(`Tvoj besplatni trial je danas istekao.`) +
        p(`Ako želiš da nastaviš — tvoj portfolio, pitch linkovi i tracking su tu, čekaju te.`),
      ctaText: "Aktiviraj Pikmi →", ctaUrl: v.ctaUrl,
    }),
  };
}
