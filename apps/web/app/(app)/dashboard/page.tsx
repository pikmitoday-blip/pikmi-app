"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

interface PitchLink {
  id: string;
  title: string;
  slug: string;
  views: number;
  is_active: boolean;
  created_at: string;
}

export default function Dashboard() {
  const [links, setLinks] = useState<PitchLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

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
  const hotLeads  = links.filter(l => (l.views || 0) >= 3).length;

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
    { label: "Ukupno linkova", value: loading ? "—" : totalLinks, icon: "🔗", color: "rgba(124,58,237,0.15)" },
    { label: "Otvaranja",      value: loading ? "—" : totalOpens, icon: "👁",  color: "rgba(59,130,246,0.15)" },
    { label: "Hot lead-ovi",   value: loading ? "—" : hotLeads,   icon: "🔥",  color: "rgba(236,72,153,0.15)" },
    { label: "Aktivnih linkova", value: loading ? "—" : links.filter(l => l.is_active).length, icon: "✅", color: "rgba(34,197,94,0.15)" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Pregled svih aktivnosti tvojih pitch linkova</p>
        </div>
        <Link href="/pitch-link" className="btn btn-primary">+ Novi pitch link</Link>
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
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Moji pitch linkovi</h2>
          <span className="badge badge-purple">Live</span>
        </div>
        {loading ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text3)" }}>Učitavanje...</div>
        ) : links.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div style={{ color: "var(--text2)", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Još nema pitch linkova</div>
            <p style={{ color: "var(--text3)", fontSize: 13, marginBottom: 20 }}>Pošalji prvi pitch link da počneš da pratiš aktivnost klijenata.</p>
            <Link href="/pitch-link" className="btn btn-primary btn-sm">Kreiraj pitch link</Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Klijent</th>
                <th>Link</th>
                <th>Pregledi</th>
                <th>Kreirano</th>
                <th>Status</th>
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
                  <td>
                    <a href={getLinkUrl(l.slug)} target="_blank" rel="noreferrer"
                      style={{ color: "var(--purple)", fontSize: 13, textDecoration: "none" }}>
                      /{l.slug} ↗
                    </a>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: (l.views || 0) >= 3 ? "#F472B6" : "var(--text)" }}>
                      {(l.views || 0) >= 3 && "🔥 "}{l.views || 0}
                    </span>
                  </td>
                  <td style={{ color: "var(--text3)", fontSize: 13 }}>{timeAgo(l.created_at)} ago</td>
                  <td>
                    <span className={`badge ${l.is_active ? "badge-green" : ""}`}
                      style={!l.is_active ? { background: "rgba(255,255,255,0.05)", color: "var(--text3)" } : {}}>
                      {l.is_active ? "Aktivan" : "Neaktivan"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid-3 mb-8" style={{ gap: 16 }}>
        {[
          { href: "/pitch-link",   icon: "🔗", title: "Kreiraj pitch link",   desc: "Personalizovani link za novog klijenta" },
          { href: "/profile-edit", icon: "✏️", title: "Uredi profil",          desc: "Ažuriraj projekte i opis" },
          { href: "/outreach",     icon: "✉️", title: "Outreach kit",          desc: "Cold DM i email šabloni" },
        ].map(a => (
          <Link key={a.href} href={a.href} className="card card-hover flex gap-3 items-start" style={{ textDecoration: "none" }}>
            <div style={{ fontSize: 24 }}>{a.icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{a.title}</div>
              <div style={{ fontSize: 13, color: "var(--text3)" }}>{a.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
