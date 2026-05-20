"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

interface LinkStat {
  id: string;
  title: string;
  slug: string;
  views: number;
  is_active: boolean;
  created_at: string;
}

interface ViewRecord {
  id: string;
  pitch_link_id: string;
  viewed_at: string;
  device: string | null;
  referrer: string | null;
  linkTitle?: string;
  linkSlug?: string;
}

interface DayStat { date: string; label: string; count: number; }

type Timeline = "7" | "30" | "90" | "all";

const TIMELINES: { value: Timeline; label: string }[] = [
  { value: "7",   label: "7 dana" },
  { value: "30",  label: "30 dana" },
  { value: "90",  label: "90 dana" },
  { value: "all", label: "Sve" },
];

export default function Analytics() {
  const [links, setLinks] = useState<LinkStat[]>([]);
  const [views, setViews] = useState<ViewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLink, setSelectedLink] = useState<string>("all");
  const [timeline, setTimeline] = useState<Timeline>("7");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: linksData } = await supabase
      .from("pitch_links")
      .select("id, title, slug, views, is_active, created_at")
      .eq("user_id", user.id)
      .order("views", { ascending: false });

    if (linksData) setLinks(linksData);

    if (linksData && linksData.length > 0) {
      const linkIds = linksData.map(l => l.id);
      const { data: viewsData } = await supabase
        .from("link_views")
        .select("id, pitch_link_id, viewed_at, device, referrer")
        .in("pitch_link_id", linkIds)
        .order("viewed_at", { ascending: false })
        .limit(2000);

      if (viewsData) {
        const enriched = viewsData.map(v => ({
          ...v,
          linkTitle: linksData.find(l => l.id === v.pitch_link_id)?.title || "—",
          linkSlug: linksData.find(l => l.id === v.pitch_link_id)?.slug || "",
        }));
        setViews(enriched);
      }
    }

    setLoading(false);
  }

  // Filtriraj po timeline
  function getTimelineStart(t: Timeline): Date | null {
    if (t === "all") return null;
    const d = new Date();
    d.setDate(d.getDate() - parseInt(t) + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const timelineStart = getTimelineStart(timeline);

  // Filtriraj po linku i timeline
  const filteredViews = views
    .filter(v => selectedLink === "all" || v.pitch_link_id === selectedLink)
    .filter(v => !timelineStart || new Date(v.viewed_at) >= timelineStart);

  // Stats
  const totalViews = filteredViews.length;
  const mobileViews = filteredViews.filter(v => v.device === "mobile").length;
  const desktopViews = filteredViews.filter(v => v.device === "desktop").length;
  const uniqueDays = new Set(filteredViews.map(v => v.viewed_at?.slice(0, 10))).size;

  // Dinamički chart prema timeline
  function buildChartData(): DayStat[] {
    if (timeline === "7" || timeline === "30") {
      // Dnevni prikaz
      const days = parseInt(timeline);
      return Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const dateStr = d.toISOString().slice(0, 10);
        const label = timeline === "7"
          ? d.toLocaleDateString("sr", { weekday: "short", day: "numeric" })
          : d.toLocaleDateString("sr", { day: "numeric", month: "short" });
        const count = filteredViews.filter(v => v.viewed_at?.slice(0, 10) === dateStr).length;
        return { date: dateStr, label, count };
      });
    }

    if (timeline === "90") {
      // Sedmični prikaz — 13 sedmica
      return Array.from({ length: 13 }, (_, i) => {
        const end = new Date();
        end.setDate(end.getDate() - (12 - i) * 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        const label = start.toLocaleDateString("sr", { day: "numeric", month: "short" });
        const count = filteredViews.filter(v => {
          const d = new Date(v.viewed_at);
          return d >= start && d <= end;
        }).length;
        return { date: start.toISOString().slice(0, 10), label, count };
      });
    }

    // Sve — mjesečni prikaz (zadnjih 12 mjeseci)
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = d.toLocaleDateString("sr", { month: "short", year: "2-digit" });
      const count = filteredViews.filter(v => {
        const vd = new Date(v.viewed_at);
        return vd.getFullYear() === year && vd.getMonth() === month;
      }).length;
      return { date: `${year}-${String(month + 1).padStart(2, "0")}`, label, count };
    });
  }

  const chartData = buildChartData();
  const maxBar = Math.max(...chartData.map(d => d.count), 1);

  const chartTitle = {
    "7":   "Pregledi — zadnjih 7 dana",
    "30":  "Pregledi — zadnjih 30 dana",
    "90":  "Pregledi — zadnjih 90 dana (po sedmicama)",
    "all": "Pregledi — po mjesecima",
  }[timeline];

  function timeAgo(dateStr: string) {
    if (!dateStr) return "—";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "upravo";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  if (loading) return <div style={{ padding: 40, color: "var(--text3)" }}>Učitavanje...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analitika</h1>
          <p className="page-subtitle">Prati ko i kada otvara tvoje pitch linkove</p>
        </div>
      </div>

      {/* Filter traka: link + timeline */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24, alignItems: "center", justifyContent: "space-between" }}>
        {/* Filter po linku */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setSelectedLink("all")}
            className={`btn btn-sm ${selectedLink === "all" ? "btn-primary" : "btn-ghost"}`}
          >
            Svi linkovi
          </button>
          {links.map(l => (
            <button
              key={l.id}
              onClick={() => setSelectedLink(l.id)}
              className={`btn btn-sm ${selectedLink === l.id ? "btn-primary" : "btn-ghost"}`}
            >
              {l.title}
            </button>
          ))}
        </div>

        {/* Timeline selector */}
        <div style={{
          display: "flex", gap: 2, background: "var(--surface)",
          border: "1px solid var(--border)", borderRadius: 10, padding: 3,
        }}>
          {TIMELINES.map(t => (
            <button
              key={t.value}
              onClick={() => setTimeline(t.value)}
              style={{
                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s",
                background: timeline === t.value ? "var(--purple)" : "transparent",
                color: timeline === t.value ? "white" : "var(--text3)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-8">
        {[
          { label: "Ukupno pregleda", value: totalViews, icon: "👁", color: "rgba(124,58,237,0.15)" },
          { label: "Aktivnih dana", value: uniqueDays, icon: "📅", color: "rgba(59,130,246,0.15)" },
          { label: "Mobilni", value: mobileViews, icon: "📱", color: "rgba(236,72,153,0.15)" },
          { label: "Desktop", value: desktopViews, icon: "🖥", color: "rgba(34,197,94,0.15)" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card mb-6">
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{chartTitle}</h2>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: timeline === "30" ? 4 : 8,
          height: 120, overflowX: "auto",
        }}>
          {chartData.map(d => (
            <div key={d.date} style={{ flex: 1, minWidth: timeline === "30" ? 18 : 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)" }}>
                {d.count > 0 ? d.count : ""}
              </div>
              <div style={{
                width: "100%", borderRadius: 6,
                background: d.count > 0 ? "linear-gradient(to top, #7C3AED, #A78BFA)" : "var(--surface)",
                height: `${Math.max((d.count / maxBar) * 80, d.count > 0 ? 8 : 4)}px`,
                minHeight: 4, transition: "height 0.3s",
              }} />
              <div style={{ fontSize: 10, color: "var(--text3)", textAlign: "center", whiteSpace: "nowrap" }}>
                {d.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela pregleda */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Nedavni pregledi</h2>
          <span style={{ fontSize: 13, color: "var(--text3)" }}>{filteredViews.length} ukupno</span>
        </div>

        {filteredViews.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div style={{ color: "var(--text2)", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              Još nema pregleda
            </div>
            <p style={{ color: "var(--text3)", fontSize: 13 }}>
              Pošalji pitch link klijentu da počneš da pratiš aktivnost.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Pitch link</th>
                  <th className="hide-mobile">Uređaj</th>
                  <th className="hide-mobile">Referrer</th>
                  <th>Kada</th>
                </tr>
              </thead>
              <tbody>
                {filteredViews.slice(0, 100).map(v => (
                  <tr key={v.id}>
                    <td>
                      <a
                        href={`/${v.linkSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--purple)", fontWeight: 500, fontSize: 14, textDecoration: "none" }}
                      >
                        {v.linkTitle} ↗
                      </a>
                    </td>
                    <td className="hide-mobile">
                      <span style={{ fontSize: 13, color: "var(--text2)" }}>
                        {v.device === "mobile" ? "📱 Mobil" : v.device === "desktop" ? "🖥 Desktop" : "—"}
                      </span>
                    </td>
                    <td className="hide-mobile">
                      <span style={{ fontSize: 12, color: "var(--text3)" }}>
                        {v.referrer ? (() => { try { return new URL(v.referrer).hostname; } catch { return v.referrer; } })() : "Direktno"}
                      </span>
                    </td>
                    <td style={{ color: "var(--text3)", fontSize: 13 }}>
                      {timeAgo(v.viewed_at)} ago
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
