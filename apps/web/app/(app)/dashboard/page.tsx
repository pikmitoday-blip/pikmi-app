"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const userId = "1";

  useEffect(() => {
    fetch(`http://localhost:4000/api/dashboard/${userId}`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => setStats({ totalLinks: 0, totalOpens: 0, hotLeads: 0, recentViews: [] }));
  }, []);

  const statCards = [
    { label: "Ukupno linkova", value: stats?.totalLinks ?? "—", icon: "🔗", color: "rgba(124,58,237,0.15)" },
    { label: "Otvaranja",      value: stats?.totalOpens ?? "—", icon: "👁",  color: "rgba(59,130,246,0.15)" },
    { label: "Hot lead-ovi",   value: stats?.hotLeads ?? "—",   icon: "🔥",  color: "rgba(236,72,153,0.15)" },
    { label: "Prosečno vreme", value: "2m 14s",                 icon: "⏱",  color: "rgba(34,197,94,0.15)" },
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

      {/* Recent views */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Poslednji pregledi</h2>
          <span className="badge badge-purple">Live</span>
        </div>
        {!stats ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text3)" }}>Učitavanje...</div>
        ) : stats.recentViews.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div style={{ color: "var(--text2)", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Još nema pregleda</div>
            <p style={{ color: "var(--text3)", fontSize: 13, marginBottom: 20 }}>Pošalji prvi pitch link da počneš da pratiš aktivnost klijenata.</p>
            <Link href="/pitch-link" className="btn btn-primary btn-sm">Kreiraj pitch link</Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Klijent</th>
                <th>Trajanje</th>
                <th>Sekcije</th>
                <th>Vreme</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentViews.map((v: any, i: number) => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{(v.clientName || "?")[0].toUpperCase()}</div>
                      <span style={{ color: "var(--text)", fontWeight: 500 }}>{v.clientName || "Nepoznat"}</span>
                    </div>
                  </td>
                  <td>{v.duration ? `${v.duration}s` : "—"}</td>
                  <td>{v.sections?.join(", ") || "—"}</td>
                  <td>{v.timestamp ? new Date(v.timestamp).toLocaleString("sr") : "—"}</td>
                  <td>
                    <span className={`badge ${v.duration > 120 ? "badge-pink" : "badge-blue"}`}>
                      {v.duration > 120 ? "🔥 Hot" : "Aktivan"}
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

      {/* Profile template preview */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>Kako izgleda tvoj profil</h2>
            <p style={{ fontSize: 13, color: "var(--text3)" }}>Ovako te vide klijenti kada otvore tvoj link</p>
          </div>
          <Link href="/u/moj-profil" target="_blank" className="btn btn-ghost btn-sm" style={{ fontSize: 13 }}>
            Pogledaj uživo ↗
          </Link>
        </div>

        {/* Preview frame */}
        <div style={{ background: "var(--bg)", padding: "24px" }}>
          <div style={{
            maxWidth: 540,
            margin: "0 auto",
            border: "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
          }}>
            {/* Mini nav bar */}
            <div style={{
              height: 44,
              background: "rgba(11,15,25,0.95)",
              backdropFilter: "blur(12px)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              gap: 8,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", maxWidth: 160 }} />
              <div style={{ marginLeft: "auto" }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: "#A78BFA",
                  padding: "3px 10px", borderRadius: 6,
                  background: "rgba(124,58,237,0.2)",
                  border: "1px solid rgba(124,58,237,0.3)",
                }}>
                  Kreiraj profil
                </div>
              </div>
            </div>

            <div style={{ padding: "24px 20px", background: "var(--bg)" }}>
              {/* Hero card */}
              <div style={{
                textAlign: "center",
                padding: "28px 20px",
                borderRadius: 14,
                background: "rgba(124,58,237,0.06)",
                border: "1px solid rgba(124,58,237,0.18)",
                marginBottom: 14,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 800, color: "white",
                  margin: "0 auto 14px",
                  boxShadow: "0 0 20px rgba(124,58,237,0.4)",
                }}>
                  M
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Marko Nikolić</div>
                <div style={{ fontSize: 14, color: "#A78BFA", fontWeight: 600, marginBottom: 4 }}>Full-stack developer</div>
                <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 18 }}>📍 Beograd</div>
                <div style={{
                  display: "inline-block", padding: "7px 18px", borderRadius: 8,
                  background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                  color: "white", fontSize: 13, fontWeight: 600,
                  boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
                }}>
                  Kontaktiraj me →
                </div>
              </div>

              {/* Bio */}
              <div style={{
                padding: "16px",
                borderRadius: 12,
                background: "var(--card)",
                border: "1px solid var(--border)",
                marginBottom: 12,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>O meni</div>
                <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
                  Pravim web aplikacije koje su brze, moderne i lako se koriste. 5+ godina iskustva sa React-om i Node.js-om.
                </div>
              </div>

              {/* Services grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {["Dizajn", "Development", "Branding", "Konsultacije"].map(s => (
                  <div key={s} style={{
                    padding: "10px 12px",
                    borderRadius: 9,
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    fontSize: 12, fontWeight: 500, color: "var(--text2)",
                  }}>
                    ✦ {s}
                  </div>
                ))}
              </div>

              {/* Portfolio grid */}
              <div style={{
                padding: "16px",
                borderRadius: 12,
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Moji radovi</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { bg: "rgba(124,58,237,0.15)", label: "SaaS platforma" },
                    { bg: "rgba(59,130,246,0.15)", label: "E-commerce" },
                    { bg: "rgba(236,72,153,0.12)", label: "Mobile app" },
                    { bg: "rgba(34,197,94,0.12)",  label: "Dashboard" },
                  ].map((p, i) => (
                    <div key={i} style={{
                      aspectRatio: "16/9",
                      borderRadius: 8,
                      background: p.bg,
                      border: "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ color: "var(--text3)", fontSize: 11 }}>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--border)",
          background: "rgba(124,58,237,0.04)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 13, color: "var(--text3)" }}>
            Ovo je template — uredi profil da dodaš svoje podatke
          </div>
          <Link href="/profile-edit" className="btn btn-primary btn-sm">
            ✏️ Uredi profil
          </Link>
        </div>
      </div>
    </div>
  );
}
