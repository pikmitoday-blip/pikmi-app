"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const professions = [
  "Video editor",
  "Copywriter",
  "Grafički dizajner",
  "Web dizajner",
  "SMM menadžer",
  "Fotograf",
  "Drugo / kombinacija",
];

function generateSlug(firstName: string, lastName: string): string {
  return `${firstName}-${lastName}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")   // ukloni dijakritike (č→c, ć→c, š→s...)
    .replace(/[^a-z0-9-]/g, "-")       // zamijeni sve ostale znakove s -
    .replace(/-+/g, "-")               // ukloni višestruke -
    .replace(/^-|-$/g, "");            // ukloni - s početka i kraja
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    city: "",
    profession: "",
  });
  const [generatedSlug, setGeneratedSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [saving, setSaving] = useState(false);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  // Kad korisnik pređe na korak 3, generiši i provjeri slug
  useEffect(() => {
    if (step === 3 && form.firstName && form.lastName) {
      checkGeneratedSlug();
    }
  }, [step]);

  async function checkGeneratedSlug() {
    setCheckingSlug(true);
    setSlugAvailable(null);
    const base = generateSlug(form.firstName, form.lastName);
    let slug = base;
    let attempt = 0;

    while (attempt < 10) {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("profile_url", slug)
        .maybeSingle();

      if (!data) {
        // Slobodan!
        setGeneratedSlug(slug);
        setSlugAvailable(true);
        break;
      }
      // Zauzet — dodaj broj
      attempt++;
      slug = `${base}${attempt + 1}`;
    }

    setCheckingSlug(false);
  }

  async function finish() {
    if (!generatedSlug) return;
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
          },
        }).eq("user_id", user.id);
      }
      router.push("/profile-edit?setup=true");
    } catch (e) {
      console.error("Onboarding error:", e);
      setSaving(false);
    }
  }

  const steps = ["Osnovno", "Profesija", "Tvoj URL"];

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="page-header" style={{ textAlign: "center" }}>
        <h1 className="page-title">Kreiraj pikmi profil</h1>
        <p className="page-subtitle">Popuni za 2 minuta i pošalji prvi pitch link</p>
      </div>

      {/* Steps */}
      <div className="steps">
        {steps.map((s, i) => {
          const n = i + 1;
          const state = n < step ? "done" : n === step ? "current" : "todo";
          return (
            <div key={s} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : "none" }}>
              <div className="flex items-center gap-2">
                <div className={`step-num ${state}`}>{n < step ? "✓" : n}</div>
                <span className={`step-label ${state === "current" ? "current" : "other"}`}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className={`step-line ${n < step ? "done" : ""}`} />}
            </div>
          );
        })}
      </div>

      <div className="card">
        {/* Korak 1 */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Kako ti se zoveš?</h3>
            <div className="edit-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Ime</label>
                <input className="input" value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Marko" />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Prezime</label>
                <input className="input" value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Jovanović" />
              </div>
            </div>
            <div className="field">
              <label className="label">Grad</label>
              <input className="input" value={form.city} onChange={e => set("city", e.target.value)} placeholder="Npr. Beograd, Srbija" />
            </div>
            <div className="flex justify-between mt-6">
              <div />
              <button
                className="btn btn-primary"
                onClick={() => setStep(2)}
                disabled={!form.firstName || !form.lastName || !form.city}
              >
                Dalje →
              </button>
            </div>
          </div>
        )}

        {/* Korak 2 */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Čime se baviš?</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {professions.map(p => (
                <button
                  key={p}
                  onClick={() => set("profession", p)}
                  style={{
                    padding: "14px 18px", borderRadius: "var(--r)", border: "1px solid",
                    borderColor: form.profession === p ? "rgba(124,58,237,0.6)" : "var(--border)",
                    background: form.profession === p ? "rgba(124,58,237,0.12)" : "var(--card)",
                    color: form.profession === p ? "#A78BFA" : "var(--text2)",
                    cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 500,
                    fontFamily: "inherit", transition: "all 0.15s",
                  }}
                >
                  {form.profession === p && <span style={{ marginRight: 8 }}>✦</span>}{p}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Nazad</button>
              <button className="btn btn-primary" onClick={() => setStep(3)} disabled={!form.profession}>Dalje →</button>
            </div>
          </div>
        )}

        {/* Korak 3 */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Tvoj pikmi URL</h3>
            <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 24 }}>
              Tvoj profil će biti dostupan na sljedećoj adresi:
            </p>

            <div style={{
              padding: "18px 20px", borderRadius: 12, marginBottom: 20,
              background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 20 }}>🔗</span>
              <div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tvoja adresa</div>
                {checkingSlug ? (
                  <div style={{ fontSize: 15, color: "var(--text3)" }}>Generišem URL...</div>
                ) : (
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#A78BFA" }}>
                    pikmi.today/<span style={{ color: "var(--text)" }}>{generatedSlug}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              padding: "12px 16px", borderRadius: 10, marginBottom: 8,
              background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)",
              fontSize: 13, color: "var(--text3)",
            }}>
              🎨 Nakon ovoga popunit ćeš profil koji klijenti vide kada otvore tvoj pitch link.
            </div>

            <div className="flex justify-between mt-4">
              <button className="btn btn-ghost" onClick={() => setStep(2)}>← Nazad</button>
              <button
                className="btn btn-primary"
                onClick={finish}
                disabled={!slugAvailable || checkingSlug || saving}
              >
                {saving ? "Čuvanje..." : "Dalje — popuni profil →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
