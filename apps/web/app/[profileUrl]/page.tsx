"use client";
import React, { useState, useEffect, useRef } from "react";
import { getTheme, themeTokens, DEFAULT_THEME_ID, DEFAULT_BLOCK_STYLE, TORN_CSS, type BlockStyleId } from "../../lib/themes";

// ── Custom video player (no download, adaptive ratio, play/pause + mute) ─────
function VideoPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [ratio, setRatio] = useState("16/9");

  function onMeta() {
    const v = ref.current;
    if (!v) return;
    if (v.videoWidth && v.videoHeight) {
      setRatio(`${v.videoWidth}/${v.videoHeight}`);
    }
    // Seek to 0.001s to force first frame render on mobile browsers
    v.currentTime = 0.001;
  }

  function togglePlay() {
    const v = ref.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play(); setPlaying(true); }
  }

  function toggleMute() {
    const v = ref.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
  }

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: ratio, background: "#000", borderRadius: 14, overflow: "hidden" }}>
      <video
        ref={ref}
        src={src}
        muted
        playsInline
        preload="metadata"
        onLoadedMetadata={onMeta}
        onEnded={() => setPlaying(false)}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
      {/* Overlay controls */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={togglePlay}>
        {!playing && (
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", border: "2px solid rgba(255,255,255,0.3)",
          }}>
            <span style={{ fontSize: 20, marginLeft: 3 }}>▶</span>
          </div>
        )}
      </div>
      {/* Bottom bar: pause + mute */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "8px 10px", display: "flex", alignItems: "center", gap: 8,
        background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
        opacity: playing ? 1 : 0, transition: "opacity 0.2s",
      }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={e => { if (playing) e.currentTarget.style.opacity = "1"; else e.currentTarget.style.opacity = "0"; }}
      >
        <button onClick={e => { e.stopPropagation(); togglePlay(); }}
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, padding: "2px 6px", borderRadius: 4, display: "flex", alignItems: "center" }}>
          {playing ? "⏸" : "▶"}
        </button>
        <button onClick={e => { e.stopPropagation(); toggleMute(); }}
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, padding: "2px 6px", borderRadius: 4, display: "flex", alignItems: "center" }}>
          {muted ? "🔇" : "🔊"}
        </button>
      </div>
    </div>
  );
}
import { supabase } from "../../lib/supabase";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ExperienceItem {
  company: string;
  role: string;
  dateFrom: string;
  dateTo: string;
  desc: string;
}

interface Profile {
  csImages: string[];
  avatarUrl: string;
  firstName: string;
  lastName: string;
  initials: string;
  city: string;
  openStatus: string;
  badge: string;
  badge2?: string;
  metric1Value: string;
  metric1Label: string;
  metric2Value: string;
  metric2Label: string;
  metric3Value?: string;
  metric3Label?: string;
  serviceTitle: string;
  servicePrice: string;
  servicePriceLabel: string;
  serviceDesc: string;
  caseStudies: Array<{
    client?: string;
    platform?: string;
    year?: string;
    bg?: string;
    industry?: string;
    metric?: string;
    metricLabel?: string;
    lightText?: boolean;
  }>;
  pricing: Array<{ name: string; price: string; desc: string; green?: boolean }>;
  stack: string;
  detailCapacity: string;
  detailResponse: string;
  detailMinBudget: string;
  detailLanguages: string;
  testimonialQuote: string;
  testimonialName: string;
  testimonialTitle: string;
  testimonialAvatarUrl?: string;
  testimonials?: Array<{ quote: string; name: string; title: string; avatarUrl?: string }>;
  experience?: ExperienceItem[];
  ctaTitle: string;
  ctaHighlight: string;
  ctaBtn1: string;
  ctaBtn2: string;
  pdfUrl: string;
  portfolioFiles?: { url: string; name: string; type: "image" | "video" | "document" }[];
  contactEmail?: string;
  contactPhone?: string;
}

// ─── Default light tokens — used by ContactModal & loading states ────────────
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

// ─── Section separator ───────────────────────────────────────────────────────
function SectionSep() {
  return <div className="pf-section-sep" />;
}

