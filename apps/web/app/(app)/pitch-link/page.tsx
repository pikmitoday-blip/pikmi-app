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

const FREE_LINK_LIMIT = 3;

// ── Color by engagement ──────────────────────────────────────────────────────
function linkColor(views: number) {
  if (views >= 2) return "#EF4444";   // hot lead — red
  if (views === 1) return "#F59E0B";  // opened once — orange
  return "#6B7280";                   // not opened — grey
}

function linkStatusLabel(l: PitchLink, t: (k: any) => string) {
  if (l.views >= 2) return "Hot lead";
  if (l.views === 1) return t("links_views_count") ? `1 ${t("links_views_count")}` : "Opened";
  if (l.is_active) return t("links_active");
  return t("links_inactive");
}

function linkWord(n: number, locale: string): string {
  if (locale === "en") return n === 1 ? "link" : "links";
  if (n === 1) return "link";
  if (n >= 2 && n <= 4) return "linka";
  return "linkova";
}

export default function PitchLink() {
  const { t, locale } = useLanguage();
  const [form, setForm] = useState({ clientName: "", slug: "", message: "", filters: "" });
  const [status, setStatus] = useState<"idle"|"loading"|"ok"|"err">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [links, setLinks] = useState<PitchLink[]>([]);
  const [copied, setCopied] = useState<string|null>(null);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [userPlan, setUserPlan] = useState<"free"|"pro">("free");

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  useEffect(() => { loadLinks(); }, []);

  async function loadLinks() {
    setLoadingLinks(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user) return;
      const [linksRes, profileRes] = await Promise.all([
        supabase.from("pitch_links").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("plan").eq("user_id", user.id).single(),
      ]);
      if (linksRes.data) setLinks(linksRes.data);
      if (profileRes.data) setUserPlan(profileRes.data.plan === "pro" ? "pro" : "free");
    } catch {}
    setLoadingLinks(false);
  }

  const isAtLimit = userPlan === "free" && links.length >= FREE_LINK_LIMIT;

  async function create() {
    if (!form.clientName || !form.slug) return;
    if (isAtLimit) return;
    setStatus("loading");
    setErrMsg("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nisi ulogovan.");
      const { data, error } = await supabase
        .from("pitch_links")
        .insert({ user_id: user.id, title: form.clientName, slug: form.slug, template: form.message || "", filters: form.filters || "", is_active: true, views: 0 })
        .select().single();
      if (error) {
        setErrMsg(error.code === "23505" ? t("links_slug_exists") : error.message);
        setStatus("err"); return;
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
    const base = typeof window !== "undefined" ? window.location.origin : "https://pikmi.today";
    return `${base}/${slug}`;
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  // ── Shared input style ────────────────────────────────────────────────────
  const INP: React.CSSProperties = {
    width: "100%", padding: "13px 14px",
    background: "var(--inp-bg)",
    border: "1px solid rgba(139,92,246,0.12)",
    borderRadius: 12, color: "var(--text)",
    fontSize: 14, fontFamily: "inherit", outline: "none",
    transition: "border-color 0.2s", boxSizing: "border-box",
  };
  const LBL: React.CSSProperties = {
    fontSize: 12, fontWeight: 600,
    color: "var(--text3)",
    marginBottom: 8, display: "block", letterSpacing: 0.3,
  };

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header">
        <h1 className="page-title">{t("links_page_title")}</h1>
        <p className="page-subtitle">{t("links_page_sub")}</p>
      </div>

      {/* ── Free limit banner ── */}
      {userPlan === "free" && !loadingLinks && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12, padding: "12px 16px", borderRadius: 12, marginBottom: 20,
          background: isAtLimit ? "rgba(239,68,68,0.07)" : "rgba(139,92,246,0.06)",
          border: `1px solid ${isAtLimit ? "rgba(239,68,68,0.2)" : "rgba(139,92,246,0.15)"}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>{isAtLimit ? "🔒" : "🔗"}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: isAtLimit ? "#F87171" : "var(--text2)" }}>
                {isAtLimit ? t("links_limit_reached") : t("links_limit_info")}
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                {links.length} / {FREE_LINK_LIMIT} {t("links_used")}
              </div>
            </div>
          </div>
          {isAtLimit && (
            <a href="/billing" className="btn btn-primary btn-sm" style={{ whiteSpace: "nowrap" }}>
              ⚡ {t("links_upgrade")}
            </a>
          )}
        </div>
      )}

      {/* ── Main grid: form + list ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}
        className="pl-grid">
        <style>{`
          @media (max-width: 768px) { .pl-grid { grid-template-columns: 1fr !important; } }
        `}</style>

        {/* ══ FORM CARD ══ */}
        <div style={{
          background: "rgba(139,92,246,0.04)",
          border: "1px solid rgba(139,92,246,0.1)",
          borderRadius: 20, padding: "22px 18px",
          position: "relative",
          opacity: isAtLimit ? 0.5 : 1,
          pointerEvents: isAtLimit ? "none" : "auto",
        }}>
          {/* Lock overlay */}
          {isAtLimit && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)", zIndex: 1,
              flexDirection: "column", gap: 12,
            }}>
              <span style={{ fontSize: 32 }}>🔒</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", textAlign: "center", padding: "0 20px" }}>
                {t("links_limit_reached")}
              </div>
              <a href="/billing" className="btn btn-primary btn-sm">⚡ {t("links_upgrade")}</a>
            </div>
          )}

          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, letterSpacing: -0.3 }}>
            {t("links_new_title")}
          </div>

          {/* Client name */}
          <div style={{ marginBottom: 14 }}>
            <label style={LBL}>{t("links_client_label")}</label>
            <input style={INP} value={form.clientName} placeholder={t("links_client_ph")}
              onChange={e => set("clientName", e.target.value)} />
          </div>

          {/* Slug */}
          <div style={{ marginBottom: 14 }}>
            <label style={LBL}>{t("links_slug_label")}</label>
            <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(139,92,246,0.12)" }}>
              <div style={{
                padding: "13px 12px", background: "rgba(139,92,246,0.08)",
                fontSize: 13, color: "rgba(255,255,255,0.3)",
                whiteSpace: "nowrap", borderRight: "1px solid rgba(139,92,246,0.1)",
              }}>pikmi.today/</div>
              <input style={{ ...INP, border: "none", borderRadius: 0, flex: 1 }}
                value={form.slug} placeholder="coca-cola"
                onChange={e => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
            </div>
          </div>

          {/* Filters */}
          <div style={{ marginBottom: 20 }}>
            <label style={LBL}>{t("links_filter_label")}</label>
            <input style={INP} value={form.filters} placeholder={t("links_filter_ph")}
              onChange={e => set("filters", e.target.value)} />
          </div>

          {/* Submit */}
          <button
            onClick={create}
            disabled={status === "loading" || !form.clientName || !form.slug || isAtLimit}
            style={{
              width: "100%", padding: "14px 0",
              background: status === "loading" ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg,#7C3AED,#6366F1)",
              border: "none", borderRadius: 14, color: "#fff",
              fontSize: 15, fontWeight: 700, cursor: status === "loading" ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 24px rgba(124,58,237,0.3)", fontFamily: "inherit",
              opacity: (status === "loading" || !form.clientName || !form.slug) ? 0.7 : 1,
              transition: "all 0.2s",
            }}>
            {status === "loading" ? t("links_creating") : t("links_create_btn")}
          </button>

          {status === "ok"  && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#4ADE80", fontSize: 13, fontWeight: 600 }}>
              ✓ {t("links_created_ok")}
            </div>
          )}
          {status === "err" && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: 13 }}>
              ⚠ {errMsg}
            </div>
          )}
        </div>

        {/* ══ LINKS LIST ══ */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>{t("links_created_list")}</h2>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
              {links.length} {linkWord(links.length, locale)}
            </span>
          </div>

          {loadingLinks ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
              {t("loading")}
            </div>
          ) : links.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", background: "rgba(139,92,246,0.03)", border: "1px solid rgba(139,92,246,0.08)", borderRadius: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
              <div style={{ color: "var(--text2)", fontSize: 14 }}>
                {t("links_no_links").split("\n").map((s: string, i: number) => <span key={i}>{s}{i === 0 && <br/>}</span>)}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {links.map(l => {
                const color = linkColor(l.views);
                return (
                  <div key={l.id}
                    style={{
                      background: l.views >= 2
                        ? "rgba(239,68,68,0.04)"
                        : l.views === 1
                        ? "rgba(245,158,11,0.04)"
                        : "rgba(139,92,246,0.03)",
                      border: `1px solid ${l.views >= 2 ? "rgba(239,68,68,0.12)" : l.views === 1 ? "rgba(245,158,11,0.12)" : "rgba(139,92,246,0.08)"}`,
                      borderRadius: 16, padding: "16px",
                    }}>
                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      {/* Left: avatar + title + slug */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                          background: `${color}12`, border: `1px solid ${color}25`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16, fontWeight: 800, color,
                        }}>{l.title[0]?.toUpperCase() ?? "?"}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {l.title}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "monospace" }}>
                            pikmi.today/{l.slug}
                          </div>
                        </div>
                      </div>

                      {/* Right: status badge + views + time */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                        <div style={{
                          fontSize: 10, fontWeight: 700, color,
                          background: `${color}12`, border: `1px solid ${color}20`,
                          padding: "4px 10px", borderRadius: 100,
                          textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap",
                        }}>
                          {l.views >= 2 ? "🔥 Hot lead" : l.views === 1 ? "Opened" : l.is_active ? t("links_active") : t("links_inactive")}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, color: "var(--text2)", fontFamily: "monospace" }}>
                            {l.views > 0 ? `${l.views} ${t("links_views_count")}` : t("links_views_count") ? `0 ${t("links_views_count")}` : "No views"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Filters badge + action buttons — uvek vidljivo */}
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(139,92,246,0.06)" }}>
                      {l.filters && (
                        <div style={{ marginBottom: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "rgba(124,58,237,0.12)", color: "#A78BFA" }}>
                            {l.filters}
                          </span>
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          onClick={() => copy(getLinkUrl(l.slug), l.id)}
                          style={{
                            flex: 1, minWidth: 100, padding: "10px 0",
                            background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
                            borderRadius: 10, color: "#A855F7",
                            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          }}>
                          {copied === l.id ? t("links_copied_btn") : t("links_copy_btn")}
                        </button>
                        <button
                          onClick={() => toggleActive(l.id, l.is_active)}
                          style={{
                            flex: 1, minWidth: 100, padding: "10px 0",
                            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)",
                            borderRadius: 10, color: "#F59E0B",
                            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          }}>
                          {l.is_active ? t("links_deactivate") : t("links_activate")}
                        </button>
                        <button
                          onClick={() => deleteLink(l.id)}
                          style={{
                            width: 42, padding: "10px 0",
                            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.12)",
                            borderRadius: 10, color: "#EF4444",
                            fontSize: 15, cursor: "pointer", fontFamily: "inherit",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>🗑</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
