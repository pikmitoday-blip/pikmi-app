"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../../lib/i18n";
import { uploadFile } from "../../../lib/upload";
import { THEMES, BLOCK_STYLES, getTheme, themeTokens, DEFAULT_THEME_ID, DEFAULT_BLOCK_STYLE, type BlockStyleId, type PortfolioAppearance } from "../../../lib/themes";
import { getPlaceholders } from "../../../lib/professions";
import SetupEditor from "./SetupEditor";

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
  portfolioAppearance?: { templateId: number; blockStyle: BlockStyleId };
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
  "linear-gradient(135deg,#6366F1,#EC4899)",
  "linear-gradient(135deg,#A855F7,#3B82F6)",
  "linear-gradient(135deg,#EC4899,#6366F1)",
  "linear-gradient(135deg,#3B82F6,#7C3AED)",
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
  // Ne koristi cache — uvijek učitaj svježe iz baze da ne bi
  // pokazivali tuđe podatke kada se drugi korisnik uloguje
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
  // Sections are now individual blocks; the separator is no longer needed.
  return null;
}

// Mali "Primer" bedž — signalizira pred-popunjeni placeholder sadržaj.
function PHBadge() {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, color: "#A855F7",
      background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)",
      borderRadius: 999, padding: "2px 8px", letterSpacing: "0.04em", textTransform: "uppercase",
    }}>Primer</span>
  );
}

