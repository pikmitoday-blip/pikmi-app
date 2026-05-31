"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

const DEFAULT_USLOVI = `<h2>1. Prihvatanje uslova</h2>
<p>Korišćenjem platforme pikmi (dostupne na <strong>pikmi.today</strong>), potvrđuješ da si pročitao, razumio i da prihvataš ove Uslove korišćenja.</p>

<h2>2. Opis usluge</h2>
<p>pikmi je SaaS platforma koja omogućava freelancerima i profesionalcima da kreiraju personalizovane portfolio stranice i pitch linkove, prate aktivnost potencijalnih klijenata i koriste alate za outreach.</p>

<h2>3. Registracija i nalog</h2>
<p>Da bi koristio pikmi, potrebno je da kreiraš nalog sa validnom email adresom. Odgovoran si za čuvanje povjerljivosti lozinke i sve aktivnosti koje se odvijaju putem tvog naloga.</p>

<h2>4. Planovi i plaćanje</h2>
<p>pikmi nudi besplatni plan (7 dana, bez kreditne kartice) i Pro plan koji se naplaćuje mesečno. Pretplatu možeš otkazati u bilo kom trenutku. Plaćanje se vrši putem Stripe platforme.</p>

<h2>5. Dozvoljeno korišćenje</h2>
<p>Saglasan si da nećeš koristiti platformu za objavljivanje lažnih sadržaja, kršenje prava intelektualne svojine, slanje neželjene pošte ili bilo kakvu nezakonitu aktivnost.</p>

<h2>6. Izmene uslova</h2>
<p>Zadržavamo pravo da izmenimo ove uslove u bilo kom trenutku. O značajnim izmenama obavestićemo te putem email adrese vezane za tvoj nalog.</p>

<h2>7. Kontakt</h2>
<p>Za sva pitanja: <a href="mailto:podrska@pikmi.today">podrska@pikmi.today</a></p>`;

const DEFAULT_PRIVATNOST = `<h2>1. Koje podatke prikupljamo</h2>
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

type PolicyKey = "policy_uslovi" | "policy_privatnost";

export default function AdminPolise() {
  const [activeTab, setActiveTab] = useState<PolicyKey>("policy_uslovi");
  const [content, setContent] = useState<Record<PolicyKey, string>>({
    policy_uslovi: DEFAULT_USLOVI,
    policy_privatnost: DEFAULT_PRIVATNOST,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadPolicies(); }, []);

  async function loadPolicies() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["policy_uslovi", "policy_privatnost"]);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(r => { map[r.key] = r.value; });
        setContent(prev => ({
          policy_uslovi: map.policy_uslovi ?? prev.policy_uslovi,
          policy_privatnost: map.policy_privatnost ?? prev.policy_privatnost,
        }));
      }
    } catch {}
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    try {
      const rows = [
        { key: "policy_uslovi", value: content.policy_uslovi, updated_at: new Date().toISOString() },
        { key: "policy_privatnost", value: content.policy_privatnost, updated_at: new Date().toISOString() },
      ];
      const { error } = await supabase.from("platform_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Greška pri čuvanju. Provjeri tabelu platform_settings.");
    }
    setSaving(false);
  }

  const tabs: { key: PolicyKey; label: string; url: string }[] = [
    { key: "policy_uslovi",     label: "Uslovi korišćenja",    url: "/uslovi"     },
    { key: "policy_privatnost", label: "Politika privatnosti",  url: "/privatnost" },
  ];

  const INP: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 8,
    background: "#0D0D12", border: "1px solid rgba(255,255,255,0.1)",
    color: "#F9FAFB", fontSize: 13, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
    resize: "vertical" as const, lineHeight: 1.6,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F9FAFB", marginBottom: 4 }}>Pravne stranice</h1>
          <p style={{ fontSize: 13, color: "#6B7280" }}>Uređuj sadržaj uslova korišćenja i politike privatnosti (HTML)</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 12, color: "#4ADE80", fontWeight: 600 }}>✓ Sačuvano!</span>}
          <a href={tabs.find(t => t.key === activeTab)?.url} target="_blank" rel="noreferrer" style={{
            padding: "9px 16px", borderRadius: 8, fontSize: 13,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#9CA3AF", textDecoration: "none",
          }}>
            Pregled ↗
          </a>
          <button onClick={save} disabled={saving || loading} style={{
            padding: "9px 20px", borderRadius: 8, cursor: saving ? "default" : "pointer",
            background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
            border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Čuvanje..." : "Sačuvaj promene"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
            background: activeTab === tab.key ? "#7C3AED" : "transparent",
            color: activeTab === tab.key ? "#fff" : "#6B7280",
            fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#4B5563", fontSize: 13 }}>Učitavanje...</div>
      ) : (
        <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#E5E7EB", margin: 0 }}>
              {tabs.find(t => t.key === activeTab)?.label}
            </h2>
            <span style={{ fontSize: 11, color: "#4B5563" }}>HTML format · oznake kao &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;</span>
          </div>
          <div style={{ padding: 20 }}>
            <textarea
              value={content[activeTab]}
              onChange={e => setContent(prev => ({ ...prev, [activeTab]: e.target.value }))}
              rows={28}
              style={INP}
              spellCheck={false}
            />
            <p style={{ fontSize: 11, color: "#374151", marginTop: 8 }}>
              Koristi HTML tagove za formatiranje. &lt;h2&gt; za naslove sekcija, &lt;p&gt; za paragrafe, &lt;ul&gt;&lt;li&gt; za liste, &lt;strong&gt; za bold tekst.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