// ─── Section label (heading, bez broja) ─────────────────────────────────────
function SectionLabel({ number: _number, text }: { number: string; text: string }) {
  return (
    <p style={{
      margin: "0 0 16px",
      fontSize: 13,
      fontWeight: 700,
      color: C.text,
      letterSpacing: "-0.1px",
    }}>
      {text}
    </p>
  );
}

// ─── Contact copy block ──────────────────────────────────────────────────────
function ContactCopyBlock({ label, value, icon }: { label: string; value: string; icon: string }) {
  const [copied, setCopied] = React.useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14, padding: "14px 16px",
        cursor: "pointer", textAlign: "left", width: "100%",
        transition: "background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{label}</span>
      </div>
      <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: "#fff", wordBreak: "break-all" }}>{value}</p>
      <p style={{ margin: 0, fontSize: 10, color: copied ? "#4ADE80" : "rgba(255,255,255,0.35)" }}>
        {copied ? "✓ Kopirano!" : "klikni da kopiraš"}
      </p>
    </button>
  );
}

// ─── Email provider helper ───────────────────────────────────────────────────

function getEmailProvider(email: string): {
  name: string;
  icon: string;
  getUrl: (to: string, subject: string, idx?: number) => string;
  supportsSwitch: boolean;
} | null {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (domain === "gmail.com" || domain === "googlemail.com") {
    return {
      name: "Gmail",
      icon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico",
      getUrl: (to, subject, idx = 0) =>
        `https://mail.google.com/mail/u/${idx}/?view=cm&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}`,
      supportsSwitch: true,
    };
  }
  if (["outlook.com", "hotmail.com", "live.com", "msn.com"].includes(domain)) {
    return {
      name: "Outlook",
      icon: "https://outlook.live.com/favicon.ico",
      getUrl: (to, subject) =>
        `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}`,
      supportsSwitch: false,
    };
  }
  if (domain === "yahoo.com" || domain === "ymail.com") {
    return {
      name: "Yahoo Mail",
      icon: "https://mail.yahoo.com/favicon.ico",
      getUrl: (to, subject) =>
        `https://compose.mail.yahoo.com/?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}`,
      supportsSwitch: false,
    };
  }
  return null;
}

// ─── Contact Modal ───────────────────────────────────────────────────────────