function SectionHead({ number: _number, text, section, onEdit, placeholder }: {
  number: string; text: string; section: string; onEdit: (s: string) => void; placeholder?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>
          {text}
        </p>
        {placeholder && <PHBadge />}
      </div>
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

// ─── Portfolio switcher (multi-portfolio, Pro feature) ───────────────────────

interface PortfolioRow {
  id: string; profile_url: string; label: string;
  profile_data: any; first_name: string; last_name: string;
}

// Zaključan "Dodaj portfolio" slot (free plan): tooltip na hover (desktop)
// ili na tap (mobile, nestaje posle 6s + X dugme).
function LockedAddSlot({ isMobile }: { isMobile: boolean }) {
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function tap() {
    if (!isMobile) return;
    setShow(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 6000);
  }
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return (
    <div
      style={{ position: "relative", flexShrink: 0 }}
      onMouseEnter={() => { if (!isMobile) setShow(true); }}
      onMouseLeave={() => { if (!isMobile) setShow(false); }}
      onClick={tap}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 7, padding: "9px 14px",
        borderRadius: 12, border: "1px dashed rgba(139,92,246,0.35)",
        background: "rgba(139,92,246,0.06)", cursor: "pointer",
        opacity: 0.55, userSelect: "none", whiteSpace: "nowrap",
      }}>
        <span style={{ fontSize: 13 }}>🔒</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>Dodaj portfolio</span>
      </div>
      {show && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50,
          width: 240, background: "#15151c", border: "1px solid rgba(139,92,246,0.4)",
          borderRadius: 12, padding: "12px 14px", boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        }}>
          <button onClick={(e) => { e.stopPropagation(); setShow(false); }} style={{
            position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", border: "none", color: "#fff",
            fontSize: 13, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
          <p style={{ margin: 0, fontSize: 12.5, color: "#E9D5FF", lineHeight: 1.5, paddingRight: 14 }}>
            🔓 Ova opcija se otključava na <strong>Pro planu</strong> — napravi portfolije za različite tipove klijenata.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function MojProfil() {
  const { t } = useLanguage();
  const router = useRouter();
  const [p, setP] = useState<Profile | null>(() => getCached());
  const [userId, setUserId] = useState<string>("");
  // ── Live-setup (onboarding fill) ──
  const [setupMode, setSetupMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [finishing, setFinishing] = useState(false);
  // ── Multi-portfolio (Pro) ──
  const [plan, setPlan] = useState<string>("free");
  const [portfolios, setPortfolios] = useState<PortfolioRow[]>([]);
  const [activePfId, setActivePfId] = useState<string | null>(null); // null = primarni (profiles)
  const [primaryUrl, setPrimaryUrl] = useState<string>("");
  const [creatingPf, setCreatingPf] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const primaryRef = useRef<Profile | null>(null);
  const [profileUrl, setProfileUrl] = useState<string>(() => {
    try { return sessionStorage.getItem("pikmi-profile-url") ?? ""; } catch { return ""; }
  });
  const [loading, setLoading] = useState(true);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  function buildMerged(pd: any, fn: string, ln: string): Profile {
    return {
      ...DEFAULT_PROFILE, ...pd,
      firstName: fn || "", lastName: ln || "",
      initials: (fn?.[0] ?? "") + (ln?.[0] ?? ""),
      csImages: pd?.csImages ?? ["", "", "", ""],
      caseStudies: pd?.caseStudies ?? [{}, {}, {}, {}],
      experience: pd?.experience ?? [],
      testimonials: pd?.testimonials ?? [],
    };
  }

  // Snimi profile_data na pravo mesto: primarni → profiles, dodatni → portfolios.
  async function persistData(pd: any, fn: string, ln: string) {
    if (activePfId) {
      await supabase.from("portfolios")
        .update({ profile_data: pd, first_name: fn, last_name: ln })
        .eq("id", activePfId);
      setPortfolios(prev => prev.map(x => x.id === activePfId
        ? { ...x, profile_data: pd, first_name: fn, last_name: ln } : x));
    } else {
      await supabase.from("profiles").upsert({
        user_id: userId, first_name: fn, last_name: ln,
        service_title: (pd?.serviceTitle || "").split("\n")[0].trim(),
        profile_data: pd,
      }, { onConflict: "user_id" });
      primaryRef.current = pd;
    }
  }

  function switchPortfolio(target: PortfolioRow | null) {
    if ((target?.id ?? null) === activePfId) return;
    setEditSection(null); setDraft(null); setPreviewMode(false);
    if (!target) {
      setActivePfId(null);
      if (primaryRef.current) setP(primaryRef.current);
      setProfileUrl(primaryUrl);
    } else {
      setActivePfId(target.id);
      setP(buildMerged(target.profile_data || {}, target.first_name, target.last_name));
      setProfileUrl(target.profile_url);
    }
  }

  async function createPortfolio() {
    if (creatingPf || plan !== "pro" || !userId) return;
    setCreatingPf(true);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", userId }),
      });
      const j = await res.json();
      if (j.portfolio) {
        const pf = j.portfolio as PortfolioRow;
        setPortfolios(prev => [...prev, pf]);
        setEditSection(null); setDraft(null); setPreviewMode(false);
        setActivePfId(pf.id);
        setP(buildMerged(pf.profile_data || {}, pf.first_name, pf.last_name));
        setProfileUrl(pf.profile_url);
      }
    } catch {}
    setCreatingPf(false);
  }

  async function renamePortfolio(id: string) {
    const label = renameValue.trim();
    setRenamingId(null);
    if (!label) return;
    setPortfolios(prev => prev.map(x => x.id === id ? { ...x, label } : x));
    try {
      await fetch("/api/portfolio", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", userId, id, label }),
      });
    } catch {}
  }

  async function deletePortfolio(pf: PortfolioRow) {
    if (!window.confirm(`Obrisati portfolio „${pf.label}"? Ova akcija je trajna i link prestaje da radi.`)) return;
    setPortfolios(prev => prev.filter(x => x.id !== pf.id));
    if (activePfId === pf.id) switchPortfolio(null);
    try {
      await fetch("/api/portfolio", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", userId, id: pf.id }),
      });
    } catch {}
  }

  async function applyTheme(templateId: number, blockStyle: BlockStyleId) {
    if (!p) return;
    const newApp: PortfolioAppearance = { templateId, blockStyle };
    const updated = { ...p, portfolioAppearance: newApp } as any;
    setP(updated);
    if (!activePfId) { try { sessionStorage.setItem("pikmi-moj-profil", JSON.stringify(updated)); } catch {} }
    await persistData(updated, p.firstName, p.lastName);
  }

  async function finishSetup() {
    if (!userId || finishing) return;
    const src: any = draft ?? p;
    if (!src) return;
    setFinishing(true);
    try {
      const updated: any = { ...src, csImages: (src.csImages ?? []).map((img: string) => img.startsWith("data:") ? "" : img), needsSetup: false };
      await supabase.from("profiles").upsert({
        user_id: userId, first_name: updated.firstName, last_name: updated.lastName,
        service_title: (updated.serviceTitle || "").split("\n")[0].trim(),
        profile_data: updated,
      }, { onConflict: "user_id" });
      try {
        sessionStorage.removeItem("pikmi-moj-profil");
        sessionStorage.removeItem("pikmi-sidebar");
        sessionStorage.removeItem("pikmi-dashboard");
      } catch {}
      router.push("/dashboard");
    } catch (e) { console.error(e); setFinishing(false); }
  }

  // ── Auto-save the draft while in setup mode (debounced) ─────────────────────
  useEffect(() => {
    if (!setupMode || !draft || !userId) return;
    const t = setTimeout(async () => {
      try {
        const toSave: any = { ...draft, csImages: (draft.csImages ?? []).map(img => img.startsWith("data:") ? "" : img) };
        await supabase.from("profiles").upsert({
          user_id: userId, first_name: draft.firstName, last_name: draft.lastName,
          service_title: (draft.serviceTitle || "").split("\n")[0].trim(),
          profile_data: toSave,
        }, { onConflict: "user_id" });
        try { sessionStorage.setItem("pikmi-moj-profil", JSON.stringify(toSave)); } catch {}
      } catch {}
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, setupMode, userId]);

  // ── Live theme tokens for the editor preview (updates in real time) ─────────
  const appearance = (p as any)?.portfolioAppearance as { templateId?: number; blockStyle?: BlockStyleId } | undefined;
  const activeTheme = getTheme(appearance?.templateId ?? DEFAULT_THEME_ID);
  const bStyle      = appearance?.blockStyle ?? DEFAULT_BLOCK_STYLE;
  const TK          = themeTokens(activeTheme, bStyle);

  // Local themed C — shadows the module light C so the preview reflects the theme
  const C = {
    accent:      TK.accent,
    accentLight: TK.accentBg,
    accentMuted: TK.accent,
    dark:        TK.textPrimary,
    text:        TK.textSecond,
    muted:       TK.textMuted,
    border:      TK.blockBorder,
    divider:     TK.divider,
    sectionBg:   TK.sectionBg,
    tagGrayBg:   TK.tagBg,
    tagGrayText: TK.tagText,
    green:       "#22C55E",
  };

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        if (user) {
          setUserId(user.id);
          const { data } = await supabase.from("profiles")
            .select("first_name, last_name, profile_data, profile_url, plan")
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
              testimonials: pd.testimonials ?? [],
            };
            setP(merged);
            primaryRef.current = merged;
            const isSetup = !!pd.needsSetup;
            setSetupMode(isSetup);
            if (isSetup) {
              // U setup modu sve sekcije su odmah u edit modu vezane za draft.
              // Osiguravamo po jedan prazan red da bi se primeri (placeholderi) videli.
              setDraft({
                ...merged,
                pricing: (merged.pricing && merged.pricing.length > 0) ? merged.pricing : [{ name: "", price: "", desc: "" }],
                experience: (merged.experience && merged.experience.length > 0) ? merged.experience : [{ company: "", role: "", dateFrom: "", dateTo: "", desc: "" }],
                testimonials: (merged.testimonials && merged.testimonials.length > 0) ? merged.testimonials : [{ quote: "", name: "", title: "" }],
              });
            }
            try { sessionStorage.setItem("pikmi-moj-profil", JSON.stringify(merged)); } catch {}
            if (data.profile_url) {
              setProfileUrl(data.profile_url);
              setPrimaryUrl(data.profile_url);
              try { sessionStorage.setItem("pikmi-profile-url", data.profile_url); } catch {}
            }
            setPlan((data as any).plan || "free");
          }
          // Dodatni portfoliji (Pro)
          try {
            const { data: pfs } = await supabase.from("portfolios")
              .select("id, profile_url, label, profile_data, first_name, last_name")
              .eq("user_id", user.id)
              .order("created_at", { ascending: true });
            if (pfs) setPortfolios(pfs as PortfolioRow[]);
          } catch {}
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  function startEdit(s: string) { setEditSection(s); setDraft(p ? { ...p } : null); if (setupMode) setBannerDismissed(true); }
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
      const toSave: any = { ...draft, csImages: (draft.csImages ?? []).map(img => img.startsWith("data:") ? "" : img) };
      await persistData(toSave, draft.firstName, draft.lastName);
      setP(toSave);
      // Sidebar/keš se odnose na nalog (primarni portfolio) — ne diramo ih za dodatne.
      if (!activePfId) {
        try {
          sessionStorage.setItem("pikmi-moj-profil", JSON.stringify(toSave));
          sessionStorage.setItem("pikmi-profile-edit", JSON.stringify(toSave));
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
      }
    } catch (e) { console.error(e); }
    setSaving(false); setSavedMsg(true); setEditSection(null); setDraft(null);
    setTimeout(() => setSavedMsg(false), 2500);
  }

  async function uploadAvatar(file: File) {
    if (!userId) return;
    setUploadingAvatar(true);
    try {
      const publicUrl = await uploadFile(file, { folder: userId, filename: `avatar.${file.name.split(".").pop() ?? "bin"}` });
      setDraft(prev => prev ? { ...prev, avatarUrl: publicUrl } : null);
    } catch {}
    setUploadingAvatar(false);
  }

  async function uploadImage(i: number, file: File) {
    if (!userId) return;
    setUploading(i);
    try {
      const publicUrl = await uploadFile(file, { folder: userId, filename: `project-${i}-${Date.now()}.${file.name.split(".").pop() ?? "bin"}` });
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
  const csSlots = [0, 1, 2, 3, 4, 5, 6, 7].filter(i => !!p.csImages?.[i]);
  const hasWork = csSlots.length > 0;

  // ── Setup-mode helpers ──────────────────────────────────────────────────────
  // U setup modu su sve sekcije odmah u edit modu (osim kad je uključen Pregled).
  const setupAllEdit = setupMode && !previewMode;
  // Primeri (preview tekst) za placeholdere — na osnovu izabrane profesije.
  const PH = getPlaceholders(((p as any)?.profession as string) || "Ostalo");

  // Kompletnost se računa iz STVARNOG sadržaja (korisnik mora da upiše svoje).
  const src: any = draft ?? p;
  const done = {
    service:     !!(src.serviceTitle && src.serviceTitle.trim()),
    pricing:     (src.pricing ?? []).some((t: PricingTier) => t.name?.trim() && t.price?.trim()),
    stack:       !!(src.stack && src.stack.trim()),
    experience:  (src.experience ?? []).some((e: ExperienceItem) => e.company?.trim() || e.role?.trim()),
    testimonial: (src.testimonials ?? []).some((t: any) => t.quote?.trim() && t.name?.trim()),
  };
  const REQUIRED_SECTIONS = ["service", "pricing", "stack", "experience", "testimonial"] as const;
  const filledRequired = REQUIRED_SECTIONS.filter(k => (done as any)[k]).length;
  const progressPct = Math.round((filledRequired / REQUIRED_SECTIONS.length) * 100);
  const allRequiredDone = filledRequired === REQUIRED_SECTIONS.length;

  // ── Setup mod (popunjavanje pri registraciji): accordion editor sa temom ──
  // Prikazuje se samo dok je needsSetup=true; običan "Moj profil" editor ostaje ispod.
  if (setupMode && draft) {
    return (
      <SetupEditor
        draft={draft}
        setDraft={setDraft}
        tk={TK}
        profession={(p as any).profession || "Ostalo"}
        done={done as any}
        uploadAvatar={uploadAvatar}
        uploadImage={uploadImage}
        uploadingAvatar={uploadingAvatar}
        uploading={uploading}
        onPreview={() => { if (profileUrl) window.open(`/${profileUrl}`, "_blank"); }}
        onFinish={finishSetup}
        finishing={finishing}
        isMobile={isMobile}
      />
    );
  }

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
        <input style={INP} value={(draft as any).yearsExperience ?? ""} onChange={e => setD("yearsExperience" as any, e.target.value)} placeholder="npr. 5" type="text" />

        {!setupAllEdit && <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />}
      </div>
    );
  }

  // ─── Info display (LEFT PANEL on desktop) ─────────────────────────────────

  function InfoDisplay() {
    if (!p) return null;
    return (
      <div style={{ padding: 24 }}>
        {!setupMode && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button onClick={() => startEdit("info")}
              style={{ padding: "4px 8px", borderRadius: 6, fontSize: 16, background: C.accentLight, border: "none", cursor: "pointer", lineHeight: 1 }}>✏️</button>
          </div>
        )}

        {/* Avatar + Name (kompaktno, poravnato sa sekcijom „Šta radim") */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
          {p.avatarUrl
            ? <img src={p.avatarUrl} alt="" style={{ width: 84, height: 84, borderRadius: TK.geom.avatar, objectFit: "cover", flexShrink: 0, boxShadow: `0 8px 22px ${TK.accent}55` }} />
            : <div style={{ width: 84, height: 84, borderRadius: TK.geom.avatar, background: `linear-gradient(135deg,${TK.accent},${TK.accent}aa)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700, color: "#fff", flexShrink: 0, boxShadow: `0 8px 22px ${TK.accent}55` }}>
                {p.initials || "?"}
              </div>
          }
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.6px", lineHeight: 1, color: C.dark }}>{p.firstName || "Ime"}</p>
            <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 700, letterSpacing: "-0.6px", lineHeight: 1.1, color: C.accent }}>{p.lastName || "Prezime"}</p>
            {p.city && <p style={{ margin: "8px 0 0", fontSize: 11, color: C.muted }}>→ {p.city}</p>}
            {(p as any).yearsExperience && (
              <p style={{ margin: "6px 0 0", fontSize: 11, color: C.accent, fontWeight: 600 }}>
                Godine iskustva: {String((p as any).yearsExperience).replace(/\s*godin.*/i, "").trim()}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={setupMode ? {
      position: "fixed", inset: 0, zIndex: 9000, overflowY: "auto",
      background: TK.pageBg, padding: isMobile ? "0 0 110px" : "0 0 96px",
    } : undefined}>

      {/* ── Setup mode: top bar (logo + progress + theme) ── */}
      {setupMode && (
        <div style={{
          position: "sticky", top: 0, zIndex: 20,
          background: "rgba(11,15,25,0.92)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: isMobile ? "12px 16px" : "14px 24px",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <img src="/pikmilogo.jpg" alt="pikmi" width={24} height={24} style={{ objectFit: "contain", display: "block" }} />
            {!isMobile && <span style={{ fontWeight: 800, fontSize: 17, background: "linear-gradient(135deg,#A855F7,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>pikmi</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Tvoj portfolio je {progressPct}% kompletan</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{filledRequired}/{REQUIRED_SECTIONS.length}</span>
            </div>
            <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#7C3AED,#A855F7)", width: `${progressPct}%`, transition: "width 0.4s cubic-bezier(0.16,1,0.3,1)" }} />
            </div>
          </div>
          <button
            onClick={() => { if (!previewMode && draft) setP(draft); setPreviewMode(v => !v); }}
            title={previewMode ? "Nazad na izmenu" : "Pregledaj portfolio"}
            style={{
              flexShrink: 0, padding: "0 14px", height: 38, borderRadius: 11,
              border: "1px solid rgba(139,92,246,0.4)",
              background: previewMode ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(124,58,237,0.15)",
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6,
            }}>{previewMode ? "✏️ Uredi" : "👁 Pregled"}</button>
          <button onClick={() => setShowThemeSheet(true)} title="Prilagodi izgled" style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            border: "1px solid rgba(139,92,246,0.3)", background: "rgba(124,58,237,0.15)",
            cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center",
          }}>🎨</button>
        </div>
      )}

      {/* ── Setup mode: dismissable onboarding banner (dark panel — čitljiv na svakoj temi) ── */}
      {setupMode && !bannerDismissed && (
        <div style={{ maxWidth: 1060, margin: "16px auto 0", padding: isMobile ? "0 12px" : "0 16px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "rgba(17,17,28,0.95)", border: "1px solid rgba(139,92,246,0.4)",
            borderRadius: 14, padding: "12px 16px", boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>👋</span>
            <p style={{ margin: 0, flex: 1, fontSize: 13, color: "#E9D5FF", lineHeight: 1.5 }}>
              Sve sekcije su odmah spremne za izmenu — <strong>upiši svoj sadržaj</strong> preko sivih primera (oni su samo inspiracija). Klikni <strong>„Pregled"</strong> gore da vidiš kako portfolio izgleda. Promene se čuvaju automatski.
            </p>
            <button onClick={() => setBannerDismissed(true)} style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: "rgba(255,255,255,0.12)", border: "none", color: "#fff",
              fontSize: 16, cursor: "pointer", lineHeight: 1,
            }}>×</button>
          </div>
        </div>
      )}

      {/* ── Responsive CSS — live themed preview ──
          Mobile: tema kao pozadina, svaka sekcija je zasebna kartica.
          Desktop: tema je pozadina, a portfolio je JEDNA celina (kao javni portfolio). */}
      <style>{`
        .pp-card {
          width: 100%;
          background: ${TK.pageBg};
          border-radius: 24px;
          overflow: hidden;
          font-family: 'Inter', -apple-system, sans-serif;
          color: ${TK.textPrimary};
          padding: 12px;
          position: relative;
        }
        .pp-card::before {
          content: "";
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image: ${TK.pattern.image};
          background-size: ${TK.pattern.size};
          background-repeat: repeat;
        }
        .pp-grid { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 10px; }
        .pp-left {
          background: ${TK.blockBg};
          border: 1px solid ${TK.blockBorder};
          box-shadow: ${TK.blockShadow};
          border-radius: ${TK.blockRadius}px;
          overflow: hidden;
        }
        .pp-right { min-width: 0; display: flex; flex-direction: column; gap: 10px; }
        .pp-right-section {
          background: ${TK.blockBg};
          border: 1px solid ${TK.blockBorder};
          box-shadow: ${TK.blockShadow};
          border-radius: ${TK.blockRadius}px;
          overflow: hidden;
        }
        .pp-sep-hidden { display: none; }
        @media (min-width: 769px) {
          .pp-card { padding: 32px 24px; }
          /* Jedna objedinjena kartica */
          .pp-grid {
            display: grid;
            grid-template-columns: 300px 1fr;
            align-items: start;
            gap: 0;
            max-width: 1060px;
            margin: 0 auto;
            background: ${TK.blockBg};
            border-radius: 24px;
            box-shadow: 0 8px 60px rgba(0,0,0,0.18);
            overflow: hidden;
          }
          .pp-left {
            border: none; box-shadow: none; border-radius: 0;
            background: transparent;
            position: sticky; top: 0; align-self: start;
            max-height: 100vh; overflow-y: auto;
          }
          /* Razdelnik na desnoj (visokoj) koloni — proteže se do dna kartice */
          .pp-right { gap: 0; background: transparent; border-left: 1px solid ${TK.divider}; }
          .pp-right-section {
            border: none; box-shadow: none; border-radius: 0;
            background: transparent;
            border-top: 1px solid ${TK.divider};
            padding: 28px 36px !important;
          }
          .pp-right-section:first-child { border-top: none; }
          /* CTA/Kontakt footer — puna širina kartice (obe kolone), od ivice do ivice */
          .pp-cta { grid-column: 1 / -1; border-radius: 0 !important; box-shadow: none !important; padding: 36px 36px 32px !important; }
          .pp-cs-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .pp-card { max-width: 480px; margin: 0 auto; }
        }
      `}</style>

      {/* ── Page header ── */}
      <div className="flex items-center justify-between page-header" style={setupMode ? { display: "none" } : undefined}>
        <div>
          <h1 className="page-title">{t("profile_page_title")}</h1>
          <p className="page-subtitle">{t("profile_page_sub")}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {savedMsg && <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>Sačuvano ✓</span>}
          {/* Customize (palette) button */}
          <button
            onClick={() => setShowThemeSheet(true)}
            title="Prilagodi izgled"
            style={{
              width: 40, height: 40, borderRadius: 12,
              border: "1px solid rgba(139,92,246,0.25)",
              background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(99,102,241,0.12))",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0,
            }}
          >
            🎨
          </button>
          {profileUrl && (
            <a href={`https://www.pikmi.today/${profileUrl}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
              <span style={{ fontSize: 14 }}>👁</span>{t("profile_view_live")}<span style={{ fontSize: 12, opacity: 0.8 }}>↗</span>
            </a>
          )}
        </div>
      </div>

      {/* ── Multi-portfolio switcher (Pro) ── */}
      {!setupMode && (
        <div style={{ marginBottom: 18 }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "var(--text2)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Tvoji portfoliji
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Primarni */}
            <button onClick={() => switchPortfolio(null)} style={{
              padding: "9px 14px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
              fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
              border: !activePfId ? "1px solid var(--purple)" : "1px solid var(--border)",
              background: !activePfId ? "rgba(124,58,237,0.15)" : "var(--card)",
              color: !activePfId ? "#C4A0FF" : "var(--text2)",
            }}>🏠 Glavni portfolio</button>

            {/* Dodatni */}
            {portfolios.map(pf => {
              const isActive = activePfId === pf.id;
              const isRenaming = renamingId === pf.id;
              return (
                <div key={pf.id} style={{
                  display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                  padding: "4px 6px 4px 4px", borderRadius: 12,
                  border: isActive ? "1px solid var(--purple)" : "1px solid var(--border)",
                  background: isActive ? "rgba(124,58,237,0.15)" : "var(--card)",
                }}>
                  {isRenaming ? (
                    <input
                      autoFocus
                      value={renameValue}
                      maxLength={40}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") renamePortfolio(pf.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      onBlur={() => renamePortfolio(pf.id)}
                      style={{
                        width: 130, padding: "5px 8px", borderRadius: 8, fontFamily: "inherit",
                        fontSize: 13, fontWeight: 600, border: "1px solid var(--purple)",
                        background: "var(--bg, #0E0E12)", color: "var(--text)", outline: "none",
                      }}
                    />
                  ) : (
                    <button onClick={() => switchPortfolio(pf)} style={{
                      padding: "5px 8px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                      fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", border: "none",
                      background: "transparent", color: isActive ? "#C4A0FF" : "var(--text2)",
                    }}>📁 {pf.label}</button>
                  )}
                  {isActive && !isRenaming && (
                    <>
                      <button title="Preimenuj" onClick={() => { setRenamingId(pf.id); setRenameValue(pf.label); }}
                        style={{ width: 26, height: 26, borderRadius: 7, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.06)", fontSize: 12, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✏️</button>
                      <button title="Obriši portfolio" onClick={() => deletePortfolio(pf)}
                        style={{ width: 26, height: 26, borderRadius: 7, border: "none", cursor: "pointer", background: "rgba(239,68,68,0.12)", color: "#F87171", fontSize: 12, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>🗑</button>
                    </>
                  )}
                </div>
              );
            })}

            {/* Dodaj (do 3 ukupno) */}
            {(1 + portfolios.length) < 3 && (
              plan === "pro" ? (
                <button onClick={createPortfolio} disabled={creatingPf} style={{
                  padding: "9px 14px", borderRadius: 12, flexShrink: 0,
                  border: "1px dashed var(--purple)", background: "rgba(124,58,237,0.08)",
                  color: "#C4A0FF", fontSize: 13, fontWeight: 700, cursor: creatingPf ? "wait" : "pointer",
                  fontFamily: "inherit", whiteSpace: "nowrap",
                }}>{creatingPf ? "Kreiranje..." : "+ Dodaj portfolio"}</button>
              ) : (
                <LockedAddSlot isMobile={isMobile} />
              )
            )}
          </div>
          {(1 + portfolios.length) < 3 && (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text3)", lineHeight: 1.5 }}>
              {plan === "pro"
                ? `Možeš da napraviš još ${3 - (1 + portfolios.length)} ${3 - (1 + portfolios.length) === 1 ? "portfolio" : "portfolija"} za različite tipove klijenata.`
                : `Napravi još ${3 - (1 + portfolios.length)} portfolija za različite tipove klijenata — otključava se na Pro planu.`}
            </p>
          )}
        </div>
      )}

      {/* ── Card ── */}
      <div className="pp-card" style={setupMode
        ? { marginBottom: 24 }
        : { marginBottom: 60 }}>

        {/* Grid: left + right */}
        <div className="pp-grid">

          {/* ── LEFT PANEL (info) ── */}
          <div className="pp-left">
            {(editSection === "info" || setupAllEdit) ? InfoEditForm() : InfoDisplay()}
          </div>

          {/* ── RIGHT PANEL (sections 01–07) ── */}
          <div className="pp-right">

            {/* 01 — Šta radim */}
            <div className="pp-right-section" style={{ padding: "24px 20px" }}>
              {(editSection === "service" || setupAllEdit) && draft ? (
                <div>
                  <p style={{ margin: "0 0 14px", fontSize: 9, fontWeight: 600, color: C.accent, letterSpacing: "1.5px", textTransform: "uppercase" }}>01 — ŠTA RADIM</p>
                  <label style={LBL}>NASLOV USLUGE</label>
                  <textarea style={{ ...INP, minHeight: 70, resize: "vertical" } as React.CSSProperties} value={draft.serviceTitle} onChange={e => setD("serviceTitle", e.target.value)} placeholder={PH.serviceTitle} />
                  <label style={LBL}>OPIS</label>
                  <textarea style={{ ...INP, minHeight: 90, resize: "vertical" } as React.CSSProperties} value={draft.serviceDesc} onChange={e => setD("serviceDesc", e.target.value)} placeholder={PH.serviceDesc} />
                  {!setupAllEdit && <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />}
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
              {(editSection === "pricing" || setupAllEdit) && draft ? (
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
                          }} placeholder={PH.pricing[i]?.name ?? "Starter"} />
                        </div>
                        <div>
                          <label style={LBL}>CENA</label>
                          <input style={INP} value={tier.price} onChange={e => {
                            const t = [...(draft.pricing ?? [])]; t[i] = { ...t[i], price: e.target.value };
                            setDraft(prev => prev ? { ...prev, pricing: t } : null);
                          }} placeholder={PH.pricing[i]?.price ?? "€500"} />
                        </div>
                      </div>
                      <div>
                        <label style={LBL}>OPIS</label>
                        <input style={INP} value={tier.desc} onChange={e => {
                          const t = [...(draft.pricing ?? [])]; t[i] = { ...t[i], desc: e.target.value };
                          setDraft(prev => prev ? { ...prev, pricing: t } : null);
                        }} placeholder={PH.pricing[i]?.desc ?? "Šta je uključeno u ovaj paket..."} />
                      </div>
                    </div>
                  ))}
                  {(draft.pricing ?? []).length < 3 && (
                    <button onClick={() => setDraft(prev => prev ? { ...prev, pricing: [...(prev.pricing ?? []), { name: "", price: "", desc: "" }] } : null)}
                      style={{ width: "100%", padding: "10px", borderRadius: 8, background: C.accentLight, color: C.accent, border: `1px dashed ${C.accent}50`, cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                      + Dodaj paket {(draft.pricing ?? []).length + 1}
                    </button>
                  )}
                  {!setupAllEdit && <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />}
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
                          borderRadius: TK.geom.inner, padding: "14px 12px",
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
              {(editSection === "portfolio" || setupAllEdit) && draft ? (
                <div>
                  <p style={{ margin: "0 0 14px", fontSize: 9, fontWeight: 600, color: C.accent, letterSpacing: "1.5px", textTransform: "uppercase" }}>02 — RAD</p>
                  {/* Upload notice — shown until first file is uploaded */}
                  {!hasWork && (
                    <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 10, background: C.accentLight, border: `1px solid ${C.accent}30`, marginBottom: 14 }}>
                      <span style={{ fontSize: 18 }}>📸</span>
                      <p style={{ margin: 0, fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                        <strong style={{ color: C.accent }}>Dodaj svoje prethodne radove!</strong> Klikni „Dodaj fajl" da uploaduješ slike, videe ili dokumente. Klijentima je ovo najvažnija sekcija.
                      </p>
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                      <div key={i} style={{ background: C.sectionBg, borderRadius: 10, padding: 12 }}>
                        <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: C.muted }}>PROJEKAT {i + 1}</p>
                        <div style={{ borderRadius: 10, overflow: "hidden", background: CS_GRADIENTS[i], marginBottom: 8, minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {draft.csImages?.[i]
                            ? (/\.(mp4|mov|webm|avi)$/i.test(draft.csImages[i])
                                ? <video src={`${draft.csImages[i]}#t=0.1`} muted controls preload="metadata" playsInline style={{ width: "100%", objectFit: "contain", display: "block", background: "#000" }} />
                                : /\.(pdf|doc|docx)$/i.test(draft.csImages[i])
                                ? <iframe
                                    src={/\.(doc|docx)$/i.test(draft.csImages[i]) ? `https://docs.google.com/viewer?url=${encodeURIComponent(draft.csImages[i])}&embedded=true` : `${draft.csImages[i]}#toolbar=0&navpanes=0&view=FitH`}
                                    style={{ width: "100%", height: 150, border: "none", display: "block", background: "#fff" }}
                                    title="dokument" />
                                : <img src={draft.csImages[i]} alt="" style={{ width: "100%", height: "auto", display: "block" }} />)
                            : <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", padding: "28px 0" }}>Bez fajla</span>
                          }
                        </div>
                        <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                          <label style={{ padding: "5px 10px", background: C.accentLight, color: C.accent, borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                            {uploading === i ? "..." : "Dodaj fajl"}
                            <input type="file" accept="image/*,video/*,application/pdf,.pdf,.doc,.docx,.mp4,.mov,.webm" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) uploadImage(i, e.target.files[0]); }} />
                          </label>
                          {draft.csImages?.[i] && (
                            <button onClick={() => { const imgs = [...(draft.csImages ?? ["","","",""])]; imgs[i] = ""; setDraft(prev => prev ? { ...prev, csImages: imgs } : null); }}
                              style={{ padding: "5px 8px", background: "none", border: "1px solid #FECACA", borderRadius: 5, cursor: "pointer", fontSize: 11, color: "#EF4444" }}>
                              Ukloni
                            </button>
                          )}
                        </div>
                        <input style={{ ...INP, marginBottom: 4 }} value={draft.caseStudies?.[i]?.client ?? ""} onChange={e => setDraftCS(i, "client", e.target.value)} placeholder="Klijent" />
                        <input style={{ ...INP, marginBottom: 0 }} value={draft.caseStudies?.[i]?.platform ?? ""} onChange={e => setDraftCS(i, "platform", e.target.value)} placeholder="Tip usluge" />
                      </div>
                    ))}
                  </div>
                  {!setupAllEdit && <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />}
                </div>
              ) : (
                <>
                  <SectionHead number="02" text="Prethodni radovi" section="portfolio" onEdit={startEdit} />
                  {hasWork ? (
                    <div className="pp-cs-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      {csSlots.map(i => {
                        const img = p.csImages?.[i];
                        const cs  = p.caseStudies?.[i];
                        const isVideo = img && /\.(mp4|mov|webm|avi)$/i.test(img);
                        const isDoc   = img && /\.(pdf|doc|docx)$/i.test(img);
                        return (
                          <div key={i}>
                            {isVideo ? (
                              <video src={`${img}#t=0.1`} muted preload="metadata" playsInline style={{ width: "100%", borderRadius: TK.geom.inner, display: "block", background: "#000", objectFit: "contain" }} />
                            ) : isDoc ? (
                              <div style={{ borderRadius: TK.geom.inner, overflow: "hidden", border: `1px solid ${C.border}`, background: "#fff" }}>
                                <iframe src={/\.(doc|docx)$/i.test(img) ? `https://docs.google.com/viewer?url=${encodeURIComponent(img)}&embedded=true` : `${img}#toolbar=0&navpanes=0&view=FitH`} style={{ width: "100%", height: 150, border: "none", display: "block", pointerEvents: "none" }} title="dokument" />
                              </div>
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img} alt="" style={{ width: "100%", height: "auto", display: "block", borderRadius: TK.geom.inner }} />
                            )}
                            {cs?.client && <p style={{ margin: "6px 0 0", fontSize: 11, fontWeight: 600, color: C.text }}>{cs.client}</p>}
                            {cs?.platform && <p style={{ margin: "2px 0 0", fontSize: 10, color: C.muted }}>{cs.platform}</p>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div onClick={() => startEdit("portfolio")} style={{ display: "flex", gap: 10, padding: "14px 16px", borderRadius: 12, background: C.accentLight, border: `1px dashed ${C.accent}50`, cursor: "pointer" }}>
                      <span style={{ fontSize: 20 }}>📸</span>
                      <p style={{ margin: 0, fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>
                        <strong style={{ color: C.accent }}>Dodaj svoje prethodne radove!</strong> Klikni ovde da uploaduješ slike, videe ili dokumente svojih radova — ovo je sekcija koju klijenti najviše gledaju.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 03 — Veštine */}
            <SectionSep />
            <div className="pp-right-section" style={{ padding: "24px 20px" }}>
              {(editSection === "stack" || setupAllEdit) && draft ? (
                <div>
                  <p style={{ margin: "0 0 14px", fontSize: 9, fontWeight: 600, color: C.accent, letterSpacing: "1.5px", textTransform: "uppercase" }}>03 — VEŠTINE</p>
                  <label style={LBL}>TVOJE VEŠTINE</label>
                  <p style={{ margin: "0 0 12px", fontSize: 11, color: C.muted, lineHeight: 1.5 }}>Dodaj svoje lične veštine, programe i alate — svaki u poseban bedž. Prve 2 prikazuju se istaknuto.</p>
                  {(() => {
                    const items = (draft.stack ?? "") === "" ? [""] : draft.stack.split(",");
                    const setItems = (arr: string[]) => setD("stack", arr.join(","));
                    return (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                        {items.map((sk, i) => (
                          <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: C.accentLight, border: `1px solid ${C.accent}40`, borderRadius: 999, padding: "4px 6px 4px 12px" }}>
                            <input
                              value={sk}
                              onChange={e => setItems(items.map((x, j) => j === i ? e.target.value.replace(/,/g, "") : x))}
                              onKeyDown={e => {
                                if (e.key === "Enter") { e.preventDefault(); if (sk.trim()) setItems([...items, ""]); }
                                if (e.key === "Backspace" && !sk && items.length > 1) { e.preventDefault(); setItems(items.filter((_, j) => j !== i)); }
                              }}
                              placeholder={PH.skills[i] ?? "npr. Figma"}
                              style={{ background: "transparent", border: "none", outline: "none", color: C.dark, fontSize: 13, fontWeight: 600, fontFamily: "inherit", width: `${Math.max(sk.length, (PH.skills[i] ?? "npr. Figma").length, 7) * 8}px`, maxWidth: 180 }}
                            />
                            <button onClick={() => setItems(items.length > 1 ? items.filter((_, j) => j !== i) : [""])}
                              style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.08)", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
                          </div>
                        ))}
                        <button onClick={() => setItems([...items, ""])} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", border: `1px dashed ${C.accent}66`, borderRadius: 999, padding: "7px 14px", color: C.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Dodaj bedž
                        </button>
                      </div>
                    );
                  })()}
                  {!setupAllEdit && <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />}
                </div>
              ) : (
                <>
                  <SectionHead number="03" text="Veštine" section="stack" onEdit={startEdit} />
                  {stackTags.length > 0
                    ? <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {stackTags.map((tag, i) => (
                          <span key={i} style={{ fontSize: 11, padding: "7px 13px", background: TK.tagBg, color: i < 2 ? TK.tagText : C.text, border: `1px solid ${TK.tagBorder}`, borderRadius: TK.geom.pill, fontWeight: i < 2 ? 600 : 500 }}>{tag}</span>
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
              {(editSection === "experience" || setupAllEdit) && draft ? (
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
                          <input style={INP} value={exp.company} onChange={e => setDraftExp(i, "company", e.target.value)} placeholder={PH.experience[i]?.company ?? "npr. Naziv firme / klijenta"} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={LBL}>ULOGA</label>
                          <input style={INP} value={exp.role} onChange={e => setDraftExp(i, "role", e.target.value)} placeholder={PH.experience[i]?.role ?? "npr. Tvoja uloga"} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={LBL}>OPIS</label>
                          <textarea style={{ ...INP, minHeight: 60, resize: "vertical" } as React.CSSProperties} value={exp.desc} onChange={e => setDraftExp(i, "desc", e.target.value)} placeholder={PH.experience[i]?.desc ?? "npr. Šta si konkretno uradio i rezultat"} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addExp} style={{ width: "100%", padding: "10px", borderRadius: 8, background: C.accentLight, color: C.accent, border: `1px dashed ${C.accent}50`, cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                    + Dodaj iskustvo
                  </button>
                  {!setupAllEdit && <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />}
                </div>
              ) : (
                <>
                  <SectionHead number="05" text="Prethodno iskustvo" section="experience" onEdit={startEdit} />
                  {(() => {
                    const csItems = (p.caseStudies ?? []).filter((cs, i) => cs.client && !p.csImages?.[i]);
                    const expItems = p.experience ?? [];
                    if (csItems.length === 0 && expItems.length === 0) {
                      return <p style={{ margin: 0, fontSize: 13, color: C.muted, fontStyle: "italic" }}>Nema iskustva — klikni Uredi</p>;
                    }
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {csItems.map((cs, i) => (
                          <div key={`cs-${i}`} style={{ paddingLeft: 12, borderLeft: `3px solid ${C.accent}` }}>
                            <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 600 }}>{cs.client}</p>
                            {cs.platform && <p style={{ margin: "0 0 4px", fontSize: 11, color: C.accent }}>{cs.platform}</p>}
                            {cs.industry && <p style={{ margin: 0, fontSize: 11, color: C.text, lineHeight: 1.5 }}>{cs.industry}</p>}
                          </div>
                        ))}
                        {expItems.map((exp, i) => (
                          <div key={`exp-${i}`} style={{ paddingLeft: 12, borderLeft: `3px solid ${TK.accent}80` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{exp.company}</p>
                              {(exp.dateFrom || exp.dateTo) && <p style={{ margin: 0, fontSize: 10, color: C.muted, flexShrink: 0, marginLeft: 10 }}>{exp.dateFrom}{exp.dateTo ? ` — ${exp.dateTo}` : ""}</p>}
                            </div>
                            {exp.role && <p style={{ margin: "0 0 6px", fontSize: 11, color: C.muted }}>{exp.role}</p>}
                            {exp.desc && <p style={{ margin: 0, fontSize: 11, color: C.text, lineHeight: 1.5 }}>{exp.desc}</p>}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {/* 06 — Reči klijenata */}
            <SectionSep />
            <div className="pp-right-section" style={{ padding: "24px 20px" }}>
              {(editSection === "testimonial" || setupAllEdit) && draft ? (
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
                      <label style={LBL}>IME KLIJENTA</label>
                      <input style={INP} value={draft.testimonialName} onChange={e => setD("testimonialName", e.target.value)} />
                      <label style={LBL}>NAZIV BRENDA</label>
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
                      }} placeholder={PH.testimonial.quote} />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <label style={LBL}>IME KLIJENTA</label>
                          <input style={INP} value={t.name} onChange={e => {
                            const ts = [...(draft.testimonials ?? [])]; ts[i] = { ...ts[i], name: e.target.value };
                            setDraft(prev => prev ? { ...prev, testimonials: ts } : null);
                          }} placeholder={PH.testimonial.name} />
                        </div>
                        <div>
                          <label style={LBL}>NAZIV BRENDA</label>
                          <input style={{ ...INP, marginBottom: 0 }} value={t.title} onChange={e => {
                            const ts = [...(draft.testimonials ?? [])]; ts[i] = { ...ts[i], title: e.target.value };
                            setDraft(prev => prev ? { ...prev, testimonials: ts } : null);
                          }} placeholder={PH.testimonial.title} />
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
                  {!setupAllEdit && <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />}
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
                          <div key={i} style={{ background: TK.quoteBg, border: `1px solid ${TK.quoteBorder}`, borderRadius: TK.geom.inner, padding: 16 }}>
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

          </div>{/* end pp-right */}

          {/* CTA / Kontakt — puna širina kartice (van kolone), kao na javnom portfoliju */}
          <div className="pp-cta" style={{ padding: "32px 24px 28px", background: "#13131a", color: "#fff", borderRadius: TK.blockRadius, boxShadow: TK.blockShadow }}>
            {(editSection === "cta" || setupAllEdit) && draft ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: 16 }}>
                <label style={LBL}>NASLOV</label>
                <input style={INP} value={draft.ctaTitle} onChange={e => setD("ctaTitle", e.target.value)} placeholder="npr. Da napravimo" />
                <label style={LBL}>ISTAKNUTA REČ (ljubičasto)</label>
                <input style={INP} value={draft.ctaHighlight} onChange={e => setD("ctaHighlight", e.target.value)} placeholder="npr. nešto sjajno zajedno?" />
                <label style={LBL}>EMAIL (za kopiranje)</label>
                <input style={INP} value={(draft as any).contactEmail ?? ""} onChange={e => setD("contactEmail" as any, e.target.value)} placeholder="tvoj@email.com" />
                <label style={LBL}>TELEFON (za kopiranje)</label>
                <input style={INP} value={(draft as any).contactPhone ?? ""} onChange={e => setD("contactPhone" as any, e.target.value)} placeholder="+381 60 000 0000" />
                {!setupAllEdit && <EditBar onSave={saveSection} onCancel={cancelEdit} saving={saving} />}
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.5px", flex: 1 }}>
                    {(p.ctaTitle || p.ctaHighlight)
                      ? <>{p.ctaTitle}{p.ctaHighlight && <> <span style={{ color: C.accentMuted }}>{p.ctaHighlight}</span></>}</>
                      : <>Da napravimo<br />tvoj <span style={{ color: C.accentMuted }}>sledeći hit</span></>
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
        </div>{/* end pp-grid */}
      </div>{/* end pp-card */}

      {/* ── Setup mode: fixed finish bar ── */}
      {setupMode && (
        <div style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 30,
          background: "rgba(11,15,25,0.95)", backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: isMobile ? "12px 16px calc(12px + env(safe-area-inset-bottom))" : "14px 24px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
        }}>
          <div style={{ width: "100%", maxWidth: 1100, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <span style={{ fontSize: 12.5, color: allRequiredDone ? "#4ADE80" : "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
              {allRequiredDone
                ? "✓ Sve obavezne sekcije su popunjene!"
                : "Popuni sve sekcije da nastaviš (Prethodni radovi su opcioni)."}
            </span>
            <button
              onClick={finishSetup}
              disabled={!allRequiredDone || finishing}
              style={{
                padding: "12px 26px", borderRadius: 12, border: "none", flexShrink: 0,
                background: (allRequiredDone && !finishing) ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(255,255,255,0.07)",
                color: (allRequiredDone && !finishing) ? "#fff" : "rgba(255,255,255,0.25)",
                fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                cursor: (allRequiredDone && !finishing) ? "pointer" : "not-allowed",
                boxShadow: (allRequiredDone && !finishing) ? "0 4px 20px rgba(124,58,237,0.4)" : "none",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              {finishing ? "Čuvanje..." : "Sačuvaj i nastavi →"}
            </button>
          </div>
        </div>
      )}

      {/* ── Theme customization ── */}
      {showThemeSheet && p && (() => {
        const app = (p as any).portfolioAppearance as PortfolioAppearance | undefined;
        const currentTpl = app?.templateId ?? 33;
        const currentBlk = app?.blockStyle  ?? DEFAULT_BLOCK_STYLE;
        const categories = [
          { key: "soft",    label: "🌸 Soft" },
          { key: "dark",    label: "🌑 Dark" },
          { key: "bold",    label: "⚡ Bold" },
          { key: "neutral", label: "🤍 Neutral" },
          { key: "special", label: "✨ Special" },
        ];

        // ── MOBILE: non-blocking bottom scroll bar (background stays scrollable) ──
        if (isMobile) {
          return (
            <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 9999, pointerEvents: "none" }}>
              <style>{`@keyframes barUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
              <div style={{
                pointerEvents: "auto",
                background: "#15151c", borderTop: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 -8px 30px rgba(0,0,0,0.4)",
                animation: "barUp 0.25s cubic-bezier(0.16,1,0.3,1)",
                padding: "10px 0 calc(10px + env(safe-area-inset-bottom))",
              }}>
                {/* Top row: shape chips + close */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px 8px", overflowX: "auto", scrollbarWidth: "none" }}>
                  {BLOCK_STYLES.map(bs => (
                    <button key={bs.id} onClick={() => applyTheme(currentTpl, bs.id)}
                      style={{
                        flexShrink: 0, padding: "5px 12px",
                        borderRadius: bs.previewRadius,
                        border: currentBlk === bs.id ? "2px solid #A855F7" : "1px solid rgba(255,255,255,0.15)",
                        background: currentBlk === bs.id ? "rgba(168,85,247,0.18)" : "rgba(255,255,255,0.05)",
                        color: currentBlk === bs.id ? "#C4A0FF" : "rgba(255,255,255,0.7)",
                        fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                        boxShadow: bs.id === "hard" ? "3px 3px 0 rgba(168,85,247,0.5)" : "none",
                      }}>{bs.name}</button>
                  ))}
                  <div style={{ flex: 1 }} />
                  <button onClick={() => setShowThemeSheet(false)} style={{ flexShrink: 0, width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 16, cursor: "pointer" }}>×</button>
                </div>
                {/* Theme thumbnails — horizontal scroll */}
                <div style={{ display: "flex", gap: 10, padding: "2px 12px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
                  {THEMES.map(th => (
                    <button key={th.id} title={th.name} onClick={() => applyTheme(th.id, currentBlk)} style={{
                      flexShrink: 0, width: 56, height: 56, borderRadius: 12,
                      background: th.bg, backgroundSize: "cover",
                      border: currentTpl === th.id ? "3px solid #A855F7" : "2px solid rgba(255,255,255,0.12)",
                      cursor: "pointer", position: "relative", padding: 0,
                      boxShadow: currentTpl === th.id ? "0 0 0 2px rgba(168,85,247,0.4)" : "none",
                    }}>
                      {currentTpl === th.id && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        // ── DESKTOP: centered modal grid (click outside / X to close) ──
        return (
          <div
            onClick={e => { if (e.target === e.currentTarget) setShowThemeSheet(false); }}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
            }}
          >
            <div style={{
              width: "100%", maxWidth: 560, background: "#fff",
              borderRadius: 24, maxHeight: "82vh", overflowY: "auto",
              boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
            }}>
              <div style={{ position: "sticky", top: 0, background: "#fff", padding: "16px 22px 14px", borderBottom: `1px solid ${C.divider}`, zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.dark }}>🎨 Prilagodi izgled</p>
                <button onClick={() => setShowThemeSheet(false)} style={{ width: 30, height: 30, borderRadius: "50%", background: C.divider, border: "none", cursor: "pointer", fontSize: 16, color: C.muted }}>×</button>
              </div>
              <div style={{ padding: "20px" }}>
                <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.5px", textTransform: "uppercase" }}>Oblik blokova</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 26 }}>
                  {BLOCK_STYLES.map(bs => (
                    <button key={bs.id} onClick={() => applyTheme(currentTpl, bs.id)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: bs.previewRadius,
                        border: currentBlk === bs.id ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                        background: currentBlk === bs.id ? C.accentLight : "#fff",
                        color: currentBlk === bs.id ? C.accent : C.dark,
                        fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                        boxShadow: bs.id === "hard" ? `3px 3px 0 ${C.accent}` : "none",
                      }}>{bs.name}</button>
                  ))}
                </div>
                {categories.map(cat => (
                  <div key={cat.key} style={{ marginBottom: 22 }}>
                    <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.5px", textTransform: "uppercase" }}>{cat.label}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))", gap: 10 }}>
                      {THEMES.filter(th => th.category === cat.key).map(th => (
                        <button key={th.id} title={th.name} onClick={() => applyTheme(th.id, currentBlk)} style={{
                          aspectRatio: "1", width: "100%", borderRadius: 14, background: th.bg,
                          border: currentTpl === th.id ? `3px solid ${C.accent}` : "2px solid rgba(0,0,0,0.08)",
                          cursor: "pointer", position: "relative",
                          boxShadow: currentTpl === th.id ? `0 0 0 3px ${C.accentLight}` : "none",
                        }}>
                          {currentTpl === th.id && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <p style={{ margin: "6px 0 8px", fontSize: 12, color: C.muted, textAlign: "center" }}>
                  Promene se odmah primenjuju na tvoj portfolio.
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
