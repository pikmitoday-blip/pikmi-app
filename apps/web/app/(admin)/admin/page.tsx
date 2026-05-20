"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

interface Stats {
  totalUsers: number;
  proUsers: number;
  totalLinks: number;
  totalViews: number;
  newUsersToday: number;
  newUsersWeek: number;
}

interface RecentUser {
  user_id: string;
  first_name: string;
  last_name: string;
  plan: string;
  created_at: string;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profilesRes, linksRes, viewsRes] = await Promise.all([
          supabase.from("profiles").select("user_id, plan, created_at"),
          supabase.from("pitch_links").select("id, views"),
          supabase.from("link_views").select("id", { count: "exact", head: true }),
        ]);

        const profiles = profilesRes.data ?? [];
        const links    = linksRes.data ?? [];
        const now      = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const weekAgo  = new Date(now.getTime() - 7 * 86400000).toISOString();

        setStats({
          totalUsers:    profiles.length,
          proUsers:      profiles.filter(p => p.plan === "pro").length,
          totalLinks:    links.length,
          totalViews:    links.reduce((s, l) => s + (l.views || 0), 0),
          newUsersToday: profiles.filter(p => p.created_at?.slice(0, 10) === todayStr).length,
          newUsersWeek:  profiles.filter(p => p.created_at >= weekAgo).length,
        });

        const { data: recent } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, plan, created_at")
          .order("created_at", { ascending: false })
          .limit(8);
        setRecentUsers(recent ?? []);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  const statCards = [
    { label: "Ukupno korisnika",   value: stats?.totalUsers,    icon: "👥", color: "rgba(59,130,246,0.15)",   text: "#60A5FA" },
    { label: "Pro pretplata",      value: stats?.proUsers,      icon: "⚡", color: "rgba(124,58,237,0.15)",  text: "#A78BFA" },
    { label: "Pitch linkovi",      value: stats?.totalLinks,    icon: "🔗", color: "rgba(34,197,94,0.15)",   text: "#4ADE80" },
    { label: "Ukupno pregleda",    value: stats?.totalViews,    icon: "👁",  color: "rgba(236,72,153,0.15)",  text: "#F472B6" },
    { label: "Novi danas",         value: stats?.newUsersToday, icon: "🌅", color: "rgba(249,115,22,0.15)",  text: "#FB923C" },
    { label: "Novi ove sedmice",   value: stats?.newUsersWeek,  icon: "📅", color: "rgba(234,179,8,0.15)",   text: "#FBBF24" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#F9FAFB", marginBottom: 6 }}>Admin pregled</h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>Statistike i aktivnost platforme u realnom vremenu</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: "#111116", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12, padding: "20px 22px",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: s.color, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 18, marginBottom: 14,
            }}>{s.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.text, marginBottom: 4 }}>
              {loading ? "—" : (s.value ?? 0)}
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue estimate */}
      {stats && (
        <div style={{
          background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)",
          borderRadius: 12, padding: "20px 24px", marginBottom: 32,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 12, color: "#A78BFA", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 4 }}>PROCIJENJENI PRIHOD / MJESEC</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#fff" }}>
              {(stats.proUsers * 990).toLocaleString("sr-RS")} din
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
              {stats.proUsers} × 990 din — Na osnovu aktivnih Pro pretplata
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>Konverzija</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#A78BFA" }}>
              {stats.totalUsers > 0 ? ((stats.proUsers / stats.totalUsers) * 100).toFixed(1) : "0.0"}%
            </div>
          </div>
        </div>
      )}

      {/* Nedavni korisnici */}
      <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#F9FAFB" }}>Nedavno registrovani</h2>
          <Link href="/admin/korisnici" style={{ fontSize: 12, color: "#A78BFA", textDecoration: "none", fontWeight: 600 }}>
            Svi korisnici →
          </Link>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#4B5563", fontSize: 13 }}>Učitavanje...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {["Korisnik", "Plan", "Registrovan"].map(h => (
                  <th key={h} style={{ padding: "10px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#4B5563", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(u => (
                <tr key={u.user_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "12px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%",
                        background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
                      }}>
                        {(u.first_name?.[0] ?? "?").toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#D1D5DB" }}>
                        {u.first_name} {u.last_name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 24px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                      background: u.plan === "pro" ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)",
                      color: u.plan === "pro" ? "#A78BFA" : "#6B7280",
                      border: `1px solid ${u.plan === "pro" ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.06)"}`,
                    }}>
                      {u.plan === "pro" ? "⚡ PRO" : "FREE"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 24px", fontSize: 12, color: "#4B5563" }}>
                    {timeAgo(u.created_at)} ago
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Brze akcije */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 24 }}>
        {[
          { href: "/admin/korisnici", icon: "👥", label: "Upravljaj korisnicima" },
          { href: "/admin/landing",   icon: "✏️", label: "Uredi landing page" },
          { href: "/admin/podesavanja", icon: "⚙️", label: "Podešavanja platforme" },
        ].map(a => (
          <Link key={a.href} href={a.href} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 18px", borderRadius: 10,
            background: "#111116", border: "1px solid rgba(255,255,255,0.06)",
            textDecoration: "none", color: "#9CA3AF", fontSize: 13,
            transition: "all 0.15s",
          }}>
            <span style={{ fontSize: 18 }}>{a.icon}</span>
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
