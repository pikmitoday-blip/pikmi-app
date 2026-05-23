"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const NAV = [
  { href: "/admin",             label: "Pregled",        icon: "📊" },
  { href: "/admin/korisnici",   label: "Korisnici",      icon: "👥" },
  { href: "/admin/blog",        label: "Blog",           icon: "✍️" },
  { href: "/admin/landing",     label: "Landing editor", icon: "✏️" },
  { href: "/admin/stranice",    label: "Stranice",       icon: "📄" },
  { href: "/admin/podesavanja", label: "Podešavanja",    icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/login"); return; }

        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").split(",").map(e => e.trim().toLowerCase());
        if (!adminEmails.includes(user.email?.toLowerCase() ?? "")) {
          setStatus("denied");
          return;
        }
        setAdminEmail(user.email ?? "");
        setStatus("ok");
      } catch {
        setStatus("denied");
      }
    }
    checkAdmin();
  }, []);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0F" }}>
        <div style={{ color: "#6B7280", fontSize: 14 }}>Provjera pristupa...</div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0F", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#F87171" }}>Pristup odbijen</h1>
        <p style={{ fontSize: 14, color: "#6B7280", textAlign: "center", maxWidth: 340 }}>
          Nemaš admin privilegije. Kontaktiraj administratora platforme.
        </p>
        <Link href="/dashboard" style={{ color: "#A78BFA", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
          ← Nazad na Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0A0F", fontFamily: "'Satoshi', -apple-system, sans-serif" }}>

      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0, background: "#111116",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: "linear-gradient(135deg, #EF4444, #F97316)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>⚡</div>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>pikmi</span>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 4,
            background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
            fontSize: 10, fontWeight: 700, color: "#F87171", letterSpacing: "0.08em",
          }}>
            🔴 ADMIN PANEL
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "12px 10px", flex: 1 }}>
          {NAV.map(l => {
            const active = path === l.href || (l.href !== "/admin" && path.startsWith(l.href));
            return (
              <Link key={l.href} href={l.href} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8, marginBottom: 2,
                textDecoration: "none",
                background: active ? "rgba(239,68,68,0.12)" : "transparent",
                color: active ? "#FCA5A5" : "#9CA3AF",
                fontSize: 13, fontWeight: active ? 600 : 400,
                transition: "all 0.15s",
                border: active ? "1px solid rgba(239,68,68,0.2)" : "1px solid transparent",
              }}>
                <span style={{ fontSize: 15 }}>{l.icon}</span>
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px 10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Prijavljen kao</div>
            <div style={{ fontSize: 12, color: "#D1D5DB", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adminEmail}</div>
          </div>
          <Link href="/dashboard" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 12px", borderRadius: 8,
            textDecoration: "none", color: "#6B7280", fontSize: 12,
            transition: "color 0.15s",
          }}>
            ← Izlaz iz admin panela
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
