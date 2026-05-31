"use client";
import React, { useState, useEffect } from "react";
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

// ─── Design tokens (iz HTML reference-a) ────────────────────────────────────

const C = {
  accent:       "#7C3AED",
  accentLight:  "#F5F1FE",
  accentMuted:  "#A78BFA",
  dark:         "#0B0F19",
  text:         "#374151",
  muted:        "#6B7280",
  border:       "#E5E7EB",
  divider:      "#F3F4F6",
  sectionBg:    "#FAFAFB",
  tagGrayBg:    "#F3F4F6",
  tagGrayText:  "#374151",
  green:        "#22C55E",
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

  const csSlots = [0, 1, 2, 3].filter(i => p.csImages?.[i] || p.caseStudies?.[i]?.client);

  return (
    <div style={{
      background: "#F7F7F9",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: C.dark,
    }}>
      {/* ── Responsive CSS ── */}
      <style>{`
        .pf-card { width:100%; max-width:480px; background:#fff; min-height:100vh; overflow:hidden; }
        .pf-grid { display:block; }
        .pf-left { }
        .pf-right { }
        .pf-section-sep { border-top: 6px solid ${C.sectionBg}; }
        @media (min-width: 769px) {
          .pf-card {
            max-width: 1060px;
            margin: 0 auto;
            border-radius: 24px;
            box-shadow: 0 4px 40px rgba(0,0,0,0.10);
            overflow: hidden;
          }
          .pf-grid {
            display: grid;
            grid-template-columns: 300px 1fr;
            align-items: start;
            min-height: calc(100vh - 56px);
          }
          .pf-left {
            border-right: 1px solid ${C.divider};
            position: sticky;
            top: 56px;
            max-height: calc(100vh - 56px);
            overflow-y: auto;
            scrollbar-width: none;
          }
          .pf-left::-webkit-scrollbar { display: none; }
          .pf-right { min-width: 0; }
          .pf-section-sep { border-top: 1px solid ${C.divider}; }
        }
        @media (min-width: 769px) {
          .pf-wrap { padding: 32px 24px !important; }
        }
      `}</style>

      {/* ── Outer centering wrapper ── */}
      <div style={{ display: "flex", justifyContent: "center", padding: "0", minHeight: "100vh" }}>

        {/* ── Card ── */}
        <div className="pf-card">

          {/* ─── Nav ─────────────────────────────────────────────────────────── */}
          <div style={{
            padding: "14px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `0.5px solid ${C.divider}`,
            position: "sticky",
            top: 0,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(16px)",
            zIndex: 50,
          }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
              pik<span style={{ color: C.accent }}>mi</span>
            </p>
            <div
              onClick={() => {
                if (typeof window !== "undefined") {
                  if (window.history.length > 1) window.history.back();
                  else window.location.href = "/";
                }
              }}
              style={{
                width: 30, height: 30, borderRadius: "50%",
                background: C.divider,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, color: C.muted, cursor: "pointer", flexShrink: 0,
              }}
            >
              ×
            </div>
          </div>

          {/* ── Desktop grid: left (info) + right (sections) ── */}
          <div className="pf-grid">

          {/* ── LEFT: Avatar + Name + Badges + Stats ── */}
          <div className="pf-left">
          <div style={{ padding: 20 }}>

            {/* Avatar + Name */}
            <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
              {p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatarUrl}
                  alt={fullName}
                  style={{ width: 84, height: 84, borderRadius: 20, objectFit: "cover", flexShrink: 0, boxShadow: "0 8px 20px rgba(124,58,237,0.25)" }}
                />
              ) : (
                <div style={{
                  width: 84, height: 84, borderRadius: 20, flexShrink: 0,
                  background: `linear-gradient(135deg,${C.accent},#3B82F6)`,
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 30, fontWeight: 700,
                  boxShadow: "0 8px 20px rgba(124,58,237,0.25)",
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

            {/* Badges */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {/* DOSTUPAN — dark pill */}
              <div style={{
                padding: "5px 11px",
                background: C.dark, color: "#fff",
                fontSize: 10, borderRadius: 999,
                display: "flex", alignItems: "center", gap: 5, fontWeight: 500,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />
                {(p.openStatus || "DOSTUPAN").toUpperCase()}
              </div>

              {/* Badge 1 — purple pill */}
              {p.badge && (
                <div style={{
                  padding: "5px 11px",
                  background: C.accentLight, color: C.accent,
                  fontSize: 10, borderRadius: 999, fontWeight: 500,
                }}>
                  {p.badge}
                </div>
              )}

              {/* Badge 2 — purple pill */}
              {p.badge2 && (
                <div style={{
                  padding: "5px 11px",
                  background: C.accentLight, color: C.accent,
                  fontSize: 10, borderRadius: 999, fontWeight: 500,
                }}>
                  {p.badge2}
                </div>
              )}
            </div>

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
          {(p.serviceTitle || p.servicePrice) && (
            <>
              <SectionSep />
              <div style={{ padding: "24px 20px" }}>
                <SectionLabel number="01" text="ŠTA RADIM" />

                {p.serviceTitle && (
                  <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px", lineHeight: 1.2 }}>
                    {p.serviceTitle}
                  </h2>
                )}

                {p.servicePrice && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
                    <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: C.accent }}>
                      {p.servicePrice}
                    </p>
                    {p.servicePriceLabel && (
                      <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
                        /{p.servicePriceLabel}
                      </p>
                    )}
                  </div>
                )}

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
              <div style={{ padding: "24px 20px" }}>
                <SectionLabel number="" text="Paketi" />
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(p.pricing.length, 3)}, 1fr)`, gap: 12 }}>
                  {p.pricing.map((tier, i) => (
                    <div key={i} style={{
                      background: tier.green ? C.accent : C.sectionBg,
                      border: `1px solid ${tier.green ? C.accent : C.border}`,
                      borderRadius: 14, padding: "18px 16px",
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
              <div style={{ padding: "24px 20px" }}>
                <SectionLabel number="02" text="RAD" />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  {csSlots.map(i => {
                    const img = p.csImages?.[i];
                    const cs  = p.caseStudies?.[i];
                    return (
                      <div key={i}>
                        <div style={{
                          height: 110,
                          background: img ? "transparent" : CS_GRADIENTS[i % CS_GRADIENTS.length],
                          borderRadius: 14,
                          overflow: "hidden",
                        }}>
                          {img && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={img}
                              alt={cs?.client || ""}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          )}
                        </div>
                        {cs?.client && (
                          <p style={{ margin: "8px 0 0", fontSize: 11, fontWeight: 600 }}>
                            {cs.client}
                          </p>
                        )}
                        {(cs?.platform || cs?.year) && (
                          <p style={{ margin: 0, fontSize: 10, color: C.muted }}>
                            {[cs.platform, cs.year].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination dots */}
                <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                  <div style={{ width: 18, height: 4, borderRadius: 999, background: C.accent }} />
                  <div style={{ width: 4,  height: 4, borderRadius: 999, background: C.border }} />
                  <div style={{ width: 4,  height: 4, borderRadius: 999, background: C.border }} />
                </div>
              </div>
            </>
          )}

          {/* ─── 03 — Veštine ────────────────────────────────────────────────── */}
          {stackTags.length > 0 && (
            <>
              <SectionSep />
              <div style={{ padding: "24px 20px" }}>
                <SectionLabel number="03" text="VEŠTINE" />
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
                          borderRadius: 999,
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
          {p.experience && p.experience.length > 0 && (
            <>
              <SectionSep />
              <div style={{ padding: "24px 20px" }}>
                <SectionLabel number="05" text="ISKUSTVO" />
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {p.experience.map((exp, i) => {
                    const isActive = i === 0;
                    return (
                      <div
                        key={i}
                        style={{
                          paddingLeft: 12,
                          borderLeft: `2px solid ${isActive ? C.accent : C.border}`,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                          <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{exp.company}</p>
                          {(exp.dateFrom || exp.dateTo) && (
                            <p style={{ margin: 0, fontSize: 10, color: C.muted, flexShrink: 0, marginLeft: 10 }}>
                              {exp.dateFrom}{exp.dateTo ? ` — ${exp.dateTo}` : ""}
                            </p>
                          )}
                        </div>
                        {exp.role && (
                          <p style={{ margin: "0 0 6px", fontSize: 11, color: isActive ? C.accent : C.muted }}>
                            {exp.role}
                          </p>
                        )}
                        {exp.desc && (
                          <p style={{ margin: 0, fontSize: 11, color: C.text, lineHeight: 1.5 }}>
                            {exp.desc}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ─── 06 — Reči klijenata ─────────────────────────────────────────── */}
          {p.testimonialQuote && (
            <>
              <SectionSep />
              <div style={{ padding: "24px 20px" }}>
                <SectionLabel number="06" text="REČI KLIJENATA" />
                <div style={{ background: C.accentLight, borderRadius: 16, padding: 18 }}>
                  <p style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 500, lineHeight: 1.4, color: C.dark }}>
                    "{p.testimonialQuote}"
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {p.testimonialAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.testimonialAvatarUrl}
                        alt={p.testimonialName}
                        style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                        background: `linear-gradient(135deg,${C.accent},#EC4899)`,
                      }} />
                    )}
                    <div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>{p.testimonialName}</p>
                      {p.testimonialTitle && (
                        <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{p.testimonialTitle}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ─── Portfolio fajlovi ───────────────────────────────────────────── */}
          {(p.portfolioFiles ?? []).length > 0 && (
            <div style={{ padding: "32px 0 8px", borderTop: `1px solid ${C.divider}` }}>
              <p style={{ margin: "0 0 16px", fontSize: 9, fontWeight: 600, color: C.accent, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                Materijali
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                {(p.portfolioFiles ?? []).map((f, i) => (
                  <div key={i} style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, background: C.sectionBg }}>
                    {f.type === "image" && (
                      <a href={f.url} target="_blank" rel="noreferrer">
                        <img src={f.url} alt={f.name} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                      </a>
                    )}
                    {f.type === "video" && (
                      <video src={f.url} controls style={{ width: "100%", height: 120, objectFit: "cover", display: "block", background: "#000" }} />
                    )}
                    {f.type === "document" && (
                      <a href={f.url} target="_blank" rel="noreferrer" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 120, gap: 8, textDecoration: "none" }}>
                        <span style={{ fontSize: 36 }}>📄</span>
                        <span style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>Otvori PDF</span>
                      </a>
                    )}
                    <div style={{ padding: "8px 10px", borderTop: `1px solid ${C.border}` }}>
                      <p style={{ margin: 0, fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          </div>{/* end pf-right */}
          </div>{/* end pf-grid */}

          {/* ─── CTA / Kontakt — full width, van grid-a ──────────────────────── */}
          <div style={{ padding: "40px 32px 32px", background: C.dark, color: "#fff" }}>
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              <h2 style={{ margin: "0 0 24px", fontSize: 28, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.5px" }}>
                {p.ctaTitle ? (
                  <>
                    {p.ctaTitle}
                    {p.ctaHighlight && (
                      <> <span style={{ color: C.accentMuted }}>{p.ctaHighlight}</span></>
                    )}?
                  </>
                ) : (
                  <>
                    Da napravimo{" "}
                    tvoj <span style={{ color: C.accentMuted }}>sledeći hit</span>?
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
              ) : (
                <button
                  onClick={() => setShowContactModal(true)}
                  style={{
                    width: "100%", maxWidth: 360,
                    background: C.accent, color: "#fff", border: "none",
                    padding: 15, borderRadius: 999,
                    fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(124,58,237,0.4)",
                  }}
                >
                  {p.ctaBtn1 || "Zakaži besplatan poziv"} →
                </button>
              )}

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
    </div>
  );
}
