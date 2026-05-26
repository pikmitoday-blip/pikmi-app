"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

interface ProfileRow {
  user_id: string;
  first_name: string;
  last_name: string;
  plan: string;
  created_at: string;
  plan_churned_at: string | null;
}

interface Stats {
  totalUsers: number;
  proUsers: number;
  totalLinks: number;
  totalViews: number;
  newUsersToday: number;
  newUsersWeek: number;
}

interface DateRange {
  from: string; // YYYY-MM-DD or ""
  to: string;   // YYYY-MM-DD or ""
  label: string;
}

function today() { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number) { return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10); }
function startOfMonth(offset = 0) {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 10);
}
function endOfMonth(offset = 0) {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset + 1); d.setDate(0);
  return d.toISOString().slice(0, 10);
}
function startOfYear() { return `${new Date().getFullYear()}-01-01`; }

const PRESETS: { label: string; from: string; to: string }[] = [
  { label: "Svi aktivni",    from: "",            to: "" },
  { label: "Danas",          from: today(),       to: today() },
  { label: "Zadnjih 7 dana", from: daysAgo(7),    to: today() },
  { label: "Ovaj mesec",     from: startOfMonth(),to: endOfMonth() },
  { label: "Prošli mesec",   from: startOfMonth(-1), to: endOfMonth(-1) },
  { label: "Ova godina",     from: startOfYear(), to: today() },
];

