"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import PikmiLogo from "../components/PikmiLogo";
import { supabase } from "../../lib/supabase";

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
  pdfUrl: string;
}

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

export default function PublicProfile({ params }: { params: { profileUrl: string } }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pitchLinkId, setPitchLinkId] = useState<string | null>(null);
  const [freelancerEmail, setFreelancerEmail] = useState<string>("");

  useEffect(() => {
    async function loadProfile() {
      const slug = params.profileUrl;

      // 1. Provjeri da li slug odgovara pitch linku
      const { data: pitchLink } = await supabase
        .from("pitch_links")
        .select("id, user_id, is_active, views, title")
        .eq("slug", slug)
        .single();

      let userId: string | null = null;

      if (pitchLink?.is_active) {
        userId = pitchLink.user_id;
        setPitchLinkId(pitchLink.id);

        // Broji pregled
        try {
          const device = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
          const referrer = document.referrer || null;

          await supabase.from("link_views").insert({
            pitch_link_id: pitchLink.id,
            viewed_at: new Date().toISOString(),
            device,
            referrer,
          });
          await supabase.from("pitch_links").update({ views: (pitchLink as any).views + 1 }).eq("id", pitchLink.id);

          // Pošalji email notifikaciju vlasniku
          fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pitchLinkId: pitchLink.id,
              pitchLinkTitle: pitchLink.title || slug,
              ownerUserId: pitchLink.user_id,
              slug,
            }),
          }).catch(() => {});
        } catch {}
      } else {
        // 2. Provjeri da li slug odgovara profile_url
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
        // Korisnik postoji ali nema profile_data — prikaži osnovno
        setProfile({
          csImages: ["", "", "", ""],
          avatarUrl: "",
          firstName: profileData.first_name || "",
          lastName: profileData.last_name || "",
          initials: (profileData.first_name?.[0] ?? "") + (profileData.last_name?.[0] ?? ""),
          city: "", openStatus: "", badge: "",
          metric1Value: "", metric1Label: "", metric2Value: "", metric2Label: "",
          serviceTitle: "", servicePrice: "", servicePriceLabel: "", serviceDesc: "",
          caseStudies: [], pricing: [], stack: "",
          detailCapacity: "", detailResponse: "", detailMinBudget: "", detailLanguages: "",
          testimonialQuote: "", testimonialName: "", testimonialTitle: "",
          ctaTitle: "", ctaHighlight: "", ctaBtn1: "", ctaBtn2: "",
          pdfUrl: "",
        });
      }

      setLoading(false);
    }

    loadProfile();
  }, [params.profileUrl]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F7F5" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "#6B6B6B" }}>Učitavanje profila...</div>
      </div>
    </div>
  );

  if (!profile) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F7F5" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 32 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#1E1E1E" }}>Profil nije pronađen</h1>
        <p style={{ color: "#6B6B6B", marginBottom: 24 }}>Pikmi profil <strong>/{params.profileUrl}</strong> ne postoji ili nije javno dostupan.</p>
        <Link href="/" className="btn btn-primary">← Nazad na pikmi</Link>
      </div>
    </div>
  );

  const p = profile;
  const stackTags = p.stack ? p.stack.split(",").map(s => s.trim()).filter(Boolean) : [];

  // Gmail compose link sa email-om freelancera
  const contactHref = freelancerEmail
    ? `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(freelancerEmail)}&su=${encodeURIComponent(`Strategy poziv — ${p.firstName} ${p.lastName}`)}`
    : undefined;

  return (
    <div style={{ background: "#F7F7F5", minHeight: "100vh", fontFamily: "'Satoshi', -apple-system, sans-serif" }}>
      {/* Mini nav */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E4EBE4" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", fontWeight: 700, fontSize: 16, color: "#1E1E1E" }}>
          <PikmiLogo size={24} />
          pikmi
        </Link>
        <Link href="/register" className="btn btn-primary btn-sm">Kreiraj tvoj profil</Link>
      </div>

      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E4EBE4", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#14A800" }} />
          <span style={{ fontSize: 13, color: "#1E1E1E", fontWeight: 500 }}>{p.openStatus || "DOSTUPAN ZA PROJEKTE"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {p.badge && (
            <div style={{ padding: "4px 12px", background: "#E8F5E3", color: "#14A800", fontSize: 11, fontWeight: 700, borderRadius: 4, border: "1px solid #B8E6A8" }}>
              {p.badge}
            </div>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="profile-layout" style={{ display: "grid", gridTemplateColumns: "300px 1fr", maxWidth: 1100, margin: "0 auto", alignItems: "start" }}>

        {/* Sidebar */}
        <div className="profile-sidebar" style={{ background: "#fff", borderRight: "1px solid #E4EBE4", padding: "32px 28px", position: "sticky", top: 52, minHeight: "calc(100vh - 52px)" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            {p.avatarUrl
              ? <img src={p.avatarUrl} alt="avatar" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", margin: "0 auto 16px", display: "block", boxShadow: "0 4px 16px rgba(31,87,195,0.25)" }} />
              : <div style={{
                  width: 100, height: 100, borderRadius: "50%",
                  background: "linear-gradient(135deg,#1F57C3,#0D3B8C)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 36, fontWeight: 700, color: "#fff",
                  margin: "0 auto 16px", boxShadow: "0 4px 16px rgba(31,87,195,0.25)",
                }}>{p.initials || (p.firstName?.[0] ?? "?")}</div>
            }
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1E1E1E", marginBottom: 4 }}>{p.firstName} {p.lastName}</div>
            {p.city && <div style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 12 }}>📍 {p.city}</div>}
            {p.ctaBtn1 && (
              <a
                href={contactHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={!contactHref ? (e) => e.preventDefault() : undefined}
                style={{ display: "block", width: "100%", padding: "12px", background: "#1F57C3", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: contactHref ? "pointer" : "default", boxShadow: "0 2px 8px rgba(31,87,195,0.3)", marginBottom: 8, textAlign: "center", textDecoration: "none" }}
              >
                {p.ctaBtn1}
              </a>
            )}
            {p.ctaBtn2 && (
              <a
                href={p.pdfUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                onClick={!p.pdfUrl ? (e) => e.preventDefault() : undefined}
                style={{ display: "block", width: "100%", padding: "11px", background: "transparent", color: "#1F57C3", border: "1.5px solid #1F57C3", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: p.pdfUrl ? "pointer" : "default", textAlign: "center", textDecoration: "none" }}
              >
                {p.ctaBtn2}
              </a>
            )}
          </div>

          {p.servicePrice && (<>
            <Divider />
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#6B6B6B", letterSpacing: "0.5px", marginBottom: 4 }}>RETAINER CIJENA</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#1E1E1E" }}>
                {p.servicePrice}
                <span style={{ fontSize: 14, fontWeight: 400, color: "#6B6B6B" }}> {p.servicePriceLabel}</span>
              </div>
            </div>
          </>)}

          {(p.metric1Value || p.metric2Value) && (<>
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
          </>)}

          <Divider />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "⚡", label: "Odgovor", value: p.detailResponse },
              { icon: "👥", label: "Kapacitet", value: p.detailCapacity },
              { icon: "💰", label: "Min budget", value: p.detailMinBudget },
              { icon: "🌐", label: "Jezici", value: p.detailLanguages },
            ].filter(d => d.value).map((d, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#6B6B6B" }}>{d.icon} {d.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1E1E1E" }}>{d.value}</span>
              </div>
            ))}
          </div>

          <Divider />
          <div style={{ textAlign: "center", fontSize: 11, color: "#ADADAD" }}>
            Profil na <Link href="/" style={{ color: "#1F57C3", fontWeight: 600, textDecoration: "none" }}>pikmi.app</Link>
          </div>
        </div>

        {/* Main content */}
        <div className="profile-main" style={{ padding: "32px 40px" }}>

          {p.serviceTitle && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E4EBE4", padding: "28px 32px", marginBottom: 20 }}>
              <SectionLabel text="01 — Šta radim" />
              <h2 style={{ margin: "0 0 16px", fontSize: 24, fontWeight: 700, color: "#1E1E1E", lineHeight: 1.25, whiteSpace: "pre-line" }}>{p.serviceTitle}</h2>
              {p.serviceDesc && <p style={{ margin: 0, fontSize: 15, color: "#3C3C3C", lineHeight: 1.8 }}>{p.serviceDesc}</p>}
            </div>
          )}

          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E4EBE4", padding: "28px 32px", marginBottom: 20 }}>
            <SectionLabel text="02 — Rezultati / Portfolio" />
            <div className="profile-cs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ aspectRatio: "4/3", borderRadius: 10, overflow: "hidden", border: p.csImages?.[i] ? "1px solid #E4EBE4" : "1.5px dashed #D0D0C8", background: p.csImages?.[i] ? "transparent" : "#F7F7F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {p.csImages?.[i]
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

          {p.pricing?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E4EBE4", padding: "28px 32px", marginBottom: 20 }}>
              <SectionLabel text="03 — Paketi i cijene" />
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
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
            </div>
          )}

          {stackTags.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E4EBE4", padding: "28px 32px", marginBottom: 20 }}>
              <SectionLabel text="04 — Stack / Vještine" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {stackTags.map((tag, i) => (
                  <span key={i} style={{ fontSize: 13, padding: "7px 16px", borderRadius: 20, background: "#F0F4FF", color: "#1F57C3", border: "1px solid #D0DCFF", fontWeight: 500 }}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {p.testimonialQuote && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E4EBE4", padding: "28px 32px", marginBottom: 20 }}>
              <SectionLabel text="06 — Recenzija klijenta" />
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#14A800", fontSize: 16 }}>★</span>)}
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
            </div>
          )}

          {p.ctaTitle && (
            <div style={{ borderRadius: 12, padding: "32px", background: "linear-gradient(135deg, #1F57C3 0%, #0D3B8C 100%)" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "1.5px", marginBottom: 10 }}>07 — KONTAKT</div>
              <h3 style={{ margin: "0 0 20px", fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                {p.ctaTitle} <em style={{ fontStyle: "italic", color: "#93C5FD" }}>{p.ctaHighlight}</em>?
              </h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {p.ctaBtn1 && (
                  <a
                    href={contactHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={!contactHref ? (e) => e.preventDefault() : undefined}
                    style={{ padding: "14px 28px", background: "#fff", color: "#1F57C3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: contactHref ? "pointer" : "default", textDecoration: "none" }}
                  >
                    {p.ctaBtn1}
                  </a>
                )}
                {p.ctaBtn2 && (
                  <a
                    href={p.pdfUrl || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={!p.pdfUrl ? (e) => e.preventDefault() : undefined}
                    style={{ padding: "14px 28px", background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.35)", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: p.pdfUrl ? "pointer" : "default", textDecoration: "none" }}
                  >
                    {p.ctaBtn2}
                  </a>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
