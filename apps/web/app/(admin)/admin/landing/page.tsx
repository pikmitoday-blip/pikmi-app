"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MockupRow { name: string; slug: string; views: number; hot: boolean; }

interface LandingSettings {
  // Hero
  hero_badge: string; hero_title: string; hero_subtitle: string;
  hero_cta1: string;  hero_note: string;
  // Freelancer badges
  freelancer_badges: string;
  // Mockup animation
  mockup_hotlead_name: string; mockup_hotlead_views: string;
  mockup_hotlead_time: string; mockup_hotlead_duration: string;
  mockup_hotlead_opens: string;
  // Features
  feature1_title: string; feature1_sub: string;
  feature2_title: string; feature2_sub: string;
  feature3_title: string; feature3_sub: string;
  feature4_title: string; feature4_desc: string;
  // How it works
  how_title: string;
  how_step1_title: string; how_step1_desc: string;
  how_step2_title: string; how_step2_desc: string;
  how_step3_title: string; how_step3_desc: string;
  // Pricing
  pricing_free_features: string; pricing_pro_features: string;
  pricing_pro_price: string;  pricing_pro_note: string;
  pricing_pro3_price: string; pricing_pro3_note: string; pricing_pro3_saving: string;
  // CTA / Footer
  cta_title: string; cta_subtitle: string; footer_copy: string;
}

type Field = keyof LandingSettings;

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: LandingSettings = {
  hero_badge:    "✦ Tailored portfolios. Real connections.",
  hero_title:    "Portfolio koji zatvara klijente dok spavaš.",
  hero_subtitle: "Personalizovani portfolio link za svakog klijenta. Vidi ko gleda, šta gleda i kada je spreman.",
  hero_cta1:     "Kreiraj profil besplatno",
  hero_note:     "Free · 7 dana · Bez kreditne kartice",
  freelancer_badges: "Dizajneri,Video editori,SMM menadžeri,Copywriteri,Fotografi,Web developeri",
  mockup_hotlead_name:     "Elon Musk",
  mockup_hotlead_views:    "12",
  mockup_hotlead_time:     "danas u 14:27",
  mockup_hotlead_duration: "4m 12s",
  mockup_hotlead_opens:    "3",
  feature1_title: "Personalizovano",    feature1_sub: "Svaki klijent dobija svoj link",
  feature2_title: "Prati interes",      feature2_sub: "Real-time otvaranja i notifikacije",
  feature3_title: "Outreach kit",       feature3_sub: "Cold DM, email i follow-up šabloni",
  feature4_title: "Profil za 5 minuta", feature4_desc: "Bez dizajnera. Bez kodiranja. Bez čekanja.",
  how_title:       "3 koraka do prvog klijenta",
  how_step1_title: "Kreiraj profil",    how_step1_desc: "Popuni za 5 minuta. Dodaj projekte, opis i boje.",
  how_step2_title: "Podeli pitch link", how_step2_desc: "Za svakog klijenta personalizovan link sa porukom.",
  how_step3_title: "Prati i reaguj",    how_step3_desc: "Dobijaš notifikaciju. Vidiš šta gledaju. Pišeš im u pravom momentu.",
  pricing_free_features: "Osnovni profil\nOgraničen broj pitch linkova\nStatistika pregleda",
  pricing_pro_features:  "Neograničeno pitch linkova\nSve sekcije profila\nReal-time tracking i notifikacije\nOutreach kit\nCustom boje i fontovi\nPriorizetna podrška",
  pricing_pro_price:   "990 din",   pricing_pro_note:    "Manje od jedne kafe nedeljno",
  pricing_pro3_price:  "2490 din",  pricing_pro3_note:   "Uštedi 17%",
  pricing_pro3_saving: "~830 din mesečno · ušteda ~480 din",
  cta_title:    "Spreman da zatvoriš prvi deal?",
  cta_subtitle: "Kreiraj profil za 5 minuta. Besplatno.",
  footer_copy:  "© 2026 pikmi. Sva prava zadržana.",
};

const DEFAULT_MOCKUP_LINKS: MockupRow[] = [
  { name: "Elon Musk",  slug: "elon-musk",  views: 12, hot: true  },
  { name: "Jeff Bezos", slug: "jeff-bezos", views: 5,  hot: false },
  { name: "Lidl",       slug: "lidl",       views: 2,  hot: false },
];

// ─── Section definitions ───────────────────────────────────────────────────────

