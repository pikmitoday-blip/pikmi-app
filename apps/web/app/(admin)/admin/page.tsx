"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

interface ProfileRow {
  user_id: string;
  first_name: string;
  last_name: string;
  plan: string;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  proUsers: number;
  totalLinks: number;
  totalViews: number;
  newUsersToday: number;
  newUsersWeek: number;
}

// Generisanje posljednjih N mjeseci kao "YYYY-MM" stringova
function lastNMonths(n: number): { value: string; label: string }[] {
  const result = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("sr-RS", { month: "long", year: "numeric" });
    result.push({ value, label });
  }
  return result;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [allProfiles, setAllProfiles] = useState<ProfileRow[]>([]);
  const [recentUsers, setRecentUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenueMonth, setRevenueMonth] = useState<string>("all");

  const months = lastNMonths(12);

  useEffect(() => {
    async function load() {
      try {
        const [profilesRes, linksRes] = await Promise.all([
          supabase.from("profiles").select("user_id, first_name, last_name, plan, created_at"),
          supabase.from("pitch_links").select("id, views"),
        ]);

        const profiles = profilesRes.data ?? [];
        const links    = linksRes.data ?? [];
        const now      = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const weekAgo  = new Date(now.getTime() - 7 * 86400000).toISOString();

        setAllProfiles(profiles);
        setStats({
          totalUsers:    profiles.length,
          proUsers:      profiles.filter(p => p.plan === "pro").length,
          totalLinks:    links.length,
          totalViews:    links.reduce((s, l) => s + (l.views || 0), 0),
          newUsersToday: profiles.filter(p => p.created_at?.slice(0, 10) === todayStr).length,
          newUsersWeek:  profiles.filter(p => p.created_at >= weekAgo).length,
        });

        setRecentUsers(
          [...profiles].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8)
        );
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  // Prihod za odabrani mjesec
  const filteredProUsers = revenueMonth === "all"
    ? allProfiles.filter(p => p.plan === "pro")
    : allProfiles.filter(p => p.plan === "pro" && p.created_at?.slice(0, 7) === revenueMonth);

  const revenueAmount = filteredProUsers.length * 990;

  // Bar chart — novi Pro po mjesecu (zadnjih 6)
  const chartMonths = lastNMonths(6).reverse();
  const chartData = chartMonths.map(m => ({
    label: m.label.split(" ")[0].slice(0, 3), // kratki naziv
    count: allProfiles.filter(p => p.plan === "pro" && p.created_at?.slice(0, 7) === m.value).length,
  }));
  const chartMax = Math.max(...chartData.map(c => c.count), 1);

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
          borderRadius: 12, padding: "24px", marginBottom: 32,
        }}>
          {/* Header */}
          <div style={{ fontSize: 12, color: "#A78BFA", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 16 }}>
            PROCIJENJENI PRIHOD / MJESEC
          </div>

          {/* Filter pill dugmad */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            <button
              onClick={() => setRevenueMonth("all")}
              style={{
                padding: "5px 14px", borderRadius: 999, border: "1px solid",
                borderColor: revenueMonth === "all" ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.08)",
                background: revenueMonth === "all" ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.03)",
                color: revenueMonth === "all" ? "#A78BFA" : "#6B7280",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              Svi aktivni
            </button>
            {months.map(m => (
              <button
                key={m.value}
                onClick={() => setRevenueMonth(m.value)}
                style={{
                  padding: "5px 14px", borderRadius: 999, border: "1px solid",
                  borderColor: revenueMonth === m.value ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.08)",
                  background: revenueMonth === m.value ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.03)",
                  color: revenueMonth === m.value ? "#A78BFA" : "#6B7280",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Iznos + konverzija */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 38, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                {revenueAmount.toLocaleString("sr-RS")} <span style={{ fontSize: 20, fontWeight: 600, color: "#A78BFA" }}>din</span>
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
                {filteredProUsers.length} Pro korisnik{filteredProUsers.length === 1 ? "" : "a"} × 990 din
                {revenueMonth !== "all" && (
                  <span style={{ marginLeft: 8, color: "#A78BFA" }}>
                    — {months.find(m => m.value === revenueMonth)?.label}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Konverzija</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#A78BFA" }}>
                {stats.totalUsers > 0 ? ((stats.proUsers / stats.totalUsers) * 100).toFixed(1) : "0.0"}%
              </div>
            </div>
          </div>

          {/* Mini bar chart — novi Pro po mjesecu */}
          <div>
            <div style={{ fontSize: 11, color: "#4B5563", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 10 }}>NOVI PRO KORISNICI PO MJESECU</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 60 }}>
              {chartData.map((c, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 10, color: "#A78BFA", fontWeight: 600 }}>{c.count > 0 ? c.count : ""}</div>
                  <div style={{
                    width: "100%", borderRadius: 4,
                    background: c.count > 0 ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.05)",
                    height: `${Math.max((c.count / chartMax) * 40, c.count > 0 ? 6 : 3)}px`,
                    transition: "height 0.3s",
                  }} />
                  <div style={{ fontSize: 9, color: "#4B5563", textAlign: "center" }}>{c.label}</div>
                </div>
              ))}
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
