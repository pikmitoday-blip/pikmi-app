"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PikmiLogo from "../components/PikmiLogo";
import { supabase } from "../../lib/supabase";

const links = [
  { href: "/dashboard",    label: "Dashboard",    icon: "🏠" },
  { href: "/moj-profil",   label: "Moj profil",   icon: "👤" },
  { href: "/pitch-link",   label: "Pitch linkovi", icon: "🔗" },
  { href: "/analytics",    label: "Analitika",    icon: "📊" },
  { href: "/profile-edit", label: "Uredi profil",  icon: "✏️" },
  { href: "/outreach",     label: "Outreach kit",  icon: "✉️" },
  { href: "/billing",      label: "Naplata",       icon: "💳" },
];

// Samo 5 ključnih linkova u mobile bottom navu
const mobileLinks = [
  { href: "/dashboard",    label: "Home",    icon: "🏠" },
  { href: "/moj-profil",   label: "Profil",  icon: "👤" },
  { href: "/pitch-link",   label: "Linkovi", icon: "🔗" },
  { href: "/analytics",    label: "Analitika", icon: "📊" },
  { href: "/outreach",     label: "Outreach", icon: "✉️" },
];

interface SidebarProfile { firstName: string; lastName: string; initials: string; serviceTitle: string; avatarUrl: string; }
const DEFAULT_SIDEBAR: SidebarProfile = { firstName: "Marko", lastName: "Nikolić", initials: "M", serviceTitle: "Full-stack developer", avatarUrl: "" };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"dark"|"light">("dark");
  const [profile, setProfile] = useState<SidebarProfile>(DEFAULT_SIDEBAR);

  useEffect(() => {
    const saved = localStorage.getItem("pikmi-theme") as "dark"|"light" | null;
    if (saved) { setTheme(saved); document.documentElement.dataset.theme = saved; }

    async function loadSidebarProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("first_name, last_name, profile_data")
            .eq("user_id", user.id)
            .single();
          if (data) {
            const pd = data.profile_data as Record<string, string> | null;
            setProfile({
              firstName: data.first_name || DEFAULT_SIDEBAR.firstName,
              lastName: data.last_name || DEFAULT_SIDEBAR.lastName,
              initials: (data.first_name?.[0] ?? "") + (data.last_name?.[0] ?? "") || DEFAULT_SIDEBAR.initials,
              serviceTitle: pd?.serviceTitle ? (pd.serviceTitle as string).split("\n")[0].trim() : DEFAULT_SIDEBAR.serviceTitle,
              avatarUrl: (pd?.avatarUrl as string) || "",
            });
          }
          return;
        }
      } catch {}
    }

    async function manageSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Provjeri da li postoji STARI session_id u localStorage (prije nego što kreiramo novi)
        const existingSessionId = localStorage.getItem("pikmi-session-id");
        let sessionId = existingSessionId;

        if (!sessionId) {
          // Prva prijava na ovom uređaju — kreiraj novi ID
          sessionId = crypto.randomUUID();
          localStorage.setItem("pikmi-session-id", sessionId);
        } else {
          // Ima stari ID — provjeri da li još postoji u bazi
          const { data: existing } = await supabase
            .from("user_sessions")
            .select("id")
            .eq("user_id", user.id)
            .eq("session_id", sessionId)
            .maybeSingle();

          // Stari ID postoji u localStorage ali ne u bazi → uređaj je istisnuo ovaj
          if (!existing) {
            await supabase.auth.signOut();
            localStorage.removeItem("pikmi-session-id");
            router.push("/login?reason=limit");
            return;
          }
        }

        // Upsert ove sesije (osvježi last_active)
        await supabase.from("user_sessions").upsert({
          user_id: user.id,
          session_id: sessionId,
          device_info: navigator.userAgent.substring(0, 250),
          last_active: new Date().toISOString(),
        }, { onConflict: "user_id,session_id" });

        // Dohvati sve sesije, sortiraj po najnovijim
        const { data: sessions } = await supabase
          .from("user_sessions")
          .select("id, session_id, last_active")
          .eq("user_id", user.id)
          .order("last_active", { ascending: false });

        // Ako ima više od 3, obriši najstarije
        if (sessions && sessions.length > 3) {
          const toDelete = sessions.slice(3).map(s => s.id);
          await supabase.from("user_sessions").delete().in("id", toDelete);
        }
      } catch {}
    }

    loadSidebarProfile();
    manageSession();
  }, []);

  async function handleLogout() {
    try {
      const sessionId = localStorage.getItem("pikmi-session-id");
      if (sessionId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("user_sessions")
            .delete()
            .eq("user_id", user.id)
            .eq("session_id", sessionId);
        }
        localStorage.removeItem("pikmi-session-id");
      }
    } catch {}
    await supabase.auth.signOut();
    router.push("/login");
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("pikmi-theme", next);
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ cursor: "default" }}>
          <PikmiLogo size={30} />
          pikmi
        </div>

        <div className="sidebar-section">Navigacija</div>
        <nav className="sidebar-nav">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={`sidebar-link ${path === l.href ? "active" : ""}`}>
              <span style={{ fontSize: 16 }}>{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Profile preview card */}
        <Link href="/profile-edit" style={{ textDecoration: "none", display: "block", margin: "8px 0 4px" }}>
          <div style={{
            margin: "0 4px",
            padding: "14px",
            borderRadius: 12,
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.2)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.15)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.4)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.08)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.2)";
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Moj profil</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt="avatar" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, boxShadow: "0 0 12px rgba(124,58,237,0.5)" }} />
                : <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 800, color: "white",
                    boxShadow: "0 0 12px rgba(124,58,237,0.5)",
                  }}>{profile.initials}</div>
              }
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>{profile.firstName} {profile.lastName}</div>
                <div style={{ fontSize: 11, color: "#A78BFA", marginTop: 2 }}>{profile.serviceTitle}</div>
              </div>
            </div>
            {/* Mini profile mockup */}
            <div style={{
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(0,0,0,0.2)",
            }}>
              {/* Fake top bar */}
              <div style={{ height: 22, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", padding: "0 8px", gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", maxWidth: 60 }} />
              </div>
              {/* Fake content */}
              <div style={{ padding: "8px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 6 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #3B82F6)" }} />
                  <div style={{ width: 50, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
                  <div style={{ width: 36, height: 3, borderRadius: 2, background: "rgba(167,139,250,0.4)" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{ height: 20, borderRadius: 4, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)" }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "#A78BFA", fontWeight: 600, textAlign: "center" }}>
              Pogledaj template →
            </div>
          </div>
        </Link>

        <div className="sidebar-footer">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)",
              background: "var(--card)", cursor: "pointer", fontFamily: "inherit",
              fontSize: 13, color: "var(--text2)", marginBottom: 8, transition: "all 0.15s",
            }}
          >
            <span>{theme === "dark" ? "🌙 Tamna tema" : "☀️ Svetla tema"}</span>
            <div style={{
              width: 36, height: 20, borderRadius: 100, background: theme === "light" ? "var(--purple)" : "var(--border)",
              position: "relative", transition: "background 0.2s", flexShrink: 0,
            }}>
              <div style={{
                position: "absolute", top: 2, left: theme === "light" ? 18 : 2,
                width: 16, height: 16, borderRadius: "50%", background: "white",
                transition: "left 0.2s",
              }} />
            </div>
          </button>

          <div className="sidebar-user">
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt="avatar" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              : <div className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>{profile.initials}</div>
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{profile.firstName} {profile.lastName}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>free plan</div>
            </div>
            <button onClick={handleLogout} title="Odjavi se" style={{
              background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)",
              cursor: "pointer", color: "#F87171", fontSize: 14, padding: "6px 8px",
              borderRadius: 8, transition: "all 0.15s", fontWeight: 600,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.25)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(248,113,113,0.5)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.12)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(248,113,113,0.25)";
            }}
            >⏻</button>
          </div>

          {/* Policy linkovi */}
          <div style={{ display: "flex", gap: 10, paddingTop: 10, justifyContent: "center" }}>
            <a href="/uslovi" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: "var(--text3)", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text2)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text3)")}>
              Uslovi
            </a>
            <span style={{ fontSize: 11, color: "var(--text3)" }}>·</span>
            <a href="/privatnost" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: "var(--text3)", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text2)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text3)")}>
              Privatnost
            </a>
          </div>
        </div>
      </aside>
      <main className="main-content">{children}</main>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav">
        {mobileLinks.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`mobile-nav-item ${path === l.href ? "active" : ""}`}
          >
            <div className="mobile-nav-icon">{l.icon}</div>
            <span>{l.label}</span>
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="mobile-nav-item"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 0 }}
        >
          <div className="mobile-nav-icon">⏻</div>
          <span>Odjava</span>
        </button>
      </nav>
    </div>
  );
}
