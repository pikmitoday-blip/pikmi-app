"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { pixel } from "../../../lib/pixel";
import { uploadFile } from "../../../lib/upload";

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateSlug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

const TOTAL_STEPS = 8;

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

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

  // ── Per-step data ─────────────────────────────────────────────────────────
  // Step 1: portfolio title + desc
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");

  // Step 2: pricing packages
  const [pricing, setPricing] = useState<{ name: string; price: string; desc: string }[]>([
    { name: "", price: "", desc: "" },
  ]);

  // Step 3: portfolio files (upload)
  const [portfolioFiles, setPortfolioFiles] = useState<{ url: string; name: string; type: "image" | "video" | "document" }[]>([]);

  // Step 4: skills/tools
  const [stack, setStack] = useState("");

  // Step 5: previous clients
  const [clients, setClients] = useState<{ name: string; service: string; desc: string }[]>([
    { name: "", service: "", desc: "" },
  ]);

  // Step 6: testimonials
  const [testimonials, setTestimonials] = useState<{ name: string; quote: string; title: string }[]>([
    { name: "", quote: "", title: "" },
  ]);

  // Step 7: CTA
  const [ctaTitle, setCtaTitle] = useState("");
  const [ctaHighlight, setCtaHighlight] = useState("");

  // Step 8: contact + URL
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");

  // Load user info on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setContactEmail(session.user.email ?? "");
      }
    });
  }, []);

  // Slug check
  useEffect(() => {
    if (!profileUrl) { setSlugStatus("idle"); return; }
    setSlugStatus("checking");
    const t = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id").eq("profile_url", profileUrl).maybeSingle();
      setSlugStatus(data ? "taken" : "ok");
    }, 500);
    return () => clearTimeout(t);
  }, [profileUrl]);

  // ── File upload ────────────────────────────────────────────────────────────
  async function uploadPortfolioFile(file: File) {
    if (!userId) return;
    setUploadingFile(true);
    try {
      const publicUrl = await uploadFile(file, { folder: userId, filename: `portfolio-${Date.now()}.${file.name.split(".").pop()?.toLowerCase() ?? "bin"}` });
      const type: "image" | "video" | "document" = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "document";
      setPortfolioFiles(prev => [...prev, { url: publicUrl, name: file.name, type }]);
    } catch {}
    setUploadingFile(false);
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const canNext: Record<number, boolean> = {
    1: !!serviceTitle.trim(),
    2: pricing.some(p => p.name.trim() && p.price.trim()),
    3: true, // optional
    4: !!stack.trim(),
    5: clients.some(c => c.name.trim()),
    6: true, // optional
    7: !!ctaTitle.trim(),
    8: !!profileUrl && slugStatus === "ok" && !!contactEmail.trim(),
  };

  // ── Save & finish ─────────────────────────────────────────────────────────
  async function finish() {
    if (!canNext[8] || !userId) return;
    setSaving(true);
    try {
      // Build caseStudies from clients
      const caseStudies = clients.filter(c => c.name.trim()).map(c => ({
        client: c.name, platform: c.service, industry: c.desc, metric: "", metricLabel: "", bg: "", lightText: true,
      }));
      // Build testimonials (filter empty)
      const testiList = testimonials.filter(t => t.name.trim() && t.quote.trim());
      // Build pricing (filter empty)
      const pricingList = pricing.filter(p => p.name.trim() && p.price.trim());

      await supabase.from("profiles").update({
        profile_url: profileUrl,
        profile_data: {
          serviceTitle, serviceDesc,
          pricing: pricingList,
          portfolioFiles,
          stack,
          caseStudies,
          testimonials: testiList,
          ctaTitle, ctaHighlight,
          contactEmail, contactPhone,
          // Keep these from existing data
          openStatus: "OTVOREN ZA SARADNJU",
        },
      }).eq("user_id", userId);

      try {
        sessionStorage.removeItem("pikmi-sidebar");
        sessionStorage.removeItem("pikmi-dashboard");
        sessionStorage.removeItem("pikmi-moj-profil");
      } catch {}

      // Meta Pixel: korisnik završio onboarding → počinje trial
      pixel.startTrial();
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const stepTitles = [
    "Čime se baviš?",
    "Tvoji cenovni paketi",
    "Prethodni radovi",
    "Veštine i alati",
    "Prethodni klijenti",
    "Testimoniali klijenata",
    "Poziv na akciju",
    "Kontakt i portfolio link",
  ];
  const stepSubtitles = [
    "Napiši naslov i opis svog portfolia.",
    "Dodaj 1–3 paketa sa cenama.",
    "Dodaj slike, videe ili dokumente svojih radova. (Možeš preskočiti)",
    "Nabroji veštine i alate koje koristiš, odvojeno zarezima.",
    "Navedi klijente sa kojima si radio.",
    "Dodaj recenzije zadovoljnih klijenata.",
    "Napiši poziv na akciju koji će biti na kraju tvog portfolia.",
    "Kako te klijenti mogu kontaktirati i gde će biti tvoj portfolio.",
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

          {/* ── STEP 1: Portfolio title + desc ── */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <label style={LBL}>Naslov portfolia *</label>
                <input style={INP} value={serviceTitle} onChange={e => setServiceTitle(e.target.value)}
                  placeholder="npr. Meta & TikTok Ads za e-commerce brendove" autoFocus />
                <p style={HINT}>Jedna rečenica koja opisuje čime se baviš i za koga.</p>
              </div>
              <div>
                <label style={LBL}>Opis usluge</label>
                <textarea value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} rows={4}
                  placeholder="npr. Skaliram performance kampanje za D2C brendove na Balkanu i u EU. Specijalizujem se za kreativnu optimizaciju i full-funnel strategiju."
                  style={{ ...INP, resize: "none" } as React.CSSProperties} />
                <p style={HINT}>Kratki opis šta radiš, za koga i kako pomažeš klijentima.</p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Pricing ── */}
          {step === 2 && (
            <div>
              <p style={{ ...HINT, marginBottom: 16 }}>Ako imaš pakete usluga, dodaj ih. Možeš dodati 1–3 paketa.</p>
              {pricing.map((p, i) => (
                <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Paket {i + 1}</span>
                    {pricing.length > 1 && (
                      <button onClick={() => setPricing(prev => prev.filter((_, j) => j !== i))}
                        style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: 11, cursor: "pointer" }}>
                        Ukloni
                      </button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                    <div>
                      <label style={LBL}>Naziv paketa</label>
                      <input style={INP} value={p.name} onChange={e => setPricing(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Starter" />
                    </div>
                    <div>
                      <label style={LBL}>Cena</label>
                      <input style={INP} value={p.price} onChange={e => setPricing(prev => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} placeholder="€500" />
                    </div>
                  </div>
                  <div>
                    <label style={LBL}>Šta je uključeno</label>
                    <input style={INP} value={p.desc} onChange={e => setPricing(prev => prev.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))} placeholder="Audit + strategija + 30-dnevni plan" />
                  </div>
                </div>
              ))}
              {pricing.length < 3 && (
                <button onClick={() => setPricing(prev => [...prev, { name: "", price: "", desc: "" }])}
                  style={{ width: "100%", padding: "11px", borderRadius: 10, background: "rgba(139,92,246,0.08)", border: "1px dashed rgba(139,92,246,0.3)", color: "#A855F7", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  + Dodaj paket {pricing.length + 1}
                </button>
              )}
            </div>
          )}

          {/* ── STEP 3: Portfolio files (optional) ── */}
          {step === 3 && (
            <div>
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.15)", marginBottom: 16, display: "flex", gap: 10 }}>
                <span>💡</span>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>Ovaj korak je opcionalan. Možeš preskočiti i dodati radove kasnije iz "Moj profil" sekcije.</p>
              </div>
              {portfolioFiles.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10, marginBottom: 14 }}>
                  {portfolioFiles.map((f, i) => (
                    <div key={i} style={{ borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", position: "relative" }}>
                      {f.type === "image" && <img src={f.url} alt={f.name} style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />}
                      {f.type === "video" && <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🎬</div>}
                      {f.type === "document" && <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📄</div>}
                      <div style={{ padding: "5px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                        <button onClick={() => setPortfolioFiles(prev => prev.filter((_, j) => j !== i))}
                          style={{ background: "none", border: "none", color: "#F87171", cursor: "pointer", fontSize: 14, padding: 0, flexShrink: 0 }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <label style={{ display: "block", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "16px", borderRadius: 12, border: "2px dashed rgba(139,92,246,0.25)", background: "rgba(139,92,246,0.04)", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600 }}>
                  {uploadingFile ? "⏳ Otpremam..." : <><span style={{ fontSize: 20 }}>+</span> Dodaj sliku, video ili dokument</>}
                </div>
                <input type="file" accept="image/*,video/*,application/pdf,.pdf" style={{ display: "none" }} disabled={uploadingFile}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadPortfolioFile(f); e.target.value = ""; }} />
              </label>
              <p style={{ ...HINT, marginTop: 10 }}>PNG, JPG, MP4, MOV, PDF · Možeš dodati više fajlova</p>
            </div>
          )}

          {/* ── STEP 4: Skills ── */}
          {step === 4 && (
            <div>
              <label style={LBL}>Veštine i alati *</label>
              <textarea value={stack} onChange={e => setStack(e.target.value)} rows={4}
                placeholder="npr. Meta Ads, TikTok Ads, Google Ads, Notion, Figma, Canva, Photoshop"
                style={{ ...INP, resize: "none" } as React.CSSProperties} />
              <p style={HINT}>Odvoji svaku veštinu ili alat zarezom. Ovo se prikazuje na tvom portfoliu.</p>
            </div>
          )}

          {/* ── STEP 5: Previous clients ── */}
          {step === 5 && (
            <div>
              <p style={{ ...HINT, marginBottom: 14 }}>Navedi klijente sa kojima si radio. Ovi podaci popunjavaju sekciju "Radovi" na tvom portfoliu.</p>
              {clients.map((c, i) => (
                <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Klijent {i + 1}</span>
                    {clients.length > 1 && (
                      <button onClick={() => setClients(prev => prev.filter((_, j) => j !== i))}
                        style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: 11, cursor: "pointer" }}>
                        Ukloni
                      </button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                    <div>
                      <label style={LBL}>Naziv klijenta</label>
                      <input style={INP} value={c.name} onChange={e => setClients(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Coca-Cola" />
                    </div>
                    <div>
                      <label style={LBL}>Usluga</label>
                      <input style={INP} value={c.service} onChange={e => setClients(prev => prev.map((x, j) => j === i ? { ...x, service: e.target.value } : x))} placeholder="Meta Ads" />
                    </div>
                  </div>
                  <div>
                    <label style={LBL}>Opis (opciono)</label>
                    <input style={INP} value={c.desc} onChange={e => setClients(prev => prev.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))} placeholder="Povećanje ROAS-a za 4× za 3 meseca" />
                  </div>
                </div>
              ))}
              <button onClick={() => setClients(prev => [...prev, { name: "", service: "", desc: "" }])}
                style={{ width: "100%", padding: "11px", borderRadius: 10, background: "rgba(139,92,246,0.08)", border: "1px dashed rgba(139,92,246,0.3)", color: "#A855F7", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                + Dodaj klijenta
              </button>
            </div>
          )}

          {/* ── STEP 6: Testimonials ── */}
          {step === 6 && (
            <div>
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.15)", marginBottom: 14, display: "flex", gap: 10 }}>
                <span>💡</span>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>Opcionalno. Možeš dodati do 5 recenzija klijenata.</p>
              </div>
              {testimonials.map((t, i) => (
                <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Recenzija {i + 1}</span>
                    {testimonials.length > 1 && (
                      <button onClick={() => setTestimonials(prev => prev.filter((_, j) => j !== i))}
                        style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: 11, cursor: "pointer" }}>
                        Ukloni
                      </button>
                    )}
                  </div>
                  <div>
                    <label style={LBL}>Citat klijenta</label>
                    <textarea value={t.quote} onChange={e => setTestimonials(prev => prev.map((x, j) => j === i ? { ...x, quote: e.target.value } : x))} rows={3}
                      placeholder='"Odlična saradnja, povećao nam je ROAS za 4× za samo 3 meseca!"'
                      style={{ ...INP, resize: "none", marginBottom: 8 } as React.CSSProperties} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={LBL}>Ime klijenta</label>
                      <input style={INP} value={t.name} onChange={e => setTestimonials(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Ana Lukić" />
                    </div>
                    <div>
                      <label style={LBL}>Pozicija / Kompanija</label>
                      <input style={INP} value={t.title} onChange={e => setTestimonials(prev => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="CEO, Lumea Beauty" />
                    </div>
                  </div>
                </div>
              ))}
              {testimonials.length < 5 && (
                <button onClick={() => setTestimonials(prev => [...prev, { name: "", quote: "", title: "" }])}
                  style={{ width: "100%", padding: "11px", borderRadius: 10, background: "rgba(139,92,246,0.08)", border: "1px dashed rgba(139,92,246,0.3)", color: "#A855F7", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  + Dodaj recenziju
                </button>
              )}
            </div>
          )}

          {/* ── STEP 7: CTA ── */}
          {step === 7 && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <label style={LBL}>Poziv na akciju *</label>
                <input style={INP} value={ctaTitle} onChange={e => setCtaTitle(e.target.value)}
                  placeholder="npr. Da napravimo" autoFocus />
                <p style={HINT}>Prva rečenica poziva — prikazuje se velikim tekstom na kraju portfolia.</p>
              </div>
              <div>
                <label style={LBL}>Istaknuta reč (ljubičasto)</label>
                <input style={INP} value={ctaHighlight} onChange={e => setCtaHighlight(e.target.value)} placeholder="npr. tvoj sledeći hit" />
                <p style={HINT}>Ova reč/fraza će biti istaknuta ljubičastom bojom.</p>
              </div>
              {(ctaTitle || ctaHighlight) && (
                <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Pregled:</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff" }}>
                    {ctaTitle} <span style={{ color: "#A855F7" }}>{ctaHighlight}</span>?
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 8: Contact + URL ── */}
          {step === 8 && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <label style={LBL}>Email adresa *</label>
                <input style={INP} value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="tvoj@email.com" type="email" />
                <p style={HINT}>Prikazuje se na portfoliu kao dugme za kopiranje.</p>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={LBL}>Broj telefona</label>
                <input style={INP} value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+381 60 000 0000" />
              </div>
              <div>
                <label style={LBL}>Tvoj portfolio URL *</label>
                <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <div style={{ padding: "13px 12px", background: "rgba(139,92,246,0.1)", fontSize: 13, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", borderRight: "1px solid rgba(139,92,246,0.15)" }}>
                    pikmi.today/
                  </div>
                  <input style={{ ...INP, border: "none", borderRadius: 0, flex: 1 }}
                    value={profileUrl}
                    onChange={e => setProfileUrl(generateSlug(e.target.value))}
                    placeholder="tvoje-ime" />
                </div>
                <p style={{ ...HINT, marginTop: 6, color: slugStatus === "ok" ? "#4ADE80" : slugStatus === "taken" ? "#F87171" : slugStatus === "checking" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.3)" }}>
                  {slugStatus === "ok" && "✓ URL je slobodan!"}
                  {slugStatus === "taken" && "✗ Ovaj URL je već zauzet — pokušaj drugi."}
                  {slugStatus === "checking" && "Proveravam dostupnost..."}
                  {slugStatus === "idle" && "Ovaj URL možeš promeniti kasnije u podešavanjima."}
                </p>
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 26 }}>
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} style={{ padding: "11px 20px", borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                ← Nazad
              </button>
            ) : <div />}

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {/* Skip button for optional steps */}
              {(step === 3 || step === 6) && (
                <button onClick={() => setStep(s => s + 1)} style={{ padding: "11px 18px", borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  Preskoči
                </button>
              )}

              {step < TOTAL_STEPS ? (
                <button onClick={() => setStep(s => s + 1)} disabled={!canNext[step]} style={{
                  padding: "12px 28px", borderRadius: 12, border: "none",
                  background: canNext[step] ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(255,255,255,0.06)",
                  color: canNext[step] ? "#fff" : "rgba(255,255,255,0.2)",
                  fontSize: 14, fontWeight: 700, cursor: canNext[step] ? "pointer" : "not-allowed",
                  fontFamily: "inherit", boxShadow: canNext[step] ? "0 4px 20px rgba(124,58,237,0.4)" : "none",
                  transition: "all 0.2s",
                }}>
                  Dalje →
                </button>
              ) : (
                <button onClick={finish} disabled={!canNext[8] || saving} style={{
                  padding: "12px 28px", borderRadius: 12, border: "none",
                  background: (canNext[8] && !saving) ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(255,255,255,0.06)",
                  color: (canNext[8] && !saving) ? "#fff" : "rgba(255,255,255,0.2)",
                  fontSize: 14, fontWeight: 700,
                  cursor: (canNext[8] && !saving) ? "pointer" : "not-allowed",
                  fontFamily: "inherit", boxShadow: (canNext[8] && !saving) ? "0 4px 20px rgba(124,58,237,0.4)" : "none",
                  transition: "all 0.2s",
                }}>
                  {saving ? "Čuvanje..." : "Završi i otvori profil →"}
                </button>
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
