"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../../lib/i18n";
import { useUser } from "../../../lib/UserContext";

interface PitchLink {
  id: string;
  title: string;
  slug: string;
  views: number;
  is_active: boolean;
  created_at: string;
}

const CACHE_KEY = "pikmi-dashboard";
const CACHE_TTL = 30_000;

function getCached(): PitchLink[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: PitchLink[]; ts: number };
    void ts;
    return data;
  } catch { return null; }
}

function isCacheStale(): boolean {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return true;
    const { ts } = JSON.parse(raw);
    return Date.now() - ts > CACHE_TTL;
  } catch { return true; }
}

function setCache(data: PitchLink[]) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

export default function Dashboard() {
  const { t } = useLanguage();
  const { userId } = useUser();

  const [links, setLinks] = useState<PitchLink[]>(() => getCached() ?? []);
  const [loading, setLoading] = useState(() => getCached() === null);
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

  useEffect(() => {
    if (!userId) return;
    if (!isCacheStale()) return;
    loadDashboard(userId);
  }, [userId]);

  async function loadDashboard(uid: string) {
    try {
      const { data } = await supabase
        .from("pitch_links")
        .select("id, title, slug, views, is_active, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      if (data) { setLinks(data); setCache(data); }
    } catch {}
    setLoading(false);
  }

  const totalLinks  = links.length;
  const totalOpens  = links.reduce((sum, l) => sum + (l.views || 0), 0);
  const hotLeads    = links.filter(l => (l.views || 0) >= 2).length;
  const activeLinks = links.filter(l => l.is_active).length;

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

  // ── Stat card definitions with JSX reference colors ──────────────────────
  const statCards = [
    { label: t("dash_total_links"),  value: loading ? "—" : totalLinks,  icon: "🔗", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.18)"  },
    { label: t("dash_opens"),        value: loading ? "—" : totalOpens,  icon: "👁",  color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.18)"  },
    { label: t("dash_hot_leads"),    value: loading ? "—" : hotLeads,    icon: "🔥", color: "#EF4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.18)"   },
    { label: t("dash_active_links"), value: loading ? "—" : activeLinks, icon: "✅", color: "#10B981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.18)"  },
  ];

  // ── Row color by status ───────────────────────────────────────────────────
  function rowColor(l: PitchLink) {
    if ((l.views || 0) >= 2) return "#EF4444";
    if (l.is_active) return "#10B981";
    return "#6B7280";
  }
  function rowStatus(l: PitchLink) {
    if ((l.views || 0) >= 2) return "Hot lead";
    if (l.is_active) return t("dash_active");
    return t("dash_inactive");
  }

  return (
    <div>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">{t("dash_title")}</h1>
          <p className="page-subtitle">{t("dash_overview")}</p>
        </div>
        {/* Desktop only: button in header */}
        <Link href="/pitch-link" className="btn btn-primary hide-mobile" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {t("dash_new_link")}
        </Link>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ marginBottom: 20 }} className="dash-stats-grid">
        {statCards.map((s) => (
          <div key={s.label} style={{
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 18,
            padding: "20px 18px 16px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Glow orb */}
            <div style={{
              position: "absolute", top: -20, right: -20,
              width: 80, height: 80,
              background: `radial-gradient(circle, ${s.bg} 0%, transparent 70%)`,
              opacity: 0.7, pointerEvents: "none",
            }} />
            <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
            <div style={{
              fontSize: 36, fontWeight: 800,
              color: s.color, letterSpacing: -1.5,
              lineHeight: 1, marginBottom: 5,
            }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 500, letterSpacing: 0.2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Mobile: New Pitch Link button ── */}
      <div className="mobile-only" style={{ marginBottom: 16 }}>
        <Link href="/pitch-link" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, width: "100%", padding: "15px 0",
          background: "linear-gradient(135deg, #7C3AED, #6366F1)",
          border: "none", borderRadius: 14, color: "#fff",
          fontSize: 15, fontWeight: 700, textDecoration: "none",
          boxShadow: "0 4px 24px rgba(124,58,237,0.3)",
        }}>
          {t("dash_new_link")}
        </Link>
      </div>

      {/* ── Pitch Links Card ── */}
      <div style={{
        background: "rgba(139,92,246,0.04)",
        border: "1px solid rgba(139,92,246,0.1)",
        borderRadius: 20,
        padding: "22px 20px",
        marginBottom: 16,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>{t("dash_my_links")}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#60A5FA",
              background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)",
              padding: "4px 12px", borderRadius: 100, letterSpacing: 0.5,
            }}>Live</span>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
            {t("loading")}
          </div>
        ) : links.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>📭</div>
            <div style={{ color: "var(--text2)", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t("dash_no_links_title")}</div>
            <p style={{ color: "var(--text3)", fontSize: 13, marginBottom: 20 }}>{t("dash_no_links_desc")}</p>
            <Link href="/pitch-link" className="btn btn-primary btn-sm">{t("dash_create_link_btn")}</Link>
          </div>
        ) : (
          <div>
            {/* Column labels — desktop only */}
            <div className="dash-link-row-time" style={{ display: "grid", gridTemplateColumns: "1fr 160px 80px 100px", gap: 12, padding: "0 4px 8px", borderBottom: "1px solid rgba(139,92,246,0.06)", marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.18)", letterSpacing: 1, textTransform: "uppercase" }}>{t("dash_client")}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.18)", letterSpacing: 1, textTransform: "uppercase" }}>{t("dash_link")}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.18)", letterSpacing: 1, textTransform: "uppercase" }}>{t("dash_views_col")}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.18)", letterSpacing: 1, textTransform: "uppercase" }}>{t("dash_status")}</span>
            </div>

            {links.map((l, i) => {
              const color = rowColor(l);
              const isHot = (l.views || 0) >= 2;
              return (
                <div key={l.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "13px 4px",
                  borderTop: i > 0 ? "1px solid rgba(139,92,246,0.06)" : "none",
                }}>
                  {/* Left: avatar + name + slug */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `${color}18`,
                      border: `1px solid ${color}35`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 700, color,
                    }}>
                      {l.title[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {l.title}
                      </div>
                      <a href={getLinkUrl(l.slug)} target="_blank" rel="noreferrer"
                        className="dash-link-row-slug"
                        style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textDecoration: "none", fontFamily: "monospace" }}>
                        /{l.slug} ↗
                      </a>
                    </div>
                  </div>

                  {/* Right: time + views + status */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                    <span className="dash-link-row-time" style={{ fontSize: 12, color: "var(--text3)" }}>
                      {timeAgo(l.created_at)} ago
                    </span>
                    <span style={{
                      fontSize: 13, fontFamily: "monospace",
                      color: isHot ? "#EF4444" : "rgba(255,255,255,0.4)",
                      minWidth: 40, textAlign: "right",
                    }}>
                      {isHot && "🔥 "}{l.views || 0}
                    </span>
                    <div style={{
                      fontSize: 10, fontWeight: 700,
                      color,
                      background: `${color}18`,
                      border: `1px solid ${color}30`,
                      padding: "4px 10px", borderRadius: 100,
                      textTransform: "uppercase", letterSpacing: 0.6,
                      whiteSpace: "nowrap",
                    }}>
                      {rowStatus(l)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Theme toggle — mobile only ── */}
      <div className="mobile-only" style={{ marginBottom: 8 }}>
        <button onClick={toggleTheme} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", borderRadius: 12, border: "1px solid var(--border)",
          background: "var(--card)", cursor: "pointer", fontFamily: "inherit",
          fontSize: 14, color: "var(--text2)", transition: "all 0.15s",
        }}>
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
