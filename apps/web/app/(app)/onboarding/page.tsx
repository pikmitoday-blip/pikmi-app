"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { pixel } from "../../../lib/pixel";
import { uploadFile } from "../../../lib/upload";
import { THEMES, BLOCK_STYLES, themeTokens, type BlockStyleId } from "../../../lib/themes";

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateSlug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

const TOTAL_STEPS = 9;
const STORAGE_KEY = "pikmi-onboarding-step";

// ── Styles ────────────────────────────────────────────────────────────────────
const INP: React.CSSProperties = {
  width: "100%", padding: "13px 15px",
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(139,92,246,0.2)",
  borderRadius: 12, color: "#fff", fontSize: 14, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
};
const LBL: React.CSSProperties = {
  display: "block", marginBottom: 7, fontSize: 11, fontWeight: 600,
  color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em", textTransform: "uppercase",
};
const HINT: React.CSSProperties = {
  fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6, lineHeight: 1.5,
};

// ── Mini portfolio mockup (only first section filled, no other text) ──────────
function MiniMockup({ themeId, blockStyle, firstName, lastName, city, years, avatarUrl, selected }: {
  themeId: number; blockStyle: BlockStyleId;
  firstName: string; lastName: string; city: string; years: string; avatarUrl: string;
  selected: boolean;
}) {
  const theme = THEMES.find(t => t.id === themeId)!;
  const TK = themeTokens(theme, blockStyle);
  const g = TK.geom;
  const initials = (firstName?.[0] ?? "") + (lastName?.[0] ?? "");

  const blockStyleCss: React.CSSProperties = {
    background: TK.blockBg,
    border: `1px solid ${TK.blockBorder}`,
    borderRadius: Math.min(g.block, 16),
    boxShadow: TK.blockShadow,
  };

  return (
    <div
      style={{
        width: "100%", borderRadius: 16, overflow: "hidden",
        background: TK.pageBg, backgroundSize: "cover",
        padding: 8, display: "flex", flexDirection: "column", gap: 6,
        border: selected ? `3px solid #A855F7` : "3px solid transparent",
        boxShadow: selected ? "0 0 0 3px rgba(168,85,247,0.25)" : "0 2px 10px rgba(0,0,0,0.2)",
        transition: "all 0.15s", cursor: "pointer", minHeight: 220,
      }}
    >
      {/* First block — filled with real info */}
      <div style={{ ...blockStyleCss, padding: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" style={{ width: 34, height: 34, borderRadius: typeof g.avatar === "string" ? g.avatar : Math.min(g.avatar, 12), objectFit: "cover", flexShrink: 0 }} />
            : <div style={{ width: 34, height: 34, borderRadius: typeof g.avatar === "string" ? g.avatar : Math.min(g.avatar, 12), background: `linear-gradient(135deg,${TK.accent},${TK.accent}aa)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{initials || "?"}</div>
          }
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: TK.textPrimary, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{firstName || "Ime"}</p>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: TK.accent, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lastName || "Prezime"}</p>
            {city && <p style={{ margin: "2px 0 0", fontSize: 8, color: TK.textMuted }}>→ {city}</p>}
          </div>
        </div>
        {years && (
          <div style={{ marginTop: 6, display: "inline-block", background: TK.accentBg, color: TK.accent, padding: "3px 8px", borderRadius: g.pill, fontSize: 8, fontWeight: 600 }}>
            Godine iskustva: {String(years).replace(/\s*godin.*/i, "").trim()}
          </div>
        )}
      </div>

      {/* Empty placeholder blocks — no text, just shape + bg */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{ ...blockStyleCss, padding: 10, display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ height: 6, width: "40%", borderRadius: 3, background: TK.accent + "30" }} />
          <div style={{ height: 5, width: "80%", borderRadius: 3, background: TK.divider }} />
          <div style={{ height: 5, width: "65%", borderRadius: 3, background: TK.divider }} />
        </div>
      ))}
    </div>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");

  // ── Step 1: identity + domain + photo ──────────────────────────────────────
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [city,         setCity]         = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDesc,  setServiceDesc]  = useState("");
  const [profileUrl,   setProfileUrl]   = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");

  // ── Step 2: appearance ──────────────────────────────────────────────────────
  const [templateId, setTemplateId] = useState(33);
  const [blockStyle, setBlockStyle] = useState<BlockStyleId>("rounded");

  // ── Step 3+: rest ──────────────────────────────────────────────────────────
  const [pricing, setPricing] = useState<{ name: string; price: string; desc: string }[]>([{ name: "", price: "", desc: "" }]);
  const [skills, setSkills] = useState<string[]>([""]);
  const [clients, setClients] = useState<{ name: string; service: string; desc: string }[]>([{ name: "", service: "", desc: "" }]);
  const [testimonials, setTestimonials] = useState<{ name: string; quote: string; title: string }[]>([{ name: "", quote: "", title: "" }]);
  const [ctaTitle,     setCtaTitle]     = useState("");
  const [ctaHighlight, setCtaHighlight] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Load user info + restore saved step on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setContactEmail(session.user.email ?? "");
        const meta = session.user.user_metadata ?? {};
        const fullName: string = meta.full_name || meta.name || "";
        setFirstName(prev => prev || meta.first_name || meta.given_name || fullName.split(" ")[0] || "");
        setLastName(prev => prev || meta.last_name || meta.family_name || fullName.split(" ").slice(1).join(" ") || "");
        setAvatarUrl(prev => prev || meta.avatar_url || meta.picture || "");
      }
    });
    // Prefill slug from landing page
    try {
      const pending = localStorage.getItem("pikmi-pending-slug");
      if (pending) setProfileUrl(generateSlug(pending));
    } catch {}
    // Restore step
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) { const n = parseInt(saved, 10); if (n >= 1 && n <= TOTAL_STEPS) setStep(n); }
    } catch {}
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, String(step)); } catch {}
  }, [step]);

  // Slug availability check
  useEffect(() => {
    if (!profileUrl) { setSlugStatus("idle"); return; }
    setSlugStatus("checking");
    const t = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id").eq("profile_url", profileUrl).maybeSingle();
      setSlugStatus(data ? "taken" : "ok");
    }, 500);
    return () => clearTimeout(t);
  }, [profileUrl]);

  async function handleAvatar(file: File) {
    if (!userId) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadFile(file, { folder: userId, filename: `avatar-${Date.now()}.${file.name.split(".").pop()?.toLowerCase() ?? "jpg"}` });
      setAvatarUrl(url);
    } catch {}
    setUploadingAvatar(false);
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const canNext: Record<number, boolean> = {
    1: !!avatarUrl && !!firstName.trim() && !!lastName.trim() && !!city.trim() && !!yearsExperience.trim()
       && !!serviceTitle.trim() && !!serviceDesc.trim() && !!profileUrl && slugStatus === "ok",
    2: true, // tema je uvek izabrana
    3: pricing.some(p => p.name.trim() && p.price.trim() && p.desc.trim()),
    4: skills.some(s => s.trim()),
    5: clients.some(c => c.name.trim() && c.service.trim()),
    6: testimonials.some(t => t.name.trim() && t.quote.trim()),
    7: !!ctaTitle.trim() && !!ctaHighlight.trim(),
    8: !!contactEmail.trim() && !!contactPhone.trim(),
    9: true,
  };

  // ── Build + save profile ────────────────────────────────────────────────────
  async function saveProfile() {
    const caseStudies = clients.filter(c => c.name.trim()).map(c => ({
      client: c.name, platform: c.service, industry: c.desc,
      metric: "", metricLabel: "", bg: "", lightText: true,
    }));
    const testiList   = testimonials.filter(t => t.name.trim() && t.quote.trim());
    const pricingList = pricing.filter(p => p.name.trim() && p.price.trim());

    await supabase.from("profiles").upsert({
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      profile_url: profileUrl,
      profile_data: {
        firstName, lastName, avatarUrl,
        serviceTitle, serviceDesc,
        city, yearsExperience,
        pricing: pricingList,
        stack: skills.map(s => s.trim()).filter(Boolean).join(", "),
        caseStudies,
        testimonials: testiList,
        ctaTitle, ctaHighlight,
        contactEmail, contactPhone,
        openStatus: "OTVOREN ZA SARADNJU",
        portfolioAppearance: { templateId, blockStyle },
      },
    }, { onConflict: "user_id" });

    try {
      sessionStorage.removeItem("pikmi-sidebar");
      sessionStorage.removeItem("pikmi-dashboard");
      sessionStorage.removeItem("pikmi-moj-profil");
      localStorage.removeItem("pikmi-pending-slug");
    } catch {}

    // CompleteRegistration — osigurava okidanje i za Google (OAuth) korisnike
    // koji ne prolaze kroz manuelnu registraciju. Guard-ovi (local + DB flag)
    // spreče dupliranje za korisnike koji su ga već poslali pri registraciji.
    pixel.completeRegistration(userId, contactEmail);
  }

  // ── Step metadata ─────────────────────────────────────────────────────────
  const stepTitles = [
    "Tvoj profil",
    "Izaberi izgled",
    "Tvoji cenovni paketi",
    "Veštine i alati",
    "Prethodni klijenti",
    "Testimoniali klijenata",
    "Poziv na akciju",
    "Kontakt",
    "Sve je spremno!",
  ];
  const stepSubtitles = [
    "Tvoj domen, ime, fotografija, grad i iskustvo.",
    "Izaberi temu i oblik — vidiš odmah kako izgleda.",
    "Dodaj 1–3 paketa sa cenama.",
    "Dodaj svoje lične veštine, programe i alate — svaki u poseban bedž.",
    "Navedi klijente sa kojima si radio.",
    "Dodaj recenzije zadovoljnih klijenata.",
    "Napiši poziv na akciju koji će biti na kraju tvog portfolia.",
    "Kako te klijenti mogu kontaktirati.",
    "Tvoj profil je kreiran i spreman za radove.",
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0B0F19 0%, #0F0B1F 50%, #0B0F19 100%)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "32px 16px 64px",
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <img src="/pikmilogo.jpg" alt="pikmi" width={28} height={28} style={{ objectFit: "contain", display: "block" }} />
          <span style={{ fontSize: 22, fontWeight: 800, background: "linear-gradient(135deg,#A855F7,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            pikmi
          </span>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Korak {step} od {TOTAL_STEPS}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#7C3AED,#A855F7)", width: `${(step / TOTAL_STEPS) * 100}%`, transition: "width 0.4s cubic-bezier(0.16,1,0.3,1)" }} />
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 24, padding: "32px 28px", backdropFilter: "blur(20px)", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>

          {/* Step header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#A855F7)", fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 14 }}>{step}</div>
            <h2 style={{ margin: "0 0 5px", fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>{stepTitles[step - 1]}</h2>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{stepSubtitles[step - 1]}</p>
          </div>

          {/* ── STEP 1: Identity + domain + photo ── */}
          {step === 1 && (
            <div>
              {/* Domain */}
              <div style={{ marginBottom: 16 }}>
                <label style={LBL}>Tvoj portfolio link *</label>
                <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <div style={{ padding: "13px 12px", background: "rgba(139,92,246,0.1)", fontSize: 13, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", borderRight: "1px solid rgba(139,92,246,0.15)" }}>pikmi.today/</div>
                  <input style={{ ...INP, border: "none", borderRadius: 0, flex: 1 }} value={profileUrl} onChange={e => setProfileUrl(generateSlug(e.target.value))} placeholder="tvoje-ime" />
                </div>
                <p style={{ ...HINT, color: slugStatus === "ok" ? "#4ADE80" : slugStatus === "taken" ? "#F87171" : "rgba(255,255,255,0.3)" }}>
                  {slugStatus === "ok"       && "✓ Link je slobodan!"}
                  {slugStatus === "taken"    && "✗ Zauzeto — pokušaj drugi."}
                  {slugStatus === "checking" && "Proveravam dostupnost..."}
                  {slugStatus === "idle"     && "Ovako će izgledati tvoj live portfolio link."}
                </p>
              </div>

              {/* Avatar */}
              <div style={{ marginBottom: 16 }}>
                <label style={LBL}>Tvoja fotografija</label>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover" }} />
                    : <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📷</div>
                  }
                  <label style={{ padding: "9px 16px", borderRadius: 10, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#A855F7", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    {uploadingAvatar ? "Otpremam..." : avatarUrl ? "Promeni" : "Dodaj fotografiju"}
                    <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploadingAvatar} onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatar(f); e.target.value = ""; }} />
                  </label>
                </div>
              </div>

              {/* Name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={LBL}>Ime *</label>
                  <input style={INP} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Marko" />
                </div>
                <div>
                  <label style={LBL}>Prezime *</label>
                  <input style={INP} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nikolić" />
                </div>
              </div>

              {/* City + years */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={LBL}>Grad</label>
                  <input style={INP} value={city} onChange={e => setCity(e.target.value)} placeholder="npr. Beograd" />
                </div>
                <div>
                  <label style={LBL}>Godine iskustva</label>
                  <input style={INP} value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} placeholder="npr. 5" />
                </div>
              </div>

              {/* Service title + desc */}
              <div style={{ marginBottom: 14 }}>
                <label style={LBL}>Naslov portfolia *</label>
                <input style={INP} value={serviceTitle} onChange={e => setServiceTitle(e.target.value)} placeholder="npr. Meta & TikTok Ads za e-commerce brendove" />
              </div>
              <div>
                <label style={LBL}>Opis usluge</label>
                <textarea value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} rows={3} placeholder="npr. Skaliram performance kampanje za D2C brendove." style={{ ...INP, resize: "none" } as React.CSSProperties} />
              </div>
            </div>
          )}

          {/* ── STEP 2: Appearance — live mockups ── */}
          {step === 2 && (
            <div>
              {/* Shape picker */}
              <p style={{ ...LBL, marginBottom: 8 }}>Oblik blokova</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {BLOCK_STYLES.map(bs => (
                  <button key={bs.id} onClick={() => setBlockStyle(bs.id)} style={{
                    padding: "7px 14px", borderRadius: bs.previewRadius,
                    border: blockStyle === bs.id ? "2px solid #A855F7" : "1px solid rgba(255,255,255,0.15)",
                    background: blockStyle === bs.id ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)",
                    color: blockStyle === bs.id ? "#A855F7" : "rgba(255,255,255,0.7)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}>{bs.name}</button>
                ))}
              </div>

              {/* Theme mockups grid */}
              <p style={{ ...LBL, marginBottom: 10 }}>Tema — klikni da izabereš</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxHeight: 420, overflowY: "auto", padding: 2 }}>
                {THEMES.map(th => (
                  <div key={th.id} onClick={() => setTemplateId(th.id)}>
                    <MiniMockup
                      themeId={th.id}
                      blockStyle={blockStyle}
                      firstName={firstName} lastName={lastName} city={city} years={yearsExperience} avatarUrl={avatarUrl}
                      selected={templateId === th.id}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Pricing ── */}
          {step === 3 && (
            <div>
              <p style={{ ...HINT, marginBottom: 16 }}>Ako imaš pakete usluga, dodaj ih. Možeš dodati 1–3 paketa.</p>
              {pricing.map((p, i) => (
                <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Paket {i + 1}</span>
                    {pricing.length > 1 && (
                      <button onClick={() => setPricing(prev => prev.filter((_, j) => j !== i))} style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: 11, cursor: "pointer" }}>Ukloni</button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                    <div><label style={LBL}>Naziv paketa</label><input style={INP} value={p.name} onChange={e => setPricing(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Starter" /></div>
                    <div><label style={LBL}>Cena</label><input style={INP} value={p.price} onChange={e => setPricing(prev => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} placeholder="€500" /></div>
                  </div>
                  <div><label style={LBL}>Šta je uključeno</label><input style={INP} value={p.desc} onChange={e => setPricing(prev => prev.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))} placeholder="Audit + strategija + 30-dnevni plan" /></div>
                </div>
              ))}
              {pricing.length < 3 && (
                <button onClick={() => setPricing(prev => [...prev, { name: "", price: "", desc: "" }])} style={{ width: "100%", padding: "11px", borderRadius: 10, background: "rgba(139,92,246,0.08)", border: "1px dashed rgba(139,92,246,0.3)", color: "#A855F7", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Dodaj paket {pricing.length + 1}</button>
              )}
            </div>
          )}

          {/* ── STEP 4: Skills (badge builder) ── */}
          {step === 4 && (
            <div>
              <label style={LBL}>Tvoje veštine *</label>
              <p style={{ ...HINT, marginTop: 0, marginBottom: 14 }}>
                Dodaj svoje lične veštine, programe, alate i ekspertize. Svaki upisuješ u poseban bedž — ovako se prikazuju na tvom portfoliju.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {skills.map((sk, i) => (
                  <div key={i} style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)",
                    borderRadius: 999, padding: "4px 6px 4px 12px",
                  }}>
                    <input
                      autoFocus={i === skills.length - 1 && !sk}
                      value={sk}
                      onChange={e => setSkills(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                      onKeyDown={e => {
                        if (e.key === "Enter") { e.preventDefault(); if (sk.trim()) setSkills(prev => [...prev, ""]); }
                        if (e.key === "Backspace" && !sk && skills.length > 1) { e.preventDefault(); setSkills(prev => prev.filter((_, j) => j !== i)); }
                      }}
                      placeholder="npr. Figma"
                      style={{
                        background: "transparent", border: "none", outline: "none",
                        color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                        width: `${Math.max(sk.length, 7) * 8}px`, maxWidth: 180,
                      }}
                    />
                    <button onClick={() => setSkills(prev => prev.length > 1 ? prev.filter((_, j) => j !== i) : [""])}
                      style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
                  </div>
                ))}

                {/* + add badge */}
                <button onClick={() => setSkills(prev => [...prev, ""])} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(139,92,246,0.4)",
                  borderRadius: 999, padding: "7px 14px", color: "#A855F7",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Dodaj bedž
                </button>
              </div>

              <p style={HINT}>Klikni „+ Dodaj bedž" za novi, pa upiši veštinu. Enter dodaje sledeći.</p>
            </div>
          )}

          {/* ── STEP 5: Previous clients ── */}
          {step === 5 && (
            <div>
              <p style={{ ...HINT, marginBottom: 14 }}>Navedi klijente sa kojima si radio. Ovi podaci popunjavaju sekciju "Prethodno iskustvo".</p>
              {clients.map((c, i) => (
                <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Klijent {i + 1}</span>
                    {clients.length > 1 && (
                      <button onClick={() => setClients(prev => prev.filter((_, j) => j !== i))} style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: 11, cursor: "pointer" }}>Ukloni</button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                    <div><label style={LBL}>Naziv klijenta</label><input style={INP} value={c.name} onChange={e => setClients(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Coca-Cola" /></div>
                    <div><label style={LBL}>Usluga</label><input style={INP} value={c.service} onChange={e => setClients(prev => prev.map((x, j) => j === i ? { ...x, service: e.target.value } : x))} placeholder="Meta Ads" /></div>
                  </div>
                  <div><label style={LBL}>Opis (opciono)</label><input style={INP} value={c.desc} onChange={e => setClients(prev => prev.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))} placeholder="Povećanje ROAS-a za 4× za 3 meseca" /></div>
                </div>
              ))}
              <button onClick={() => setClients(prev => [...prev, { name: "", service: "", desc: "" }])} style={{ width: "100%", padding: "11px", borderRadius: 10, background: "rgba(139,92,246,0.08)", border: "1px dashed rgba(139,92,246,0.3)", color: "#A855F7", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Dodaj klijenta</button>
            </div>
          )}

          {/* ── STEP 6: Testimonials ── */}
          {step === 6 && (
            <div>
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.15)", marginBottom: 14, display: "flex", gap: 10 }}>
                <span>💡</span>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>Dodaj bar jednu recenziju klijenta (možeš do 5). Testimoniali grade poverenje kod novih klijenata.</p>
              </div>
              {testimonials.map((t, i) => (
                <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Recenzija {i + 1}</span>
                    {testimonials.length > 1 && (
                      <button onClick={() => setTestimonials(prev => prev.filter((_, j) => j !== i))} style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: 11, cursor: "pointer" }}>Ukloni</button>
                    )}
                  </div>
                  <div><label style={LBL}>Citat klijenta</label><textarea value={t.quote} onChange={e => setTestimonials(prev => prev.map((x, j) => j === i ? { ...x, quote: e.target.value } : x))} rows={3} placeholder='"Odlična saradnja, povećao nam je ROAS za 4× za samo 3 meseca!"' style={{ ...INP, resize: "none", marginBottom: 8 } as React.CSSProperties} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div><label style={LBL}>Ime klijenta</label><input style={INP} value={t.name} onChange={e => setTestimonials(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Ana Lukić" /></div>
                    <div><label style={LBL}>Pozicija / Kompanija</label><input style={INP} value={t.title} onChange={e => setTestimonials(prev => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="CEO, Lumea Beauty" /></div>
                  </div>
                </div>
              ))}
              {testimonials.length < 5 && (
                <button onClick={() => setTestimonials(prev => [...prev, { name: "", quote: "", title: "" }])} style={{ width: "100%", padding: "11px", borderRadius: 10, background: "rgba(139,92,246,0.08)", border: "1px dashed rgba(139,92,246,0.3)", color: "#A855F7", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Dodaj recenziju</button>
              )}
            </div>
          )}

          {/* ── STEP 7: CTA ── */}
          {step === 7 && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <label style={LBL}>Poziv na akciju *</label>
                <input style={INP} value={ctaTitle} onChange={e => setCtaTitle(e.target.value)} placeholder="npr. Da napravimo" autoFocus />
                <p style={HINT}>Prva rečenica poziva — prikazuje se velikim tekstom na kraju portfolia.</p>
              </div>
              <div>
                <label style={LBL}>Istaknuta reč (ljubičasto)</label>
                <input style={INP} value={ctaHighlight} onChange={e => setCtaHighlight(e.target.value)} placeholder="npr. tvoj sledeći projekat" />
                <p style={HINT}>Ova reč/fraza će biti istaknuta bojom teme. Dodaj upitnik na kraju ako želiš.</p>
              </div>
              {(ctaTitle || ctaHighlight) && (
                <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Pregled:</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff" }}>{ctaTitle}{ctaTitle && ctaHighlight ? " " : ""}<span style={{ color: "#A855F7" }}>{ctaHighlight}</span></p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 8: Contact ── */}
          {step === 8 && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <label style={LBL}>Email adresa *</label>
                <input style={INP} value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="tvoj@email.com" type="email" />
                <p style={HINT}>Prikazuje se na portfoliu kao dugme za kopiranje.</p>
              </div>
              <div>
                <label style={LBL}>Broj telefona</label>
                <input style={INP} value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+381 60 000 0000" />
              </div>
            </div>
          )}

          {/* ── STEP 9: Final ── */}
          {step === 9 && (
            <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
              <h3 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800, color: "#fff" }}>Profil je kreiran!</h3>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                Bićeš preusmjeren na portfolio gdje možeš da uploaduješ svoje prethodne radove.
              </p>
              <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                  📸 Dodaj slike i videe svojih radova<br />
                  🔗 Podijeli portfolio link sa klijentima<br />
                  📊 Prati ko gleda tvoj profil
                </p>
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 26 }}>
            {step > 1 && step < 9 ? (
              <button onClick={() => setStep(s => s - 1)} style={{ padding: "11px 20px", borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>← Nazad</button>
            ) : <div />}

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>

              {step < 8 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={!canNext[step]} style={{
                  padding: "12px 28px", borderRadius: 12, border: "none",
                  background: canNext[step] ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(255,255,255,0.06)",
                  color: canNext[step] ? "#fff" : "rgba(255,255,255,0.2)",
                  fontSize: 14, fontWeight: 700, cursor: canNext[step] ? "pointer" : "not-allowed",
                  fontFamily: "inherit", boxShadow: canNext[step] ? "0 4px 20px rgba(124,58,237,0.4)" : "none",
                  transition: "all 0.2s",
                }}>Dalje →</button>
              ) : step === 8 ? (
                <button onClick={async () => {
                  if (!canNext[8] || !userId) return;
                  setSaving(true);
                  try {
                    await saveProfile();
                    pixel.startTrial(userId, contactEmail);
                    setSaving(false);
                    setStep(9);
                  } catch (e) { console.error(e); setSaving(false); }
                }} disabled={!canNext[8] || saving} style={{
                  padding: "12px 28px", borderRadius: 12, border: "none",
                  background: (canNext[8] && !saving) ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(255,255,255,0.06)",
                  color: (canNext[8] && !saving) ? "#fff" : "rgba(255,255,255,0.2)",
                  fontSize: 14, fontWeight: 700, cursor: (canNext[8] && !saving) ? "pointer" : "not-allowed",
                  fontFamily: "inherit", boxShadow: (canNext[8] && !saving) ? "0 4px 20px rgba(124,58,237,0.4)" : "none",
                  transition: "all 0.2s",
                }}>{saving ? "Čuvanje..." : "Dalje →"}</button>
              ) : (
                <button onClick={() => { try { sessionStorage.removeItem(STORAGE_KEY); } catch {}; router.push("/moj-profil"); }} style={{
                  padding: "12px 28px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg,#7C3AED,#6366F1)",
                  color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                }}>Idi na portfolio →</button>
              )}
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
          Sve možeš promeniti kasnije iz sekcije "Moj profil".
        </p>

      </div>
    </div>
  );
}
