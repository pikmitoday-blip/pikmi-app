"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MockupRow { name: string; slug: string; views: number; hot: boolean; }

interface LandingSettings {
  // Tipografija
  font_heading: string; font_body: string;
  font_size_hero: string; font_size_section: string;
  font_size_subtitle: string; font_size_body: string;
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
  // Feature sections (full-width, alternating)
  feat1_eyebrow: string; feat1_title: string; feat1_desc: string; feat1_extra: string; feat1_image: string; feat1_code: string;
  feat2_eyebrow: string; feat2_title: string; feat2_desc: string; feat2_extra: string; feat2_image: string; feat2_code: string;
  feat3_eyebrow: string; feat3_title: string; feat3_desc: string; feat3_extra: string; feat3_image: string; feat3_code: string;
  // Central CTA
  mid_cta_title: string; mid_cta_button: string;
  // FAQ
  faq_title: string;
}

type Field = keyof LandingSettings;

// ─── Defaults ─────────────────────────────────────────────────────────────────

const FONTS = [
  { value: "system",       label: "System (default)",      css: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { value: "inter",        label: "Inter",                  css: "'Inter', sans-serif" },
  { value: "space-grotesk",label: "Space Grotesk",          css: "'Space Grotesk', sans-serif" },
  { value: "plus-jakarta", label: "Plus Jakarta Sans",      css: "'Plus Jakarta Sans', sans-serif" },
  { value: "outfit",       label: "Outfit",                 css: "'Outfit', sans-serif" },
  { value: "geist",        label: "Geist",                  css: "'Geist', sans-serif" },
];

const DEFAULTS: LandingSettings = {
  font_heading: "system", font_body: "system",
  font_size_hero: "58", font_size_section: "40",
  font_size_subtitle: "17", font_size_body: "14",
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
  // Feature sections
  feat1_eyebrow: "Pitch Linkovi", feat1_title: "Personalizovan link za svakog klijenta",
  feat1_desc: "Napravi poseban pitch link za svakog klijenta i prati ko ga je otvorio, koliko puta i koliko se dugo zadržao. Saznaj ko je spreman za saradnju — u realnom vremenu.",
  feat1_extra: "Notifikacije te obaveste čim klijent otvori link.", feat1_image: "", feat1_code: "",
  feat2_eyebrow: "Portfolio za 3 minuta", feat2_title: "Biraj između 50 tema i napravi profil koji se pamti",
  feat2_desc: "Izaberi temu, oblik blokova i boju — i tvoj portfolio je spreman. Bez dizajnera, bez kodiranja. Sve prilagodiš za par klikova, na telefonu ili kompjuteru.",
  feat2_extra: "Svaka tema se prilagođava — od blokova do badge-ova.", feat2_image: "", feat2_code: "",
  feat3_eyebrow: "Outreach Kit", feat3_title: "Gotovi šabloni za cold DM, email i follow-up",
  feat3_desc: "Ne znaš kako da započneš razgovor sa klijentom? Dobijaš provjerene šablone za prvi kontakt, ponudu i follow-up — samo zalijepi svoj link i pošalji.",
  feat3_extra: "Sve što ti treba da pretvoriš lead u klijenta.", feat3_image: "", feat3_code: "",
  mid_cta_title: "Napravi svoj portfolio za 3 minuta i počni da šalješ ponude klijentima već danas.",
  mid_cta_button: "Kreiraj profil besplatno →",
  faq_title: "Najčešća pitanja",
};

interface FaqRow { q: string; a: string; }
const DEFAULT_FAQ: FaqRow[] = [
  { q: "Da li je pikmi besplatan?", a: "Da — imaš 7 dana besplatnog triala sa svim funkcijama, bez kreditne kartice." },
  { q: "Da li mi treba dizajner ili znanje kodiranja?", a: "Ne. Biraš jednu od 50 gotovih tema i popuniš podatke kroz kratak kviz." },
  { q: "Šta su pitch linkovi?", a: "Personalizovani linkovi za svakog klijenta — vidiš ko je otvorio link i koliko se zadržao." },
];

const DEFAULT_MOCKUP_LINKS: MockupRow[] = [
  { name: "Elon Musk",  slug: "elon-musk",  views: 12, hot: true  },
  { name: "Jeff Bezos", slug: "jeff-bezos", views: 5,  hot: false },
  { name: "Lidl",       slug: "lidl",       views: 2,  hot: false },
];

// ─── Section definitions ───────────────────────────────────────────────────────

const SECTIONS: { title: string; fields: { key: Field; label: string; type: "input" | "textarea" | "image" }[] }[] = [
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
    title: "Feature sekcija 1 — Pitch Linkovi (animacija levo)",
    fields: [
      { key: "feat1_eyebrow", label: "Nadnaslov (eyebrow)", type: "input"    },
      { key: "feat1_title",   label: "Naslov",              type: "input"    },
      { key: "feat1_desc",    label: "Opis",                type: "textarea" },
      { key: "feat1_extra",   label: "Dodatni tekst",       type: "input"    },
      { key: "feat1_image",   label: "Slika / GIF (ostavi prazno za default animaciju)", type: "image" },
      { key: "feat1_code",    label: "Custom HTML animacija (override slike)", type: "textarea" },
    ],
  },
  {
    title: "Feature sekcija 2 — (tekst levo, animacija desno)",
    fields: [
      { key: "feat2_eyebrow", label: "Nadnaslov (eyebrow)", type: "input"    },
      { key: "feat2_title",   label: "Naslov",              type: "input"    },
      { key: "feat2_desc",    label: "Opis",                type: "textarea" },
      { key: "feat2_extra",   label: "Dodatni tekst",       type: "input"    },
      { key: "feat2_image",   label: "Slika / GIF (ostavi prazno za default)", type: "image" },
      { key: "feat2_code",    label: "Custom HTML animacija (override slike)", type: "textarea" },
    ],
  },
  {
    title: "Feature sekcija 3 — Outreach (animacija levo)",
    fields: [
      { key: "feat3_eyebrow", label: "Nadnaslov (eyebrow)", type: "input"    },
      { key: "feat3_title",   label: "Naslov",              type: "input"    },
      { key: "feat3_desc",    label: "Opis",                type: "textarea" },
      { key: "feat3_extra",   label: "Dodatni tekst",       type: "input"    },
      { key: "feat3_image",   label: "Slika / GIF (ostavi prazno za default)", type: "image" },
      { key: "feat3_code",    label: "Custom HTML animacija (override slike)", type: "textarea" },
    ],
  },
  {
    title: "Centralni CTA (prelaz ka cenovniku)",
    fields: [
      { key: "mid_cta_title",  label: "CTA naslov",  type: "textarea" },
      { key: "mid_cta_button", label: "CTA dugme",   type: "input"    },
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
  const [faqItems, setFaqItems] = useState<FaqRow[]>(DEFAULT_FAQ);
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
      // Load FAQ
      const rawFaq = (data ?? []).find(r => r.key === "faq_items")?.value;
      if (rawFaq) { try { const p = JSON.parse(rawFaq); if (Array.isArray(p)) setFaqItems(p); } catch {} }
    } catch { setDbError(true); }
    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const rows = [
        ...(Object.keys(values) as Field[]).map(key => ({ key, value: values[key], updated_at: new Date().toISOString() })),
        { key: "mockup_links", value: JSON.stringify(mockupLinks), updated_at: new Date().toISOString() },
        { key: "faq_items", value: JSON.stringify(faqItems.filter(f => f.q.trim())), updated_at: new Date().toISOString() },
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

  const [uploadingKey, setUploadingKey] = useState<Field | null>(null);
  async function uploadImageFor(key: Field, file: File) {
    setUploadingKey(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "landing");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) update(key, data.url);
    } catch {}
    setUploadingKey(null);
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

          {/* ── Tipografija ── */}
          <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#E5E7EB", margin: 0 }}>Tipografija</h2>
              <p style={{ fontSize: 11, color: "#6B7280", marginTop: 4, marginBottom: 0 }}>Fontovi i veličine teksta na landing stranici</p>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Font porodice */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Font za naslove (H1, H2)</label>
                  <select value={values.font_heading} onChange={e => update("font_heading", e.target.value)} style={{ ...INP, cursor: "pointer", appearance: "none", WebkitAppearance: "none" }}>
                    {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  <div style={{ marginTop: 8, padding: "10px 12px", background: "rgba(124,58,237,0.08)", borderRadius: 8, border: "1px solid rgba(124,58,237,0.15)" }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#A78BFA", fontFamily: FONTS.find(f => f.value === values.font_heading)?.css }}>
                      Primer naslova
                    </span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Font za tekst (body)</label>
                  <select value={values.font_body} onChange={e => update("font_body", e.target.value)} style={{ ...INP, cursor: "pointer", appearance: "none", WebkitAppearance: "none" }}>
                    {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  <div style={{ marginTop: 8, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: FONTS.find(f => f.value === values.font_body)?.css }}>
                      Primer teksta paragraf
                    </span>
                  </div>
                </div>
              </div>

              {/* Veličine */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>Veličine teksta (px)</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  {([
                    { key: "font_size_hero"     as Field, label: "Hero naslov",     hint: "desktop" },
                    { key: "font_size_section"  as Field, label: "Sekcija naslov",  hint: "Features, Cene..." },
                    { key: "font_size_subtitle" as Field, label: "Podnaslov hero",  hint: "ispod H1" },
                    { key: "font_size_body"     as Field, label: "Body tekst",      hint: "stavke, opisi" },
                  ]).map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 10, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
                        {f.label}
                        <span style={{ color: "#374151", fontWeight: 400, marginLeft: 4 }}>({f.hint})</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="number" min={10} max={120}
                          value={values[f.key]}
                          onChange={e => update(f.key, e.target.value)}
                          style={{ ...INP, paddingRight: 32 }}
                        />
                        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#4B5563", pointerEvents: "none" }}>px</span>
                      </div>
                      <div style={{ marginTop: 6, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                        <span style={{ fontSize: Math.min(parseInt(values[f.key]) * 0.35, 22), fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: FONTS.find(fo => fo.value === values.font_heading)?.css }}>
                          Aa
                        </span>
                        <span style={{ fontSize: 10, color: "#374151", marginLeft: 6 }}>{values[f.key]}px</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

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
                    ) : f.type === "image" ? (
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        {values[f.key] && <img src={values[f.key]} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />}
                        <input type="text" value={values[f.key]} onChange={e => update(f.key, e.target.value)} placeholder="URL ili upload →" style={{ ...INP, flex: 1, minWidth: 160 }} />
                        <label style={{ padding: "9px 14px", borderRadius: 8, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#A78BFA", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                          {uploadingKey === f.key ? "Upload..." : "📤 Upload"}
                          <input type="file" accept="image/*,.gif" style={{ display: "none" }} disabled={uploadingKey === f.key} onChange={e => { const file = e.target.files?.[0]; if (file) uploadImageFor(f.key, file); e.target.value = ""; }} />
                        </label>
                        {values[f.key] && <button onClick={() => update(f.key, "")} style={{ padding: "9px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: 12, cursor: "pointer" }}>Ukloni</button>}
                      </div>
                    ) : (
                      <input type="text" value={values[f.key]} onChange={e => update(f.key, e.target.value)} style={INP} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* ── FAQ editor ── */}
          <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#E5E7EB", margin: 0 }}>Najčešća pitanja (FAQ)</h2>
              <p style={{ fontSize: 11, color: "#6B7280", marginTop: 4, marginBottom: 0 }}>Dropdown sekcija pre footera — max 10 pitanja</p>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {/* FAQ title */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Naslov sekcije</label>
                <input value={values.faq_title} onChange={e => update("faq_title", e.target.value)} style={INP} />
              </div>

              {faqItems.map((item, i) => (
                <div key={i} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280" }}>Pitanje {i + 1}</span>
                    <button onClick={() => setFaqItems(prev => prev.filter((_, j) => j !== i))} style={{ padding: "3px 10px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: 11, cursor: "pointer" }}>Ukloni</button>
                  </div>
                  <input value={item.q} onChange={e => setFaqItems(prev => prev.map((x, j) => j === i ? { ...x, q: e.target.value } : x))} placeholder="Pitanje" style={{ ...INP, marginBottom: 8 }} />
                  <textarea value={item.a} onChange={e => setFaqItems(prev => prev.map((x, j) => j === i ? { ...x, a: e.target.value } : x))} placeholder="Odgovor" rows={3} style={{ ...INP, resize: "vertical" }} />
                </div>
              ))}

              {faqItems.length < 10 && (
                <button onClick={() => setFaqItems(prev => [...prev, { q: "", a: "" }])} style={{ width: "100%", padding: "11px", borderRadius: 10, background: "rgba(124,58,237,0.1)", border: "1px dashed rgba(124,58,237,0.3)", color: "#A78BFA", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  + Dodaj pitanje ({faqItems.length}/10)
                </button>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
