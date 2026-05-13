"use client";
import { useState } from "react";

export default function PitchLink() {
  const [form, setForm] = useState({ userId: "1", clientName: "", slug: "", message: "", filters: "" });
  const [status, setStatus] = useState<"idle"|"loading"|"ok"|"err">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [links, setLinks] = useState<any[]>([]);
  const [copied, setCopied] = useState<string|null>(null);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  async function create() {
    if (!form.clientName || !form.slug) return;
    setStatus("loading");
    setErrMsg("");
    try {
      const r = await fetch("http://localhost:4000/api/pitch-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        const data = await r.json();
        const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
        setLinks(prev => [{ ...form, id: Date.now(), url: `${base}/${data.slug || form.slug}` }, ...prev]);
        setForm({ userId: "1", clientName: "", slug: "", message: "", filters: "" });
        setStatus("ok");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        const body = await r.json().catch(() => ({}));
        setErrMsg(body.error || "Greška na serveru.");
        setStatus("err");
      }
    } catch {
      setErrMsg("API server nije dostupan. Provjeri da li radi na portu 4000.");
      setStatus("err");
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pitch linkovi</h1>
        <p className="page-subtitle">Kreiraj personalizovane linkove za svakog klijenta</p>
      </div>

      <div className="grid-2" style={{ gap: 32, alignItems: "start" }}>
        {/* Form */}
        <div className="card">
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 24 }}>Novi pitch link</h2>

          <div className="field">
            <label className="label">Ime klijenta *</label>
            <input className="input" value={form.clientName} placeholder="Npr. Coca-Cola d.o.o."
              onChange={e => { set("clientName", e.target.value); if (!form.slug) set("slug", autoSlug(e.target.value)); }} />
          </div>
          <div className="field">
            <label className="label">Slug (URL) *</label>
            <div className="flex items-center">
              <span style={{ padding: "11px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRight: "none", borderRadius: "var(--r) 0 0 var(--r)", fontSize: 13, color: "var(--text3)", whiteSpace: "nowrap" }}>
                pikmi.app/
              </span>
              <input className="input" style={{ borderRadius: "0 var(--r) var(--r) 0" }}
                value={form.slug} placeholder="coca-cola"
                onChange={e => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
            </div>
          </div>
          <div className="field">
            <label className="label">Personalizovana poruka</label>
            <textarea className="input" value={form.message} placeholder="Zdravo! Pripremio sam selekciju projekata posebno za vas..."
              onChange={e => set("message", e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Filter projekata (opciono)</label>
            <input className="input" value={form.filters} placeholder="Npr. branding, web dizajn"
              onChange={e => set("filters", e.target.value)} />
          </div>

          <button className="btn btn-primary w-full" style={{ justifyContent: "center", marginTop: 8 }}
            onClick={create} disabled={status === "loading" || !form.clientName || !form.slug}>
            {status === "loading" ? "Kreiranje..." : "✦ Kreiraj pitch link"}
          </button>
          {status === "ok"  && <div className="success-msg">✓ Link kreiran i spreman za slanje!</div>}
          {status === "err" && <div className="error-msg">⚠ {errMsg}</div>}
        </div>

        {/* Links list */}
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Kreirani linkovi</h2>
          {links.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔗</div>
              <div style={{ color: "var(--text2)", fontSize: 14 }}>Još nema kreiranih linkova.<br />Kreiraj prvi gore.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {links.map((l) => (
                <div key={l.id} className="card card-hover">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{l.clientName[0]}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{l.clientName}</div>
                        <div style={{ fontSize: 12, color: "var(--text3)" }}>{l.url}</div>
                      </div>
                    </div>
                    <span className="badge badge-green">Aktivan</span>
                  </div>
                  {l.message && (
                    <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12, lineHeight: 1.5 }}>{l.message.slice(0, 80)}{l.message.length > 80 ? "..." : ""}</p>
                  )}
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => copy(l.url, l.id)}>
                      {copied === String(l.id) ? "✓ Kopirano!" : "📋 Kopiraj link"}
                    </button>
                    <button className="btn btn-ghost btn-sm">📊 Statistika</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
