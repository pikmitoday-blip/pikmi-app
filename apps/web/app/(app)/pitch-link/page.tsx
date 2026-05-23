"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../../lib/i18n";

interface PitchLink {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  template: string;
  filters: string;
  views: number;
  is_active: boolean;
  created_at: string;
}

export default function PitchLink() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ clientName: "", slug: "", message: "", filters: "" });
  const [status, setStatus] = useState<"idle"|"loading"|"ok"|"err">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [links, setLinks] = useState<PitchLink[]>([]);
  const [copied, setCopied] = useState<string|null>(null);
  const [loadingLinks, setLoadingLinks] = useState(true);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }


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
          filters: form.filters || "",
          is_active: true,
          views: 0,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          setErrMsg(t("links_slug_exists"));
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
        <h1 className="page-title">{t("links_page_title")}</h1>
        <p className="page-subtitle">{t("links_page_sub")}</p>
      </div>

      <div className="grid-2" style={{ gap: 32, alignItems: "start" }}>
        {/* Form */}
        <div className="card">
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 24 }}>{t("links_new_title")}</h2>

          <div className="field">
            <label className="label">{t("links_client_label")}</label>
            <input className="input" value={form.clientName} placeholder={t("links_client_ph")}
              onChange={e => set("clientName", e.target.value)} />
          </div>
          <div className="field">
            <label className="label">{t("links_slug_label")}</label>
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
            <label className="label">{t("links_msg_label")}</label>
            <textarea className="input" value={form.message} placeholder={t("links_msg_ph")}
              onChange={e => set("message", e.target.value)} />
          </div>
          <div className="field">
            <label className="label">{t("links_filter_label")}</label>
            <input className="input" value={form.filters} placeholder={t("links_filter_ph")}
              onChange={e => set("filters", e.target.value)} />
          </div>

          <button className="btn btn-primary w-full" style={{ justifyContent: "center", marginTop: 8 }}
            onClick={create} disabled={status === "loading" || !form.clientName || !form.slug}>
            {status === "loading" ? t("links_creating") : t("links_create_btn")}
          </button>
          {status === "ok"  && <div className="success-msg">{t("links_created_ok")}</div>}
          {status === "err" && <div className="error-msg">⚠ {errMsg}</div>}
        </div>

        {/* Links list */}
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>{t("links_created_list")}</h2>
          {loadingLinks ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ color: "var(--text2)", fontSize: 14 }}>{t("loading")}</div>
            </div>
          ) : links.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔗</div>
              <div style={{ color: "var(--text2)", fontSize: 14 }}>{t("links_no_links").split("\n").map((s, i) => <span key={i}>{s}{i === 0 && <br/>}</span>)}</div>
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
                        {l.filters && (
                          <span style={{
                            display: "inline-block", marginTop: 3,
                            fontSize: 11, fontWeight: 600, padding: "2px 8px",
                            borderRadius: 999, background: "rgba(124,58,237,0.12)",
                            color: "#A78BFA", letterSpacing: "0.03em",
                          }}>
                            {l.filters}
                          </span>
                        )}
                        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: l.filters ? 3 : 0 }}>{getLinkUrl(l.slug)}</div>
                      </div>
                    </div>
                    <span className={`badge ${l.is_active ? "badge-green" : ""}`} style={!l.is_active ? { background: "rgba(255,255,255,0.05)", color: "var(--text3)" } : {}}>
                      {l.is_active ? t("links_active") : t("links_inactive")}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>
                    👁 {l.views} {t("links_views_count")}
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => copy(getLinkUrl(l.slug), l.id)}>
                      {copied === l.id ? t("links_copied_btn") : t("links_copy_btn")}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(l.id, l.is_active)}>
                      {l.is_active ? t("links_deactivate") : t("links_activate")}
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
