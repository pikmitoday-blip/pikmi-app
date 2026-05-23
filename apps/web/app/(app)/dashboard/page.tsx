"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../../lib/i18n";

interface PitchLink {
  id: string;
  title: string;
  slug: string;
  views: number;
  is_active: boolean;
  created_at: string;
}

export default function Dashboard() {
  const { t } = useLanguage();
  const [links, setLinks] = useState<PitchLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("pikmi-theme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("pikmi-theme", next);
  }

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("pitch_links")
        .select("id, title, slug, views, is_active, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setLinks(data);
    } catch {}
    setLoading(false);
  }

  const totalLinks = links.length;
  const totalOpens = links.reduce((sum, l) => sum + (l.views || 0), 0);
  const hotLeads  = links.filter(l => (l.views || 0) >= 2).length;

  function getLinkUrl(slug: string) {
    const base = typeof window !== "undefined" ? window.location.origin : "https://pikmi.today";
    return `${base}/${slug}`;
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  const statCards = [
    { label: t("dash_total_links"), value: loading ? "—" : totalLinks, icon: "🔗", color: "rgba(124,58,237,0.15)" },
    { label: t("dash_opens"),       value: loading ? "—" : totalOpens, icon: "👁",  color: "rgba(59,130,246,0.15)" },
    { label: t("dash_hot_leads"),   value: loading ? "—" : hotLeads,   icon: "🔥",  color: "rgba(236,72,153,0.15)" },
    { label: t("dash_active_links"),value: loading ? "—" : links.filter(l => l.is_active).length, icon: "✅", color: "rgba(34,197,94,0.15)" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">{t("dash_title")}</h1>
          <p className="page-subtitle">{t("dash_overview")}</p>
        </div>
        <Link href="/pitch-link" className="btn btn-primary">{t("dash_new_link")}</Link>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pitch linkovi tabela */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>{t("dash_my_links")}</h2>
          <span className="badge badge-purple">Live</span>
        </div>
        {loading ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text3)" }}>{t("loading")}</div>
        ) : links.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div style={{ color: "var(--text2)", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t("dash_no_links_title")}</div>
            <p style={{ color: "var(--text3)", fontSize: 13, marginBottom: 20 }}>{t("dash_no_links_desc")}</p>
            <Link href="/pitch-link" className="btn btn-primary btn-sm">{t("dash_create_link_btn")}</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("dash_client")}</th>
                  <th className="hide-mobile">{t("dash_link")}</th>
                  <th>{t("dash_views_col")}</th>
                  <th className="hide-mobile">{t("dash_created")}</th>
                  <th>{t("dash_status")}</th>
                </tr>
              </thead>
              <tbody>
                {links.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                          {l.title[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span style={{ color: "var(--text)", fontWeight: 500 }}>{l.title}</span>
                      </div>
                    </td>
                    <td className="hide-mobile">
                      <a href={getLinkUrl(l.slug)} target="_blank" rel="noreferrer"
                        style={{ color: "var(--purple)", fontSize: 13, textDecoration: "none" }}>
                        /{l.slug} ↗
                      </a>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: (l.views || 0) >= 2 ? "#F472B6" : "var(--text)" }}>
                        {(l.views || 0) >= 2 && "🔥 "}{l.views || 0}
                      </span>
                    </td>
                    <td className="hide-mobile" style={{ color: "var(--text3)", fontSize: 13 }}>{timeAgo(l.created_at)} ago</td>
                    <td>
                      <span className={`badge ${l.is_active ? "badge-green" : ""}`}
                        style={!l.is_active ? { background: "rgba(255,255,255,0.05)", color: "var(--text3)" } : {}}>
                        {l.is_active ? t("dash_active") : t("dash_inactive")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Theme toggle — samo mobilni */}
      <div className="mobile-only" style={{ marginBottom: 8 }}>
        <button
          onClick={toggleTheme}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px", borderRadius: 12, border: "1px solid var(--border)",
            background: "var(--card)", cursor: "pointer", fontFamily: "inherit",
            fontSize: 14, color: "var(--text2)", transition: "all 0.15s",
          }}
        >
          <span style={{ fontWeight: 500 }}>
            {theme === "dark" ? t("theme_dark") : t("theme_light")}
          </span>
          <div style={{
            width: 42, height: 24, borderRadius: 100,
            background: theme === "light" ? "var(--purple)" : "var(--border)",
            position: "relative", transition: "background 0.2s", flexShrink: 0,
          }}>
            <div style={{
              position: "absolute", top: 3, left: theme === "light" ? 21 : 3,
              width: 18, height: 18, borderRadius: "50%", background: "white",
              transition: "left 0.2s",
            }} />
          </div>
        </button>
      </div>
    </div>
  );
}