const SECTIONS: { title: string; fields: { key: Field; label: string; type: "input" | "textarea" }[] }[] = [
  {
    title: "Hero sekcija",
    fields: [
      { key: "hero_badge",    label: "Badge tekst",         type: "input"    },
      { key: "hero_title",    label: "Naslov (gradient na: dok spavaš.)", type: "textarea" },
      { key: "hero_subtitle", label: "Podnaslov",            type: "textarea" },
      { key: "hero_cta1",     label: "CTA dugme tekst",      type: "input"    },
      { key: "hero_note",     label: "Napomena ispod dugmeta", type: "input"  },
    ],
  },
  {
    title: "Features",
    fields: [
      { key: "feature1_title", label: "Feature 1 — naslov", type: "input"    },
      { key: "feature1_sub",   label: "Feature 1 — podnaslov", type: "input" },
      { key: "feature2_title", label: "Feature 2 — naslov", type: "input"    },
      { key: "feature2_sub",   label: "Feature 2 — podnaslov", type: "input" },
      { key: "feature3_title", label: "Feature 3 — naslov", type: "input"    },
      { key: "feature3_sub",   label: "Feature 3 — podnaslov", type: "input" },
      { key: "feature4_title", label: "Feature 4 — naslov", type: "input"    },
      { key: "feature4_desc",  label: "Feature 4 — opis",   type: "textarea" },
    ],
  },
  {
    title: "Kako funkcioniše",
    fields: [
      { key: "how_title",       label: "Naslov sekcije",     type: "input"    },
      { key: "how_step1_title", label: "Korak 1 — naslov",   type: "input"    },
      { key: "how_step1_desc",  label: "Korak 1 — opis",     type: "textarea" },
      { key: "how_step2_title", label: "Korak 2 — naslov",   type: "input"    },
      { key: "how_step2_desc",  label: "Korak 2 — opis",     type: "textarea" },
      { key: "how_step3_title", label: "Korak 3 — naslov",   type: "input"    },
      { key: "how_step3_desc",  label: "Korak 3 — opis",     type: "textarea" },
    ],
  },
  {
    title: "Pricing",
    fields: [
      { key: "pricing_free_features", label: "Free plan — stavke (1 po redu)",  type: "textarea" },
      { key: "pricing_pro_features",  label: "Pro plan — stavke (1 po redu)",   type: "textarea" },
      { key: "pricing_pro_price",     label: "Pro cena (npr. 990 din)",          type: "input"    },
      { key: "pricing_pro_note",      label: "Pro napomena ispod cene",          type: "input"    },
      { key: "pricing_pro3_price",    label: "Pro 3mes cena (npr. 2490 din)",    type: "input"    },
      { key: "pricing_pro3_note",     label: "Pro 3mes badge (npr. Uštedi 17%)", type: "input"    },
      { key: "pricing_pro3_saving",   label: "Pro 3mes opis uštede",             type: "input"    },
    ],
  },
  {
    title: "CTA & Footer",
    fields: [
      { key: "cta_title",    label: "CTA naslov (gradient na: deal?)", type: "input"    },
      { key: "cta_subtitle", label: "CTA podnaslov",                    type: "textarea" },
      { key: "footer_copy",  label: "Footer copyright",                 type: "input"    },
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminLanding() {
  const [values, setValues] = useState<LandingSettings>(DEFAULTS);
  const [mockupLinks, setMockupLinks] = useState<MockupRow[]>(DEFAULT_MOCKUP_LINKS);
  const [newBadge, setNewBadge] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dbError, setDbError] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("platform_settings").select("key, value");
      if (error) { setDbError(true); setLoading(false); return; }
      const map: Partial<LandingSettings> = {};
      (data ?? []).forEach(row => {
        if (row.key in DEFAULTS) (map as Record<string, string>)[row.key] = row.value;
      });
      setValues({ ...DEFAULTS, ...map });
      // Load mockup links
      const raw = (data ?? []).find(r => r.key === "mockup_links")?.value;
      if (raw) { try { setMockupLinks(JSON.parse(raw)); } catch {} }
    } catch { setDbError(true); }
    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const rows = [
        ...(Object.keys(values) as Field[]).map(key => ({ key, value: values[key], updated_at: new Date().toISOString() })),
        { key: "mockup_links", value: JSON.stringify(mockupLinks), updated_at: new Date().toISOString() },
      ];
      const { error } = await supabase.from("platform_settings").upsert(rows, { onConflict: "key" });
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

  // Badge helpers
  const badgeList = values.freelancer_badges.split(",").map(b => b.trim()).filter(Boolean);
  function removeBadge(i: number) {
    const next = [...badgeList]; next.splice(i, 1);
    update("freelancer_badges", next.join(","));
  }
  function addBadge() {
    if (!newBadge.trim()) return;
    update("freelancer_badges", [...badgeList, newBadge.trim()].join(","));
    setNewBadge("");
  }

  // Mockup link helpers
  function updateLink(i: number, field: keyof MockupRow, val: string | number | boolean) {
    setMockupLinks(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  }

  const INP: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    background: "#0D0D12", border: "1px solid rgba(255,255,255,0.1)",
    color: "#F9FAFB", fontSize: 13, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F9FAFB", marginBottom: 4 }}>Landing page editor</h1>
          <p style={{ fontSize: 13, color: "#6B7280" }}>Izmene se čuvaju u bazi i odmah primenjuju (cache 5min)</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 12, color: "#4ADE80", fontWeight: 600 }}>✓ Sačuvano!</span>}
          <a href="/" target="_blank" rel="noreferrer" style={{ padding: "9px 16px", borderRadius: 8, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9CA3AF", textDecoration: "none" }}>
            Pregled ↗
          </a>
          <button onClick={saveSettings} disabled={saving || loading} style={{ padding: "9px 20px", borderRadius: 8, cursor: saving ? "default" : "pointer", background: "linear-gradient(135deg,#7C3AED,#3B82F6)", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Čuvanje..." : "Sačuvaj promene"}
          </button>
        </div>
      </div>

      {/* DB error */}
      {dbError && (
        <div style={{ padding: "16px 20px", borderRadius: 10, marginBottom: 24, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", color: "#FCD34D", fontSize: 13 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>⚠️ Tabela platform_settings ne postoji</div>
          <pre style={{ marginTop: 10, padding: "12px 14px", borderRadius: 8, background: "#0D0D12", color: "#A78BFA", fontSize: 11, overflowX: "auto" }}>
{`CREATE TABLE platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only" ON platform_settings USING (true) WITH CHECK (true);`}
          </pre>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#4B5563", fontSize: 13 }}>Učitavanje...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* ── Freelancer badges ── */}
          <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#E5E7EB", margin: 0 }}>Za kreativce i freelancere — bedževi</h2>
              <p style={{ fontSize: 11, color: "#6B7280", marginTop: 4, marginBottom: 0 }}>Možeš dodavati i uklanjati bedževe koji se prikazuju na landing stranici</p>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {badgeList.map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 12px", borderRadius: 100, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", fontSize: 12, fontWeight: 600, color: "#A78BFA" }}>
                    {b}
                    <button onClick={() => removeBadge(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 14, padding: 0, lineHeight: 1, display: "flex" }}>×</button>
                  </div>
                ))}
                {badgeList.length === 0 && <span style={{ fontSize: 12, color: "#374151" }}>Nema bedževa</span>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={newBadge} onChange={e => setNewBadge(e.target.value)} onKeyDown={e => e.key === "Enter" && addBadge()} placeholder="Novi bedž (npr. UX dizajneri)" style={{ ...INP, flex: 1 }} />
                <button onClick={addBadge} style={{ padding: "9px 16px", borderRadius: 8, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#A78BFA", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  + Dodaj
                </button>
              </div>
            </div>
          </div>

          {/* ── Mockup animacija ── */}
          <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#E5E7EB", margin: 0 }}>Pitch links animacija — 3 reda</h2>
              <p style={{ fontSize: 11, color: "#6B7280", marginTop: 4, marginBottom: 0 }}>Podaci koji se prikazuju u kartici na hero sekciji</p>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {mockupLinks.map((link, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 80px", gap: 8, alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <label style={{ fontSize: 10, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Ime klijenta</label>
                    <input value={link.name} onChange={e => updateLink(i, "name", e.target.value)} style={INP} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Slug</label>
                    <input value={link.slug} onChange={e => updateLink(i, "slug", e.target.value)} style={INP} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Pregledi</label>
                    <input type="number" value={link.views} onChange={e => updateLink(i, "views", parseInt(e.target.value) || 0)} style={INP} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Hot lead?</label>
                    <button onClick={() => updateLink(i, "hot", !link.hot)} style={{ width: "100%", padding: "7px 0", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: link.hot ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)", color: link.hot ? "#F87171" : "#6B7280" }}>
                      {link.hot ? "🔥 DA" : "Ne"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Hot Lead notifikacija ── */}
          <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#E5E7EB", margin: 0 }}>Hot lead notifikacija</h2>
              <p style={{ fontSize: 11, color: "#6B7280", marginTop: 4, marginBottom: 0 }}>Pulsujuća kartica ispod pitch links tabele</p>
            </div>
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12 }}>
              {[
                { key: "mockup_hotlead_name"     as Field, label: "Ime klijenta" },
                { key: "mockup_hotlead_views"    as Field, label: "Broj pregleda" },
                { key: "mockup_hotlead_time"     as Field, label: "Vreme (npr. danas u 14:27)" },
                { key: "mockup_hotlead_duration" as Field, label: "Trajanje (npr. 4m 12s)" },
                { key: "mockup_hotlead_opens"    as Field, label: "Broj otvaranja" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 10, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input value={values[f.key]} onChange={e => update(f.key, e.target.value)} style={INP} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Regular sections ── */}
          {SECTIONS.map(section => (
            <div key={section.title} style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#E5E7EB", margin: 0 }}>{section.title}</h2>
              </div>
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                {section.fields.map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                      {f.label}
                    </label>
                    {f.type === "textarea" ? (
                      <textarea value={values[f.key]} onChange={e => update(f.key, e.target.value)} rows={3} style={{ ...INP, resize: "vertical" }} />
                    ) : (
                      <input type="text" value={values[f.key]} onChange={e => update(f.key, e.target.value)} style={INP} />
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
