"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../../lib/i18n";
import { useUser } from "../../../lib/UserContext";

const CACHE_KEY = "pikmi-analytics";
const CACHE_TTL = 60_000;

interface AnalyticsCache { links: LinkStat[]; views: ViewRecord[]; ts: number; }

function getCached(): AnalyticsCache | null {
  try { const raw = sessionStorage.getItem(CACHE_KEY); if (!raw) return null; return JSON.parse(raw) as AnalyticsCache; } catch { return null; }
}
function isCacheStale(): boolean {
  try { const raw = sessionStorage.getItem(CACHE_KEY); if (!raw) return true; const { ts } = JSON.parse(raw); return Date.now() - ts > CACHE_TTL; } catch { return true; }
}
function setCache(links: LinkStat[], views: ViewRecord[]) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ links, views, ts: Date.now() })); } catch {}
}

interface LinkStat { id: string; title: string; slug: string; views: number; is_active: boolean; created_at: string; }
interface ViewRecord {
  id: string; pitch_link_id: string; viewed_at: string;
  device: string | null; referrer: string | null;
  duration?: number | null;
  linkTitle?: string; linkSlug?: string;
}
interface DayStat { date: string; label: string; count: number; }
type Timeline = "7" | "30" | "90" | "all";

function formatDuration(sec: number | null | undefined): string {
  if (!sec || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function Analytics() {
  const { t } = useLanguage();
  const { userId } = useUser();

  const [links, setLinks] = useState<LinkStat[]>(() => getCached()?.links ?? []);
  const [views, setViews] = useState<ViewRecord[]>(() => getCached()?.views ?? []);
  const [loading, setLoading] = useState<boolean>(() => getCached() === null);
  const [selectedLink, setSelectedLink] = useState<string>("all");
  const [timeline, setTimeline] = useState<Timeline>("7");

  useEffect(() => {
    if (!userId) return;
    if (!isCacheStale()) return;
    loadData(userId);
  }, [userId]);

  async function loadData(uid: string) {
    const { data: linksData } = await supabase
      .from("pitch_links")
      .select("id, title, slug, views, is_active, created_at")
      .eq("user_id", uid)
      .order("views", { ascending: false });

    if (linksData) setLinks(linksData);

    let enrichedViews: ViewRecord[] = [];
    if (linksData && linksData.length > 0) {
      const linkIds = linksData.map(l => l.id);
      const { data: viewsData } = await supabase
        .from("link_views")
        .select("id, pitch_link_id, viewed_at, device, referrer, duration")
        .in("pitch_link_id", linkIds)
        .order("viewed_at", { ascending: false })
        .limit(2000);

      if (viewsData) {
        enrichedViews = viewsData.map((v: any) => ({
          ...v,
          linkTitle: linksData.find(l => l.id === v.pitch_link_id)?.title || "—",
          linkSlug: linksData.find(l => l.id === v.pitch_link_id)?.slug || "",
        }));
        setViews(enrichedViews);
      }
    }

    if (linksData) setCache(linksData, enrichedViews);
    setLoading(false);
  }

  const TIMELINES: { value: Timeline; label: string }[] = [
    { value: "7",   label: t("analytics_timeline_7") },
    { value: "30",  label: t("analytics_timeline_30") },
    { value: "90",  label: t("analytics_timeline_90") },
    { value: "all", label: t("analytics_timeline_all") },
  ];

  function getTimelineStart(tl: Timeline): Date | null {
    if (tl === "all") return null;
    const d = new Date(); d.setDate(d.getDate() - parseInt(tl) + 1); d.setHours(0, 0, 0, 0);
    return d;
  }

  const timelineStart = getTimelineStart(timeline);
  const filteredViews = views
    .filter(v => selectedLink === "all" || v.pitch_link_id === selectedLink)
    .filter(v => !timelineStart || new Date(v.viewed_at) >= timelineStart);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalViews   = filteredViews.length;
  const mobileViews  = filteredViews.filter(v => v.device === "mobile").length;
  const desktopViews = filteredViews.filter(v => v.device === "desktop").length;

  // Prosečno vreme
  const viewsWithDuration = filteredViews.filter((v: any) => v.duration && v.duration > 0);
  const avgDurationSec = viewsWithDuration.length > 0
    ? Math.round(viewsWithDuration.reduce((sum: number, v: any) => sum + (v.duration || 0), 0) / viewsWithDuration.length)
    : null;
  const avgDurationStr = avgDurationSec != null ? formatDuration(avgDurationSec) : "—";

  // ── Trend: danas vs juče (na celom setu filtriranom po linku, ne timeline) ─
  const linkFilteredViews = views.filter(v => selectedLink === "all" || v.pitch_link_id === selectedLink);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const todayViews     = linkFilteredViews.filter(v => new Date(v.viewed_at) >= todayStart).length;
  const yesterdayViews = linkFilteredViews.filter(v => new Date(v.viewed_at) >= yesterdayStart && new Date(v.viewed_at) < todayStart).length;
  const trendViews     = todayViews - yesterdayViews;

  const todayMobile     = linkFilteredViews.filter(v => new Date(v.viewed_at) >= todayStart && v.device === "mobile").length;
  const yesterdayMobile = linkFilteredViews.filter(v => new Date(v.viewed_at) >= yesterdayStart && new Date(v.viewed_at) < todayStart && v.device === "mobile").length;
  const trendMobile     = todayMobile - yesterdayMobile;

  const todayDesktop     = linkFilteredViews.filter(v => new Date(v.viewed_at) >= todayStart && v.device === "desktop").length;
  const yesterdayDesktop = linkFilteredViews.filter(v => new Date(v.viewed_at) >= yesterdayStart && new Date(v.viewed_at) < todayStart && v.device === "desktop").length;
  const trendDesktop     = todayDesktop - yesterdayDesktop;

  // ── Chart ─────────────────────────────────────────────────────────────────
  function buildChartData(): DayStat[] {
    if (timeline === "7" || timeline === "30") {
      const days = parseInt(timeline);
      return Array.from({ length: days }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
        const dateStr = d.toISOString().slice(0, 10);
        const label = timeline === "7"
          ? d.toLocaleDateString("sr", { weekday: "short", day: "numeric" })
          : d.toLocaleDateString("sr", { day: "numeric", month: "short" });
        const count = filteredViews.filter(v => v.viewed_at?.slice(0, 10) === dateStr).length;
        return { date: dateStr, label, count };
      });
    }
    if (timeline === "90") {
      return Array.from({ length: 13 }, (_, i) => {
        const end = new Date(); end.setDate(end.getDate() - (12 - i) * 7);
        const start = new Date(end); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);
        const label = start.toLocaleDateString("sr", { day: "numeric", month: "short" });
        const count = filteredViews.filter(v => { const d = new Date(v.viewed_at); return d >= start && d <= end; }).length;
        return { date: start.toISOString().slice(0, 10), label, count };
      });
    }
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (11 - i));
      const year = d.getFullYear(); const month = d.getMonth();
      const label = d.toLocaleDateString("sr", { month: "short", year: "2-digit" });
      const count = filteredViews.filter(v => { const vd = new Date(v.viewed_at); return vd.getFullYear() === year && vd.getMonth() === month; }).length;
      return { date: `${year}-${String(month + 1).padStart(2, "0")}`, label, count };
    });
  }

  const chartData = buildChartData();
  const maxBar = Math.max(...chartData.map(d => d.count), 1);

  function timeAgo(dateStr: string) {
    if (!dateStr) return "—";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("analytics_just_now");
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  // ── Link color by engagement ──────────────────────────────────────────────
  function viewLinkColor(v: ViewRecord) {
    const link = links.find(l => l.id === v.pitch_link_id);
    const totalLinkViews = link?.views ?? 0;
    if (totalLinkViews >= 2) return "#EF4444";
    if (totalLinkViews === 1) return "#F59E0B";
    return "#6B7280";
  }

  // ── Trend badge helper ────────────────────────────────────────────────────
  function TrendBadge({ delta }: { delta: number }) {
    if (delta === 0) return null;
    const positive = delta > 0;
    return (
      <div style={{
        position: "absolute", top: 10, right: 12,
        fontSize: 10, fontWeight: 700,
        color: positive ? "#4ADE80" : "#F87171",
        background: positive ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
        border: `1px solid ${positive ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`,
        padding: "2px 7px", borderRadius: 100,
        whiteSpace: "nowrap",
      }}>
        {positive ? `↑ +${delta}` : `↓ ${delta}`}
      </div>
    );
  }

  // ── Stat cards ────────────────────────────────────────────────────────────
  const statCards = [
    { label: t("analytics_total_views"), value: loading ? "—" : totalViews,    icon: "👁",  color: "#8B5CF6", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.18)",  trend: trendViews },
    { label: "Prosečno vreme",           value: loading ? "—" : avgDurationStr, icon: "⏱",  color: "#3B82F6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.18)",  trend: 0 },
    { label: "Mobile",                   value: loading ? "—" : mobileViews,   icon: "📱",  color: "#EC4899", bg: "rgba(236,72,153,0.1)",  border: "rgba(236,72,153,0.18)",  trend: trendMobile },
    { label: "Desktop",                  value: loading ? "—" : desktopViews,  icon: "🖥",  color: "#10B981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.18)",  trend: trendDesktop },
  ];

  const chartTitleMap: Record<Timeline, string> = {
    "7":   `${t("analytics_total_views")} — ${t("analytics_timeline_7")}`,
    "30":  `${t("analytics_total_views")} — ${t("analytics_timeline_30")}`,
    "90":  `${t("analytics_total_views")} — ${t("analytics_timeline_90")}`,
    "all": t("analytics_total_views"),
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("nav_analytics")}</h1>
          <p className="page-subtitle">{t("analytics_page_sub")}</p>
        </div>
      </div>

      {/* ── Filter po linku ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" as any }}>
        <button onClick={() => setSelectedLink("all")} style={{
          padding: "7px 16px", borderRadius: 10, border: selectedLink === "all" ? "none" : "1px solid rgba(139,92,246,0.12)",
          background: selectedLink === "all" ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(139,92,246,0.04)",
          color: selectedLink === "all" ? "#fff" : "var(--text2)",
          fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          flexShrink: 0, whiteSpace: "nowrap",
        }}>
          {t("analytics_all_links")}
        </button>
        {links.map(l => (
          <button key={l.id} onClick={() => setSelectedLink(l.id)} style={{
            padding: "7px 16px", borderRadius: 10, border: selectedLink === l.id ? "none" : "1px solid rgba(139,92,246,0.12)",
            background: selectedLink === l.id ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(139,92,246,0.04)",
            color: selectedLink === l.id ? "#fff" : "var(--text2)",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            flexShrink: 0, whiteSpace: "nowrap",
          }}>
            {l.title}
          </button>
        ))}
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ marginBottom: 20 }} className="analytics-stats">
        {statCards.map(s => (
          <div key={s.label} style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 18, padding: "20px 18px 16px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, background: `radial-gradient(circle,${s.bg} 0%,transparent 70%)`, opacity: 0.7, pointerEvents: "none" }} />
            <TrendBadge delta={s.trend} />
            <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, letterSpacing: -1.5, lineHeight: 1, marginBottom: 5 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 500, letterSpacing: 0.2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Chart ── */}
      <div style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.1)", borderRadius: 20, padding: "22px 20px", marginBottom: 16, minWidth: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, minWidth: 0 }}>{chartTitleMap[timeline]}</h2>
          <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(139,92,246,0.1)", borderRadius: 10, padding: 3, width: "fit-content" }}>
            {TIMELINES.map(tl => (
              <button key={tl.value} onClick={() => setTimeline(tl.value)} style={{
                padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s",
                background: timeline === tl.value ? "rgba(124,58,237,0.8)" : "transparent",
                color: timeline === tl.value ? "#fff" : "var(--text3)",
                whiteSpace: "nowrap",
              }}>
                {tl.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: timeline === "30" ? 4 : 8, height: 110, overflowX: "auto", maxWidth: "100%", WebkitOverflowScrolling: "touch" as any }}>
          {chartData.map((d, i) => {
            // Na mobilnom prikazuj etiketu samo za svaki Nti bar
            const step = timeline === "30" ? 5 : timeline === "90" ? 2 : 1;
            const showLabel = i % step === 0 || i === chartData.length - 1;
            return (
            <div key={d.date} style={{ flex: 1, minWidth: timeline === "30" ? 18 : 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)" }}>{d.count > 0 ? d.count : ""}</div>
              <div style={{
                width: "100%", borderRadius: 6,
                background: d.count > 0 ? "linear-gradient(to top,#7C3AED,#A78BFA)" : "rgba(255,255,255,0.04)",
                height: `${Math.max((d.count / maxBar) * 80, d.count > 0 ? 8 : 4)}px`,
                minHeight: 4, transition: "height 0.3s",
              }} />
              <div style={{ fontSize: 10, color: "var(--text3)", textAlign: "center", whiteSpace: "nowrap", visibility: showLabel ? "visible" : "hidden" }}>{d.label}</div>
            </div>
            );
          })}
        </div>
      </div>

      {/* ── Nedavni pregledi — dark card style ── */}
      <div style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.1)", borderRadius: 20, padding: "22px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>{t("analytics_recent")}</h2>
          <span style={{ fontSize: 12, color: "var(--text3)", fontFamily: "monospace" }}>
            {filteredViews.length} {t("analytics_total_views").toLowerCase()}
          </span>
        </div>

        {filteredViews.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <div style={{ color: "var(--text2)", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t("analytics_no_views")}</div>
            <p style={{ color: "var(--text3)", fontSize: 13 }}>{t("analytics_no_data")}</p>
          </div>
        ) : (
          <>
            {/* Column headers — desktop */}
            <div className="dash-link-row-time" style={{ display: "grid", gridTemplateColumns: "1fr 110px 80px 70px", gap: 8, padding: "0 4px 8px", borderBottom: "1px solid rgba(139,92,246,0.06)", marginBottom: 4 }}>
              {["Pitch link", "Uređaj", "Trajanje", "Vreme"].map((h, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>

            <div>
              {filteredViews.slice(0, 100).map((v, i) => {
                const color = viewLinkColor(v);
                return (
                  <div key={v.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 4px",
                    borderTop: i > 0 ? "1px solid rgba(139,92,246,0.05)" : "none",
                  }}>
                    {/* Left: avatar + link name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: `${color}18`, border: `1px solid ${color}30`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700, color,
                      }}>
                        {(v.linkTitle?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <a href={`/${v.linkSlug}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}
                          onClick={e => e.stopPropagation()}>
                          {v.linkTitle}
                        </a>
                      </div>
                    </div>

                    {/* Right: device + duration + time */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                      <span className="dash-link-row-time" style={{ fontSize: 12, color: "var(--text3)", minWidth: 110 }}>
                        {v.device === "mobile" ? "📱 Mobile" : v.device === "desktop" ? "🖥 Desktop" : "—"}
                      </span>
                      <span className="dash-link-row-time" style={{ fontSize: 12, fontFamily: "monospace", color: (v as any).duration ? "#A78BFA" : "var(--text3)", minWidth: 80 }}>
                        {formatDuration((v as any).duration)}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text3)", minWidth: 50, textAlign: "right", whiteSpace: "nowrap" }}>
                        {timeAgo(v.viewed_at) === t("analytics_just_now") ? t("analytics_just_now") : `${timeAgo(v.viewed_at)} ${t("analytics_ago")}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
