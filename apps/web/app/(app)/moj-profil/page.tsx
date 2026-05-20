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
}

const DEFAULT_PROFILE: Profile = {
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
};

function Divider() {
  return <div style={{ height: "0.5px", background: "#E4EBE4", margin: "24px 0" }} />;
}

function SectionLabel({ text, color = "#6B6B6B" }: { text: string; color?: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 16 }}>
      {text}
    </div>
  );
}

export default function MojProfil() {
  const [p, setP] = useState<Profile>(DEFAULT_PROFILE);
  const [profileUrl, setProfileUrl] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("first_name, last_name, profile_data, profile_url")
            .eq("user_id", user.id)
            .single();
          if (data) {
            const pd = (data.profile_data as Record<string, any>) || {};
            setP({
              ...DEFAULT_PROFILE,
              ...pd,
              firstName: data.first_name || DEFAULT_PROFILE.firstName,
              lastName: data.last_name || DEFAULT_PROFILE.lastName,
              initials: (data.first_name?.[0] ?? "") + (data.last_name?.[0] ?? "") || DEFAULT_PROFILE.initials,
              csImages: pd.csImages ?? ["", "", "", ""],
              caseStudies: pd.caseStudies ?? DEFAULT_PROFILE.caseStudies,
              pricing: pd.pricing ?? DEFAULT_PROFILE.pricing,
            });
            if (data.profile_url) {
              setProfileUrl(data.profile_url);
              setPreviewUrl(`/${data.profile_url}`);
            } else {
              // Fallback: prvi aktivni pitch link
              const { data: links } = await supabase
                .from("pitch_links")
                .select("slug")
                .eq("user_id", user.id)
                .eq("is_active", true)
                .limit(1);
              if (links?.[0]) setPreviewUrl(`/${links[0].slug}`);
            }
            return;
          }
        }
      } catch {}
      // fallback na localStorage
      try {
        const saved = localStorage.getItem("pikmi-profile");
        if (saved) {
          const loaded = JSON.parse(saved);
          setP({ ...DEFAULT_PROFILE, ...loaded, csImages: loaded.csImages ?? ["", "", "", ""] });
        }
      } catch {}
    }
    loadProfile();
  }, []);

  const stackTags = p.stack.split(",").map(s => s.trim()).filter(Boolean);

  return (
    <div>
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Moj profil</h1>
          <p className="page-subtitle">Ovako te vide klijenti — tvoj javni pikmi profil</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {previewUrl && (
            <Link href={previewUrl} target="_blank" className="btn btn-ghost btn-sm">👁 Pogledaj profil ↗</Link>
          )}
          <Link href="/profile-edit" className="btn btn-primary">✏️ Uredi profil</Link>
        </div>
      </div>

      {/* Upwork-style wrapper */}
      <div className="profile-upwork-wrapper" style={{ background: "#F7F7F5", borderRadius: 16, overflow: "hidden", border: "1px solid #E4EBE4", marginBottom: 48, fontFamily: "'Satoshi', -apple-system, sans-serif" }}>


        {/* Main layout: sidebar + content */}
        <div className="profile-layout" style={{ display: "grid", gridTemplateColumns: "300px 1fr", alignItems: "start" }}>

          {/* ── SIDEBAR ── */}
          <div className="profile-sidebar" style={{ background: "#fff", borderRight: "1px solid #E4EBE4", padding: "32px 28px", position: "sticky", top: 0 }}>

            {/* Avatar */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              {p.avatarUrl
                ? <img src={p.avatarUrl} alt="avatar" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", margin: "0 auto 16px", display: "block", boxShadow: "0 4px 16px rgba(31,87,195,0.25)" }} />
                : <div style={{
                    width: 100, height: 100, borderRadius: "50%",
                    background: "linear-gradient(135deg,#1F57C3,#0D3B8C)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 36, fontWeight: 700, color: "#fff",
                    margin: "0 auto 16px",
                    boxShadow: "0 4px 16px rgba(31,87,195,0.25)",
                  }}>{p.initials}</div>
              }
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1E1E1E", marginBottom: 4 }}>
                {p.firstName} {p.lastName}
              </div>
              <div style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 8 }}>
                📍 {p.city}
              </div>

              {/* Status + badge centrirano */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 20, background: "#F0FAF0", border: "1px solid #B8E6A8" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#14A800", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "#14A800", fontWeight: 600 }}>{p.openStatus}</span>
                </div>
                <div style={{ padding: "5px 10px", background: "#FFEEE0", color: "#D97706", fontSize: 11, fontWeight: 700, borderRadius: 20, border: "1px solid #FCD9A0" }}>
                  ★ TOP RATED
                </div>
                {p.badge && (
                  <div style={{ padding: "5px 10px", background: "#E8F5E3", color: "#14A800", fontSize: 11, fontWeight: 700, borderRadius: 20, border: "1px solid #B8E6A8" }}>
                    {p.badge}
                  </div>
                )}
              </div>

              <button style={{
                width: "100%", padding: "12px", background: "#1F57C3",
                color: "#fff", border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(31,87,195,0.3)",
              }}>
                {p.ctaBtn1}
              </button>
              <button style={{
                width: "100%", padding: "11px", background: "transparent",
                color: "#1F57C3", border: "1.5px solid #1F57C3", borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8,
              }}>
                {p.ctaBtn2}
              </button>
            </div>

            <Divider />

            {/* Rate */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#6B6B6B", letterSpacing: "0.5px", marginBottom: 4 }}>RETAINER CIJENA</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#1E1E1E" }}>
                {p.servicePrice}
                <span style={{ fontSize: 14, fontWeight: 400, color: "#6B6B6B" }}> {p.servicePriceLabel}</span>
              </div>
            </div>

            <Divider />

            {/* Stats */}
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

            {/* Details */}
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

            {/* Footer */}
            <div style={{ textAlign: "center", fontSize: 11, color: "#ADADAD" }}>
              Profil na <a href="https://www.pikmi.today/" target="_blank" rel="noopener noreferrer" style={{ color: "#1F57C3", fontWeight: 600, textDecoration: "none" }}>pikmi.today</a>
            </div>
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="profile-main" style={{ padding: "32px 40px" }}>

            {/* 01 — O meni */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E4EBE4", padding: "28px 32px", marginBottom: 20 }}>
              <SectionLabel text="01 — Šta radim" />
              <h2 style={{ margin: "0 0 16px", fontSize: 24, fontWeight: 700, color: "#1E1E1E", lineHeight: 1.25, letterSpacing: "-0.3px", whiteSpace: "pre-line" }}>
                {p.serviceTitle}
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "#3C3C3C", lineHeight: 1.8 }}>{p.serviceDesc}</p>
            </div>

            {/* 02 — Portfolio */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E4EBE4", padding: "28px 32px", marginBottom: 20 }}>
              <SectionLabel text="02 — Rezultati / Portfolio" />
              <div className="profile-cs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{
                    aspectRatio: "4/3",
                    borderRadius: 10,
                    overflow: "hidden",
                    border: p.csImages[i] ? "1px solid #E4EBE4" : "1.5px dashed #D0D0C8",
                    background: p.csImages[i] ? "transparent" : "#F7F7F5",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
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
            </div>

            {/* 03 — Paketi */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E4EBE4", padding: "28px 32px", marginBottom: 20 }}>
              <SectionLabel text="03 — Paketi i cijene" />
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {p.pricing.map((tier, i) => (
                  <div key={i} className="profile-pricing-row" style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "18px 0",
                    borderBottom: i < p.pricing.length - 1 ? "1px solid #F0F0EB" : "none",
                  }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#1E1E1E", marginBottom: 4 }}>{tier.name}</div>
                      <div style={{ fontSize: 13, color: "#6B6B6B" }}>{tier.desc}</div>
                    </div>
                    <div className="profile-pricing-price" style={{
                      fontSize: 20, fontWeight: 800,
                      color: tier.green ? "#14A800" : "#1F57C3",
                      flexShrink: 0, marginLeft: 24,
                    }}>{tier.price}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 04 — Skills */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E4EBE4", padding: "28px 32px", marginBottom: 20 }}>
              <SectionLabel text="04 — Stack / Vještine" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {stackTags.map((tag, i) => (
                  <span key={i} style={{
                    fontSize: 13, padding: "7px 16px", borderRadius: 20,
                    background: "#F0F4FF", color: "#1F57C3",
                    border: "1px solid #D0DCFF", fontWeight: 500,
                  }}>{tag}</span>
                ))}
              </div>
            </div>

            {/* 06 — Testimonial */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E4EBE4", padding: "28px 32px", marginBottom: 20 }}>
              <SectionLabel text="06 — Recenzija klijenta" />
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#14A800", fontSize: 16 }}>★</span>)}
                <span style={{ fontSize: 13, color: "#6B6B6B", marginLeft: 6, alignSelf: "center" }}>5.0 / 5.0</span>
              </div>
              <p style={{ margin: "0 0 20px", fontSize: 16, color: "#1E1E1E", lineHeight: 1.7, fontStyle: "italic" }}>
                "{p.testimonialQuote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#1F57C3,#0D3B8C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                  {p.testimonialName[0]}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1E1E1E" }}>{p.testimonialName}</div>
                  <div style={{ fontSize: 12, color: "#6B6B6B" }}>{p.testimonialTitle}</div>
                </div>
              </div>
            </div>

            {/* 07 — CTA */}
            <div style={{
              borderRadius: 12, padding: "32px",
              background: "linear-gradient(135deg, #1F57C3 0%, #0D3B8C 100%)",
              border: "none",
            }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "1.5px", marginBottom: 10 }}>07 — KONTAKT</div>
              <h3 style={{ margin: "0 0 20px", fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                {p.ctaTitle} <em style={{ fontStyle: "italic", color: "#93C5FD" }}>{p.ctaHighlight}</em>?
              </h3>
              <div style={{ display: "flex", gap: 12 }}>
                <button style={{ padding: "14px 28px", background: "#fff", color: "#1F57C3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  {p.ctaBtn1}
                </button>
                <button style={{ padding: "14px 28px", background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.35)", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  {p.ctaBtn2}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
