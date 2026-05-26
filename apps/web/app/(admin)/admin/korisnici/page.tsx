"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  plan: string;
  created_at: string;
  profile_url: string | null;
  stripe_subscription_id: string | null;
  linkCount?: number;
}

export default function AdminKorisnici() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"sve" | "free" | "pro">("sve");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email, plan, created_at, profile_url, stripe_subscription_id")
        .order("created_at", { ascending: false });

      const { data: links } = await supabase
        .from("pitch_links")
        .select("user_id");

      const linkCounts: Record<string, number> = {};
      (links ?? []).forEach(l => { linkCounts[l.user_id] = (linkCounts[l.user_id] ?? 0) + 1; });

      setUsers((profiles ?? []).map(p => ({ ...p, linkCount: linkCounts[p.user_id] ?? 0 })));
    } catch {}
    setLoading(false);
  }

  async function changePlan(userId: string, newPlan: "free" | "pro") {
    setActionLoading(userId + newPlan);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ plan: newPlan })
        .eq("user_id", userId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, plan: newPlan } : u));
      showToast(`Plan promenjen u ${newPlan.toUpperCase()}`, true);
    } catch {
      showToast("Greška pri promjeni plana", false);
    }
    setActionLoading(null);
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Obrisati korisnika "${name}"? Ova akcija je trajna.`)) return;
    setActionLoading(userId + "del");
    try {
      await supabase.from("pitch_links").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("user_id", userId);
      setUsers(prev => prev.filter(u => u.user_id !== userId));
      showToast(`Korisnik "${name}" obrisan`, true);
    } catch {
      showToast("Greška pri brisanju", false);
    }
    setActionLoading(null);
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) || (u.profile_url ?? "").includes(q) || (u.email ?? "").toLowerCase().includes(q);
    const matchPlan = planFilter === "sve" || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}mj`;
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          padding: "12px 20px", borderRadius: 10,
          background: toast.ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
          border: `1px solid ${toast.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: toast.ok ? "#4ADE80" : "#F87171",
          fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}>
          {toast.ok ? "✓" : "⚠"} {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F9FAFB", marginBottom: 4 }}>Korisnici</h1>
        <p style={{ fontSize: 13, color: "#6B7280" }}>{users.length} registrovanih korisnika</p>
      </div>

      {/* Filteri */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pretraži po imenu ili URL-u..."
          style={{
            flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 8,
            background: "#111116", border: "1px solid rgba(255,255,255,0.1)",
            color: "#F9FAFB", fontSize: 13, outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {(["sve", "free", "pro"] as const).map(p => (
            <button key={p} onClick={() => setPlanFilter(p)} style={{
              padding: "8px 16px", borderRadius: 8, cursor: "pointer",
              fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
              background: planFilter === p ? (p === "pro" ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.08)") : "transparent",
              border: planFilter === p ? `1px solid ${p === "pro" ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.15)"}` : "1px solid rgba(255,255,255,0.06)",
              color: planFilter === p ? (p === "pro" ? "#A78BFA" : "#D1D5DB") : "#4B5563",
            }}>
              {p === "sve" ? "Svi" : p === "free" ? "Free" : "⚡ Pro"}
            </button>
          ))}
        </div>
        <button onClick={loadUsers} style={{
          padding: "8px 14px", borderRadius: 8, cursor: "pointer",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
          color: "#6B7280", fontSize: 12,
        }}>
          ↻ Osvježi
        </button>
      </div>

      {/* Tabela */}
      <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#4B5563", fontSize: 13 }}>Učitavanje...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#4B5563", fontSize: 13 }}>Nema rezultata</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Korisnik", "Plan", "Linkovi", "Registrovan", "Akcije"].map(h => (
                  <th key={h} style={{ padding: "11px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#4B5563", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.user_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "13px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: "#fff",
                      }}>
                        {(u.first_name?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#E5E7EB" }}>
                          {u.first_name} {u.last_name}
                        </div>
                        {u.email && (
                          <a href={`mailto:${u.email}`}
                            style={{ fontSize: 11, color: "#6B7280", textDecoration: "none", display: "block" }}>
                            {u.email}
                          </a>
                        )}
                        {u.profile_url && (
                          <a href={`/${u.profile_url}`} target="_blank" rel="noreferrer"
                            style={{ fontSize: 11, color: "#4B5563", textDecoration: "none", display: "block" }}>
                            /{u.profile_url} ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                      background: u.plan === "pro" ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)",
                      color: u.plan === "pro" ? "#A78BFA" : "#6B7280",
                      border: `1px solid ${u.plan === "pro" ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.06)"}`,
                    }}>
                      {u.plan === "pro" ? "⚡ PRO" : "FREE"}
                    </span>
                  </td>
                  <td style={{ padding: "13px 20px", fontSize: 13, color: "#6B7280" }}>
                    {u.linkCount ?? 0}
                  </td>
                  <td style={{ padding: "13px 20px", fontSize: 12, color: "#4B5563" }}>
                    {timeAgo(u.created_at)} ago
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {u.plan !== "pro" ? (
                        <button
                          onClick={() => changePlan(u.user_id, "pro")}
                          disabled={actionLoading === u.user_id + "pro"}
                          style={{
                            padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                            fontSize: 11, fontWeight: 600,
                            background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
                            color: "#A78BFA", opacity: actionLoading === u.user_id + "pro" ? 0.5 : 1,
                          }}>
                          ⚡ Pro
                        </button>
                      ) : (
                        <button
                          onClick={() => changePlan(u.user_id, "free")}
                          disabled={actionLoading === u.user_id + "free"}
                          style={{
                            padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                            fontSize: 11, fontWeight: 600,
                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                            color: "#9CA3AF", opacity: actionLoading === u.user_id + "free" ? 0.5 : 1,
                          }}>
                          → Free
                        </button>
                      )}
                      <button
                        onClick={() => deleteUser(u.user_id, `${u.first_name} ${u.last_name}`)}
                        disabled={actionLoading === u.user_id + "del"}
                        style={{
                          padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                          fontSize: 11, fontWeight: 600,
                          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                          color: "#F87171", opacity: actionLoading === u.user_id + "del" ? 0.5 : 1,
                        }}>
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: "#374151" }}>
        Prikazano {filtered.length} od {users.length} korisnika
      </div>
    </div>
  );
}
