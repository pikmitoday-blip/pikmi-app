import Link from "next/link";
import PikmiLogo from "../components/PikmiLogo";
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
    <div style={{ background: "var(--bg)", minHeight: "100vh", fontFamily: "'Satoshi', -apple-system, sans-serif" }}>
      <nav className="nav-top">
        <Link href="/" className="nav-logo">
          <PikmiLogo size={32} />
          pikmi
        </Link>
        <div className="nav-actions">
          <Link href="/login" className="btn btn-ghost btn-sm">Login</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px 100px" }}>
        <div style={{ marginBottom: 48 }}>
          <div className="badge badge-purple" style={{ marginBottom: 16, display: "inline-flex" }}>Pravni dokument</div>
          <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 12 }}>Politika privatnosti</h1>
          <p style={{ fontSize: 15, color: "var(--text2)" }}>Posljednje ažuriranje: maj 2026.</p>
        </div>

        <div
          style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 8 }}
          dangerouslySetInnerHTML={{ __html: html }}
          className="policy-content"
        />

        <div style={{ marginTop: 56, paddingTop: 32, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <Link href="/uslovi" style={{ color: "var(--purple)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            Uslovi korišćenja →
          </Link>
          <Link href="/" style={{ color: "var(--text3)", fontSize: 14, textDecoration: "none" }}>
            ← Nazad na pikmi
          </Link>
        </div>
      </div>

      <style>{`
        .policy-content h2 { font-size: 20px; font-weight: 700; color: var(--text); margin: 32px 0 12px; }
        .policy-content p  { margin-bottom: 10px; }
        .policy-content ul { padding-left: 20px; margin-bottom: 10px; }
        .policy-content li { margin-bottom: 6px; }
        .policy-content a  { color: var(--purple); }
        .policy-content strong { color: var(--text); }
      `}</style>
    </div>
  );
}
