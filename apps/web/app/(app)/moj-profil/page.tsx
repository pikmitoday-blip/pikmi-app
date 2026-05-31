"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../../lib/i18n";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ExperienceItem {
  company: string; role: string; dateFrom: string; dateTo: string; desc: string;
}
interface CaseStudyItem {
  client?: string; platform?: string; year?: string;
  bg?: string; industry?: string; metric?: string; metricLabel?: string; lightText?: boolean;
}
interface PricingTier { name: string; price: string; desc: string; green?: boolean; }
interface Profile {
  csImages: string[];
  avatarUrl: string;
  firstName: string; lastName: string; initials: string; city: string;
  openStatus: string; badge: string; badge2?: string;
  metric1Value: string; metric1Label: string;
  metric2Value: string; metric2Label: string;
  metric3Value?: string; metric3Label?: string;
  serviceTitle: string; servicePrice: string; servicePriceLabel: string; serviceDesc: string;
  caseStudies: CaseStudyItem[];
  pricing: PricingTier[];
  stack: string;
  detailCapacity: string; detailResponse: string; detailMinBudget: string; detailLanguages: string;
  testimonialQuote: string; testimonialName: string; testimonialTitle: string;
  testimonials?: Array<{ quote: string; name: string; title: string; avatarUrl?: string }>;
  experience?: ExperienceItem[];
  ctaTitle: string; ctaHighlight: string; ctaBtn1: string; ctaBtn2: string;
  pdfUrl?: string;
}

// ─── Design tokens ───────────────────────────────────────────────────────────

const C = {
  accent:      "#7C3AED",
  accentLight: "#F5F1FE",
  accentMuted: "#A78BFA",
  dark:        "#0B0F19",
  text:        "#374151",
  muted:       "#6B7280",
  border:      "#E5E7EB",
  divider:     "#F3F4F6",
  sectionBg:   "#FAFAFB",
  tagGrayBg:   "#F3F4F6",
  tagGrayText: "#374151",
  green:       "#22C55E",
};

const CS_GRADIENTS = [
  "linear-gradient(135deg,#7C3AED,#3B82F6)",
  "linear-gradient(135deg,#EC4899,#7C3AED)",
  "linear-gradient(135deg,#3B82F6,#0B0F19)",
  "linear-gradient(135deg,#7C3AED,#EC4899)",
];

const DEFAULT_PROFILE: Profile = {
  csImages: ["", "", "", ""],
  avatarUrl: "", firstName: "", lastName: "", initials: "", city: "",
  openStatus: "DOSTUPAN", badge: "", badge2: "",
  metric1Value: "", metric1Label: "", metric2Value: "", metric2Label: "",
  metric3Value: "", metric3Label: "",
  serviceTitle: "", servicePrice: "", servicePriceLabel: "sat", serviceDesc: "",
  caseStudies: [{}, {}, {}, {}], pricing: [], stack: "",
  detailCapacity: "", detailResponse: "", detailMinBudget: "", detailLanguages: "",
  testimonialQuote: "", testimonialName: "", testimonialTitle: "",
  experience: [],
  ctaTitle: "", ctaHighlight: "", ctaBtn1: "Zakaži besplatan poziv", ctaBtn2: "",
  pdfUrl: "",
};

function getCached(): Profile | null {
  try { const c = sessionStorage.getItem("pikmi-moj-profil"); if (c) return JSON.parse(c); } catch {}
  return null;
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const INP: React.CSSProperties = {
  width: "100%", padding: "9px 11px", borderRadius: 8, fontSize: 13,
  border: `1.5px solid ${C.border}`, background: "#FAFAFA",
  fontFamily: "inherit", color: C.dark, outline: "none",
  boxSizing: "border-box", marginBottom: 8,
};
const LBL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.5px",
  display: "block", marginBottom: 3, textTransform: "uppercase",
};

function SectionSep() {
  return <div style={{ borderTop: `6px solid ${C.sectionBg}` }} />;
}

function SectionHead({ number: _number, text, section, onEdit }: {
  number: string; text: string; section: string; onEdit: (s: string) => void;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>
        {text}
      </p>
      <button onClick={() => onEdit(section)}
        style={{ padding: "4px 8px", borderRadius: 6, fontSize: 16, background: C.accentLight, border: "none", cursor: "pointer", lineHeight: 1 }}>
        ✏️
      </button>
    </div>
  );
}