// Generisanje poslednjih N meseci kao "YYYY-MM" stringova (za chart)
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
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "", label: "Svi aktivni" });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Zatvori dropdown klikom van njega
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [profilesRes, linksRes] = await Promise.all([
          supabase.from("profiles").select("user_id, first_name, last_name, plan, created_at, plan_churned_at"),
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

  // Prihod za odabrani period
  const filteredProUsers = allProfiles.filter(p => {
    if (p.plan !== "pro") return false;
    if (!dateRange.from && !dateRange.to) return true;
    const d = p.created_at?.slice(0, 10) ?? "";
    if (dateRange.from && d < dateRange.from) return false;
    if (dateRange.to && d > dateRange.to) return false;
    return true;
  });

  const revenueAmount = filteredProUsers.length * 990;

  function applyPreset(preset: typeof PRESETS[0]) {
    setDateRange({ from: preset.from, to: preset.to, label: preset.label });
    setCustomFrom(preset.from);
    setCustomTo(preset.to);
    setDropdownOpen(false);
  }

  function applyCustom() {
    if (!customFrom && !customTo) {
      setDateRange({ from: "", to: "", label: "Svi aktivni" });
    } else {
      const fmt = (d: string) => d ? new Date(d).toLocaleDateString("sr-RS", { day: "numeric", month: "short", year: "numeric" }) : "...";
      setDateRange({ from: customFrom, to: customTo, label: `${fmt(customFrom)} — ${fmt(customTo)}` });
    }
    setDropdownOpen(false);
  }

  // Churn ovog meseca
  const thisMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const churnThisMonth = allProfiles.filter(p =>
    p.plan_churned_at && p.plan_churned_at.slice(0, 7) === thisMonth
  ).length;

  // Prosječan broj linkova po korisniku
  const avgLinksPerUser = stats && stats.totalUsers > 0
    ? (stats.totalLinks / stats.totalUsers)
    : 0;
  const avgLinksColor = avgLinksPerUser >= 5 ? "#4ADE80" : avgLinksPerUser >= 3 ? "#FBBF24" : "#F87171";
  const avgLinksLabel = avgLinksPerUser >= 5 ? "Odlično 🚀" : avgLinksPerUser >= 3 ? "Solidno 👍" : "Activation problem ⚠️";

  // Bar chart — novi Pro po mesecu (zadnjih 6)
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
            PROCENJENI PRIHOD / MESEC
          </div>

          {/* Filter dropdown */}
          <div ref={dropdownRef} style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 14px", borderRadius: 8,
                border: "1px solid rgba(124,58,237,0.4)",
                background: "rgba(124,58,237,0.15)",
                color: "#A78BFA", fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              📅 {dateRange.label}
              <span style={{ fontSize: 10, opacity: 0.7 }}>{dropdownOpen ? "▲" : "▼"}</span>
            </button>

            {dropdownOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
                background: "#18181f", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, padding: 16, minWidth: 280,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}>
                {/* Presets */}
                <div style={{ fontSize: 10, color: "#4B5563", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>BRZI ODABIR</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 16 }}>
                  {PRESETS.map(p => (
                    <button key={p.label} onClick={() => applyPreset(p)} style={{
                      textAlign: "left", padding: "7px 10px", borderRadius: 6, border: "none",
                      background: dateRange.label === p.label ? "rgba(124,58,237,0.2)" : "transparent",
                      color: dateRange.label === p.label ? "#A78BFA" : "#9CA3AF",
                      fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: dateRange.label === p.label ? 600 : 400,
                      transition: "all 0.1s",
                    }}>
                      {dateRange.label === p.label ? "✓ " : "   "}{p.label}
                    </button>
                  ))}
                </div>

                {/* Custom range */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
                  <div style={{ fontSize: 10, color: "#4B5563", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 10 }}>PRILAGOĐENI PERIOD</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Od</div>
                      <input
                        type="date"
                        value={customFrom}
                        onChange={e => setCustomFrom(e.target.value)}
                        style={{
                          width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 6, padding: "6px 8px", color: "#F9FAFB", fontSize: 12,
                          fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                          colorScheme: "dark",
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Do</div>
                      <input
                        type="date"
                        value={customTo}
                        onChange={e => setCustomTo(e.target.value)}
                        style={{
                          width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 6, padding: "6px 8px", color: "#F9FAFB", fontSize: 12,
                          fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                          colorScheme: "dark",
                        }}
                      />
                    </div>
                  </div>
                  <button onClick={applyCustom} style={{
                    width: "100%", padding: "8px", borderRadius: 7,
                    background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
                    border: "none", color: "#fff", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    Primeni period
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Iznos + konverzija */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 38, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                {revenueAmount.toLocaleString("sr-RS")} <span style={{ fontSize: 20, fontWeight: 600, color: "#A78BFA" }}>din</span>
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
                {filteredProUsers.length} Pro korisnik{filteredProUsers.length === 1 ? "" : "a"} × 990 din
                {dateRange.label !== "Svi aktivni" && (
                  <span style={{ marginLeft: 8, color: "#A78BFA" }}>— {dateRange.label}</span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Konverzija</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#A78BFA" }}>
                  {stats.totalUsers > 0 ? ((stats.proUsers / stats.totalUsers) * 100).toFixed(1) : "0.0"}%
                </div>
              </div>
              <div style={{ textAlign: "right", paddingLeft: 24, borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Otkazano ovog meseca</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: churnThisMonth > 0 ? "#F87171" : "#4ADE80" }}>
                  {churnThisMonth}
                </div>
                {churnThisMonth > 0 && stats.proUsers > 0 && (
                  <div style={{ fontSize: 11, color: "#F87171", marginTop: 2 }}>
                    churn {((churnThisMonth / (stats.proUsers + churnThisMonth)) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", paddingLeft: 24, borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Prosj. linkova / korisnik</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: avgLinksColor }}>
                  {avgLinksPerUser.toFixed(1)}
                </div>
                <div style={{ fontSize: 11, color: avgLinksColor, marginTop: 2 }}>
                  {avgLinksLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Mini bar chart — novi Pro po mjesecu */}
          <div>
            <div style={{ fontSize: 11, color: "#4B5563", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 10 }}>NOVI PRO KORISNICI PO MESECU</div>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 24 }}>
        {[
          { href: "/admin/korisnici", icon: "👥", label: "Upravljaj korisnicima" },
          { href: "/admin/blog",      icon: "✍️", label: "Blog postovi" },
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
