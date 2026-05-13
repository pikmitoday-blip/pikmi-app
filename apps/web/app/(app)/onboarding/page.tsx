"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const professions = ["Video editor", "Copywriter", "Grafički dizajner", "Web dizajner", "SMM menadžer", "Fotograf", "Drugo / kombinacija"];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", city: "", profession: "", profileUrl: "", language: "SR" });
  const [checking, setChecking] = useState(false);
  const [urlStatus, setUrlStatus] = useState<any>(null);
  const [done, setDone] = useState(false);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function checkUrl() {
    if (!form.profileUrl) return;
    setChecking(true);
    try {
      const r = await fetch(`http://localhost:4000/api/onboarding/check-url/${form.profileUrl}`);
      setUrlStatus(await r.json());
    } catch { setUrlStatus({ available: true }); }
    setChecking(false);
  }

  async function finish() {
    setChecking(true);
    try {
      await fetch("http://localhost:4000/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch { /* ignore */ }
    setChecking(false);
  }

  const steps = ["Osnovno", "Profesija", "Tvoj URL"];

  if (done) return (
    <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center", paddingTop: 80 }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
      <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Profil kreiran!</h2>
      <p style={{ color: "var(--text2)" }}>Preusmeravanje na dashboard...</p>
    </div>
  );

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
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Kako ti se zoveš?</h3>
            <div className="field">
              <label className="label">Ime i prezime</label>
              <input className="input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Npr. Marko Jovanović" />
            </div>
            <div className="field">
              <label className="label">Grad</label>
              <input className="input" value={form.city} onChange={e => set("city", e.target.value)} placeholder="Npr. Beograd" />
            </div>
            <div className="flex justify-between mt-6">
              <div />
              <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!form.name || !form.city}>Dalje →</button>
            </div>
          </div>
        )}

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

        {step === 3 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Tvoj pikmi URL</h3>
            <div className="field">
              <label className="label">Izaberi korisničko ime</label>
              <div className="flex items-center" style={{ gap: 0 }}>
                <span style={{ padding: "11px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRight: "none", borderRadius: "var(--r) 0 0 var(--r)", fontSize: 14, color: "var(--text3)", whiteSpace: "nowrap" }}>
                  pikmi.app/
                </span>
                <input
                  className="input" style={{ borderRadius: "0 var(--r) var(--r) 0" }}
                  value={form.profileUrl} placeholder="marko"
                  onChange={e => { set("profileUrl", e.target.value.toLowerCase().replace(/\s/g, "-")); setUrlStatus(null); }}
                  onBlur={checkUrl}
                />
              </div>
              {checking && <div className="text-xs text-muted mt-2">Proveravam dostupnost...</div>}
              {urlStatus && (
                <div className={`mt-2 text-sm ${urlStatus.available ? "success-msg" : "error-msg"}`}>
                  {urlStatus.available ? "✓ URL je slobodan!" : `✗ Zauzet. Predlozi: ${urlStatus.suggestions?.join(", ")}`}
                </div>
              )}
            </div>
            <div className="field">
              <label className="label">Jezik profila</label>
              <select className="input" value={form.language} onChange={e => set("language", e.target.value)}>
                <option value="SR">🇷🇸 Srpski</option>
                <option value="EN">🇬🇧 Engleski</option>
              </select>
            </div>
            <div className="flex justify-between mt-6">
              <button className="btn btn-ghost" onClick={() => setStep(2)}>← Nazad</button>
              <button className="btn btn-primary" onClick={finish} disabled={!form.profileUrl || checking || (urlStatus && !urlStatus.available)}>
                {checking ? "Kreiranje..." : "Završi ✦"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
