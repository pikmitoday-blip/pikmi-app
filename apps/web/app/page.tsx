import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import CheckoutButton from "./components/CheckoutButton";
import Checkout3MButton from "./components/Checkout3MButton";
import LandingMockup, { MockupLink } from "./components/LandingMockup";

export const revalidate = 300; // 5 min cache

async function getSettings(): Promise<Record<string, string>> {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await sb.from("platform_settings").select("key, value");
    const map: Record<string, string> = {};
    (data ?? []).forEach((r: any) => { map[r.key] = r.value; });
    return map;
  } catch { return {}; }
}

function s(settings: Record<string, string>, key: string, def: string) {
  return settings[key] ?? def;
}

export default async function Home() {
  const settings = await getSettings();
  const g = (key: string, def: string) => s(settings, key, def);

  // ── Mockup data ──────────────────────────────────────────────────────────
  let mockupLinks: MockupLink[] = [
    { name: "Elon Musk",   slug: "elon-musk",  views: 12, hot: true  },
    { name: "Jeff Bezos",  slug: "jeff-bezos", views: 5,  hot: false },
    { name: "Lidl",        slug: "lidl",       views: 2,  hot: false },
  ];
  try {
    const raw = settings["mockup_links"];
    if (raw) mockupLinks = JSON.parse(raw);
  } catch {}

  const hotleadName     = g("mockup_hotlead_name",     "Elon Musk");
  const hotleadViews    = g("mockup_hotlead_views",    "12");
  const hotleadTime     = g("mockup_hotlead_time",     "danas u 14:27");
  const hotleadDuration = g("mockup_hotlead_duration", "4m 12s");
  const hotleadOpens    = g("mockup_hotlead_opens",    "3");

  // ── Freelancer badges ─────────────────────────────────────────────────────
  const badges = g("freelancer_badges", "Dizajneri,Video editori,SMM menadžeri,Copywriteri,Fotografi,Web developeri")
    .split(",").map(b => b.trim()).filter(Boolean);

  // ── Hero ─────────────────────────────────────────────────────────────────
  const heroBadge    = g("hero_badge",    "✦ Tailored portfolios. Real connections.");
  const heroTitle    = g("hero_title",    "Portfolio koji zatvara klijente dok spavaš.");
  const heroSubtitle = g("hero_subtitle", "Personalizovani portfolio link za svakog klijenta. Vidi ko gleda, šta gleda i kada je spreman.");
  const heroCta1     = g("hero_cta1",     "Kreiraj profil besplatno");
  const heroNote     = g("hero_note",     "Free · 7 dana · Bez kreditne kartice");

  // ── How it works ──────────────────────────────────────────────────────────
  const steps = [
    { n: "01", color: "#8B5CF6", title: g("how_step1_title", "Kreiraj profil"),    desc: g("how_step1_desc", "Popuni za 5 minuta. Dodaj projekte, opis i boje.") },
    { n: "02", color: "#A855F7", title: g("how_step2_title", "Podeli pitch link"),  desc: g("how_step2_desc", "Za svakog klijenta personalizovan link sa porukom.") },
    { n: "03", color: "#D946EF", title: g("how_step3_title", "Prati i reaguj"),     desc: g("how_step3_desc", "Dobijaš notifikaciju. Vidiš šta gledaju. Pišeš im u pravom momentu.") },
  ];

  // ── Pricing ───────────────────────────────────────────────────────────────
  const freeFeatures  = g("pricing_free_features",  "Osnovni profil\nOgraničen broj pitch linkova\nStatistika pregleda").split("\n").filter(Boolean);
  const proFeatures   = g("pricing_pro_features",   "Neograničeno pitch linkova\nSve sekcije profila\nReal-time tracking i notifikacije\nOutreach kit (DM + email + follow-up)\nCustom boje i fontovi\nPriorizetna podrška").split("\n").filter(Boolean);
  const toLower = (s: string) => s.replace(/\bDIN\b/g, "din").replace(/\bRSD\b/g, "rsd");
  const proPrice      = toLower(g("pricing_pro_price",      "990 din"));
  const proNote       = g("pricing_pro_note",       "Manje od jedne kafe nedeljno");
  const pro3Price     = toLower(g("pricing_pro3_price",     "2490 din"));
  const pro3Note      = g("pricing_pro3_note",      "Uštedi 17%");
  const pro3Saving    = toLower(g("pricing_pro3_saving",    "~830 din mesečno · ušteda ~480 din"));

  // ── CTA / Footer ─────────────────────────────────────────────────────────
  const ctaTitle    = g("cta_title",    "Spreman da zatvoriš prvi deal?");
  const ctaSub      = g("cta_subtitle", "Kreiraj profil za 5 minuta. Besplatno.");
  const footerCopy  = g("footer_copy",  "© 2026 pikmi. Sva prava zadržana.");

  // ── Tipografija ───────────────────────────────────────────────────────────
  const FONT_MAP: Record<string, string> = {
    "system":        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    "inter":         "'Inter', sans-serif",
    "space-grotesk": "'Space Grotesk', sans-serif",
    "plus-jakarta":  "'Plus Jakarta Sans', sans-serif",
    "outfit":        "'Outfit', sans-serif",
    "geist":         "'Geist', sans-serif",
  };
  const GFONTS: Record<string, string> = {
    "inter":         "Inter:wght@400;600;700;800;900",
    "space-grotesk": "Space+Grotesk:wght@400;600;700;800",
    "plus-jakarta":  "Plus+Jakarta+Sans:wght@400;600;700;800;900",
    "outfit":        "Outfit:wght@400;600;700;800;900",
  };
  const fontHeading   = FONT_MAP[g("font_heading", "system")] ?? FONT_MAP["system"];
  const fontBody      = FONT_MAP[g("font_body",    "system")] ?? FONT_MAP["system"];
  const fsHero        = parseInt(g("font_size_hero",     "58"))  || 58;
  const fsSection     = parseInt(g("font_size_section",  "40"))  || 40;
  const fsSubtitle    = parseInt(g("font_size_subtitle", "17"))  || 17;
  const fsBody        = parseInt(g("font_size_body",     "14"))  || 14;

  // Google Fonts to import
  const gfontImports = [...new Set([
    GFONTS[g("font_heading", "system")],
    GFONTS[g("font_body",    "system")],
  ])].filter(Boolean).map(f => `@import url('https://fonts.googleapis.com/css2?family=${f}&display=swap');`).join("\n");

  return (
    <div style={{ background: "#08080F", minHeight: "100vh", color: "#fff", fontFamily: fontBody, overflowX: "hidden" }}>

      {/* ── Global inline styles ── */}
      <style>{`${gfontImports}
        .landing-nav-link { font-size: 14px; color: rgba(255,255,255,0.55); text-decoration: none; transition: color 0.15s; }
        .landing-nav-link:hover { color: rgba(255,255,255,0.9); }
        .landing-btn-ghost:hover { border-color: rgba(255,255,255,0.2) !important; color: #fff !important; }
        @media (max-width: 768px) {
          * { box-sizing: border-box; }
          body { overflow-x: hidden; }
          .hero-grid { flex-direction: column !important; align-items: stretch !important; width: 100% !important; }
          .hero-mockup {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            flex-shrink: 1 !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
          }
          .hero-mockup > div { width: 100% !important; box-sizing: border-box !important; }
          .hero-text { max-width: 100% !important; text-align: center !important; width: 100% !important; }
          .hero-text p { margin-left: auto !important; margin-right: auto !important; }
          .hero-cta-wrap { justify-content: center !important; }
          .how-grid { flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .how-grid > div { align-items: center !important; }
          .pricing-grid { flex-direction: column !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .nav-links-desktop { display: none !important; }
          .hero-title { font-size: 44px !important; letter-spacing: -1.5px !important; }
          section h2 { font-size: 26px !important; letter-spacing: -0.5px !important; }
          section { padding-left: 16px !important; padding-right: 16px !important; padding-top: 40px !important; padding-bottom: 40px !important; }
          nav { padding-left: 16px !important; padding-right: 16px !important; }
          footer { padding: 24px 16px !important; }
          footer > div { flex-direction: column !important; align-items: center !important; text-align: center !important; gap: 12px !important; }
        }
      `}</style>

      {/* ══ NAV ══ */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 48px", height: 64, maxWidth: 1280, margin: "0 auto",
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(8,8,15,0.85)", backdropFilter: "blur(20px)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <img src="/pikmilogo.jpg" alt="pikmi" width={28} height={28} style={{ objectFit: "contain", display: "block" }} />
          <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>pikmi</span>
        </Link>

        <div className="nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="/#features"  className="landing-nav-link">Features</a>
          <a href="/#how"       className="landing-nav-link">Kako funkcioniše</a>
          <a href="/#pricing"   className="landing-nav-link">Cene</a>
          {/* Blog — privremeno sakriveno, vratiti kada bude spreman
          <Link href="/blog"    className="landing-nav-link">Blog</Link>
          */}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/login" style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, textDecoration: "none", transition: "all 0.15s" }} className="landing-btn-ghost">Login</Link>
          <Link href="/register" style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7C3AED,#6366F1)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Napravi profil</Link>
        </div>
      </nav>
      <div style={{ height: 1, background: "rgba(139,92,246,0.06)" }} />

      {/* ══ HERO ══ */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 48px 60px", position: "relative" }}>
        {/* Glow */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 800, height: 600, background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 60%)", pointerEvents: "none" }} />

        <div className="hero-grid" style={{ display: "flex", alignItems: "center", gap: 64, position: "relative" }}>
          {/* Left — text */}
          <div className="hero-text" style={{ flex: 1, maxWidth: 560 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 100, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 28, letterSpacing: 0.3 }}>
              {heroBadge}
            </div>
            <h1 className="hero-title" style={{ fontSize: fsHero, fontWeight: 900, letterSpacing: -2, lineHeight: 1.07, marginBottom: 20, color: "#fff", fontFamily: fontHeading }}>
              {heroTitle.includes("dok spavaš") ? (
                <>
                  {heroTitle.split("dok spavaš")[0]}
                  <span style={{ background: "linear-gradient(135deg,#A855F7,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>dok spavaš.</span>
                </>
              ) : heroTitle}
            </h1>
            <p style={{ fontSize: fsSubtitle, color: "rgba(255,255,255,0.4)", lineHeight: 1.65, marginBottom: 36, maxWidth: 460 }}>
              {heroSubtitle}
            </p>
            <div className="hero-cta-wrap" style={{ display: "flex", justifyContent: "flex-start", marginBottom: 14 }}>
              <Link href="/register" style={{ padding: "15px 36px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#7C3AED,#6366F1)", color: "#fff", fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 32px rgba(124,58,237,0.35)", letterSpacing: -0.2, display: "inline-block" }}>
                {heroCta1}
              </Link>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>{heroNote}</p>
          </div>

          {/* Right — mockup */}
          <div className="hero-mockup" style={{ width: 420, flexShrink: 0, minWidth: 0, boxSizing: "border-box" }}>
            <LandingMockup
              links={mockupLinks}
              hotleadName={hotleadName}
              hotleadViews={hotleadViews}
              hotleadTime={hotleadTime}
              hotleadDuration={hotleadDuration}
              hotleadOpens={hotleadOpens}
            />
          </div>
        </div>
      </section>

      {/* ══ WHO IS THIS FOR ══ */}
      <section style={{ padding: "32px 48px 48px", textAlign: "center", maxWidth: 1280, margin: "0 auto" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.25)", marginBottom: 14, letterSpacing: 0.5, textTransform: "uppercase" }}>Za kreativce i freelancere</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {badges.map((b, i) => (
            <span key={i} style={{ padding: "7px 16px", borderRadius: 100, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.1)", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>{b}</span>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <div style={{ background: "linear-gradient(180deg,rgba(139,92,246,0.04) 0%,transparent 100%)", width: "100%" }}>
      <section id="features" style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 48px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "linear-gradient(135deg,#A855F7,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 14 }}>Features</div>
          <h2 style={{ fontSize: fsSection, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.1, fontFamily: fontHeading }}>Sve što ti treba da<br />zatvoriš posao</h2>
        </div>

        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Feature 1 — Personalization */}
          <div className="landing-feature-card" style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.08)", borderRadius: 20, padding: "28px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎯</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>{g("feature1_title", "Personalizovano")}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{g("feature1_sub", "Svaki klijent dobija svoj link")}</div>
              </div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(139,92,246,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,#3B82F6,#6366F1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>C</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Hey Coca Cola, ovo je za vas.</span>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>pikmi.today/coca-cola</div>
            </div>
          </div>

          {/* Feature 2 — Tracking */}
          <div className="landing-feature-card" style={{ background: "rgba(245,158,11,0.03)", border: "1px solid rgba(245,158,11,0.07)", borderRadius: 20, padding: "28px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👁</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>{g("feature2_title", "Prati interes")}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{g("feature2_sub", "Real-time otvaranja i notifikacije")}</div>
              </div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "12px 16px", border: "1px solid rgba(245,158,11,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>✉️</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Klijent je otvorio tvoj link</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>upravo sada</div>
                </div>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#EF4444", background: "rgba(239,68,68,0.12)", padding: "3px 9px", borderRadius: 100 }}>🔥</span>
            </div>
          </div>

          {/* Feature 3 — Outreach Kit */}
          <div className="landing-feature-card" style={{ background: "rgba(16,185,129,0.03)", border: "1px solid rgba(16,185,129,0.07)", borderRadius: 20, padding: "28px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✉️</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>{g("feature3_title", "Outreach kit")}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{g("feature3_sub", "Cold DM, email i follow-up šabloni")}</div>
              </div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, border: "1px solid rgba(16,185,129,0.06)", overflow: "hidden", position: "relative" }}>
              <div style={{ padding: "14px 16px 6px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "rgba(16,185,129,0.5)", marginBottom: 8 }}>Outreach dokument</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>Pozicioniranje — morate se predstaviti kao ekspert koji edukuje klijenta.</div>
              </div>
              <div style={{ position: "relative", padding: "4px 16px 14px" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, filter: "blur(4px)", userSelect: "none" }}>
                  Ponuda mora biti jasna i specifična. Klijent mora razumeti šta dobija, u kom roku i za koju cenu.
                </div>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg,transparent,rgba(0,0,0,0.5))" }}>
                  <span style={{ fontSize: 24 }}>🔒</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4 — Quick Setup */}
          <div className="landing-feature-card" style={{ background: "rgba(139,92,246,0.03)", border: "1px solid rgba(139,92,246,0.07)", borderRadius: 20, padding: "28px 24px", display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(250,204,21,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, marginTop: 2 }}>⚡</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3, marginBottom: 8 }}>{g("feature4_title", "Profil spreman za 5 minuta")}</div>
              <div style={{ fontSize: fsBody, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>{g("feature4_desc", "Bez dizajnera. Bez kodiranja. Bez čekanja. Onboarding te vodi korak po korak.")}</div>
            </div>
          </div>
        </div>
      </section>
      </div> {/* end features full-width bg */}

      {/* ══ HOW IT WORKS ══ */}
      <section id="how" style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 48px 56px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "linear-gradient(135deg,#A855F7,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 14 }}>Kako funkcioniše</div>
        <h2 style={{ fontSize: fsSection, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 56, fontFamily: fontHeading }}>
          {g("how_title", "3 koraka do prvog klijenta")}
        </h2>
        <div className="how-grid" style={{ display: "flex", gap: 32, textAlign: "left" }}>
          {steps.map((step, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg,${step.color},${step.color}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "#fff", boxShadow: `0 6px 20px ${step.color}40` }}>{step.n}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 8, color: "#fff" }}>{step.title}</div>
                <div style={{ fontSize: fsBody, color: "rgba(255,255,255,0.35)", lineHeight: 1.65 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <div style={{ background: "linear-gradient(180deg,rgba(139,92,246,0.04) 0%,transparent 100%)", width: "100%" }}>
      <section id="pricing" style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 48px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "linear-gradient(135deg,#A855F7,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 14 }}>Cene</div>
          <h2 style={{ fontSize: fsSection, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.1, fontFamily: fontHeading }}>Jednostavna cena.<br />Ozbiljan alat.</h2>
        </div>
        <div className="pricing-grid" style={{ display: "flex", gap: 16, alignItems: "stretch" }}>

          {/* Free */}
          <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>FREE</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: -2, color: "#fff" }}>0 din</span>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginBottom: 24 }}>7 dana besplatno · bez kreditne kartice</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
              {freeFeatures.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "rgba(255,255,255,0.45)" }}>
                  <span style={{ color: "#10B981", fontSize: 12 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <Link href="/register" style={{ display: "block", textAlign: "center", padding: "14px 0", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Počni besplatno
            </Link>
          </div>

          {/* Pro Monthly */}
          <div style={{ flex: 1, background: "linear-gradient(135deg,rgba(124,58,237,0.08),rgba(99,102,241,0.05))", border: "1.5px solid rgba(139,92,246,0.3)", borderRadius: 24, padding: "28px 24px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 0 0 1px rgba(139,92,246,0.1), 0 8px 40px rgba(124,58,237,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#A855F7" }}>PRO MESEČNO</div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: "linear-gradient(135deg,#7C3AED,#A855F7)", padding: "4px 14px", borderRadius: 999, letterSpacing: "0.05em", boxShadow: "0 2px 12px rgba(124,58,237,0.5)" }}>🔥 NAJPOPULARNIJE</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: -2, background: "linear-gradient(135deg,#A855F7,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{proPrice}</span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>/mes</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 22 }}>{proNote}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
              {proFeatures.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
                  <span style={{ color: "#A855F7", fontSize: 12 }}>✦</span> {f}
                </div>
              ))}
            </div>
            <CheckoutButton />
          </div>

          {/* Pro 3 Months */}
          <div style={{ flex: 1, background: "rgba(16,185,129,0.03)", border: "1.5px solid rgba(16,185,129,0.18)", borderRadius: 24, padding: "28px 24px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#10B981" }}>PRO 3 MESECA</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.18)", padding: "3px 10px", borderRadius: 100 }}>{pro3Note}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: -2, color: "#10B981" }}>{pro3Price}</span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>/3 mes</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 22 }}>{pro3Saving}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
              {["Sve iz Pro mesečnog plana", "Zaključana niža cena za 3 meseca"].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "rgba(255,255,255,0.45)" }}>
                  <span style={{ color: "#10B981", fontSize: 12 }}>✦</span> {f}
                </div>
              ))}
            </div>
            <Checkout3MButton />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 10 }}>Najbolja vrednost</p>
          </div>

        </div>
      </section>
      </div> {/* end pricing full-width bg */}

      {/* ══ CTA ══ */}
      <section style={{ padding: "80px 48px", textAlign: "center", background: "linear-gradient(180deg,transparent,rgba(139,92,246,0.05))" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: fsSection + 4, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 14, color: "#fff", fontFamily: fontHeading }}>
            {ctaTitle.includes("deal") ? (
              <>
                {ctaTitle.split("deal")[0]}
                <span style={{ background: "linear-gradient(135deg,#A855F7,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>deal?</span>
              </>
            ) : ctaTitle}
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.35)", marginBottom: 32 }}>{ctaSub}</p>
          <Link href="/register" style={{ display: "inline-block", padding: "16px 48px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#7C3AED,#6366F1)", color: "#fff", fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 32px rgba(124,58,237,0.3)" }}>
            Kreiraj profil besplatno →
          </Link>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: "1px solid rgba(139,92,246,0.06)", padding: "32px 48px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/pikmilogo.jpg" alt="pikmi" width={24} height={24} style={{ objectFit: "contain", display: "block" }} />
            <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>pikmi</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", flex: 1, textAlign: "center" }}>{footerCopy}</div>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/uslovi"     style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textDecoration: "none" }}>Uslovi korišćenja</Link>
            <Link href="/privatnost" style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textDecoration: "none" }}>Politika privatnosti</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
