"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

interface CaseStudy {
  industry: string; metric: string; metricLabel: string;
  client: string; platform: string; bg: string; lightText: boolean;
}
interface PricingTier { name: string; price: string; desc: string; green?: boolean; }
interface Profile {
  csImages: string[];
  avatarUrl: string;
  firstName: string; lastName: string; initials: string; city: string;
  openStatus: string; badge: string;
  metric1Value: string; metric1Label: string;
  metric2Value: string; metric2Label: string;
  serviceTitle: string; servicePrice: string; servicePriceLabel: string; serviceDesc: string;
  caseStudies: CaseStudy[];
  pricing: PricingTier[];
  stack: string;
  detailCapacity: string; detailResponse: string; detailMinBudget: string; detailLanguages: string;
  testimonialQuote: string; testimonialName: string; testimonialTitle: string;
  ctaTitle: string; ctaHighlight: string; ctaBtn1: string; ctaBtn2: string;
  calLink: string; pdfUrl: string;
}

const DEFAULT: Profile = {
  csImages: ["", "", "", ""],
  avatarUrl: "",
  firstName: "Stefan", lastName: "Radović", initials: "SR", city: "Beograd, Srbija",
  openStatus: "OTVOREN ZA RETAINER", badge: "TOP 5%",
  metric1Value: "€840k", metric1Label: "UPRAVLJANO AD SPEND",
  metric2Value: "4.1×", metric2Label: "PROS. ROAS",
  serviceTitle: "Meta i TikTok Ads\nza e-commerce brendove.",
  servicePrice: "€1.800", servicePriceLabel: "/mes retainer",
  serviceDesc: "Skaliram performance kampanje za D2C brendove na Balkanu i u EU. Specijalizacija: Meta Ads, TikTok Ads, kreativna optimizacija, full-funnel strategija.",
  caseStudies: [
    { industry: "D2C SKINCARE", metric: "5.8×", metricLabel: "ROAS · 6 meseci", client: "Lumea Beauty", platform: "Meta + TikTok", bg: "linear-gradient(135deg,#2B4FFF,#1A33B3)", lightText: true },
    { industry: "FASHION", metric: "€220k", metricLabel: "revenue · Q4", client: "Studio Nara", platform: "Meta Ads", bg: "linear-gradient(135deg,#1AA877,#0F6E56)", lightText: true },
    { industry: "SUPPLEMENTS", metric: "−42%", metricLabel: "CAC za 3 meseca", client: "Vital Pro", platform: "Full funnel", bg: "linear-gradient(135deg,#0F1419,#2A323C)", lightText: true },
    { industry: "HOME", metric: "3.2×", metricLabel: "ROAS launch", client: "Casa Mare", platform: "TikTok Ads", bg: "linear-gradient(135deg,#7AE5C5,#1AA877)", lightText: false },
  ],
  pricing: [
    { name: "Audit + strategija", price: "€600", desc: "Deep dive kroz nalog + 30-dnevni plan" },
    { name: "Mesečni retainer", price: "€1.800/m", desc: "Full management Meta + TikTok · do €30k spend" },
    { name: "Scale partner", price: "% od spend", desc: "Za brendove iznad €30k mes ad spend", green: true },
  ],
  stack: "Meta Ads, TikTok Ads, Triple Whale, Northbeam, Klaviyo, GA4, Shopify",
  detailCapacity: "2 retainer slota", detailResponse: "0–4 sata",
  detailMinBudget: "€5k/mes", detailLanguages: "SR · EN",
  testimonialQuote: "Stefan je za 6 meseci skalirao naš ad spend 4× uz bolji ROAS. Ne tražimo nikog drugog.",
  testimonialName: "Ana Lukić", testimonialTitle: "CEO, Lumea Beauty",
  ctaTitle: "Spreman da skaliraš", ctaHighlight: "profitabilno",
  ctaBtn1: "Zakaži strategy poziv →", ctaBtn2: "Preuzmi case study (PDF)",
  calLink: "", pdfUrl: "",
};

const CS_GRADIENTS = [
  "linear-gradient(135deg,#2B4FFF,#1A33B3)",
  "linear-gradient(135deg,#1AA877,#0F6E56)",
  "linear-gradient(135deg,#0F1419,#2A323C)",
  "linear-gradient(135deg,#7AE5C5,#1AA877)",
];

function Section({ label, color = "#A78BFA", children }: { label: string; color?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
        {label}
      </div>
      {children}
    </div>
  );
}

