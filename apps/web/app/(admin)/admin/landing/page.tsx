"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

interface LandingSettings {
  hero_badge:    string;
  hero_title:    string;
  hero_subtitle: string;
  hero_cta1:     string;
  how_title:     string;
  how_step1_title: string; how_step1_desc: string;
  how_step2_title: string; how_step2_desc: string;
  how_step3_title: string; how_step3_desc: string;
  pricing_free_features: string;
  pricing_pro_features:  string;
  cta_title:     string;
  cta_subtitle:  string;
  footer_copy:   string;
}

const DEFAULTS: LandingSettings = {
  hero_badge:    "Tailored portfolios. Real connections.",
  hero_title:    "Portfolio koji zatvara\nklijente dok spavaš.",
  hero_subtitle: "Personalizovani portfolio link za svakog klijenta. Vidi ko gleda, šta gleda i kada je spreman.",
  hero_cta1:     "Kreiraj profil besplatno",
  how_title:     "3 koraka do prvog klijenta",
  how_step1_title: "Kreiraj profil",
  how_step1_desc:  "Popuni onboarding za 5 minuta. Dodaj projekte, opis i boje koje odgovaraju tebi.",
  how_step2_title: "Podeli pitch link",
  how_step2_desc:  "Za svakog klijenta kreiraj personalizovani link sa porukom i relevantnim radovima.",
  how_step3_title: "Prati i reaguj",
  how_step3_desc:  "Dobijaš notifikaciju kada otvore. Vidiš šta gledaju. Pišeš im u pravom momentu.",
  pricing_free_features: "1 pitch link\nOsnovni profil\nStatistika pregleda",
  pricing_pro_features:  "Neograničeno pitch linkova\nSve sekcije profila\nReal-time tracking i notifikacije\nOutreach kit\nPriorizetna podrška",
  cta_title:     "Spreman da zatvoriš",
  cta_subtitle:  "Kreiraj pikmi profil za 5 minuta i pošalji prvi personalizovani pitch link još danas.",
  footer_copy:   "© 2026 pikmi. Sva prava zadržana.",
};

type Field = keyof LandingSettings;

const SECTIONS = [
  {
    title: "Hero sekcija",
    fields: [
      { key: "hero_badge" as Field,    label: "Badge tekst",  type: "input" },
      { key: "hero_title" as Field,    label: "Naslov (Enter = novi red)", type: "textarea" },
      { key: "hero_subtitle" as Field, label: "Podnaslov",    type: "textarea" },
      { key: "hero_cta1" as Field,     label: "CTA dugme",    type: "input" },
    ],
  },
  {
    title: "Kako funkcioniše",
    fields: [
      { key: "how_title" as Field,       label: "Naslov sekcije", type: "input" },
      { key: "how_step1_title" as Field, label: "Korak 1 — naslov", type: "input" },
      { key: "how_step1_desc" as Field,  label: "Korak 1 — opis",   type: "textarea" },
      { key: "how_step2_title" as Field, label: "Korak 2 — naslov", type: "input" },
      { key: "how_step2_desc" as Field,  label: "Korak 2 — opis",   type: "textarea" },
      { key: "how_step3_title" as Field, label: "Korak 3 — naslov", type: "input" },
      { key: "how_step3_desc" as Field,  label: "Korak 3 — opis",   type: "textarea" },
    ],
  },
  {
    title: "Pricing sekcija",
    fields: [
      { key: "pricing_free_features" as Field, label: "Free plan — lista (po jedna stavka u redu)", type: "textarea" },
      { key: "pricing_pro_features" as Field,  label: "Pro plan — lista (po jedna stavka u redu)",  type: "textarea" },
    ],
  },
  {
    title: "CTA & Footer",
    fields: [
      { key: "cta_title" as Field,    label: "CTA naslov",     type: "input" },
      { key: "cta_subtitle" as Field, label: "CTA podnaslov",  type: "textarea" },
      { key: "footer_copy" as Field,  label: "Footer copyright", type: "input" },
    ],
  },
];

export default function AdminLanding() {
  const [values, setValues] = useState<LandingSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dbError, setDbError] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value");

      if (error) { setDbError(true); setLoading(false); return; }

      const map: Partial<LandingSettings> = {};
      (data ?? []).forEach(row => {
        if (row.key in DEFAULTS) (map as Record<string, string>)[row.key] = row.value;
      });
      setValues({ ...DEFAULTS, ...map });
    } catch { setDbError(true); }
    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const rows = (Object.keys(values) as Field[]).map(key => ({
        key,
        value: values[key],
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("platform_settings")
        .upsert(rows, { onConflict: "key" });

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Greška pri čuvanju. Provjeri da li postoji tabela platform_settings.");
    }
    setSaving(false);
  }

  function update(key: Field, val: string) {
    setValues(prev => ({ ...prev, [key]: val }));
  }

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    background: "#0D0D12", border: "1px solid rgba(255,255,255,0.1)",
    color: "#F9FAFB", fontSize: 13, outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F9FAFB", marginBottom: 4 }}>Landing page editor</h1>
          <p style={{ fontSize: 13, color: "#6B7280" }}>Izmjene se čuvaju u bazi i odmah primjenjuju na landing stranici</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {saved && (
            <span style={{ fontSize: 12, color: "#4ADE80", fontWeight: 600 }}>✓ Sačuvano!</span>
          )}
          <a href="/" target="_blank" rel="noreferrer" style={{
            padding: "9px 16px", borderRadius: 8, fontSize: 13,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#9CA3AF", textDecoration: "none",
          }}>
            Pregled ↗
          </a>
          <button onClick={saveSettings} disabled={saving || loading} style={{
            padding: "9px 20px", borderRadius: 8, cursor: saving ? "default" : "pointer",
            background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
            border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Čuvanje..." : "Sačuvaj promjene"}
          </button>
        </div>
      </div>

      {/* DB setup upozorenje */}
      {dbError && (
        <div style={{
          padding: "16px 20px", borderRadius: 10, marginBottom: 24,
          background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
          color: "#FCD34D", fontSize: 13,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>⚠️ Tabela platform_settings ne postoji</div>
          <div style={{ color: "#9CA3AF", fontSize: 12, lineHeight: 1.7 }}>
            Pokreni ovaj SQL u Supabase SQL editoru da aktiviraš ovu funkciju:
          </div>
          <pre style={{
            marginTop: 10, padding: "12px 14px", borderRadius: 8,
            background: "#0D0D12", color: "#A78BFA", fontSize: 11,
            overflowX: "auto", lineHeight: 1.6,
          }}>
{`CREATE TABLE platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only" ON platform_settings
  USING (true) WITH CHECK (true);`}
          </pre>
          <div style={{ marginTop: 8, color: "#6B7280", fontSize: 11 }}>
            Napomena: Ograniči pristup RLS politikom na admin korisnike kada postaviš u produkciju.
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#4B5563", fontSize: 13 }}>Učitavanje...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {SECTIONS.map(section => (
            <div key={section.title} style={{
              background: "#111116", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, overflow: "hidden",
            }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#E5E7EB" }}>{section.title}</h2>
              </div>
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                {section.fields.map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                      {f.label}
                    </label>
                    {f.type === "textarea" ? (
                      <textarea
                        value={values[f.key]}
                        onChange={e => update(f.key, e.target.value)}
                        rows={3}
                        style={{ ...inputStyle, resize: "vertical" }}
                      />
                    ) : (
                      <input
                        type="text"
                        value={values[f.key]}
                        onChange={e => update(f.key, e.target.value)}
                        style={inputStyle}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
