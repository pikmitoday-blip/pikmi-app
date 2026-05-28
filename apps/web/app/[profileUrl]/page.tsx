"use client";
import { useState, useEffect } from "react";
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
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ACCENT = "#7B4FEA";
const ACCENT_LIGHT = "#F0EAFB";

const CS_GRADIENTS = [
  "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)",
  "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)",
  "linear-gradient(135deg, #0D9488 0%, #1E3A5F 100%)",
  "linear-gradient(135deg, #F97316 0%, #EC4899 100%)",
];

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
        padding: "0 0 0 0",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "24px 24px 0 0",
          padding: "32px 24px 40px",
          width: "100%",
          maxWidth: 520,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
        }}
      >
        {/* Handle bar */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E5E7EB", margin: "0 auto 24px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111", margin: 0 }}>Pošalji poruku ✉️</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#9CA3AF", lineHeight: 1 }}
          >×</button>
        </div>

        <div style={{ background: "#F9F9FB", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.8px", marginBottom: 4, textTransform: "uppercase" }}>Šalješ na</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>{freelancerEmail}</div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.5px", display: "block", marginBottom: 8, textTransform: "uppercase" }}>
            Tvoj email (sa kojeg šalješ)
          </label>
          <input
            type="email"
            value={senderEmail}
            onChange={e => setSenderEmail(e.target.value)}
            placeholder="npr. poslovni@firma.com"
            style={{
              width: "100%", padding: "13px 14px", borderRadius: 12, fontSize: 14,
              border: "1.5px solid #E5E7EB", outline: "none", boxSizing: "border-box",
              color: "#111", background: "#fff", fontFamily: "inherit",
              transition: "border-color 0.15s",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
            onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
          />
          {senderEmail && !isValidEmail && (
            <p style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>Unesi ispravan email</p>
          )}
        </div>

        {!isValidEmail ? (
          <div style={{ textAlign: "center", padding: "16px 0", color: "#9CA3AF", fontSize: 13 }}>
            Upiši email iznad da vidiš opcije za slanje
          </div>
        ) : provider?.supportsSwitch ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "13px 16px", borderRadius: 12,
                  border: "1.5px solid #E5E7EB", textDecoration: "none",
                  color: "#111", fontSize: 14, fontWeight: 500, background: "#fff",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
              >
                <img
                  src={provider.icon}
                  alt=""
                  style={{ width: 18, height: 18 }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                {label}
              </a>
            ))}
            <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 4 }}>
              Gmail otvara naloge po redosledu prijave (1. = prvi prijavljeni)
            </p>
          </div>
        ) : provider ? (
          <a
            href={provider.getUrl(freelancerEmail, subject)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "15px 20px", borderRadius: 50, textDecoration: "none",
              background: `linear-gradient(135deg, ${ACCENT}, #9333EA)`,
              color: "#fff", fontSize: 15, fontWeight: 700,
            }}
          >
            <img
              src={provider.icon}
              alt=""
              style={{ width: 18, height: 18, filter: "brightness(10)" }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            Otvori {provider.name}
          </a>
        ) : (
          <a
            href={`mailto:${freelancerEmail}?subject=${encodeURIComponent(subject)}`}
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "15px 20px", borderRadius: 50, textDecoration: "none",
              background: `linear-gradient(135deg, ${ACCENT}, #9333EA)`,
              color: "#fff", fontSize: 15, fontWeight: 700,
            }}
          >
            ✉️ Otvori email klijent
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Section Label ───────────────────────────────────────────────────────────

