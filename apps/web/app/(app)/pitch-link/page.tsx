"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

interface PitchLink {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  template: string;
  views: number;
  is_active: boolean;
  created_at: string;
}

export default function PitchLink() {
  const [form, setForm] = useState({ clientName: "", slug: "", message: "", filters: "" });
  const [status, setStatus] = useState<"idle"|"loading"|"ok"|"err">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [links, setLinks] = useState<PitchLink[]>([]);
  const [copied, setCopied] = useState<string|null>(null);
  const [loadingLinks, setLoadingLinks] = useState(true);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  useEffect(() => {
    loadLinks();
  }, []);

  async function loadLinks() {
    setLoadingLinks(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("pitch_links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setLinks(data);
    } catch {}
    setLoadingLinks(false);
  }

  async function create() {
    if (!form.clientName || !form.slug) return;
    setStatus("loading");
    setErrMsg("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nisi ulogovan.");

      const { data, error } = await supabase
        .from("pitch_links")
        .insert({
          user_id: user.id,
          title: form.clientName,
          slug: form.slug,
          template: form.message || "",
          is_active: true,
          views: 0,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          setErrMsg("Slug već postoji. Odaberi drugi URL.");
        } else {
          setErrMsg(error.message);
        }
        setStatus("err");
        return;
      }

      if (data) setLinks(prev => [data, ...prev]);
      setForm({ clientName: "", slug: "", message: "", filters: "" });
      setStatus("ok");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e: any) {
      setErrMsg(e.message || "Greška pri kreiranju linka.");
      setStatus("err");
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("pitch_links").update({ is_active: !current }).eq("id", id);
    setLinks(prev => prev.map(l => l.id === id ? { ...l, is_active: !current } : l));
  }

  async function deleteLink(id: string) {
    await supabase.from("pitch_links").delete().eq("id", id);
    setLinks(prev => prev.filter(l => l.id !== id));
  }

  function getLinkUrl(slug: string) {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/${slug}`;
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
          {loadingLinks ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ color: "var(--text2)", fontSize: 14 }}>Učitavanje...</div>
            </div>
          ) : links.length === 0 ? (
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
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{l.title[0]}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{l.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text3)" }}>{getLinkUrl(l.slug)}</div>
                      </div>
                    </div>
                    <span className={`badge ${l.is_active ? "badge-green" : ""}`} style={!l.is_active ? { background: "rgba(255,255,255,0.05)", color: "var(--text3)" } : {}}>
                      {l.is_active ? "Aktivan" : "Neaktivan"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>
                    👁 {l.views} pregleda
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => copy(getLinkUrl(l.slug), l.id)}>
                      {copied === l.id ? "✓ Kopirano!" : "📋 Kopiraj link"}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(l.id, l.is_active)}>
                      {l.is_active ? "⏸ Deaktiviraj" : "▶ Aktiviraj"}
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: "#F87171" }} onClick={() => deleteLink(l.id)}>
                      🗑
                    </button>
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
