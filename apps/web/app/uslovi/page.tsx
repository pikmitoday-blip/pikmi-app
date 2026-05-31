import Link from "next/link";
import PikmiLogo from "../components/PikmiLogo";
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
<h2>6. Kontakt</h2>
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
          <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 12 }}>Uslovi korišćenja</h1>
          <p style={{ fontSize: 15, color: "var(--text2)" }}>Posljednje ažuriranje: maj 2026.</p>
        </div>

        <div
          style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 8 }}
          dangerouslySetInnerHTML={{ __html: html }}
          className="policy-content"
        />

        <div style={{ marginTop: 56, paddingTop: 32, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <Link href="/privatnost" style={{ color: "var(--purple)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            Politika privatnosti →
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
