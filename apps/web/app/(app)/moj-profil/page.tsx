"use client";
import { useState, useEffect } from "react";
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
  pdfUrl?: string;
}

const DEFAULT_PROFILE: Profile = {
  csImages: ["", "", "", ""],
  avatarUrl: "",
  firstName: "", lastName: "", initials: "", city: "",
  openStatus: "OTVOREN ZA RETAINER", badge: "TOP 5%",
  metric1Value: "", metric1Label: "",
  metric2Value: "", metric2Label: "",
  serviceTitle: "", servicePrice: "", servicePriceLabel: "/mes retainer", serviceDesc: "",
  caseStudies: [
    { industry: "", metric: "", metricLabel: "", client: "", platform: "", bg: "linear-gradient(135deg,#2B4FFF,#1A33B3)", lightText: true },
    { industry: "", metric: "", metricLabel: "", client: "", platform: "", bg: "linear-gradient(135deg,#1AA877,#0F6E56)", lightText: true },
    { industry: "", metric: "", metricLabel: "", client: "", platform: "", bg: "linear-gradient(135deg,#0F1419,#2A323C)", lightText: true },
    { industry: "", metric: "", metricLabel: "", client: "", platform: "", bg: "linear-gradient(135deg,#7AE5C5,#1AA877)", lightText: false },
  ],
  pricing: [
    { name: "", price: "", desc: "" },
    { name: "", price: "", desc: "" },
    { name: "", price: "", desc: "", green: false },
  ],
  stack: "",
  detailCapacity: "", detailResponse: "", detailMinBudget: "", detailLanguages: "",
  testimonialQuote: "", testimonialName: "", testimonialTitle: "",
  ctaTitle: "", ctaHighlight: "", ctaBtn1: "Zakaži strategy poziv →", ctaBtn2: "Preuzmi case study (PDF)",
  pdfUrl: "",
};

function getCachedProfile(): Profile | null {
  try {
    const c = sessionStorage.getItem("pikmi-moj-profil");
    if (c) return JSON.parse(c);
  } catch {}
  return null;
}

function Divider() {
  return <div style={{ height: "0.5px", background: "#E4EBE4", margin: "24px 0" }} />;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 13,
  border: "1.5px solid #E0E6FF", background: "#F7F9FF", fontFamily: "inherit",
  color: "#1E1E1E", outline: "none", boxSizing: "border-box", marginBottom: 8,
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#6B6B6B", letterSpacing: "0.5px",
  display: "block", marginBottom: 4, textTransform: "uppercase",
};

