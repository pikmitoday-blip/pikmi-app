"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

function generateSlug(firstName: string, lastName: string): string {
  return `${firstName}-${lastName}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const TOTAL_STEPS = 4;

const PROFESSION_OPTIONS = [
  "Video editor", "Copywriter", "Grafički dizajner", "Web dizajner",
  "SMM menadžer", "Fotograf", "UX/UI dizajner", "Motion dizajner",
  "Performance marketer", "Brend strateg", "Drugo",
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [generatedSlug, setGeneratedSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const [form, setForm] = useState({
    firstName: "", lastName: "", city: "",
    profession: "", serviceTitle: "",
    servicePrice: "", serviceDesc: "",
  });

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  // Auto-generisi slug kad udjemo na korak 4
  useEffect(() => {
    if (step === 4 && form.firstName && form.lastName) {
      generateAndCheckSlug();
    }
  }, [step]);

  async function generateAndCheckSlug() {
    setCheckingSlug(true);
    setSlugAvailable(null);
    const base = generateSlug(form.firstName, form.lastName);
    let slug = base;
    let attempt = 0;
    while (attempt < 10) {
      const { data } = await supabase.from("profiles").select("id").eq("profile_url", slug).maybeSingle();
      if (!data) { setGeneratedSlug(slug); setSlugAvailable(true); break; }
      attempt++;
      slug = `${base}${attempt + 1}`;
    }
    setCheckingSlug(false);
  }

  function goNext() {
    setDirection("forward");
    setStep(s => s + 1);
  }
  function goBack() {
    setDirection("back");
    setStep(s => s - 1);
  }

  async function finish() {
    if (!generatedSlug || !slugAvailable) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const initials = (form.firstName[0] ?? "").toUpperCase() + (form.lastName[0] ?? "").toUpperCase();
        await supabase.from("profiles").update({
          first_name: form.firstName,
          last_name: form.lastName,
          profile_url: generatedSlug,
          profile_data: {
            firstName: form.firstName,
            lastName: form.lastName,
            initials,
            city: form.city,
            openStatus: "OTVOREN ZA SARADNJU",
            serviceTitle: form.serviceTitle || form.profession,
            servicePrice: form.servicePrice,
            serviceDesc: form.serviceDesc,
          },
        }).eq("user_id", user.id);
        // Čisti cache
        try {
          sessionStorage.removeItem("pikmi-sidebar");
          sessionStorage.removeItem("pikmi-dashboard");
        } catch {}
      }
      router.push("/dashboard");
    } catch (e) {
      console.error("Onboarding error:", e);
      setSaving(false);
    }
  }

  // ── Validacija po koraku ───────────────────────────────────────────────────
  const canNext: Record<number, boolean> = {
    1: !!(form.firstName.trim() && form.lastName.trim() && form.city.trim()),
    2: !!(form.profession),
    3: !!(form.serviceTitle.trim() && form.servicePrice.trim()),
    4: !!(slugAvailable && !checkingSlug),
  };

  const stepTitles = ["Ko si ti?", "Čime se baviš?", "Tvoje usluge", "Tvoj URL"];
  const stepSubtitles = [
    "Popuni osnovne informacije o sebi.",
    "Odaberi svoju profesiju.",
    "Reci klijentima šta nudaš i po kojoj ceni.",
    "Klijenti te pronalaze na ovoj adresi.",
  ];

  // ── INP style ─────────────────────────────────────────────────────────────
  const INP: React.CSSProperties = {
    width: "100%", padding: "14px 16px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(139,92,246,0.2)",
    borderRadius: 12, color: "#fff",
    fontSize: 15, fontFamily: "inherit", outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };
  const LBL: React.CSSProperties = {
    display: "block", marginBottom: 8,
    fontSize: 12, fontWeight: 600,
    color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0B0F19 0%, #0F0B1F 50%, #0B0F19 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 24, fontWeight: 800, background: "linear-gradient(135deg,#A855F7,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            pikmi
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
              Korak {step} od {TOTAL_STEPS}
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              {Math.round((step / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 999,
              background: "linear-gradient(90deg, #7C3AED, #A855F7)",
              width: `${(step / TOTAL_STEPS) * 100}%`,
              transition: "width 0.4s cubic-bezier(0.16,1,0.3,1)",
            }} />
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(139,92,246,0.15)",
          borderRadius: 24,
          padding: "36px 32px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
        }}>
          {/* Step header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg,#7C3AED,#A855F7)",
              fontSize: 14, fontWeight: 800, color: "#fff",
              marginBottom: 16,
            }}>{step}</div>
            <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
              {stepTitles[step - 1]}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
              {stepSubtitles[step - 1]}
            </p>
          </div>

          {/* ── Korak 1: Ime, prezime, grad ── */}
          {step === 1 && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={LBL}>Ime *</label>
                  <input style={INP} value={form.firstName} onChange={e => set("firstName", e.target.value)}
                    placeholder="Marko" autoFocus />
                </div>
                <div>
                  <label style={LBL}>Prezime *</label>
                  <input style={INP} value={form.lastName} onChange={e => set("lastName", e.target.value)}
                    placeholder="Jovanović" />
                </div>
              </div>
              <div>
                <label style={LBL}>Grad *</label>
                <input style={INP} value={form.city} onChange={e => set("city", e.target.value)}
                  placeholder="Beograd, Srbija" />
              </div>
            </div>
          )}

          {/* ── Korak 2: Profesija ── */}
          {step === 2 && (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {PROFESSION_OPTIONS.map(p => (
                  <button key={p} onClick={() => set("profession", p)} style={{
                    padding: "13px 16px", borderRadius: 12,
                    border: `1px solid ${form.profession === p ? "rgba(168,85,247,0.6)" : "rgba(255,255,255,0.08)"}`,
                    background: form.profession === p ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                    color: form.profession === p ? "#C084FC" : "rgba(255,255,255,0.6)",
                    cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: form.profession === p ? 600 : 400,
                    fontFamily: "inherit", transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    {form.profession === p && <span style={{ color: "#A855F7", fontSize: 12 }}>✦</span>}
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Korak 3: Usluge ── */}
          {step === 3 && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <label style={LBL}>Naslov tvoje usluge *</label>
                <input style={INP} value={form.serviceTitle} onChange={e => set("serviceTitle", e.target.value)}
                  placeholder={`npr. ${form.profession || "Video editing"} za brendove`} autoFocus />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={LBL}>Tvoja cena / rate *</label>
                <input style={INP} value={form.servicePrice} onChange={e => set("servicePrice", e.target.value)}
                  placeholder="npr. €500, od €200/projekat, 990 din/mes" />
              </div>
              <div>
                <label style={LBL}>Kratki opis <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>(opciono)</span></label>
                <textarea
                  value={form.serviceDesc}
                  onChange={e => set("serviceDesc", e.target.value)}
                  placeholder="Šta radiš i za koga — u 2 rečenice..."
                  rows={3}
                  style={{ ...INP, resize: "none" } as React.CSSProperties}
                />
              </div>
            </div>
          )}

          {/* ── Korak 4: URL ── */}
          {step === 4 && (
            <div>
              <div style={{
                padding: "20px", borderRadius: 14, marginBottom: 20,
                background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
              }}>
                {checkingSlug ? (
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Generišem URL...</p>
                ) : slugAvailable ? (
                  <>
                    <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Tvoja adresa
                    </p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>pikmi.today/</span>
                      <span style={{ color: "#C084FC" }}>{generatedSlug}</span>
                    </p>
                  </>
                ) : (
                  <p style={{ margin: 0, color: "#F87171", fontSize: 14 }}>Greška pri generisanju URL-a</p>
                )}
              </div>

              <div style={{
                padding: "14px 16px", borderRadius: 12,
                background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>🎉</span>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "#4ADE80" }}>Profil je spreman!</p>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                    Klikni Završi da uđeš na dashboard. Ostale detalje možeš popuniti kasnije u sekciji "Moj profil".
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Navigacija ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
            {step > 1 ? (
              <button onClick={goBack} style={{
                padding: "12px 20px", borderRadius: 12,
                background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>← Nazad</button>
            ) : <div />}

            {step < TOTAL_STEPS ? (
              <button onClick={goNext} disabled={!canNext[step]} style={{
                padding: "13px 28px", borderRadius: 12, border: "none",
                background: canNext[step] ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(255,255,255,0.06)",
                color: canNext[step] ? "#fff" : "rgba(255,255,255,0.25)",
                fontSize: 14, fontWeight: 700, cursor: canNext[step] ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                boxShadow: canNext[step] ? "0 4px 20px rgba(124,58,237,0.4)" : "none",
                transition: "all 0.2s",
              }}>
                Dalje →
              </button>
            ) : (
              <button onClick={finish} disabled={!canNext[4] || saving} style={{
                padding: "13px 28px", borderRadius: 12, border: "none",
                background: (canNext[4] && !saving) ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(255,255,255,0.06)",
                color: (canNext[4] && !saving) ? "#fff" : "rgba(255,255,255,0.25)",
                fontSize: 14, fontWeight: 700,
                cursor: (canNext[4] && !saving) ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                boxShadow: (canNext[4] && !saving) ? "0 4px 20px rgba(124,58,237,0.4)" : "none",
                transition: "all 0.2s",
              }}>
                {saving ? "Čuvanje..." : "Završi →"}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
          Možeš sve promeniti kasnije u podešavanjima profila.
        </p>

      </div>
    </div>
  );
}