function EditBar({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, paddingTop: 14, borderTop: `1px solid ${C.border}`, marginTop: 14 }}>
      <button onClick={onSave} disabled={saving}
        style={{ padding: "9px 18px", background: C.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
        {saving ? "Čuvam..." : "Sačuvaj"}
      </button>
      <button onClick={onCancel}
        style={{ padding: "9px 14px", background: "#F7F7F5", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
        Otkaži
      </button>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function MojProfil() {
  const { t } = useLanguage();
  const [p, setP] = useState<Profile | null>(() => getCached());
  const [userId, setUserId] = useState<string>("");
  const [profileUrl, setProfileUrl] = useState<string>(() => {
    try { return sessionStorage.getItem("pikmi-profile-url") ?? ""; } catch { return ""; }
  });
  const [loading, setLoading] = useState(!getCached());
  const [editSection, setEditSection] = useState<string | null>(null);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        if (user) {
          setUserId(user.id);
          const { data } = await supabase.from("profiles")
            .select("first_name, last_name, profile_data, profile_url")
            .eq("user_id", user.id).single();
          if (data) {
            const pd = (data.profile_data as Record<string, any>) || {};
            const merged: Profile = {
              ...DEFAULT_PROFILE, ...pd,
              firstName: data.first_name || "",
              lastName: data.last_name || "",
              initials: (data.first_name?.[0] ?? "") + (data.last_name?.[0] ?? ""),
              csImages: pd.csImages ?? ["", "", "", ""],
              caseStudies: pd.caseStudies ?? [{}, {}, {}, {}],
              experience: pd.experience ?? [],
            };
            setP(merged);
            try { sessionStorage.setItem("pikmi-moj-profil", JSON.stringify(merged)); } catch {}
            if (data.profile_url) {
              setProfileUrl(data.profile_url);
              try { sessionStorage.setItem("pikmi-profile-url", data.profile_url); } catch {}
            }
          }
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  function startEdit(s: string) { setEditSection(s); setDraft(p ? { ...p } : null); }
  function cancelEdit() { setEditSection(null); setDraft(null); }
  function setD<K extends keyof Profile>(key: K, v: Profile[K]) {
    setDraft(prev => prev ? { ...prev, [key]: v } : null);
  }
  function setDraftCS(i: number, key: keyof CaseStudyItem, v: string) {
    if (!draft) return;
    const cs = [...(draft.caseStudies ?? [{}, {}, {}, {}])];
    cs[i] = { ...cs[i], [key]: v };
    setDraft(prev => prev ? { ...prev, caseStudies: cs } : null);
  }
  function setDraftExp(i: number, key: keyof ExperienceItem, v: string) {
    if (!draft) return;
    const exp = [...(draft.experience ?? [])];
    exp[i] = { ...exp[i], [key]: v };
    setDraft(prev => prev ? { ...prev, experience: exp } : null);
  }
  function addExp() {
    setDraft(prev => prev ? { ...prev, experience: [...(prev.experience ?? []), { company: "", role: "", dateFrom: "", dateTo: "", desc: "" }] } : null);
  }
  function removeExp(i: number) {
    setDraft(prev => {
      if (!prev) return null;
      const exp = [...(prev.experience ?? [])]; exp.splice(i, 1);
      return { ...prev, experience: exp };
    });
  }

  async function saveSection() {
    if (!draft || !userId) return;
    setSaving(true);
    try {
      const toSave = { ...draft, csImages: (draft.csImages ?? []).map(img => img.startsWith("data:") ? "" : img) };
      await supabase.from("profiles").upsert({
        user_id: userId, first_name: draft.firstName, last_name: draft.lastName,
        service_title: (draft.serviceTitle || "").split("\n")[0].trim(),
        profile_data: toSave,
      }, { onConflict: "user_id" });
      setP(toSave);
      try {
        sessionStorage.setItem("pikmi-moj-profil", JSON.stringify(toSave));
        sessionStorage.setItem("pikmi-profile-edit", JSON.stringify(toSave));
        // Instant update sidebara — bez refresha
        window.dispatchEvent(new CustomEvent("pikmi-profile-changed", {
          detail: {
            firstName: toSave.firstName,
            lastName: toSave.lastName,
            initials: (toSave.firstName?.[0] ?? "").toUpperCase() + (toSave.lastName?.[0] ?? "").toUpperCase(),
            avatarUrl: toSave.avatarUrl,
            serviceTitle: (toSave.serviceTitle || "").split("\n")[0].trim(),
          },
        }));
      } catch {}
    } catch (e) { console.error(e); }
    setSaving(false); setSavedMsg(true); setEditSection(null); setDraft(null);
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
      const imgs = [...(draft?.csImages ?? ["", "", "", ""])];
      imgs[i] = publicUrl;
      setDraft(prev => prev ? { ...prev, csImages: imgs } : null);
    } catch {}
    setUploading(null);
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <div style={{ fontSize: 14, color: C.muted }}>Učitavanje profila...</div>
    </div>
  );
  if (!p) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <div style={{ fontSize: 14, color: C.muted }}>Profil nije pronađen</div>
    </div>
  );

  const stackTags = (p.stack || "").split(",").map(s => s.trim()).filter(Boolean);
  const stats = [
    { value: p.metric1Value, label: p.metric1Label },
    { value: p.metric2Value, label: p.metric2Label },
    ...(p.metric3Value ? [{ value: p.metric3Value!, label: p.metric3Label ?? "" }] : []),
  ].filter(m => m.value);
  const csSlots = [0, 1, 2, 3].filter(i => p.csImages?.[i] || p.caseStudies?.[i]?.client);
  const hasWork = csSlots.length > 0;

  // ─── Edit form helpers ─────────────────────────────────────────────────────

  function InfoEditForm() {
    if (!draft) return null;
    return (
      <div style={{ padding: 24 }}>
        {/* Profilna slika */}
        <p style={{ ...LBL, marginBottom: 10 }}>PROFILNA SLIKA</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          {draft.avatarUrl
            ? <img src={draft.avatarUrl} alt="" style={{ width: 60, height: 60, borderRadius: 14, objectFit: "cover" }} />
            : <div style={{ width: 60, height: 60, borderRadius: 14, background: `linear-gradient(135deg,${C.accent},#3B82F6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff" }}>{draft.initials || "?"}</div>
          }
          <label style={{ padding: "7px 13px", background: C.accentLight, color: C.accent, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {uploadingAvatar ? "Otpremam..." : "Promeni sliku"}
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]); }} />
          </label>
        </div>

        {/* Ime i prezime */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 2 }}>
          <div><label style={LBL}>IME</label><input style={INP} value={draft.firstName} onChange={e => setD("firstName", e.target.value)} placeholder="Ime" /></div>
          <div><label style={LBL}>PREZIME</label><input style={INP} value={draft.lastName} onChange={e => setD("lastName", e.target.value)} placeholder="Prezime" /></div>
        </div>

        {/* Grad */}
        <label style={LBL}>GRAD, ZEMLJA</label>
        <input style={INP} value={draft.city} onChange={e => setD("city", e.target.value)} placeholder="Beograd, Srbija" />

        {/* Godine iskustva */}
        <label style={LBL}>GODINE ISKUSTVA</label>
        <input style={INP} value={(draft as any).yearsExperience ?? ""} onChange={e => setD("yearsExperience" as any, e.target.value)} placeholder="npr. 3+ godine, 5 godina..." />

        <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />
      </div>
    );
  }

  // ─── Info display (LEFT PANEL on desktop) ─────────────────────────────────

  function InfoDisplay() {
    if (!p) return null;
    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <button onClick={() => startEdit("info")}
            style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: C.accentLight, color: C.accent, border: "none", cursor: "pointer" }}>
            Uredi
          </button>
        </div>

        {/* Avatar + Name */}
        <div style={{ marginBottom: 16 }}>
          {p.avatarUrl
            ? <img src={p.avatarUrl} alt="" style={{ width: "100%", maxWidth: 220, height: 200, borderRadius: 20, objectFit: "cover", display: "block", marginBottom: 14, boxShadow: "0 8px 20px rgba(124,58,237,0.2)" }} />
            : <div style={{ width: 88, height: 88, borderRadius: 20, background: `linear-gradient(135deg,${C.accent},#3B82F6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 14, boxShadow: "0 8px 20px rgba(124,58,237,0.25)" }}>
                {p.initials || "?"}
              </div>
          }
          <p style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.6px", lineHeight: 1, color: C.dark }}>{p.firstName || "Ime"}</p>
          <p style={{ margin: "2px 0 0", fontSize: 26, fontWeight: 700, letterSpacing: "-0.6px", lineHeight: 1.1, color: C.accent }}>{p.lastName || "Prezime"}</p>
          {p.city && <p style={{ margin: "8px 0 0", fontSize: 11, color: C.muted }}>→ {p.city}</p>}
          {(p as any).yearsExperience && (
            <p style={{ margin: "6px 0 0", fontSize: 11, color: C.accent, fontWeight: 600 }}>
              🗓 {(p as any).yearsExperience}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Responsive CSS ── */}
      <style>{`
        .pp-card {
          width: 100%;
          background: #fff;
          border-radius: 24px;
          border: 0.5px solid ${C.border};
          overflow: hidden;
          font-family: 'Inter', -apple-system, sans-serif;
          color: ${C.dark};
        }
        .pp-grid { display: block; }
        .pp-left { }
        .pp-right { min-width: 0; }
        @media (min-width: 769px) {
          .pp-grid {
            display: grid;
            grid-template-columns: 320px 1fr;
            align-items: start;
          }
          .pp-left {
            border-right: 1px solid ${C.divider};
            position: sticky;
            top: 0;
            max-height: calc(100vh - 80px);
            overflow-y: auto;
          }
          .pp-right-section { padding: 28px 36px !important; }
          .pp-cs-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .pp-card { max-width: 480px; margin: 0 auto; }
        }
      `}</style>

      {/* ── Page header ── */}
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">{t("profile_page_title")}</h1>
          <p className="page-subtitle">{t("profile_page_sub")}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {savedMsg && <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>Sačuvano ✓</span>}
          {profileUrl && (
            <a href={`https://www.pikmi.today/${profileUrl}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
              <span style={{ fontSize: 14 }}>👁</span>{t("profile_view_live")}<span style={{ fontSize: 12, opacity: 0.8 }}>↗</span>
            </a>
          )}
        </div>
      </div>

      {/* ── Card ── */}
      <div className="pp-card" style={{ marginBottom: 60 }}>

        {/* Nav */}
        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `0.5px solid ${C.divider}` }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
            pik<span style={{ color: C.accent }}>mi</span>
          </p>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.divider, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: C.muted }}>×</div>
        </div>

        {/* Grid: left + right */}
        <div className="pp-grid">

          {/* ── LEFT PANEL (info) ── */}
          <div className="pp-left">
            {editSection === "info" ? <InfoEditForm /> : <InfoDisplay />}
          </div>

          {/* ── RIGHT PANEL (sections 01–07) ── */}
          <div className="pp-right">

            {/* 01 — Šta radim */}
            <div className="pp-right-section" style={{ padding: "24px 20px" }}>
              {editSection === "service" && draft ? (
                <div>
                  <p style={{ margin: "0 0 14px", fontSize: 9, fontWeight: 600, color: C.accent, letterSpacing: "1.5px", textTransform: "uppercase" }}>01 — ŠTA RADIM</p>
                  <label style={LBL}>NASLOV USLUGE</label>
                  <textarea style={{ ...INP, minHeight: 70, resize: "vertical" } as React.CSSProperties} value={draft.serviceTitle} onChange={e => setD("serviceTitle", e.target.value)} placeholder="Video editor za e-commerce" />
                  <label style={LBL}>OPIS</label>
                  <textarea style={{ ...INP, minHeight: 90, resize: "vertical" } as React.CSSProperties} value={draft.serviceDesc} onChange={e => setD("serviceDesc", e.target.value)} placeholder="Kratki opis tvojih usluga..." />
                  <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />
                </div>
              ) : (
                <>
                  <SectionHead number="01" text="Šta radim" section="service" onEdit={startEdit} />
                  {p.serviceTitle
                    ? <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px", lineHeight: 1.2 }}>{p.serviceTitle}</h2>
                    : <p style={{ margin: "0 0 12px", fontSize: 13, color: C.muted, fontStyle: "italic" }}>Nema naslova — klikni Uredi</p>
                  }
                  {p.serviceDesc && <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.65 }}>{p.serviceDesc}</p>}
                </>
              )}
            </div>

            {/* Paketi / cene */}
            <SectionSep />
            <div className="pp-right-section" style={{ padding: "24px 20px" }}>
              {editSection === "pricing" && draft ? (
                <div>
                  <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: C.text }}>Paketi</p>
                  {(draft.pricing ?? []).map((tier, i) => (
                    <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Paket {i + 1}</span>
                        <button onClick={() => {
                          const next = [...(draft.pricing ?? [])]; next.splice(i, 1);
                          setDraft(prev => prev ? { ...prev, pricing: next } : null);
                        }} style={{ padding: "3px 10px", borderRadius: 6, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontSize: 11, cursor: "pointer" }}>
                          Ukloni
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <div>
                          <label style={LBL}>IME PAKETA</label>
                          <input style={INP} value={tier.name} onChange={e => {
                            const t = [...(draft.pricing ?? [])]; t[i] = { ...t[i], name: e.target.value };
                            setDraft(prev => prev ? { ...prev, pricing: t } : null);
                          }} placeholder="Starter" />
                        </div>
                        <div>
                          <label style={LBL}>CENA</label>
                          <input style={INP} value={tier.price} onChange={e => {
                            const t = [...(draft.pricing ?? [])]; t[i] = { ...t[i], price: e.target.value };
                            setDraft(prev => prev ? { ...prev, pricing: t } : null);
                          }} placeholder="€500" />
                        </div>
                      </div>
                      <div>
                        <label style={LBL}>OPIS</label>
                        <input style={INP} value={tier.desc} onChange={e => {
                          const t = [...(draft.pricing ?? [])]; t[i] = { ...t[i], desc: e.target.value };
                          setDraft(prev => prev ? { ...prev, pricing: t } : null);
                        }} placeholder="Šta je uključeno u ovaj paket..." />
                      </div>
                    </div>
                  ))}
                  {(draft.pricing ?? []).length < 3 && (
                    <button onClick={() => setDraft(prev => prev ? { ...prev, pricing: [...(prev.pricing ?? []), { name: "", price: "", desc: "" }] } : null)}
                      style={{ width: "100%", padding: "10px", borderRadius: 8, background: C.accentLight, color: C.accent, border: `1px dashed ${C.accent}50`, cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                      + Dodaj paket {(draft.pricing ?? []).length + 1}
                    </button>
                  )}
                  <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>Paketi</p>
                    <button onClick={() => startEdit("pricing")}
                      style={{ padding: "4px 8px", borderRadius: 6, fontSize: 16, background: C.accentLight, border: "none", cursor: "pointer", lineHeight: 1 }}>✏️</button>
                  </div>
                  {p.pricing && p.pricing.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(p.pricing.length, 3)}, 1fr)`, gap: 12 }}>
                      {p.pricing.map((tier, i) => (
                        <div key={i} style={{
                          background: tier.green ? C.accent : C.sectionBg,
                          border: `1px solid ${tier.green ? C.accent : C.border}`,
                          borderRadius: 14, padding: "14px 12px",
                          color: tier.green ? "#fff" : C.text,
                        }}>
                          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: tier.green ? "rgba(255,255,255,0.7)" : C.muted }}>{tier.name}</p>
                          <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: tier.green ? "#fff" : C.accent }}>{tier.price}</p>
                          <p style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: tier.green ? "rgba(255,255,255,0.8)" : C.muted }}>{tier.desc}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 13, color: C.muted, fontStyle: "italic" }}>Nema paketa — klikni ✏️</p>
                  )}
                </>
              )}
            </div>

            {/* 02 — Rad */}
            <SectionSep />
            <div className="pp-right-section" style={{ padding: "24px 20px" }}>
              {editSection === "portfolio" && draft ? (
                <div>
                  <p style={{ margin: "0 0 14px", fontSize: 9, fontWeight: 600, color: C.accent, letterSpacing: "1.5px", textTransform: "uppercase" }}>02 — RAD</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{ background: C.sectionBg, borderRadius: 10, padding: 12 }}>
                        <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: C.muted }}>PROJEKAT {i + 1}</p>
                        <div style={{ height: 80, borderRadius: 10, overflow: "hidden", background: CS_GRADIENTS[i], marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {draft.csImages?.[i]
                            ? (/\.(mp4|mov|webm|avi)$/i.test(draft.csImages[i])
                                ? <video src={draft.csImages[i]} muted controls style={{ width: "100%", objectFit: "contain", display: "block", background: "#000", maxHeight: 200 }} />
                                : <img src={draft.csImages[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />)
                            : <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Bez fajla</span>
                          }
                        </div>
                        <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                          <label style={{ padding: "5px 10px", background: C.accentLight, color: C.accent, borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                            {uploading === i ? "..." : "Dodaj fajl"}
                            <input type="file" accept="image/*,video/*,application/pdf,.pdf,.mp4,.mov,.webm" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) uploadImage(i, e.target.files[0]); }} />
                          </label>
                          {draft.csImages?.[i] && (
                            <button onClick={() => { const imgs = [...(draft.csImages ?? ["","","",""])]; imgs[i] = ""; setDraft(prev => prev ? { ...prev, csImages: imgs } : null); }}
                              style={{ padding: "5px 8px", background: "none", border: "1px solid #FECACA", borderRadius: 5, cursor: "pointer", fontSize: 11, color: "#EF4444" }}>
                              Ukloni
                            </button>
                          )}
                        </div>
                        <input style={{ ...INP, marginBottom: 4 }} value={draft.caseStudies?.[i]?.client ?? ""} onChange={e => setDraftCS(i, "client", e.target.value)} placeholder="Klijent" />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 60px", gap: 4 }}>
                          <input style={{ ...INP, marginBottom: 0 }} value={draft.caseStudies?.[i]?.platform ?? ""} onChange={e => setDraftCS(i, "platform", e.target.value)} placeholder="Tip" />
                          <input style={{ ...INP, marginBottom: 0 }} value={draft.caseStudies?.[i]?.year ?? ""} onChange={e => setDraftCS(i, "year", e.target.value)} placeholder="2024" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />
                </div>
              ) : (
                <>
                  <SectionHead number="02" text="Prethodni radovi" section="portfolio" onEdit={startEdit} />
                  {hasWork ? (
                    <>
                      <div className="pp-cs-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                        {csSlots.map(i => {
                          const img = p.csImages?.[i]; const cs = p.caseStudies?.[i];
                          return (
                            <div key={i}>
                              {img && /\.(mp4|mov|webm|avi)$/i.test(img) ? (
                                <video src={img} muted preload="metadata" style={{ width: "100%", borderRadius: 14, display: "block", background: "#000", maxHeight: 160, objectFit: "contain" }} />
                              ) : (
                              <div style={{ height: 110, background: img ? "transparent" : CS_GRADIENTS[i % CS_GRADIENTS.length], borderRadius: 14, overflow: "hidden" }}>
                                {img && <img src={img} alt={cs?.client || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                              </div>
                              )}
                              {cs?.client && <p style={{ margin: "8px 0 0", fontSize: 11, fontWeight: 600 }}>{cs.client}</p>}
                              {(cs?.platform || cs?.year) && <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{[cs.platform, cs.year].filter(Boolean).join(" · ")}</p>}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: "none" }}>
                      </div>
                    </>
                  ) : <p style={{ margin: 0, fontSize: 13, color: C.muted, fontStyle: "italic" }}>Nema projekata — klikni Uredi</p>}
                </>
              )}
            </div>

            {/* 03 — Veštine */}
            <SectionSep />
            <div className="pp-right-section" style={{ padding: "24px 20px" }}>
              {editSection === "stack" && draft ? (
                <div>
                  <p style={{ margin: "0 0 14px", fontSize: 9, fontWeight: 600, color: C.accent, letterSpacing: "1.5px", textTransform: "uppercase" }}>03 — VEŠTINE</p>
                  <label style={LBL}>ALATI I VEŠTINE (odvojene zarezom)</label>
                  <textarea style={{ ...INP, minHeight: 80, resize: "vertical" } as React.CSSProperties} value={draft.stack} onChange={e => setD("stack", e.target.value)} placeholder="Premiere Pro, After Effects, DaVinci Resolve..." />
                  <p style={{ margin: "-4px 0 8px", fontSize: 11, color: C.muted }}>Prve 2 veštine prikazuju se istaknuto (ljubičasto).</p>
                  <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />
                </div>
              ) : (
                <>
                  <SectionHead number="03" text="Veštine" section="stack" onEdit={startEdit} />
                  {stackTags.length > 0
                    ? <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {stackTags.map((tag, i) => (
                          <span key={i} style={{ fontSize: 11, padding: "7px 13px", background: i < 2 ? C.accentLight : C.tagGrayBg, color: i < 2 ? C.accent : C.tagGrayText, borderRadius: 999, fontWeight: i < 2 ? 500 : 400 }}>{tag}</span>
                        ))}
                      </div>
                    : <p style={{ margin: 0, fontSize: 13, color: C.muted, fontStyle: "italic" }}>Nema veština — klikni Uredi</p>
                  }
                </>
              )}
            </div>


            {/* 05 — Iskustvo */}
            <SectionSep />
            <div className="pp-right-section" style={{ padding: "24px 20px" }}>
              {editSection === "experience" && draft ? (
                <div>
                  <p style={{ margin: "0 0 14px", fontSize: 9, fontWeight: 600, color: C.accent, letterSpacing: "1.5px", textTransform: "uppercase" }}>05 — ISKUSTVO</p>
                  {(draft.experience ?? []).map((exp, i) => (
                    <div key={i} style={{ background: C.sectionBg, borderRadius: 10, padding: 14, marginBottom: 12, borderLeft: `3px solid ${C.accent}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>Iskustvo {i + 1}</span>
                        <button onClick={() => removeExp(i)} style={{ padding: "3px 8px", background: "none", border: "1px solid #FECACA", borderRadius: 5, cursor: "pointer", fontSize: 11, color: "#EF4444" }}>Ukloni</button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={LBL}>KOMPANIJA</label>
                          <input style={INP} value={exp.company} onChange={e => setDraftExp(i, "company", e.target.value)} placeholder="Magična Azbuka" />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={LBL}>ULOGA</label>
                          <input style={INP} value={exp.role} onChange={e => setDraftExp(i, "role", e.target.value)} placeholder="Senior Video Editor" />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={LBL}>OPIS</label>
                          <textarea style={{ ...INP, minHeight: 60, resize: "vertical" } as React.CSSProperties} value={exp.desc} onChange={e => setDraftExp(i, "desc", e.target.value)} placeholder="Brand film + 8 ad creative-a · ROAS 3.2×" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addExp} style={{ width: "100%", padding: "10px", borderRadius: 8, background: C.accentLight, color: C.accent, border: `1px dashed ${C.accent}50`, cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                    + Dodaj iskustvo
                  </button>
                  <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />
                </div>
              ) : (
                <>
                  <SectionHead number="05" text="Prethodno iskustvo" section="experience" onEdit={startEdit} />
                  {(p.experience ?? []).length > 0
                    ? <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {(p.experience ?? []).map((exp, i) => (
                          <div key={i} style={{ paddingLeft: 12, borderLeft: `2px solid ${i === 0 ? C.accent : C.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{exp.company}</p>
                              {(exp.dateFrom || exp.dateTo) && <p style={{ margin: 0, fontSize: 10, color: C.muted, flexShrink: 0, marginLeft: 10 }}>{exp.dateFrom}{exp.dateTo ? ` — ${exp.dateTo}` : ""}</p>}
                            </div>
                            {exp.role && <p style={{ margin: "0 0 6px", fontSize: 11, color: i === 0 ? C.accent : C.muted }}>{exp.role}</p>}
                            {exp.desc && <p style={{ margin: 0, fontSize: 11, color: C.text, lineHeight: 1.5 }}>{exp.desc}</p>}
                          </div>
                        ))}
                      </div>
                    : <p style={{ margin: 0, fontSize: 13, color: C.muted, fontStyle: "italic" }}>Nema iskustva — klikni Uredi</p>
                  }
                </>
              )}
            </div>

            {/* 06 — Reči klijenata */}
            <SectionSep />
            <div className="pp-right-section" style={{ padding: "24px 20px" }}>
              {editSection === "testimonial" && draft ? (
                <div>
                  <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: C.text }}>Reči klijenata</p>
                  {((draft.testimonials ?? []).length === 0 && !draft.testimonialQuote) && (
                    <p style={{ fontSize: 12, color: C.muted, fontStyle: "italic", marginBottom: 14 }}>Dodaj do 5 recenzija klijenata.</p>
                  )}
                  {/* Stari single testimonial — prikaži kao prvi ako nema array */}
                  {(draft.testimonials ?? []).length === 0 && draft.testimonialQuote && (
                    <div style={{ background: C.sectionBg, borderRadius: 12, padding: 14, marginBottom: 12, borderLeft: `3px solid ${C.accent}` }}>
                      <label style={LBL}>CITAT</label>
                      <textarea style={{ ...INP, minHeight: 70, resize: "vertical" } as React.CSSProperties} value={draft.testimonialQuote} onChange={e => setD("testimonialQuote", e.target.value)} />
                      <label style={LBL}>IME</label>
                      <input style={INP} value={draft.testimonialName} onChange={e => setD("testimonialName", e.target.value)} />
                      <label style={LBL}>KOMPANIJA / POZICIJA</label>
                      <input style={{ ...INP, marginBottom: 0 }} value={draft.testimonialTitle} onChange={e => setD("testimonialTitle", e.target.value)} />
                    </div>
                  )}
                  {/* Novi array testimonials */}
                  {(draft.testimonials ?? []).map((t, i) => (
                    <div key={i} style={{ background: C.sectionBg, borderRadius: 12, padding: 14, marginBottom: 12, borderLeft: `3px solid ${C.accent}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>Recenzija {i + 1}</span>
                        <button onClick={() => {
                          const next = [...(draft.testimonials ?? [])]; next.splice(i, 1);
                          setDraft(prev => prev ? { ...prev, testimonials: next } : null);
                        }} style={{ padding: "2px 8px", background: "none", border: "1px solid #FECACA", borderRadius: 5, cursor: "pointer", fontSize: 11, color: "#EF4444" }}>Ukloni</button>
                      </div>
                      <label style={LBL}>CITAT</label>
                      <textarea style={{ ...INP, minHeight: 70, resize: "vertical" } as React.CSSProperties} value={t.quote} onChange={e => {
                        const ts = [...(draft.testimonials ?? [])]; ts[i] = { ...ts[i], quote: e.target.value };
                        setDraft(prev => prev ? { ...prev, testimonials: ts } : null);
                      }} placeholder='"Odlična saradnja..."' />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <label style={LBL}>IME</label>
                          <input style={INP} value={t.name} onChange={e => {
                            const ts = [...(draft.testimonials ?? [])]; ts[i] = { ...ts[i], name: e.target.value };
                            setDraft(prev => prev ? { ...prev, testimonials: ts } : null);
                          }} placeholder="Marko Petrović" />
                        </div>
                        <div>
                          <label style={LBL}>KOMPANIJA / POZICIJA</label>
                          <input style={{ ...INP, marginBottom: 0 }} value={t.title} onChange={e => {
                            const ts = [...(draft.testimonials ?? [])]; ts[i] = { ...ts[i], title: e.target.value };
                            setDraft(prev => prev ? { ...prev, testimonials: ts } : null);
                          }} placeholder="CEO, Kompanija" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {((draft.testimonials ?? []).length < 5) && (
                    <button onClick={() => {
                      const current = draft.testimonials ?? [];
                      // Ako imamo stari single, prebaci ga u array i resetuj stari
                      if (current.length === 0 && draft.testimonialQuote) {
                        const first = { quote: draft.testimonialQuote, name: draft.testimonialName, title: draft.testimonialTitle };
                        setDraft(prev => prev ? { ...prev, testimonials: [...current, first, { quote: "", name: "", title: "" }], testimonialQuote: "", testimonialName: "", testimonialTitle: "" } : null);
                      } else {
                        setDraft(prev => prev ? { ...prev, testimonials: [...current, { quote: "", name: "", title: "" }] } : null);
                      }
                    }} style={{ width: "100%", padding: "10px", borderRadius: 8, background: C.accentLight, color: C.accent, border: `1px dashed ${C.accent}50`, cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                      + Dodaj recenziju ({(draft.testimonials ?? []).length + (draft.testimonialQuote ? 1 : 0)}/5)
                    </button>
                  )}
                  <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />
                </div>
              ) : (
                <>
                  <SectionHead number="06" text="Reči klijenata" section="testimonial" onEdit={startEdit} />
                  {(() => {
                    const list = (p.testimonials && p.testimonials.length > 0)
                      ? p.testimonials
                      : p.testimonialQuote
                      ? [{ quote: p.testimonialQuote, name: p.testimonialName, title: p.testimonialTitle }]
                      : [];
                    if (list.length === 0) return <p style={{ margin: 0, fontSize: 13, color: C.muted, fontStyle: "italic" }}>Nema recenzija — klikni ✏️</p>;
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {list.map((t, i) => (
                          <div key={i} style={{ background: C.accentLight, borderRadius: 14, padding: 16 }}>
                            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500, lineHeight: 1.4, color: C.dark }}>"{t.quote}"</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,${C.accent},#EC4899)` }} />
                              <div>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>{t.name}</p>
                                {t.title && <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{t.title}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {/* CTA / Kontakt */}
            <div style={{ padding: "32px 24px 28px", background: C.dark, color: "#fff" }}>
              {editSection === "cta" && draft ? (
                <div style={{ background: "#fff", borderRadius: 14, padding: 16 }}>
                  <label style={LBL}>NASLOV</label>
                  <input style={INP} value={draft.ctaTitle} onChange={e => setD("ctaTitle", e.target.value)} placeholder="Da napravimo" />
                  <label style={LBL}>ISTAKNUTA REČ (ljubičasto)</label>
                  <input style={INP} value={draft.ctaHighlight} onChange={e => setD("ctaHighlight", e.target.value)} placeholder="sledeći hit" />
                  <label style={LBL}>EMAIL (za kopiranje)</label>
                  <input style={INP} value={(draft as any).contactEmail ?? ""} onChange={e => setD("contactEmail" as any, e.target.value)} placeholder="tvoj@email.com" />
                  <label style={LBL}>TELEFON (za kopiranje)</label>
                  <input style={INP} value={(draft as any).contactPhone ?? ""} onChange={e => setD("contactPhone" as any, e.target.value)} placeholder="+381 60 000 0000" />
                  <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.5px", flex: 1 }}>
                      {(p.ctaTitle || p.ctaHighlight)
                        ? <>{p.ctaTitle}{p.ctaHighlight && <> <span style={{ color: C.accentMuted }}>{p.ctaHighlight}</span></>}?</>
                        : <>Da napravimo<br />tvoj <span style={{ color: C.accentMuted }}>sledeći hit</span>?</>
                      }
                    </h2>
                    <button onClick={() => startEdit("cta")} style={{ padding: "4px 8px", borderRadius: 6, fontSize: 16, background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", lineHeight: 1, flexShrink: 0, marginLeft: 10 }}>✏️</button>
                  </div>
                  {/* Kontakt blokovi preview */}
                  {((p as any).contactEmail || (p as any).contactPhone) ? (
                    <div style={{ display: "grid", gridTemplateColumns: (p as any).contactEmail && (p as any).contactPhone ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 0 }}>
                      {(p as any).contactEmail && (
                        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "12px 14px" }}>
                          <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>✉️ Email</p>
                          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, wordBreak: "break-all" }}>{(p as any).contactEmail}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>klikni da kopiraš</p>
                        </div>
                      )}
                      {(p as any).contactPhone && (
                        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "12px 14px" }}>
                          <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>📞 Telefon</p>
                          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>{(p as any).contactPhone}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>klikni da kopiraš</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>Dodaj email ili telefon — klikni ✏️</p>
                  )}
                  <p style={{ margin: "20px 0 0", textAlign: "center", fontSize: 9, color: C.muted, letterSpacing: "1px" }}>
                    PRAVLJENO SA PIKMI<span style={{ color: C.accentMuted }}>.</span>
                  </p>
                </>
              )}
            </div>

          </div>{/* end pp-right */}
        </div>{/* end pp-grid */}
      </div>{/* end pp-card */}
    </div>
  );
}