export default function MojProfil() {
  const [p, setP] = useState<Profile | null>(() => getCachedProfile());
  const [userId, setUserId] = useState<string>("");
  const [profileUrl, setProfileUrl] = useState<string>("");
  const [loading, setLoading] = useState(!getCachedProfile());

  const [editSection, setEditSection] = useState<string | null>(null);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data } = await supabase
            .from("profiles")
            .select("first_name, last_name, profile_data, profile_url")
            .eq("user_id", user.id)
            .single();
          if (data) {
            const pd = (data.profile_data as Record<string, any>) || {};
            const updated: Profile = {
              ...DEFAULT_PROFILE, ...pd,
              firstName: data.first_name || "",
              lastName: data.last_name || "",
              initials: (data.first_name?.[0] ?? "") + (data.last_name?.[0] ?? ""),
              csImages: pd.csImages ?? ["", "", "", ""],
              caseStudies: pd.caseStudies ?? DEFAULT_PROFILE.caseStudies,
              pricing: pd.pricing ?? DEFAULT_PROFILE.pricing,
            };
            setP(updated);
            try { sessionStorage.setItem("pikmi-moj-profil", JSON.stringify(updated)); } catch {}
            if (data.profile_url) setProfileUrl(data.profile_url);
          }
        }
      } catch {}
      setLoading(false);
    }
    loadProfile();
  }, []);

  function startEdit(section: string) {
    setEditSection(section);
    setDraft(p ? { ...p } : null);
  }
  function cancelEdit() { setEditSection(null); setDraft(null); }
  function setD<K extends keyof Profile>(key: K, value: Profile[K]) {
    setDraft(prev => prev ? { ...prev, [key]: value } : null);
  }
  function setDraft_cs(i: number, key: keyof CaseStudy, value: string | boolean) {
    if (!draft) return;
    const cs = [...draft.caseStudies];
    cs[i] = { ...cs[i], [key]: value };
    setDraft(prev => prev ? { ...prev, caseStudies: cs } : null);
  }
  function setDraft_tier(i: number, key: keyof PricingTier, value: string | boolean) {
    if (!draft) return;
    const tiers = [...draft.pricing];
    tiers[i] = { ...tiers[i], [key]: value };
    setDraft(prev => prev ? { ...prev, pricing: tiers } : null);
  }

  async function saveSection() {
    if (!draft || !userId) return;
    setSaving(true);
    try {
      const csImagesClean = draft.csImages.map(img => img.startsWith("data:") ? "" : img);
      const toSave = { ...draft, csImages: csImagesClean };
      await supabase.from("profiles").upsert({
        user_id: userId,
        first_name: draft.firstName,
        last_name: draft.lastName,
        service_title: draft.serviceTitle.split("\n")[0].trim(),
        profile_data: toSave,
      }, { onConflict: "user_id" });
      setP(toSave);
      try {
        sessionStorage.setItem("pikmi-moj-profil", JSON.stringify(toSave));
        sessionStorage.setItem("pikmi-profile-edit", JSON.stringify(toSave));
        sessionStorage.removeItem("pikmi-sidebar");
      } catch {}
    } catch (e) { console.error(e); }
    setSaving(false);
    setSavedMsg(true);
    setEditSection(null);
    setDraft(null);
    setTimeout(() => setSavedMsg(false), 2500);
  }

  async function uploadAvatar(file: File) {
    if (!userId) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${userId}/avatar.${ext}`;
      await supabase.storage.from("pikmi-uploads").upload(path, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("pikmi-uploads").getPublicUrl(path);
      setDraft(prev => prev ? { ...prev, avatarUrl: publicUrl } : null);
    } catch {}
    setUploadingAvatar(false);
  }

  async function uploadImage(i: number, file: File) {
    if (!userId) return;
    setUploading(i);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${userId}/project-${i}-${Date.now()}.${ext}`;
      await supabase.storage.from("pikmi-uploads").upload(path, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("pikmi-uploads").getPublicUrl(path);
      const imgs = [...(draft?.csImages ?? ["","","",""])];
      imgs[i] = publicUrl;
      setDraft(prev => prev ? { ...prev, csImages: imgs } : null);
    } catch {}
    setUploading(null);
  }

  // Pencil button — inline uz section header
  function SectionHeader({ label, section, light = false }: { label: string; section: string; light?: boolean }) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: light ? "rgba(255,255,255,0.5)" : "#6B6B6B", letterSpacing: "1.2px", textTransform: "uppercase" }}>
          {label}
        </div>
        <button
          onClick={() => startEdit(section)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 6, cursor: "pointer",
            fontSize: 11, fontWeight: 700, border: "none",
            background: light ? "rgba(255,255,255,0.2)" : "#EEF2FF",
            color: light ? "#fff" : "#1F57C3",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = light ? "rgba(255,255,255,0.35)" : "#DBEAFE"; }}
          onMouseLeave={e => { e.currentTarget.style.background = light ? "rgba(255,255,255,0.2)" : "#EEF2FF"; }}
        >
          ✏️ Uredi
        </button>
      </div>
    );
  }

  // Save/Cancel bar
  function EditActions() {
    return (
      <div style={{ display: "flex", gap: 8, marginTop: 16, paddingTop: 16, borderTop: "1px solid #E4EBE4" }}>
        <button
          onClick={saveSection}
          disabled={saving}
          style={{ padding: "10px 20px", background: "#1F57C3", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          {saving ? "Čuvanje..." : "✓ Sačuvaj"}
        </button>
        <button
          onClick={cancelEdit}
          style={{ padding: "10px 16px", background: "#F7F7F5", color: "#6B6B6B", border: "1px solid #E4EBE4", borderRadius: 8, fontSize: 13, cursor: "pointer" }}
        >
          Otkaži
        </button>
      </div>
    );
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <div style={{ color: "var(--text3)", fontSize: 14 }}>Učitavanje profila...</div>
    </div>
  );
  if (!p) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <div style={{ color: "var(--text3)", fontSize: 14 }}>Profil nije pronađen.</div>
    </div>
  );

  const stackTags = p.stack.split(",").map(s => s.trim()).filter(Boolean);

  return (
    <div>
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Moj profil</h1>
          <p className="page-subtitle">Klikni ✏️ na bilo kojoj sekciji da je urediš</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {savedMsg && <span style={{ fontSize: 13, color: "#14A800", fontWeight: 600 }}>✓ Sačuvano!</span>}
          {profileUrl && (
            <a href={`https://www.pikmi.today/${profileUrl}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
              👁 Pogledaj profil ↗
            </a>
          )}
        </div>
      </div>

      <div className="profile-upwork-wrapper" style={{ background: "#F7F7F5", borderRadius: 16, overflow: "hidden", border: "1px solid #E4EBE4", marginBottom: 48, fontFamily: "'Satoshi', -apple-system, sans-serif" }}>
        <div className="profile-layout" style={{ display: "grid", gridTemplateColumns: "300px 1fr", alignItems: "start" }}>

          {/* ── SIDEBAR ── */}
          <div className="profile-sidebar" style={{ background: "#fff", borderRight: "1px solid #E4EBE4", padding: "32px 28px", position: "sticky", top: 0 }}>
            <div>
              {editSection === "sidebar" && draft ? (
                <div>
                  <SectionHeader label="Bočna traka" section="sidebar" />


                  {/* Avatar */}
                  <label style={labelStyle}>Profilna slika</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    {draft.avatarUrl
                      ? <img src={draft.avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} />
                      : <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#1F57C3", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>{draft.initials}</div>
                    }
                    <label style={{ padding: "8px 14px", background: "#F0F4FF", border: "1px solid #D0DCFF", borderRadius: 8, cursor: "pointer", fontSize: 12, color: "#1F57C3", fontWeight: 600 }}>
                      {uploadingAvatar ? "Uploading..." : "Promijeni sliku"}
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]); }} />
                    </label>
                  </div>

                  <label style={labelStyle}>Ime</label>
                  <input style={inputStyle} value={draft.firstName} onChange={e => setD("firstName", e.target.value)} placeholder="Ime" />
                  <label style={labelStyle}>Prezime</label>
                  <input style={inputStyle} value={draft.lastName} onChange={e => setD("lastName", e.target.value)} placeholder="Prezime" />
                  <label style={labelStyle}>Grad</label>
                  <input style={inputStyle} value={draft.city} onChange={e => setD("city", e.target.value)} placeholder="Beograd, Srbija" />
                  <label style={labelStyle}>Status dostupnosti</label>
                  <input style={inputStyle} value={draft.openStatus} onChange={e => setD("openStatus", e.target.value)} placeholder="OTVOREN ZA RETAINER" />
                  <label style={labelStyle}>Bedž (npr. TOP 5%)</label>
                  <input style={inputStyle} value={draft.badge} onChange={e => setD("badge", e.target.value)} placeholder="TOP 5%" />
                  <label style={labelStyle}>Metrika 1 — vrijednost</label>
                  <input style={inputStyle} value={draft.metric1Value} onChange={e => setD("metric1Value", e.target.value)} placeholder="€840k" />
                  <label style={labelStyle}>Metrika 1 — naziv</label>
                  <input style={inputStyle} value={draft.metric1Label} onChange={e => setD("metric1Label", e.target.value)} placeholder="UPRAVLJANO AD SPEND" />
                  <label style={labelStyle}>Metrika 2 — vrijednost</label>
                  <input style={inputStyle} value={draft.metric2Value} onChange={e => setD("metric2Value", e.target.value)} placeholder="4.1×" />
                  <label style={labelStyle}>Metrika 2 — naziv</label>
                  <input style={inputStyle} value={draft.metric2Label} onChange={e => setD("metric2Label", e.target.value)} placeholder="PROS. ROAS" />
                  <label style={labelStyle}>Cijena retainera</label>
                  <input style={inputStyle} value={draft.servicePrice} onChange={e => setD("servicePrice", e.target.value)} placeholder="€1.800" />
                  <label style={labelStyle}>Oznaka cijene</label>
                  <input style={inputStyle} value={draft.servicePriceLabel} onChange={e => setD("servicePriceLabel", e.target.value)} placeholder="/mes retainer" />
                  <label style={labelStyle}>Kapacitet</label>
                  <input style={inputStyle} value={draft.detailCapacity} onChange={e => setD("detailCapacity", e.target.value)} placeholder="2 retainer slota" />
                  <label style={labelStyle}>Brzina odgovora</label>
                  <input style={inputStyle} value={draft.detailResponse} onChange={e => setD("detailResponse", e.target.value)} placeholder="0–4 sata" />
                  <label style={labelStyle}>Min. budžet</label>
                  <input style={inputStyle} value={draft.detailMinBudget} onChange={e => setD("detailMinBudget", e.target.value)} placeholder="€5k/mes" />
                  <label style={labelStyle}>Jezici</label>
                  <input style={inputStyle} value={draft.detailLanguages} onChange={e => setD("detailLanguages", e.target.value)} placeholder="SR · EN" />
                  <label style={labelStyle}>CTA dugme 1</label>
                  <input style={inputStyle} value={draft.ctaBtn1} onChange={e => setD("ctaBtn1", e.target.value)} />
                  <label style={labelStyle}>CTA dugme 2</label>
                  <input style={inputStyle} value={draft.ctaBtn2} onChange={e => setD("ctaBtn2", e.target.value)} />
                  <EditActions />
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <SectionHeader label="Informacije" section="sidebar" />
                  </div>
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    {p.avatarUrl
                      ? <img src={p.avatarUrl} alt="avatar" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", margin: "0 auto 16px", display: "block", boxShadow: "0 4px 16px rgba(31,87,195,0.25)" }} />
                      : <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg,#1F57C3,#0D3B8C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 700, color: "#fff", margin: "0 auto 16px", boxShadow: "0 4px 16px rgba(31,87,195,0.25)" }}>{p.initials}</div>
                    }
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#1E1E1E", marginBottom: 4 }}>{p.firstName} {p.lastName}</div>
                    <div style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 8 }}>📍 {p.city}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 20, background: "#F0FAF0", border: "1px solid #B8E6A8" }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#14A800", flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "#14A800", fontWeight: 600 }}>{p.openStatus}</span>
                      </div>
                      <div style={{ padding: "5px 10px", background: "#FFEEE0", color: "#D97706", fontSize: 11, fontWeight: 700, borderRadius: 20, border: "1px solid #FCD9A0" }}>★ TOP RATED</div>
                      {p.badge && <div style={{ padding: "5px 10px", background: "#E8F5E3", color: "#14A800", fontSize: 11, fontWeight: 700, borderRadius: 20, border: "1px solid #B8E6A8" }}>{p.badge}</div>}
                    </div>
                    <button style={{ width: "100%", padding: "12px", background: "#1F57C3", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(31,87,195,0.3)" }}>{p.ctaBtn1}</button>
                    <button style={{ width: "100%", padding: "11px", background: "transparent", color: "#1F57C3", border: "1.5px solid #1F57C3", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>{p.ctaBtn2}</button>
                  </div>
                  <Divider />
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: "#6B6B6B", letterSpacing: "0.5px", marginBottom: 4 }}>RETAINER CIJENA</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#1E1E1E" }}>{p.servicePrice}<span style={{ fontSize: 14, fontWeight: 400, color: "#6B6B6B" }}> {p.servicePriceLabel}</span></div>
                  </div>
                  <Divider />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                    <div style={{ textAlign: "center", padding: "14px 8px", background: "#F7F7F5", borderRadius: 10, border: "1px solid #E4EBE4" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#1F57C3" }}>{p.metric1Value}</div>
                      <div style={{ fontSize: 9, color: "#6B6B6B", letterSpacing: "0.5px", marginTop: 4 }}>{p.metric1Label}</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "14px 8px", background: "#F7F7F5", borderRadius: 10, border: "1px solid #E4EBE4" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#14A800" }}>{p.metric2Value}</div>
                      <div style={{ fontSize: 9, color: "#6B6B6B", letterSpacing: "0.5px", marginTop: 4 }}>{p.metric2Label}</div>
                    </div>
                  </div>
                  <Divider />
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { icon: "⚡", label: "Odgovor", value: p.detailResponse },
                      { icon: "👥", label: "Kapacitet", value: p.detailCapacity },
                      { icon: "💰", label: "Min budget", value: p.detailMinBudget },
                      { icon: "🌐", label: "Jezici", value: p.detailLanguages },
                    ].map((d, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#6B6B6B" }}>{d.icon} {d.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1E1E1E" }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                  <Divider />
                  <div style={{ textAlign: "center", fontSize: 11, color: "#ADADAD" }}>
                    Profil na <a href="https://www.pikmi.today/" target="_blank" rel="noopener noreferrer" style={{ color: "#1F57C3", fontWeight: 600, textDecoration: "none" }}>pikmi.today</a>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="profile-main" style={{ padding: "32px 40px" }}>

            {/* 01 — Šta radim */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E4EBE4", padding: "28px 32px", marginBottom: 20 }}>
              {editSection === "service" && draft ? (
                <div>
                  <SectionHeader label="01 — Šta radim" section="service" />
                  <label style={labelStyle}>Naslov usluge</label>
                  <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={draft.serviceTitle} onChange={e => setD("serviceTitle", e.target.value)} placeholder="Npr. Meta i TikTok Ads za e-commerce brendove." />
                  <label style={labelStyle}>Opis usluge</label>
                  <textarea style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} value={draft.serviceDesc} onChange={e => setD("serviceDesc", e.target.value)} placeholder="Kratki opis tvojih usluga i specijalizacija..." />
                  <EditActions />
                </div>
              ) : (
                <>
                  <SectionHeader label="01 — Šta radim" section="service" />
                  <h2 style={{ margin: "0 0 16px", fontSize: 24, fontWeight: 700, color: "#1E1E1E", lineHeight: 1.25, letterSpacing: "-0.3px", whiteSpace: "pre-line" }}>{p.serviceTitle}</h2>
                  <p style={{ margin: 0, fontSize: 15, color: "#3C3C3C", lineHeight: 1.8 }}>{p.serviceDesc}</p>
                </>
              )}
            </div>

            {/* 02 — Portfolio */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E4EBE4", padding: "28px 32px", marginBottom: 20 }}>
              {editSection === "portfolio" && draft ? (
                <div>
                  <SectionHeader label="02 — Rezultati / Portfolio" section="portfolio" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i}>
                        <label style={labelStyle}>Slika projekta {i + 1}</label>
                        <div style={{ aspectRatio: "4/3", borderRadius: 10, overflow: "hidden", border: "1.5px dashed #D0D8FF", background: "#F7F9FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, position: "relative" }}>
                          {draft.csImages[i]
                            ? <img src={draft.csImages[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <div style={{ textAlign: "center", color: "#ADADAD" }}>
                                <div style={{ fontSize: 24, marginBottom: 4 }}>📁</div>
                                <div style={{ fontSize: 10 }}>Projekat {i + 1}</div>
                              </div>
                          }
                        </div>
                        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ padding: "7px 14px", background: "#F0F4FF", border: "1px solid #D0DCFF", borderRadius: 8, cursor: "pointer", fontSize: 12, color: "#1F57C3", fontWeight: 600, whiteSpace: "nowrap" }}>
                            {uploading === i ? "Uploading..." : "⬆ Uploaduj"}
                          </span>
                          <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) uploadImage(i, e.target.files[0]); }} />
                          {draft.csImages[i] && (
                            <button onClick={() => { const imgs = [...draft.csImages]; imgs[i] = ""; setDraft(prev => prev ? { ...prev, csImages: imgs } : null); }}
                              style={{ padding: "7px 10px", background: "none", border: "1px solid #FECACA", borderRadius: 8, cursor: "pointer", fontSize: 12, color: "#EF4444" }}>
                              Ukloni
                            </button>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                  <EditActions />
                </div>
              ) : (
                <>
                  <SectionHeader label="02 — Rezultati / Portfolio" section="portfolio" />
                  <div className="profile-cs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{ aspectRatio: "4/3", borderRadius: 10, overflow: "hidden", border: p.csImages[i] ? "1px solid #E4EBE4" : "1.5px dashed #D0D0C8", background: p.csImages[i] ? "transparent" : "#F7F7F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {p.csImages[i]
                          ? <img src={p.csImages[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 20, opacity: 0.25, marginBottom: 4 }}>📁</div>
                              <div style={{ fontSize: 9, color: "#ADADAD", letterSpacing: "0.5px" }}>PROJEKAT {i + 1}</div>
                            </div>
                        }
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 03 — Paketi */}
            <div style={{ position: "relative", background: "#fff", borderRadius: 12, border: "1px solid #E4EBE4", padding: "28px 32px", marginBottom: 20 }}>
              {editSection === "pricing" && draft ? (
                <div>
                  <SectionHeader label="03 — Paketi i cijene" section="pricing" />
                  {draft.pricing.map((tier, i) => (
                    <div key={i} style={{ padding: "16px", background: "#F7F9FF", borderRadius: 10, marginBottom: 12, border: "1px solid #E0E6FF" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6B6B", marginBottom: 10 }}>PAKET {i + 1}</div>
                      <label style={labelStyle}>Naziv</label>
                      <input style={inputStyle} value={tier.name} onChange={e => setDraft_tier(i, "name", e.target.value)} placeholder="Naziv paketa" />
                      <label style={labelStyle}>Cijena</label>
                      <input style={inputStyle} value={tier.price} onChange={e => setDraft_tier(i, "price", e.target.value)} placeholder="€600" />
                      <label style={labelStyle}>Opis</label>
                      <input style={inputStyle} value={tier.desc} onChange={e => setDraft_tier(i, "desc", e.target.value)} placeholder="Kratki opis..." />
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6B6B6B", cursor: "pointer" }}>
                        <input type="checkbox" checked={!!tier.green} onChange={e => setDraft_tier(i, "green", e.target.checked)} />
                        Zelena boja cijene
                      </label>
                    </div>
                  ))}
                  <EditActions />
                </div>
              ) : (
                <>
                  <SectionHeader label="03 — Paketi i cijene" section="pricing" />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {p.pricing.map((tier, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", borderBottom: i < p.pricing.length - 1 ? "1px solid #F0F0EB" : "none" }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "#1E1E1E", marginBottom: 4 }}>{tier.name}</div>
                          <div style={{ fontSize: 13, color: "#6B6B6B" }}>{tier.desc}</div>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: tier.green ? "#14A800" : "#1F57C3", flexShrink: 0, marginLeft: 24 }}>{tier.price}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 04 — Stack */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E4EBE4", padding: "28px 32px", marginBottom: 20 }}>
              {editSection === "stack" && draft ? (
                <div>
                  <SectionHeader label="04 — Stack / Vještine" section="stack" />
                  <label style={labelStyle}>Alati i vještine (razdvoji zarezom)</label>
                  <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={draft.stack} onChange={e => setD("stack", e.target.value)} placeholder="Meta Ads, TikTok Ads, Klaviyo, GA4..." />
                  <EditActions />
                </div>
              ) : (
                <>
                  <SectionHeader label="04 — Stack / Vještine" section="stack" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {stackTags.map((tag, i) => (
                      <span key={i} style={{ fontSize: 13, padding: "7px 16px", borderRadius: 20, background: "#F0F4FF", color: "#1F57C3", border: "1px solid #D0DCFF", fontWeight: 500 }}>{tag}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 06 — Testimonial */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E4EBE4", padding: "28px 32px", marginBottom: 20 }}>
              {editSection === "testimonial" && draft ? (
                <div>
                  <SectionHeader label="06 — Recenzija klijenta" section="testimonial" />
                  <label style={labelStyle}>Citat klijenta</label>
                  <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} value={draft.testimonialQuote} onChange={e => setD("testimonialQuote", e.target.value)} placeholder="Npr. Stefan je za 6 meseci skalirao naš ad spend 4×..." />
                  <label style={labelStyle}>Ime klijenta</label>
                  <input style={inputStyle} value={draft.testimonialName} onChange={e => setD("testimonialName", e.target.value)} placeholder="Ana Lukić" />
                  <label style={labelStyle}>Titula / Kompanija</label>
                  <input style={inputStyle} value={draft.testimonialTitle} onChange={e => setD("testimonialTitle", e.target.value)} placeholder="CEO, Lumea Beauty" />
                  <EditActions />
                </div>
              ) : (
                <>
                  <SectionHeader label="06 — Recenzija klijenta" section="testimonial" />
                  <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                    {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#14A800", fontSize: 16 }}>★</span>)}
                    <span style={{ fontSize: 13, color: "#6B6B6B", marginLeft: 6, alignSelf: "center" }}>5.0 / 5.0</span>
                  </div>
                  <p style={{ margin: "0 0 20px", fontSize: 16, color: "#1E1E1E", lineHeight: 1.7, fontStyle: "italic" }}>"{p.testimonialQuote}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#1F57C3,#0D3B8C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                      {p.testimonialName?.[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1E1E1E" }}>{p.testimonialName}</div>
                      <div style={{ fontSize: 12, color: "#6B6B6B" }}>{p.testimonialTitle}</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 07 — CTA */}
            <div style={{ position: "relative", borderRadius: 12, padding: "32px", background: "linear-gradient(135deg, #1F57C3 0%, #0D3B8C 100%)" }}>
              {editSection === "cta" && draft ? (
                <div style={{ background: "#fff", borderRadius: 10, padding: 20 }}>
                  <SectionHeader label="07 — CTA / Kontakt" section="cta" />
                  <label style={labelStyle}>Naslov CTA</label>
                  <input style={inputStyle} value={draft.ctaTitle} onChange={e => setD("ctaTitle", e.target.value)} placeholder="Spreman da skaliraš" />
                  <label style={labelStyle}>Istaknuta riječ (italic, plava)</label>
                  <input style={inputStyle} value={draft.ctaHighlight} onChange={e => setD("ctaHighlight", e.target.value)} placeholder="profitabilno" />
                  <label style={labelStyle}>Tekst dugmeta 1</label>
                  <input style={inputStyle} value={draft.ctaBtn1} onChange={e => setD("ctaBtn1", e.target.value)} />
                  <label style={labelStyle}>Tekst dugmeta 2</label>
                  <input style={inputStyle} value={draft.ctaBtn2} onChange={e => setD("ctaBtn2", e.target.value)} />
                  <EditActions />
                </div>
              ) : (
                <>
                  <SectionHeader label="07 — KONTAKT" section="cta" light={true} />
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "1.5px", marginBottom: 10 }}>07 — KONTAKT</div>
                  <h3 style={{ margin: "0 0 20px", fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                    {p.ctaTitle} <em style={{ fontStyle: "italic", color: "#93C5FD" }}>{p.ctaHighlight}</em>?
                  </h3>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button style={{ padding: "14px 28px", background: "#fff", color: "#1F57C3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{p.ctaBtn1}</button>
                    <button style={{ padding: "14px 28px", background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.35)", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{p.ctaBtn2}</button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
