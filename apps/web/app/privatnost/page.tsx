import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 300;
export const metadata = { title: "Politika privatnosti — pikmi" };

const DEFAULT_HTML = `<h2>1. Koje podatke prikupljamo</h2>
<p>Prikupljamo email adresu, ime i prezime, podatke profila koje sami unosiš, i tehničke podatke o korišćenju (IP adresa, tip uređaja, pregledi pitch linkova).</p>
<h2>2. Kako koristimo podatke</h2>
<p>Podaci se koriste za pružanje usluge, slanje notifikacija o aktivnostima na tvojim linkovima, i poboljšanje platforme. Ne prodajemo tvoje podatke trećim stranama.</p>
<h2>3. Kolačići i praćenje</h2>
<p>Koristimo kolačiće za autentifikaciju i analitiku. Ne koristimo kolačiće za reklamno praćenje.</p>
<h2>4. Čuvanje podataka</h2>
<p>Podaci se čuvaju u Supabase infrastrukturi (EU region). Možeš zatražiti brisanje svog naloga i svih podataka u bilo kom trenutku.</p>
<h2>5. Plaćanje</h2>
<p>Podaci o platnoj kartici se ne čuvaju na pikmi serverima — obrada se vrši putem Stripe platforme.</p>
<h2>6. Kontakt</h2>
<p>Za pitanja o privatnosti: <a href="mailto:podrska@pikmi.today">podrska@pikmi.today</a></p>`;

async function getContent(): Promise<string> {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await sb.from("platform_settings").select("value").eq("key", "policy_privatnost").single();
    return data?.value || DEFAULT_HTML;
  } catch { return DEFAULT_HTML; }
}

export default async function PrivatnostPage() {
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

      {/* ── Nav — logo levo, dugmad desno ── */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 24px", height: 60,
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(8,8,15,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(139,92,246,0.06)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <img src="/pikmilogo.jpg" alt="pikmi" width={26} height={26} style={{ objectFit: "contain", display: "block" }} />
          <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>pikmi</span>
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/login" style={{ padding: "7px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Login</Link>
          <Link href="/register" style={{ padding: "7px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7C3AED,#6366F1)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Napravi profil</Link>
        </div>
      </nav>

      {/* ── Sadržaj ── */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 100px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "inline-flex", padding: "5px 14px", borderRadius: 100, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", fontSize: 11, fontWeight: 600, color: "#A78BFA", marginBottom: 16, letterSpacing: 0.5 }}>
            Pravni dokument
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 10, letterSpacing: -1 }}>Politika privatnosti</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Posljednje ažuriranje: maj 2026.</p>
        </div>

        <div
          className="policy-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "none" }}>pikmi.today</Link>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid rgba(139,92,246,0.06)", padding: "28px 24px" }}>
        <style>{`@media(max-width:640px){.pf-footer{flex-direction:column!important;align-items:center!important;text-align:center!important;}}`}</style>
        <div className="pf-footer" style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
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