function ContactModal({
  freelancerEmail,
  freelancerName,
  senderEmail,
  setSenderEmail,
  onClose,
}: {
  freelancerEmail: string;
  freelancerName: string;
  senderEmail: string;
  setSenderEmail: (v: string) => void;
  onClose: () => void;
}) {
  const subject = `Strategy poziv — ${freelancerName}`;
  const provider = senderEmail.includes("@") ? getEmailProvider(senderEmail) : null;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "24px 24px 0 0",
          padding: "28px 20px 40px",
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.divider, margin: "0 auto 20px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: C.dark, margin: 0 }}>Pošalji poruku ✉️</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: C.muted, lineHeight: 1, padding: 0 }}
          >×</button>
        </div>

        <div style={{ background: C.sectionBg, borderRadius: 12, padding: "11px 14px", marginBottom: 18 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.8px", marginBottom: 3, textTransform: "uppercase" as const }}>Šalješ na</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{freelancerEmail}</div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.5px", display: "block", marginBottom: 7, textTransform: "uppercase" as const }}>
            Tvoj email (sa kojeg šalješ)
          </label>
          <input
            type="email"
            value={senderEmail}
            onChange={e => setSenderEmail(e.target.value)}
            placeholder="npr. poslovni@firma.com"
            style={{
              width: "100%", padding: "12px 13px", borderRadius: 10, fontSize: 14,
              border: `1.5px solid ${C.border}`, outline: "none", boxSizing: "border-box" as const,
              color: C.dark, background: "#fff", fontFamily: "inherit",
              transition: "border-color 0.15s",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
            onBlur={e => (e.currentTarget.style.borderColor = C.border)}
          />
          {senderEmail && !isValidEmail && (
            <p style={{ fontSize: 11, color: "#EF4444", marginTop: 5 }}>Unesi ispravan email</p>
          )}
        </div>

        {!isValidEmail ? (
          <div style={{ textAlign: "center", padding: "14px 0", color: C.muted, fontSize: 12 }}>
            Upiši email iznad da vidiš opcije za slanje
          </div>
        ) : provider?.supportsSwitch ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Otvori sa 1. Gmail nalogom", index: 0 },
              { label: "Otvori sa 2. Gmail nalogom", index: 1 },
              { label: "Otvori sa 3. Gmail nalogom", index: 2 },
            ].map(({ label, index }) => (
              <a
                key={index}
                href={provider.getUrl(freelancerEmail, subject, index)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", borderRadius: 10,
                  border: `1.5px solid ${C.border}`, textDecoration: "none",
                  color: C.dark, fontSize: 13, fontWeight: 500, background: "#fff",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = C.accent)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
              >
                <img src={provider.icon} alt="" style={{ width: 16, height: 16 }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                {label}
              </a>
            ))}
            <p style={{ fontSize: 10, color: C.muted, textAlign: "center", marginTop: 3 }}>
              Gmail otvara naloge po redosledu prijave (1. = prvi prijavljeni)
            </p>
          </div>
        ) : provider ? (
          <a
            href={provider.getUrl(freelancerEmail, subject)}
            target="_blank" rel="noopener noreferrer" onClick={onClose}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px 20px", borderRadius: 999, textDecoration: "none",
              background: C.accent, color: "#fff", fontSize: 13, fontWeight: 600,
            }}
          >
            <img src={provider.icon} alt="" style={{ width: 16, height: 16, filter: "brightness(10)" }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            Otvori {provider.name}
          </a>
        ) : (
          <a
            href={`mailto:${freelancerEmail}?subject=${encodeURIComponent(subject)}`}
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "14px 20px", borderRadius: 999, textDecoration: "none",
              background: C.accent, color: "#fff", fontSize: 13, fontWeight: 600,
            }}
          >
            ✉️ Otvori email klijent
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PublicProfile({ params }: { params: { profileUrl: string } }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [freelancerEmail, setFreelancerEmail] = useState<string>("");
  const [showContactModal, setShowContactModal] = useState(false);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [senderEmail, setSenderEmail] = useState("");
  useEffect(() => {
    async function loadProfile() {
      const slug = params.profileUrl;

      // 1. Proveri da li slug odgovara pitch linku
      const { data: pitchLink } = await supabase
        .from("pitch_links")
        .select("id, user_id, is_active, views, title")
        .eq("slug", slug)
        .single();

      let userId: string | null = null;

      if (pitchLink?.is_active) {
        userId = pitchLink.user_id;

        // sessionStorage key unique per pitch link — survives React remounts and StrictMode
        const ssKey = `pikmi-tracked-${pitchLink.id}`;
        const alreadyTracked = sessionStorage.getItem(ssKey);

        if (!alreadyTracked) {
          sessionStorage.setItem(ssKey, "1");

          let viewerToken: string | null = null;
          try {
            const { data: { session } } = await supabase.auth.getSession();
            viewerToken = session?.access_token ?? null;
          } catch {}

          const device = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
          const referrer = document.referrer || "";

          const trackStart = Date.now();

          fetch("/api/track-view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pitchLinkId: pitchLink.id,
              ownerUserId: pitchLink.user_id,
              device, referrer, viewerToken,
            }),
          })
            .then(res => res.json())
            .then(data => {
              if (data.ok && !data.skipped) {
                // Notify owner
                fetch("/api/notify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    pitchLinkId: pitchLink.id,
                    pitchLinkTitle: pitchLink.title || slug,
                    ownerUserId: pitchLink.user_id,
                    slug, device, referrer,
                  }),
                }).catch(() => {});

                // Duration tracking — pošalji kada korisnik napusti stranicu
                if (data.viewId) {
                  const viewId = data.viewId;
                  const sendDuration = () => {
                    const duration = Math.round((Date.now() - trackStart) / 1000);
                    if (duration < 2) return;
                    // sendBeacon radi čak i kad se stranica zatvori
                    navigator.sendBeacon(
                      "/api/track-duration",
                      JSON.stringify({ viewId, duration })
                    );
                  };
                  const onHide = () => { if (document.visibilityState === "hidden") sendDuration(); };
                  document.addEventListener("visibilitychange", onHide);
                  window.addEventListener("beforeunload", sendDuration);
                  // Cleanup kad se komponenta unmountuje (SPA navigacija)
                  window.addEventListener("popstate", sendDuration, { once: true });
                }
              }
            })
            .catch(() => {});
        } // end sessionStorage guard
      } else {
        // 2. Proveri profile_url
        const { data: profileByUrl } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("profile_url", slug)
          .single();
        if (profileByUrl) userId = profileByUrl.user_id;
      }

      if (!userId) { setLoading(false); return; }

      // 3. Učitaj profile_data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("profile_data, first_name, last_name, email")
        .eq("user_id", userId)
        .single();

      if (profileData?.email) setFreelancerEmail(profileData.email);

      if (profileData?.profile_data && Object.keys(profileData.profile_data).length > 0) {
        // Always override firstName/lastName from DB columns (not profile_data JSON)
        // so changes in account settings are reflected immediately
        const pd = profileData.profile_data as Profile;
        setProfile({
          ...pd,
          firstName: profileData.first_name || pd.firstName || "",
          lastName: profileData.last_name || pd.lastName || "",
          initials: (profileData.first_name?.[0] ?? pd.firstName?.[0] ?? "").toUpperCase()
                  + (profileData.last_name?.[0] ?? pd.lastName?.[0] ?? "").toUpperCase(),
        });
      } else if (profileData) {
        setProfile({
          csImages: ["", "", "", ""],
          avatarUrl: "",
          firstName: profileData.first_name || "",
          lastName: profileData.last_name || "",
          initials: (profileData.first_name?.[0] ?? "") + (profileData.last_name?.[0] ?? ""),
          city: "", openStatus: "", badge: "", badge2: "",
          metric1Value: "", metric1Label: "", metric2Value: "", metric2Label: "",
          metric3Value: "", metric3Label: "",
          serviceTitle: "", servicePrice: "", servicePriceLabel: "", serviceDesc: "",
          caseStudies: [], pricing: [], stack: "",
          detailCapacity: "", detailResponse: "", detailMinBudget: "", detailLanguages: "",
          testimonialQuote: "", testimonialName: "", testimonialTitle: "",
          experience: [],
          ctaTitle: "", ctaHighlight: "", ctaBtn1: "", ctaBtn2: "",
          pdfUrl: "",
        });
      }

      setLoading(false);
    }

    loadProfile();
  }, [params.profileUrl]);

  // ─── Theme tokens (computed defensively; profile may be null) ────────────────
  const appearance = (profile as any)?.portfolioAppearance as { templateId?: number; blockStyle?: BlockStyleId } | undefined;
  const activeTheme = getTheme(appearance?.templateId ?? DEFAULT_THEME_ID);
  const bStyle      = appearance?.blockStyle ?? DEFAULT_BLOCK_STYLE;
  const TK          = themeTokens(activeTheme, bStyle);

  // Local themed C — shadows the module-level light C inside this component
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

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F7F9" }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%",
        border: `3px solid ${C.accentLight}`,
        borderTopColor: C.accent,
        animation: "spin 0.75s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ─── Not Found ───────────────────────────────────────────────────────────────
  if (!profile) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F7F9" }}>
      <div style={{ textAlign: "center", maxWidth: 340, padding: "0 24px" }}>
        <div style={{ fontSize: 50, marginBottom: 14 }}>🔍</div>
        <h1 style={{ fontSize: 21, fontWeight: 700, marginBottom: 8, color: C.dark }}>Profil nije pronađen</h1>
        <p style={{ color: C.muted, marginBottom: 26, lineHeight: 1.65, fontSize: 13 }}>
          Pikmi profil <strong>/{params.profileUrl}</strong> ne postoji ili nije javno dostupan.
        </p>
        <a
          href="/"
          style={{
            display: "inline-block", padding: "12px 26px",
            background: C.accent, color: "#fff", borderRadius: 999,
            textDecoration: "none", fontWeight: 600, fontSize: 13,
          }}
        >
          ← Nazad na pikmi
        </a>
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  const p = profile;

  const stackTags = p.stack ? p.stack.split(",").map(s => s.trim()).filter(Boolean) : [];
  const fullName = `${p.firstName} ${p.lastName}`.trim();

  const stats = [
    { value: p.metric1Value, label: p.metric1Label },
    { value: p.metric2Value, label: p.metric2Label },
    ...(p.metric3Value ? [{ value: p.metric3Value, label: p.metric3Label ?? "" }] : []),
  ].filter(m => m.value);

  const csSlots = [0, 1, 2, 3, 4, 5, 6, 7].filter(i => !!p.csImages?.[i]);
  // Klijenti bez uploadovanog fajla idu u "Prethodno iskustvo"
  const iskustvoItems = (p.caseStudies ?? []).filter((cs, i) => cs.client && !p.csImages?.[i]);

  return (
    <div style={{
      background: TK.pageBg,
      backgroundAttachment: "fixed",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: TK.textPrimary,
    }}>
      {/* ── Responsive CSS ── */}
      <style>{`
        .pf-card { width:100%; max-width:480px; min-height:100vh; overflow:hidden; }
        @media (max-width: 768px) {
          .pf-card { background: transparent; padding: 12px 0 40px; display: flex; flex-direction: column; gap: 10px; }
          /* Profile block + each section becomes its own card */
          .pf-block-mobile, .pf-sec {
            background: ${TK.blockBg};
            border: 1px solid ${TK.blockBorder};
            box-shadow: ${TK.blockShadow};
            border-radius: ${TK.blockRadius}px;
            margin: 0 12px;
            overflow: hidden;
          }
          .pf-grid { display: flex; flex-direction: column; gap: 10px; }
          .pf-right { display: flex; flex-direction: column; gap: 10px; }
          .pf-section-sep { display: none; }
          ${TK.isTorn ? TORN_CSS : ""}
        }
        .pf-left { }
        .pf-right { }
        .pf-section-sep { border-top: 6px solid ${TK.divider}; }
        @media (min-width: 769px) {
          .pf-card {
            max-width: 1060px;
            margin: 0 auto;
            border-radius: 24px;
            box-shadow: 0 8px 60px rgba(0,0,0,0.18);
            overflow: hidden;
          }
          .pf-block { margin: 0; border-radius: 0; border: none; box-shadow: none; background: transparent; }
          .pf-grid {
            display: grid;
            grid-template-columns: 300px 1fr;
            align-items: start;
            min-height: 100vh;
          }
          .pf-left {
            border-right: 1px solid ${TK.divider};
            position: sticky;
            top: 0;
            max-height: 100vh;
            overflow-y: auto;
            scrollbar-width: none;
            background: ${TK.blockBg};
          }
          .pf-left::-webkit-scrollbar { display: none; }
          .pf-right { min-width: 0; background: ${TK.blockBg}; }
          .pf-section-sep { border-top: 1px solid ${TK.divider}; }
        }
        @media (min-width: 769px) {
          .pf-wrap { padding: 32px 24px !important; }
        }
      `}</style>

      {/* ── Outer centering wrapper ── */}
      <div style={{ display: "flex", justifyContent: "center", padding: "0", minHeight: "100vh", backgroundAttachment: "fixed" }}>

        {/* ── Card ── */}
        <div className="pf-card">


          {/* ── Desktop grid: left (info) + right (sections) ── */}
          <div className="pf-grid">

          {/* ── LEFT: Avatar + Name + Badges + Stats ── */}
          <div className={`pf-left pf-block-mobile${TK.isTorn ? " pf-torn" : ""}`}>
          <div style={{ padding: 20 }}>

            {/* Avatar + Name */}
            <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
              {p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatarUrl}
                  alt={fullName}
                  style={{ width: 84, height: 84, borderRadius: TK.geom.avatar, objectFit: "cover", flexShrink: 0, boxShadow: `0 8px 22px ${TK.accent}55` }}
                />
              ) : (
                <div style={{
                  width: 84, height: 84, borderRadius: TK.geom.avatar, flexShrink: 0,
                  background: `linear-gradient(135deg,${TK.accent},${TK.accent}aa)`,
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 30, fontWeight: 700,
                  boxShadow: `0 8px 22px ${TK.accent}55`,
                }}>
                  {p.initials || (p.firstName?.[0] ?? "?")}
                </div>
              )}

              <div style={{ flex: 1, paddingTop: 4 }}>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.6px", lineHeight: 1 }}>
                  {p.firstName}
                </p>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.6px", lineHeight: 1.1, color: C.accent }}>
                  {p.lastName}
                </p>
                {p.city && (
                  <p style={{ margin: "8px 0 0", fontSize: 11, color: C.muted }}>
                    → {p.city}
                  </p>
                )}
              </div>
            </div>

            {/* Godina iskustva */}
            {(p as any).yearsExperience && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", background: C.accentLight, color: C.accent,
                  fontSize: 11, borderRadius: TK.geom.pill, fontWeight: 600,
                }}>
                  Godine iskustva: {String((p as any).yearsExperience).replace(/\s*godin.*/i, "").trim()}
                </div>
              </div>
            )}

            {/* Stats */}
            {stats.length > 0 && (
              <div style={{
                display: "flex", gap: 18,
                paddingTop: 14,
                borderTop: `0.5px solid ${C.divider}`,
              }}>
                {stats.map((s, i) => (
                  <div key={i}>
                    <p style={{
                      margin: 0,
                      fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px",
                      color: i === 0 ? C.accent : C.dark,
                    }}>
                      {s.value}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 9, color: C.muted, letterSpacing: "0.5px" }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>{/* end pf-left */}

          {/* ── RIGHT: sve sekcije ── */}
          <div className="pf-right">

          {/* ─── 01 — Šta radim ──────────────────────────────────────────────── */}
          {p.serviceTitle && (
            <>
              <SectionSep />
              <div className={`pf-sec${TK.isTorn ? " pf-torn" : ""}`} style={{ padding: "24px 20px" }}>
                <SectionLabel number="01" text="Šta radim" />
                <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px", lineHeight: 1.2 }}>
                  {p.serviceTitle}
                </h2>
                {p.serviceDesc && (
                  <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.65 }}>
                    {p.serviceDesc}
                  </p>
                )}
              </div>
            </>
          )}

          {/* ─── Cene (paketi) ───────────────────────────────────────────────── */}
          {p.pricing && p.pricing.length > 0 && (
            <>
              <SectionSep />
              <div className={`pf-sec${TK.isTorn ? " pf-torn" : ""}`} style={{ padding: "24px 20px" }}>
                <SectionLabel number="" text="Paketi" />
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(p.pricing.length, 3)}, 1fr)`, gap: 12 }}>
                  {p.pricing.map((tier, i) => (
                    <div key={i} style={{
                      background: tier.green ? C.accent : C.sectionBg,
                      border: `1px solid ${tier.green ? C.accent : C.border}`,
                      borderRadius: TK.geom.inner, padding: "18px 16px",
                      color: tier.green ? "#fff" : C.text,
                    }}>
                      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: tier.green ? "rgba(255,255,255,0.7)" : C.muted }}>{tier.name}</p>
                      <p style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: tier.green ? "#fff" : C.accent }}>{tier.price}</p>
                      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: tier.green ? "rgba(255,255,255,0.85)" : C.muted }}>{tier.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ─── 02 — Rad ────────────────────────────────────────────────────── */}
          {csSlots.length > 0 && (
            <>
              <SectionSep />
              <div className={`pf-sec${TK.isTorn ? " pf-torn" : ""}`} style={{ padding: "24px 20px" }}>
                <SectionLabel number="02" text="Prethodni radovi" />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  {csSlots.map(i => {
                    const img = p.csImages?.[i];
                    const cs  = p.caseStudies?.[i];
                    const isVideo = img && /\.(mp4|mov|webm|avi)$/i.test(img);
                    const isDoc   = img && /\.(pdf|doc|docx)$/i.test(img);
                    const isPdf   = img && /\.pdf$/i.test(img);
                    return (
                      <div key={i}>
                        {isVideo ? (
                          <VideoPlayer src={img} />
                        ) : isDoc ? (
                          <button onClick={() => setDocPreview(img)} style={{
                            width: "100%", background: C.accentLight, border: `1px solid ${C.border}`,
                            borderRadius: TK.geom.inner, padding: "24px 16px", cursor: "pointer",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                          }}>
                            <span style={{ fontSize: 40 }}>{isPdf ? "📄" : "📝"}</span>
                            <span style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{isPdf ? "PDF dokument" : "Word dokument"}</span>
                            <span style={{ fontSize: 11, color: C.muted }}>Klikni za pregled</span>
                          </button>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" style={{ width: "100%", height: "auto", display: "block", borderRadius: TK.geom.inner }} />
                        )}
                        {cs?.client && (
                          <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 600, color: C.text }}>{cs.client}</p>
                        )}
                        {cs?.platform && (
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>{cs.platform}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </>
          )}

          {/* ─── 03 — Veštine ────────────────────────────────────────────────── */}
          {stackTags.length > 0 && (
            <>
              <SectionSep />
              <div className={`pf-sec${TK.isTorn ? " pf-torn" : ""}`} style={{ padding: "24px 20px" }}>
                <SectionLabel number="03" text="Veštine" />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {stackTags.map((tag, i) => {
                    const isPrimary = i < 2;
                    return (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          padding: "7px 13px",
                          background: isPrimary ? C.accentLight : C.tagGrayBg,
                          color:      isPrimary ? C.accent      : C.tagGrayText,
                          borderRadius: TK.geom.pill,
                          fontWeight: isPrimary ? 500 : 400,
                        }}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          )}


          {/* ─── 05 — Iskustvo ───────────────────────────────────────────────── */}
          {(() => {
            // Klijenti bez uploada + experience (ručno dodano)
            const csItems = iskustvoItems;
            const expItems = p.experience ?? [];
            if (csItems.length === 0 && expItems.length === 0) return null;
            return (
              <>
                <SectionSep />
                <div className={`pf-sec${TK.isTorn ? " pf-torn" : ""}`} style={{ padding: "24px 20px" }}>
                  <SectionLabel number="05" text="Prethodno iskustvo" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Klijenti iz kviza */}
                    {csItems.map((cs, i) => (
                      <div key={`cs-${i}`} style={{ paddingLeft: 12, borderLeft: `2px solid ${i === 0 && expItems.length === 0 ? C.accent : C.border}` }}>
                        <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 600 }}>{cs.client}</p>
                        {cs.platform && (
                          <p style={{ margin: "0 0 4px", fontSize: 11, color: C.accent }}>{cs.platform}</p>
                        )}
                        {cs.industry && (
                          <p style={{ margin: 0, fontSize: 11, color: C.text, lineHeight: 1.5 }}>{cs.industry}</p>
                        )}
                      </div>
                    ))}

                    {/* Experience ručno dodan */}
                    {expItems.map((exp, i) => {
                      const isActive = i === 0 && csItems.length === 0;
                      return (
                        <div key={`exp-${i}`} style={{ paddingLeft: 12, borderLeft: `2px solid ${isActive ? C.accent : C.border}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{exp.company}</p>
                            {(exp.dateFrom || exp.dateTo) && (
                              <p style={{ margin: 0, fontSize: 10, color: C.muted, flexShrink: 0, marginLeft: 10 }}>
                                {exp.dateFrom}{exp.dateTo ? ` — ${exp.dateTo}` : ""}
                              </p>
                            )}
                          </div>
                          {exp.role && <p style={{ margin: "0 0 6px", fontSize: 11, color: isActive ? C.accent : C.muted }}>{exp.role}</p>}
                          {exp.desc && <p style={{ margin: 0, fontSize: 11, color: C.text, lineHeight: 1.5 }}>{exp.desc}</p>}
                        </div>
                      );
                    })}

                  </div>
                </div>
              </>
            );
          })()}

          {/* ─── 06 — Reči klijenata ─────────────────────────────────────────── */}
          {(() => {
            // Koristimo novi array ako postoji, inače stari single testimonial
            const list = (p.testimonials && p.testimonials.length > 0)
              ? p.testimonials
              : p.testimonialQuote
              ? [{ quote: p.testimonialQuote, name: p.testimonialName, title: p.testimonialTitle, avatarUrl: p.testimonialAvatarUrl }]
              : [];
            if (list.length === 0) return null;
            return (
              <>
                <SectionSep />
                <div className={`pf-sec${TK.isTorn ? " pf-torn" : ""}`} style={{ padding: "24px 20px" }}>
                  <SectionLabel number="06" text="Reči klijenata" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {list.map((t, i) => (
                      <div key={i} style={{ background: C.accentLight, borderRadius: TK.geom.inner, padding: 18 }}>
                        <p style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 500, lineHeight: 1.4, color: C.dark }}>
                          "{t.quote}"
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {t.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.avatarUrl} alt={t.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,${C.accent},#EC4899)` }} />
                          )}
                          <div>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>{t.name}</p>
                            {t.title && <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{t.title}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}


          </div>{/* end pf-right */}
          </div>{/* end pf-grid */}

          {/* ─── CTA / Kontakt — full width, van grid-a ──────────────────────── */}
          <div className={`pf-sec${TK.isTorn ? " pf-torn" : ""}`} style={{ padding: "40px 32px 32px", background: "#13131a", color: "#fff" }}>
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              <h2 style={{ margin: "0 0 24px", fontSize: 28, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.5px" }}>
                {p.ctaTitle ? (
                  <>
                    {p.ctaTitle}
                    {p.ctaHighlight && (
                      <> <span style={{ color: TK.accent }}>{p.ctaHighlight}</span></>
                    )}
                  </>
                ) : (
                  <>
                    Da napravimo{" "}
                    tvoj <span style={{ color: TK.accent }}>sledeći hit</span>
                  </>
                )}
              </h2>

              {/* Email + Telefon blokovi */}
              {(p.contactEmail || p.contactPhone) ? (
                <div style={{ display: "grid", gridTemplateColumns: p.contactEmail && p.contactPhone ? "1fr 1fr" : "1fr", gap: 12 }}>
                  {p.contactEmail && (
                    <ContactCopyBlock label="Email" value={p.contactEmail} icon="✉️" />
                  )}
                  {p.contactPhone && (
                    <ContactCopyBlock label="Telefon" value={p.contactPhone} icon="📞" />
                  )}
                </div>
              ) : null}

              <p style={{ margin: "24px 0 0", textAlign: "center", fontSize: 9, color: C.muted, letterSpacing: "1px" }}>
                PRAVLJENO SA PIKMI<span style={{ color: C.accentMuted }}>.</span>
              </p>
            </div>
          </div>

        </div>{/* end card */}
      </div>{/* end centering */}

      {/* ── Contact Modal ── */}
      {showContactModal && (
        <ContactModal
          freelancerEmail={freelancerEmail}
          freelancerName={fullName}
          senderEmail={senderEmail}
          setSenderEmail={setSenderEmail}
          onClose={() => setShowContactModal(false)}
        />
      )}

      {/* ── Document preview modal ── */}
      {docPreview && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setDocPreview(null); }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          {/* Header */}
          <div style={{
            width: "100%", maxWidth: 860, display: "flex", justifyContent: "flex-end", marginBottom: 10,
          }}>
            <button onClick={() => setDocPreview(null)} style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          </div>
          {/* Dokument viewer */}
          <div style={{ width: "100%", maxWidth: 860, flex: 1, maxHeight: "80vh", borderRadius: 16, overflow: "hidden", background: "#fff" }}>
            <iframe
              src={/\.(doc|docx)$/i.test(docPreview ?? "")
                ? `https://docs.google.com/viewer?url=${encodeURIComponent(docPreview!)}&embedded=true`
                : `${docPreview}#toolbar=0`}
              style={{ width: "100%", height: "100%", border: "none", minHeight: "70vh" }}
              title="Dokument"
            />
          </div>
          {/* Download link */}
          <a href={docPreview} target="_blank" rel="noreferrer" style={{
            marginTop: 12, fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none",
          }}>
            ↓ Preuzmi dokument
          </a>
        </div>
      )}
    </div>
  );
}