function SectionLabel({ number, text }: { number: string; text: string }) {
  return (
    <div style={{
      fontSize: 10,
      fontWeight: 700,
      color: ACCENT,
      letterSpacing: "1.2px",
      textTransform: "uppercase" as const,
      marginBottom: 16,
    }}>
      {number} — {text}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#F0F0F0" }} />;
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

        let viewerToken: string | null = null;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          viewerToken = session?.access_token ?? null;
        } catch {}

        const device = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
        const referrer = document.referrer || "";

        fetch("/api/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pitchLinkId: pitchLink.id,
            ownerUserId: pitchLink.user_id,
            currentViews: (pitchLink as any).views ?? 0,
            device,
            referrer,
            viewerToken,
          }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.ok && !data.skipped) {
              fetch("/api/notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  pitchLinkId: pitchLink.id,
                  pitchLinkTitle: pitchLink.title || slug,
                  ownerUserId: pitchLink.user_id,
                  slug,
                  device,
                  referrer,
                }),
              }).catch(() => {});
            }
          })
          .catch(() => {});
      } else {
        // 2. Proveri da li slug odgovara profile_url
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
        setProfile(profileData.profile_data as Profile);
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

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#fff",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: `3px solid ${ACCENT}30`,
        borderTopColor: ACCENT,
        animation: "spin 0.75s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ─── Not Found ──────────────────────────────────────────────────────────────
  if (!profile) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#fff",
    }}>
      <div style={{ textAlign: "center", maxWidth: 340, padding: "0 24px" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#111" }}>
          Profil nije pronađen
        </h1>
        <p style={{ color: "#6B7280", marginBottom: 28, lineHeight: 1.65, fontSize: 14 }}>
          Pikmi profil <strong>/{params.profileUrl}</strong> ne postoji ili nije javno dostupan.
        </p>
        <a
          href="/"
          style={{
            display: "inline-block", padding: "13px 28px",
            background: `linear-gradient(135deg, ${ACCENT}, #9333EA)`,
            color: "#fff", borderRadius: 50, textDecoration: "none",
            fontWeight: 700, fontSize: 14,
          }}
        >
          ← Nazad na pikmi
        </a>
      </div>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────
  const p = profile;
  const stackTags = p.stack ? p.stack.split(",").map(s => s.trim()).filter(Boolean) : [];
  const fullName = `${p.firstName} ${p.lastName}`.trim();
  const hasWork = (p.csImages?.some(Boolean) || (p.caseStudies?.length > 0 && p.caseStudies.some(cs => cs?.client)));

  return (
    <div style={{
      background: "#fff",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#111",
    }}>

      {/* ─── Sticky nav ─── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px",
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid #F0F0F0",
      }}>
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.4px", color: "#111" }}>
          pik<span style={{ color: ACCENT }}>mi</span>
        </span>
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              if (window.history.length > 1) window.history.back();
              else window.location.href = "/";
            }
          }}
          style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "1px solid #E5E7EB", background: "#F5F5F7",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 18, color: "#6B7280",
            fontWeight: 300, lineHeight: 1, flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* ─── Main content ─── */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 20px" }}>

        {/* ── Hero: Avatar + Name + Badges + Stats ── */}
        <div style={{ paddingTop: 28, paddingBottom: 24 }}>

          {/* Avatar + Name row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
            {/* Avatar */}
            {p.avatarUrl ? (
              <img
                src={p.avatarUrl}
                alt={fullName}
                style={{ width: 76, height: 76, borderRadius: 18, objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 76, height: 76, borderRadius: 18, flexShrink: 0,
                background: "linear-gradient(135deg, #8B5CF6 0%, #4F46E5 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px",
              }}>
                {p.initials || (p.firstName?.[0] ?? "?")}
              </div>
            )}

            {/* Name + City */}
            <div style={{ paddingTop: 4 }}>
              <div style={{ lineHeight: 1.05, marginBottom: 6 }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: "#111", display: "block", letterSpacing: "-0.5px" }}>
                  {p.firstName}
                </span>
                <span style={{ fontSize: 30, fontWeight: 800, color: ACCENT, display: "block", letterSpacing: "-0.5px" }}>
                  {p.lastName}
                </span>
              </div>
              {p.city && (
                <div style={{ fontSize: 13, color: "#9CA3AF" }}>→ {p.city}</div>
              )}
            </div>
          </div>

          {/* Status + Badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 22 }}>
            {/* Open status */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 20, background: "#111",
              color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.3px",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
              {(p.openStatus || "DOSTUPAN").toUpperCase()}
            </div>

            {/* Extra badge 1 */}
            {p.badge && (
              <div style={{
                display: "inline-flex", alignItems: "center",
                padding: "6px 12px", borderRadius: 20,
                border: "1px solid #E5E7EB",
                fontSize: 11, fontWeight: 600, color: "#374151",
              }}>
                {p.badge}
              </div>
            )}

            {/* Extra badge 2 */}
            {p.badge2 && (
              <div style={{
                display: "inline-flex", alignItems: "center",
                padding: "6px 12px", borderRadius: 20,
                border: "1px solid #E5E7EB",
                fontSize: 11, fontWeight: 600, color: "#374151",
              }}>
                {p.badge2}
              </div>
            )}
          </div>

          {/* Stats row */}
          {(p.metric1Value || p.metric2Value || p.metric3Value) && (
            <div style={{ display: "flex", gap: 28 }}>
              {[
                { value: p.metric1Value, label: p.metric1Label },
                { value: p.metric2Value, label: p.metric2Label },
                { value: p.metric3Value, label: p.metric3Label },
              ]
                .filter(m => m.value)
                .map((m, i) => (
                  <div key={i}>
                    <div style={{
                      fontSize: 28, fontWeight: 800, color: ACCENT,
                      lineHeight: 1, letterSpacing: "-0.8px",
                    }}>
                      {m.value}
                    </div>
                    <div style={{
                      fontSize: 10, color: "#9CA3AF",
                      letterSpacing: "0.8px", textTransform: "uppercase",
                      marginTop: 4,
                    }}>
                      {m.label}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ── 01 — Šta radim ── */}
        {(p.serviceTitle || p.servicePrice) && (
          <>
            <Divider />
            <div style={{ paddingTop: 24, paddingBottom: 24 }}>
              <SectionLabel number="01" text="ŠTA RADIM" />

              {p.serviceTitle && (
                <h2 style={{
                  margin: "0 0 10px", fontSize: 22, fontWeight: 800, color: "#111",
                  lineHeight: 1.2, whiteSpace: "pre-line", letterSpacing: "-0.3px",
                }}>
                  {p.serviceTitle}
                </h2>
              )}

              {p.servicePrice && (
                <div style={{ fontSize: 28, fontWeight: 800, color: ACCENT, marginBottom: 12, letterSpacing: "-0.5px" }}>
                  {p.servicePrice}
                  {p.servicePriceLabel && (
                    <span style={{ fontSize: 14, fontWeight: 400, color: "#9CA3AF" }}>
                      {" "}/{p.servicePriceLabel}
                    </span>
                  )}
                </div>
              )}

              {p.serviceDesc && (
                <p style={{ margin: 0, fontSize: 14, color: "#4B5563", lineHeight: 1.8 }}>
                  {p.serviceDesc}
                </p>
              )}
            </div>
          </>
        )}

        {/* ── 02 — Rad ── */}
        {hasWork && (
          <>
            <Divider />
            <div style={{ paddingTop: 24, paddingBottom: 24 }}>
              <SectionLabel number="02" text="RAD" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[0, 1, 2, 3].map(i => {
                  const img = p.csImages?.[i];
                  const cs = p.caseStudies?.[i];
                  const hasImg = Boolean(img);
                  const hasLabel = Boolean(cs?.client || cs?.platform);
                  if (!hasImg && !hasLabel) return null;
                  return (
                    <div key={i}>
                      <div style={{
                        borderRadius: 16,
                        overflow: "hidden",
                        aspectRatio: "4/3",
                        background: CS_GRADIENTS[i % CS_GRADIENTS.length],
                        flexShrink: 0,
                      }}>
                        {hasImg && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt={cs?.client || ""}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        )}
                      </div>
                      {(cs?.client || cs?.platform) && (
                        <div style={{ marginTop: 8 }}>
                          {cs?.client && (
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#111", lineHeight: 1.3 }}>
                              {cs.client}
                            </div>
                          )}
                          {(cs?.platform || cs?.year) && (
                            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                              {[cs.platform, cs.year].filter(Boolean).join(" · ")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── 03 — Veštine ── */}
        {stackTags.length > 0 && (
          <>
            <Divider />
            <div style={{ paddingTop: 24, paddingBottom: 24 }}>
              <SectionLabel number="03" text="VEŠTINE" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {stackTags.map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 13, padding: "7px 14px", borderRadius: 20,
                      border: `1.5px solid ${ACCENT}40`,
                      color: ACCENT,
                      background: `${ACCENT}08`,
                      fontWeight: 500,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── 04 — Detalji ── */}
        {(p.detailCapacity || p.detailResponse || p.detailLanguages || p.detailMinBudget) && (
          <>
            <Divider />
            <div style={{ paddingTop: 24, paddingBottom: 24 }}>
              <SectionLabel number="04" text="DETALJI" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
                {[
                  { label: "DOSTUPNOST", value: p.detailCapacity },
                  { label: "ODGOVOR", value: p.detailResponse },
                  { label: "JEZICI", value: p.detailLanguages },
                  { label: "MIN. BUDGET", value: p.detailMinBudget },
                ]
                  .filter(d => d.value)
                  .map((d, i) => (
                    <div key={i}>
                      <div style={{
                        fontSize: 10, color: "#9CA3AF",
                        letterSpacing: "0.8px", textTransform: "uppercase",
                        marginBottom: 5,
                      }}>
                        {d.label}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{d.value}</div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* ── 05 — Iskustvo ── */}
        {p.experience && p.experience.length > 0 && (
          <>
            <Divider />
            <div style={{ paddingTop: 24, paddingBottom: 24 }}>
              <SectionLabel number="05" text="ISKUSTVO" />
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {p.experience.map((exp, i) => (
                  <div
                    key={i}
                    style={{
                      paddingLeft: 14,
                      borderLeft: `2px solid ${ACCENT}30`,
                    }}
                  >
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "flex-start", marginBottom: 3,
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>
                        {exp.company}
                      </span>
                      {(exp.dateFrom || exp.dateTo) && (
                        <span style={{
                          fontSize: 12, color: "#9CA3AF",
                          flexShrink: 0, marginLeft: 12,
                        }}>
                          {exp.dateFrom}{exp.dateTo ? ` — ${exp.dateTo}` : ""}
                        </span>
                      )}
                    </div>
                    {exp.role && (
                      <div style={{
                        fontSize: 12, color: ACCENT,
                        fontWeight: 600, marginBottom: exp.desc ? 5 : 0,
                      }}>
                        {exp.role}
                      </div>
                    )}
                    {exp.desc && (
                      <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}>
                        {exp.desc}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── 06 — Reči klijenata ── */}
        {p.testimonialQuote && (
          <>
            <Divider />
            <div style={{ paddingTop: 24, paddingBottom: 24 }}>
              <SectionLabel number="06" text="REČI KLIJENATA" />
              <div style={{
                background: ACCENT_LIGHT,
                borderRadius: 18,
                padding: "22px 20px",
              }}>
                <p style={{
                  margin: "0 0 18px",
                  fontSize: 15, color: "#111", lineHeight: 1.75,
                }}>
                  "{p.testimonialQuote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {p.testimonialAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.testimonialAvatarUrl}
                      alt={p.testimonialName}
                      style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                      background: `linear-gradient(135deg, ${ACCENT}, #3B82F6)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 14, fontWeight: 700,
                    }}>
                      {p.testimonialName?.[0]}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>
                      {p.testimonialName}
                    </div>
                    {p.testimonialTitle && (
                      <div style={{ fontSize: 12, color: "#9CA3AF" }}>{p.testimonialTitle}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>{/* end max-width container */}

      {/* ── 07 — Kontakt (dark section) ── */}
      <div style={{ background: "#0D0520", padding: "40px 20px 48px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: ACCENT,
            letterSpacing: "1.2px", textTransform: "uppercase",
            marginBottom: 16,
          }}>
            07 — KONTAKT
          </div>

          <h3 style={{
            margin: "0 0 28px",
            fontSize: 32, fontWeight: 800, color: "#fff",
            lineHeight: 1.15, letterSpacing: "-0.5px",
          }}>
            {p.ctaTitle || "Da napravimo"}
            {p.ctaHighlight && (
              <> <span style={{ color: ACCENT }}>{p.ctaHighlight}</span></>
            )}
            {(p.ctaTitle || p.ctaHighlight) ? "?" : " sledeći hit?"}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Primarni CTA */}
            <button
              onClick={() => setShowContactModal(true)}
              style={{
                width: "100%", padding: "17px 20px",
                borderRadius: 50,
                background: `linear-gradient(135deg, ${ACCENT} 0%, #9333EA 100%)`,
                color: "#fff", border: "none",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                letterSpacing: "0.1px",
              }}
            >
              {p.ctaBtn1 || "Zakaži besplatan poziv"} →
            </button>

            {/* Sekundarni CTA */}
            {p.ctaBtn2 ? (
              <a
                href={p.pdfUrl || "#"}
                onClick={!p.pdfUrl ? (e) => { e.preventDefault(); setShowContactModal(true); } : undefined}
                target={p.pdfUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                style={{
                  display: "block", width: "100%", padding: "16px 20px",
                  borderRadius: 50, textDecoration: "none",
                  background: "transparent",
                  color: "#fff", border: "1.5px solid rgba(255,255,255,0.18)",
                  fontSize: 15, fontWeight: 600, textAlign: "center",
                  boxSizing: "border-box", cursor: "pointer",
                }}
              >
                {p.ctaBtn2}
              </a>
            ) : (
              <button
                onClick={() => setShowContactModal(true)}
                style={{
                  width: "100%", padding: "16px 20px",
                  borderRadius: 50,
                  background: "transparent",
                  color: "#fff", border: "1.5px solid rgba(255,255,255,0.18)",
                  fontSize: 15, fontWeight: 600, cursor: "pointer",
                }}
              >
                Pošalji poruku
              </button>
            )}
          </div>

          <div style={{
            marginTop: 36, textAlign: "center",
            fontSize: 11, color: `${ACCENT}99`,
            fontWeight: 600, letterSpacing: "0.8px",
          }}>
            PRAVLJENO SA PIKMI.
          </div>
        </div>
      </div>

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