export default function ProfileEdit() {
  const [p, setP] = useState<Profile>(DEFAULT);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Učitaj profil — prvo iz Supabase, zatim localStorage kao fallback
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Korisnik je ulogovan — učitaj samo iz Supabase, ne iz localStorage
          const { data } = await supabase
            .from("profiles")
            .select("profile_data, first_name, last_name")
            .eq("user_id", user.id)
            .single();
          if (data?.profile_data && Object.keys(data.profile_data).length > 0) {
            setP({ ...DEFAULT, ...data.profile_data, csImages: data.profile_data.csImages ?? ["", "", "", ""] });
            return;
          }
          // Novi korisnik — samo popuni ime/prezime iz profila, ostalo ostaje DEFAULT
          if (data?.first_name) {
            setP(prev => ({ ...prev, firstName: data.first_name, lastName: data.last_name ?? "", initials: (data.first_name[0] ?? "") + (data.last_name?.[0] ?? "") }));
          }
          return; // Ne padaj na localStorage
        }
        // Nije ulogovan — localStorage fallback (ne bi trebalo da se desi zbog middlewarea)
        const s = localStorage.getItem("pikmi-profile");
        if (s) {
          const loaded = JSON.parse(s);
          setP({ ...DEFAULT, ...loaded, csImages: loaded.csImages ?? ["", "", "", ""] });
        }
      } catch {
        try {
          const s = localStorage.getItem("pikmi-profile");
          if (s) setP({ ...DEFAULT, ...JSON.parse(s) });
        } catch {}
      }
    }
    loadProfile();
  }, []);

  async function save() {
    setSaving(true);
    // Sačuvaj u localStorage (brzo, za sidebar preview)
    const dataToSave = { ...p, csImages: p.csImages }; // uključi slike
    localStorage.setItem("pikmi-profile", JSON.stringify(dataToSave));

    // Sačuvaj u Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // csImages sada sadrži URL-ove iz Storage (ne base64) — možemo čuvati
        const csImagesClean = p.csImages.map(img =>
          img.startsWith("data:") ? "" : img  // ukloni stare base64 slike
        );
        await supabase
          .from("profiles")
          .upsert({
            user_id: user.id,
            first_name: p.firstName,
            last_name: p.lastName,
            email: user.email ?? "",
            service_title: p.serviceTitle.split("\n")[0].trim(),
            profile_data: { ...p, csImages: csImagesClean },
          }, { onConflict: "user_id" });
      }
    } catch (e) {
      console.error("Supabase save error:", e);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setP(prev => ({ ...prev, [key]: value }));
  }

  function setCS(i: number, key: keyof CaseStudy, value: string | boolean) {
    const cs = [...p.caseStudies];
    cs[i] = { ...cs[i], [key]: value };
    setP(prev => ({ ...prev, caseStudies: cs }));
  }

  function setTier(i: number, key: keyof PricingTier, value: string | boolean) {
    const tiers = [...p.pricing];
    tiers[i] = { ...tiers[i], [key]: value };
    setP(prev => ({ ...prev, pricing: tiers }));
  }

  async function uploadAvatar(file: File) {
    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage
        .from("pikmi-uploads")
        .upload(path, file, { upsert: true });
      if (error) { console.error(error); return; }
      const { data: { publicUrl } } = supabase.storage
        .from("pikmi-uploads")
        .getPublicUrl(path);
      setP(prev => ({ ...prev, avatarUrl: publicUrl }));
    } catch (e) {
      console.error("Avatar upload error:", e);
    }
    setUploadingAvatar(false);
  }

  async function uploadImage(i: number, file: File) {
    setUploading(i);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${user.id}/project-${i}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("pikmi-uploads")
        .upload(path, file, { upsert: true });
      if (error) { console.error(error); return; }
      const { data: { publicUrl } } = supabase.storage
        .from("pikmi-uploads")
        .getPublicUrl(path);
      const imgs = [...p.csImages];
      imgs[i] = publicUrl;
      setP(prev => ({ ...prev, csImages: imgs }));
    } catch (e) {
      console.error("Upload error:", e);
    }
    setUploading(null);
  }

  function removeImage(i: number) {
    const imgs = [...p.csImages];
    imgs[i] = "";
    setP(prev => ({ ...prev, csImages: imgs }));
  }

  return (
    <div>
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Uredi profil</h1>
          <p className="page-subtitle">Popuni sve sekcije — klikom na "Sačuvaj" ažurira se tvoj profil</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/moj-profil" className="btn btn-ghost btn-sm">👁 Pogledaj profil</Link>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Čuvanje..." : saved ? "✓ Sačuvano!" : "💾 Sačuvaj"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* HERO */}
        <Section label="Hero — Ime, avatar i metrike">

          {/* Avatar upload */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24, padding: "16px", background: "rgba(124,58,237,0.05)", borderRadius: 12, border: "1px solid rgba(124,58,237,0.15)" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              {p.avatarUrl
                ? <img src={p.avatarUrl} alt="avatar" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--purple)" }} />
                : <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "#fff" }}>{p.initials || "?"}</div>
              }
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Profilna slika</div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10 }}>JPG, PNG · max 2MB</div>
              <label style={{ cursor: "pointer" }}>
                <span className="btn btn-ghost btn-sm" style={{ pointerEvents: "none" }}>
                  {uploadingAvatar ? "Uploading..." : "📷 Promeni sliku"}
                </span>
                <input type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
              </label>
              {p.avatarUrl && (
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8, color: "#F87171" }}
                  onClick={() => setP(prev => ({ ...prev, avatarUrl: "" }))}>
                  Ukloni
                </button>
              )}
            </div>
          </div>

          <div className="edit-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Ime</label>
              <input className="input" value={p.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Stefan" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Prezime</label>
              <input className="input" value={p.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Radović" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Inicijali (avatar, maks 3 slova)</label>
              <input className="input" value={p.initials} maxLength={3} onChange={e => set("initials", e.target.value.toUpperCase())} placeholder="SR" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Grad</label>
              <input className="input" value={p.city} onChange={e => set("city", e.target.value)} placeholder="Beograd, Srbija" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Status badge (crni, zelena tačka)</label>
              <input className="input" value={p.openStatus} onChange={e => set("openStatus", e.target.value)} placeholder="OTVOREN ZA RETAINER" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Desni badge (plavi)</label>
              <input className="input" value={p.badge} onChange={e => set("badge", e.target.value)} placeholder="TOP 5%" />
            </div>
          </div>
          <div className="edit-grid-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Metrika 1 (vrijednost)</label>
              <input className="input" value={p.metric1Value} onChange={e => set("metric1Value", e.target.value)} placeholder="€840k" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Metrika 1 (labela)</label>
              <input className="input" value={p.metric1Label} onChange={e => set("metric1Label", e.target.value)} placeholder="AD SPEND" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Metrika 2 (vrijednost)</label>
              <input className="input" value={p.metric2Value} onChange={e => set("metric2Value", e.target.value)} placeholder="4.1×" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Metrika 2 (labela)</label>
              <input className="input" value={p.metric2Label} onChange={e => set("metric2Label", e.target.value)} placeholder="PROS. ROAS" />
            </div>
          </div>
        </Section>

        {/* 01 */}
        <Section label="01 — Šta radim">
          <div className="field">
            <label className="label">Naslov usluge (Enter = novi red u profilu)</label>
            <textarea className="input" rows={2} value={p.serviceTitle} onChange={e => set("serviceTitle", e.target.value)} />
          </div>
          <div className="edit-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Cijena</label>
              <input className="input" value={p.servicePrice} onChange={e => set("servicePrice", e.target.value)} placeholder="€1.800" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Labela cijene</label>
              <input className="input" value={p.servicePriceLabel} onChange={e => set("servicePriceLabel", e.target.value)} placeholder="/mes retainer" />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Opis</label>
            <textarea className="input" rows={3} value={p.serviceDesc} onChange={e => set("serviceDesc", e.target.value)} />
          </div>
        </Section>

        {/* 02 */}
        <Section label="02 — Rezultati (upload projekata)">
          <div className="edit-cs-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
                {/* Upload zona */}
                <label style={{ display: "block", cursor: "pointer" }}>
                  <input
                    type="file"
                    accept="image/*,application/pdf,.png,.jpg,.jpeg,.gif,.webp,.mp4,.mov"
                    style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(i, f); }}
                  />
                  <div style={{
                    aspectRatio: "4/3",
                    background: p.csImages[i] ? "transparent" : "rgba(255,255,255,0.02)",
                    borderBottom: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative", overflow: "hidden",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!p.csImages[i]) (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.06)"; }}
                  onMouseLeave={e => { if (!p.csImages[i]) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                  >
                    {uploading === i ? (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: "var(--text3)" }}>Uploadovanje...</div>
                      </div>
                    ) : p.csImages[i] ? (
                      <>
                        <img src={p.csImages[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{
                          position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          opacity: 0, transition: "opacity 0.15s",
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0"}
                        >
                          <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>Zamijeni fajl</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>+</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 4 }}>Projekat {i + 1}</div>
                        <div style={{ fontSize: 11, color: "var(--text3)" }}>Klikni da uploaduješ</div>
                        <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>PNG · JPG · PDF · MP4</div>
                      </div>
                    )}
                  </div>
                </label>
                {/* Remove dugme */}
                {p.csImages[i] && (
                  <button
                    onClick={() => removeImage(i)}
                    style={{ width: "100%", padding: "8px", background: "rgba(239,68,68,0.08)", border: "none", borderTop: "1px solid var(--border)", color: "#F87171", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    × Ukloni sliku
                  </button>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* 03 */}
        <Section label="03 — Kako radim (paketi / cijene)">
          {p.pricing.map((tier, i) => (
            <div key={i} style={{ marginBottom: i < 2 ? 20 : 0, paddingBottom: i < 2 ? 20 : 0, borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", marginBottom: 10 }}>Paket {i + 1} {i === 2 && <span style={{ color: "#1AA877" }}>— zelena boja</span>}</div>
              <div className="edit-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Naziv</label>
                  <input className="input" value={tier.name} onChange={e => setTier(i, "name", e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Cijena</label>
                  <input className="input" value={tier.price} onChange={e => setTier(i, "price", e.target.value)} />
                </div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Opis</label>
                <input className="input" value={tier.desc} onChange={e => setTier(i, "desc", e.target.value)} />
              </div>
            </div>
          ))}
        </Section>

        {/* 04 */}
        <Section label="04 — Stack / Alati">
          <div className="field" style={{ marginBottom: 12 }}>
            <label className="label">Alati odvojeni zarezom</label>
            <input className="input" value={p.stack} onChange={e => set("stack", e.target.value)} placeholder="Meta Ads, TikTok Ads, GA4, Shopify..." />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {p.stack.split(",").map(s => s.trim()).filter(Boolean).map((tag, i) => (
              <span key={i} style={{ fontSize: 11, padding: "5px 11px", borderRadius: 999, background: i % 2 === 0 ? "rgba(43,79,255,0.15)" : "rgba(26,168,119,0.15)", color: i % 2 === 0 ? "#7B9CFF" : "#3DD6A3" }}>{tag}</span>
            ))}
          </div>
        </Section>

        {/* 05 */}
        <Section label="05 — Detalji">
          <div className="edit-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Kapacitet</label>
              <input className="input" value={p.detailCapacity} onChange={e => set("detailCapacity", e.target.value)} placeholder="2 retainer slota" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Vrijeme odgovora</label>
              <input className="input" value={p.detailResponse} onChange={e => set("detailResponse", e.target.value)} placeholder="0–4 sata" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Minimalni budget</label>
              <input className="input" value={p.detailMinBudget} onChange={e => set("detailMinBudget", e.target.value)} placeholder="€5k/mes" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Jezici</label>
              <input className="input" value={p.detailLanguages} onChange={e => set("detailLanguages", e.target.value)} placeholder="SR · EN" />
            </div>
          </div>
        </Section>

        {/* 06 */}
        <Section label="06 — Reč klijenta" color="#1AA877">
          <div className="field">
            <label className="label">Citat</label>
            <textarea className="input" rows={3} value={p.testimonialQuote} onChange={e => set("testimonialQuote", e.target.value)} />
          </div>
          <div className="edit-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Ime i prezime</label>
              <input className="input" value={p.testimonialName} onChange={e => set("testimonialName", e.target.value)} placeholder="Ana Lukić" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Pozicija, kompanija</label>
              <input className="input" value={p.testimonialTitle} onChange={e => set("testimonialTitle", e.target.value)} placeholder="CEO, Lumea Beauty" />
            </div>
          </div>
        </Section>

        {/* 07 */}
        <Section label="07 — Kontakt / CTA">
          <div className="edit-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Tekst naslova</label>
              <input className="input" value={p.ctaTitle} onChange={e => set("ctaTitle", e.target.value)} placeholder="Spreman da skaliraš" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Istaknuta riječ (plava, kurziv)</label>
              <input className="input" value={p.ctaHighlight} onChange={e => set("ctaHighlight", e.target.value)} placeholder="profitabilno" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Dugme 1 (plavo) — tekst</label>
              <input className="input" value={p.ctaBtn1} onChange={e => set("ctaBtn1", e.target.value)} placeholder="Zakaži strategy poziv →" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Dugme 1 — Calendly / Cal.com link</label>
              <input className="input" value={p.calLink} onChange={e => set("calLink", e.target.value)} placeholder="https://calendly.com/tvoj-profil" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Dugme 2 (outline) — tekst</label>
              <input className="input" value={p.ctaBtn2} onChange={e => set("ctaBtn2", e.target.value)} placeholder="Preuzmi case study (PDF)" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Dugme 2 — PDF link (Google Drive, Dropbox...)</label>
              <input className="input" value={p.pdfUrl} onChange={e => set("pdfUrl", e.target.value)} placeholder="https://drive.google.com/..." />
            </div>
          </div>
        </Section>

        {/* Save */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingBottom: 40 }}>
          <Link href="/moj-profil" className="btn btn-ghost">👁 Pogledaj profil</Link>
          <button className="btn btn-primary" onClick={save} style={{ minWidth: 160 }}>
            {saving ? "Čuvanje..." : saved ? "✓ Sačuvano!" : "💾 Sačuvaj promjene"}
          </button>
        </div>
      </div>
    </div>
  );
}
