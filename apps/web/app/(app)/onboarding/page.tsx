"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { pixel } from "../../../lib/pixel";
import { uploadFile } from "../../../lib/upload";
import { THEMES, BLOCK_STYLES, themeTokens, type BlockStyleId } from "../../../lib/themes";
import { PROFESSIONS, getPlaceholders } from "../../../lib/professions";

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateSlug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

const TOTAL_STEPS = 2;
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
  const [userEmail, setUserEmail] = useState("");
  const [blockedByIp, setBlockedByIp] = useState(false);

  // ── Step 1: identity + domain + photo + profession ─────────────────────────
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [city,         setCity]         = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [profession,   setProfession]   = useState("");
  const [customProfession, setCustomProfession] = useState("");
  const [profileUrl,   setProfileUrl]   = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");

  // ── Step 2: appearance ──────────────────────────────────────────────────────
  const [templateId, setTemplateId] = useState(33);
  const [blockStyle, setBlockStyle] = useState<BlockStyleId>("rounded");

  // Load user info + restore saved step on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? "");
        const meta = session.user.user_metadata ?? {};
        const fullName: string = meta.full_name || meta.name || "";
        setFirstName(prev => prev || meta.first_name || meta.given_name || fullName.split(" ")[0] || "");
        setLastName(prev => prev || meta.last_name || meta.family_name || fullName.split(" ").slice(1).join(" ") || "");
        setAvatarUrl(prev => prev || meta.avatar_url || meta.picture || "");

        // OAuth (Google) korisnici ne prolaze kroz register — IP zaštitu
        // proveravamo ovde, ali samo za nove naloge (bez postojećeg profila).
        try {
          const { data: existing } = await supabase.from("profiles")
            .select("profile_url").eq("user_id", session.user.id).maybeSingle();
          if (!existing?.profile_url) {
            const r = await fetch("/api/trial", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "status", userId: session.user.id }),
            });
            const j = await r.json();
            if (j?.used) setBlockedByIp(true);
          }
        } catch {}
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

  // Resolved profession label ("Ostalo" → custom text)
  const resolvedProfession = profession === "Ostalo" ? (customProfession.trim() || "Ostalo") : profession;

  // ── Validation ────────────────────────────────────────────────────────────
  const canNext: Record<number, boolean> = {
    1: !!avatarUrl && !!firstName.trim() && !!lastName.trim() && !!city.trim()
       && !!yearsExperience.trim() && !!profession
       && (profession !== "Ostalo" || !!customProfession.trim())
       && !!profileUrl && slugStatus === "ok",
    2: true, // tema je uvek izabrana
  };

  // ── Build + save profile (with per-profession placeholders) ─────────────────
  async function saveProfile() {
    // Placeholder content matched to the chosen profession
    const ph = getPlaceholders(profession === "Ostalo" ? "Ostalo" : profession);

    const caseStudies = [{}, {}, {}, {}]; // "Prethodni radovi" — ostaju prazni (upload kasnije)
    const experience = ph.experience.map(e => ({
      company: e.company, role: e.role, dateFrom: "", dateTo: "", desc: e.desc,
    }));

    await supabase.from("profiles").upsert({
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      profile_url: profileUrl,
      profile_data: {
        firstName, lastName, avatarUrl,
        profession: resolvedProfession,
        serviceTitle: ph.serviceTitle,
        serviceDesc: ph.serviceDesc,
        city, yearsExperience,
        pricing: ph.pricing,
        stack: ph.skills.join(", "),
        caseStudies,
        experience,
        testimonials: [ph.testimonial],
        ctaTitle: "Da napravimo nešto", ctaHighlight: "zajedno?",
        contactEmail: userEmail, contactPhone: "",
        openStatus: "OTVOREN ZA SARADNJU",
        portfolioAppearance: { templateId, blockStyle },
        // ── Live-setup flags ──
        needsSetup: true,
        placeholderSections: ["service", "pricing", "stack", "experience", "testimonial"],
      },
    }, { onConflict: "user_id" });

    try {
      sessionStorage.removeItem("pikmi-sidebar");
      sessionStorage.removeItem("pikmi-dashboard");
      sessionStorage.removeItem("pikmi-moj-profil");
      localStorage.removeItem("pikmi-pending-slug");
    } catch {}

    // Veži trial za IP adresu (server-side) — pokriva i Google (OAuth) korisnike.
    try {
      await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim", userId }),
      });
    } catch {}

    // CompleteRegistration — osigurava okidanje i za Google (OAuth) korisnike.
    pixel.completeRegistration(userId, userEmail);
  }

  // ── Step metadata ─────────────────────────────────────────────────────────
  const stepTitles = ["Tvoj profil", "Izaberi izgled"];
  const stepSubtitles = [
    "Ime, fotografija, grad, iskustvo i čime se baviš.",
    "Izaberi temu i oblik — vidiš odmah kako izgleda.",
  ];

  if (blockedByIp) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0B0F19 0%, #0F0B1F 50%, #0B0F19 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "32px 16px", fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      }}>
        <div style={{
          width: "100%", maxWidth: 460, textAlign: "center",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: 24, padding: "40px 28px", backdropFilter: "blur(20px)",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 800, color: "#fff" }}>Trial je već iskorišćen</h2>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            Sa ove mreže je već iskorišćen besplatni 7-dnevni trial. Prijavi se na svoj postojeći nalog ili pređi na Pro plan da nastaviš.
          </p>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            style={{
              padding: "12px 28px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg,#7C3AED,#6366F1)", color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >Idi na prijavu →</button>
        </div>
      </div>
    );
  }

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

          {/* ── STEP 1: Identity + domain + photo + profession ── */}
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
                  <label style={LBL}>Grad *</label>
                  <input style={INP} value={city} onChange={e => setCity(e.target.value)} placeholder="npr. Beograd" />
                </div>
                <div>
                  <label style={LBL}>Godine iskustva *</label>
                  <input style={INP} value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} placeholder="npr. 5" />
                </div>
              </div>

              {/* Profession */}
              <div>
                <label style={LBL}>Čime se baviš? *</label>
                <select
                  value={profession}
                  onChange={e => setProfession(e.target.value)}
                  style={{ ...INP, appearance: "none", cursor: "pointer", color: profession ? "#fff" : "rgba(255,255,255,0.4)" } as React.CSSProperties}
                >
                  <option value="" disabled style={{ color: "#000" }}>Izaberi profesiju…</option>
                  {PROFESSIONS.map(pr => (
                    <option key={pr} value={pr} style={{ color: "#000" }}>{pr}</option>
                  ))}
                </select>
                {profession === "Ostalo" && (
                  <input
                    style={{ ...INP, marginTop: 10 }}
                    value={customProfession}
                    onChange={e => setCustomProfession(e.target.value)}
                    placeholder="Upiši svoju profesiju"
                    autoFocus
                  />
                )}
                <p style={HINT}>Na osnovu profesije unapred popunjavamo tvoj portfolio primerima koje zatim lako izmeniš.</p>
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

          {/* ── Navigation ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 26 }}>
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} style={{ padding: "11px 20px", borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>← Nazad</button>
            ) : <div />}

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {step < 2 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={!canNext[step]} style={{
                  padding: "12px 28px", borderRadius: 12, border: "none",
                  background: canNext[step] ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(255,255,255,0.06)",
                  color: canNext[step] ? "#fff" : "rgba(255,255,255,0.2)",
                  fontSize: 14, fontWeight: 700, cursor: canNext[step] ? "pointer" : "not-allowed",
                  fontFamily: "inherit", boxShadow: canNext[step] ? "0 4px 20px rgba(124,58,237,0.4)" : "none",
                  transition: "all 0.2s",
                }}>Dalje →</button>
              ) : (
                <button onClick={async () => {
                  if (!userId || saving) return;
                  setSaving(true);
                  try {
                    await saveProfile();
                    pixel.startTrial(userId, userEmail);
                    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
                    router.push("/moj-profil");
                  } catch (e) { console.error(e); setSaving(false); }
                }} disabled={saving} style={{
                  padding: "12px 28px", borderRadius: 12, border: "none",
                  background: !saving ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(255,255,255,0.06)",
                  color: !saving ? "#fff" : "rgba(255,255,255,0.4)",
                  fontSize: 14, fontWeight: 700, cursor: !saving ? "pointer" : "wait",
                  fontFamily: "inherit", boxShadow: !saving ? "0 4px 20px rgba(124,58,237,0.4)" : "none",
                  transition: "all 0.2s",
                }}>{saving ? "Kreiranje portfolija..." : "Kreiraj portfolio →"}</button>
              )}
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
          Sve ćeš moći da izmeniš na svom živom portfoliju u sledećem koraku.
        </p>

      </div>
    </div>
  );
}
