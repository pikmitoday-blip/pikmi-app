import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 300;
export const metadata = { title: "Uslovi korišćenja — pikmi" };

const DEFAULT_HTML = `<h2>1. Prihvatanje uslova</h2>
<p>Korišćenjem platforme pikmi (dostupne na <strong>pikmi.today</strong>), potvrđuješ da si pročitao, razumio i da prihvataš ove Uslove korišćenja.</p>
<h2>2. Opis usluge</h2>
<p>pikmi je SaaS platforma koja omogućava freelancerima i profesionalcima da kreiraju personalizovane portfolio stranice i pitch linkove, prate aktivnost potencijalnih klijenata i koriste alate za outreach.</p>
<h2>3. Registracija i nalog</h2>
<p>Da bi koristio pikmi, potrebno je da kreiraš nalog sa validnom email adresom. Odgovoran si za čuvanje povjerljivosti lozinke i sve aktivnosti koje se odvijaju putem tvog naloga.</p>
<h2>4. Planovi i plaćanje</h2>
<p>pikmi nudi besplatni plan (7 dana, bez kreditne kartice) i Pro plan koji se naplaćuje mesečno. Pretplatu možeš otkazati u bilo kom trenutku. Plaćanje se vrši putem Stripe platforme.</p>
<h2>5. Dozvoljeno korišćenje</h2>
<p>Saglasan si da nećeš koristiti platformu za objavljivanje lažnih sadržaja, kršenje prava intelektualne svojine ili bilo kakvu nezakonitu aktivnost.</p>
<h2>6. Izmene uslova</h2>
<p>Zadržavamo pravo da izmenimo ove uslove u bilo kom trenutku. O značajnim izmenama obavestićemo te putem email adrese vezane za tvoj nalog.</p>
<h2>7. Kontakt</h2>
<p>Za sva pitanja: <a href="mailto:podrska@pikmi.today">podrska@pikmi.today</a></p>`;

async function getContent(): Promise<string> {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await sb.from("platform_settings").select("value").eq("key", "policy_uslovi").single();
    return data?.value || DEFAULT_HTML;
  } catch { return DEFAULT_HTML; }
}

export default async function UsloviPage() {
  const html = await getContent();

  return (
    <div style={{ background: "#08080F", minHeight: "100vh", color: "#fff", fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      <style>{`
        .policy-content h2 { font-size: 18px; font-weight: 700; color: #fff; margin: 28px 0 10px; }
        .policy-content p  { margin-bottom: 10px; color: rgba(255,255,255,0.6); line-height: 1.75; }
        .policy-content ul { padding-left: 20px; margin-bottom: 10px; }
        .policy-content li { margin-bottom: 6px; color: rgba(255,255,255,0.6); line-height: 1.75; }
        .policy-content a  { color: #A78BFA; text-decoration: none; }
        .policy-content strong { color: #fff; }
        .pnav-link { font-size: 14px; color: rgba(255,255,255,0.55); text-decoration: none; transition: color 0.15s; }
        .pnav-link:hover { color: rgba(255,255,255,0.9); }
      `}</style>

      {/* ── Nav (identičan landingu) ── */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 48px", height: 64, maxWidth: 1280, margin: "0 auto",
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(8,8,15,0.85)", backdropFilter: "blur(20px)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7C3AED,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff" }}>P</div>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>pikmi</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="/#features"  className="pnav-link">Features</a>
          <a href="/#how"       className="pnav-link">Kako funkcioniše</a>
          <a href="/#pricing"   className="pnav-link">Cene</a>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/login"    style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Login</Link>
          <Link href="/register" style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7C3AED,#6366F1)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Napravi profil</Link>
        </div>
      </nav>
      <div style={{ height: 1, background: "rgba(139,92,246,0.06)" }} />

      {/* ── Sadržaj ── */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 100px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "inline-flex", padding: "5px 14px", borderRadius: 100, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", fontSize: 11, fontWeight: 600, color: "#A78BFA", marginBottom: 16, letterSpacing: 0.5 }}>
            Pravni dokument
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 10, letterSpacing: -1 }}>Uslovi korišćenja</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Posljednje ažuriranje: maj 2026.</p>
        </div>

        <div
          className="policy-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div style={{ marginTop: 56, paddingTop: 28, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <Link href="/privatnost" style={{ color: "#A78BFA", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            Politika privatnosti →
          </Link>
          <Link href="/" style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, textDecoration: "none" }}>
            ← Nazad na pikmi
          </Link>
        </div>
      </div>

      {/* ── Footer (identičan landingu) ── */}
      <footer style={{ borderTop: "1px solid rgba(139,92,246,0.06)", padding: "28px 48px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,#7C3AED,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#fff" }}>P</div>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>pikmi</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>© 2026 pikmi. Sva prava zadržana.</div>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/uslovi"     style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textDecoration: "none" }}>Uslovi korišćenja</Link>
            <Link href="/privatnost" style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textDecoration: "none" }}>Politika privatnosti</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
