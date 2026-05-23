"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PikmiLogo from "../components/PikmiLogo";
import { supabase } from "../../lib/supabase";
import { LanguageProvider, LOCALES, useLanguage, initLocale, type Locale } from "../../lib/i18n";

// Nav links su definirani unutar komponente da mogu koristiti prijevode
interface SidebarProfile { firstName: string; lastName: string; initials: string; serviceTitle: string; avatarUrl: string; plan: string; }
const EMPTY_SIDEBAR: SidebarProfile = { firstName: "", lastName: "", initials: "", serviceTitle: "", avatarUrl: "", plan: "free" };

function getCachedSidebar(): SidebarProfile {
  try {
    const c = sessionStorage.getItem("pikmi-sidebar");
    if (c) return JSON.parse(c);
  } catch {}
  return EMPTY_SIDEBAR;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </LanguageProvider>
  );
}

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useLanguage();
  const path = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"dark"|"light">("dark");
  const [profile, setProfile] = useState<SidebarProfile>(getCachedSidebar);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Inicijalizuj jezik iz localStorage
  useEffect(() => { initLocale(); }, []);

  useEffect(() => {
    const saved = localStorage.getItem("pikmi-theme") as "dark"|"light" | null;
    if (saved) { setTheme(saved); document.documentElement.dataset.theme = saved; }

    async function loadSidebarProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").split(",").map(e => e.trim().toLowerCase());
          if (adminEmails.includes(user.email?.toLowerCase() ?? "")) setIsAdmin(true);
          const { data } = await supabase
            .from("profiles")
            .select("first_name, last_name, profile_data, plan, profile_url")
            .eq("user_id", user.id)
            .single();

          // Novi korisnik koji nije završio onboarding → redirect
          if (!data?.profile_url && !path.includes("/onboarding") && !path.includes("/profile-edit")) {
            router.replace("/onboarding");
            return;
          }

          if (data) {
            const pd = data.profile_data as Record<string, string> | null;
            const updated: SidebarProfile = {
              firstName: data.first_name || "",
              lastName: data.last_name || "",
              initials: (data.first_name?.[0] ?? "") + (data.last_name?.[0] ?? ""),
              serviceTitle: pd?.serviceTitle ? (pd.serviceTitle as string).split("\n")[0].trim() : "",
              avatarUrl: (pd?.avatarUrl as string) || "",
              plan: data.plan || "free",
            };
            setProfile(updated);
            try { sessionStorage.setItem("pikmi-sidebar", JSON.stringify(updated)); } catch {}
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
    // Resetuj temu i obrisi cache pri odjavljivanju
    localStorage.removeItem("pikmi-theme");
    localStorage.removeItem("pikmi-session-ts");
    document.documentElement.dataset.theme = "dark";
    try { sessionStorage.clear(); } catch {}
    await supabase.auth.signOut();
    router.push("/login");
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("pikmi-theme", next);
  }

  const navLinks = [
    { href: "/dashboard",    label: t("nav_dashboard"),    icon: "🏠" },
    { href: "/moj-profil",   label: t("nav_my_profile"),   icon: "👤" },
    { href: "/pitch-link",   label: t("nav_pitch_links"),  icon: "🔗" },
    { href: "/analytics",    label: t("nav_analytics"),    icon: "📊" },
    { href: "/profile-edit", label: t("nav_edit_profile"), icon: "✏️" },
    { href: "/outreach",     label: t("nav_outreach"),     icon: "✉️" },
    { href: "/billing",      label: t("nav_billing"),      icon: "💳" },
  ];

  const mobileLinks = [
    { href: "/dashboard",    label: t("mob_home"),      icon: "🏠" },
    { href: "/moj-profil",   label: t("mob_profile"),   icon: "👤" },
    { href: "/pitch-link",   label: t("mob_links"),     icon: "🔗" },
    { href: "/analytics",    label: t("mob_analytics"), icon: "📊" },
    { href: "/outreach",     label: t("mob_outreach"),  icon: "✉️" },
  ];

  const currentLocale = LOCALES.find(l => l.value === locale)!;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ cursor: "default" }}>
          <PikmiLogo size={30} />
          pikmi
        </div>

        <div className="sidebar-section">{t("navigation")}</div>
        <nav className="sidebar-nav">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} className={`sidebar-link ${path === l.href ? "active" : ""}`}>
              <span style={{ fontSize: 16 }}>{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Admin link — vidljiv samo adminima */}
        {isAdmin && (
          <Link href="/admin" style={{ textDecoration: "none", display: "block", margin: "4px 4px 0" }}>
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              display: "flex", alignItems: "center", gap: 8,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.35)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.2)";
            }}>
              <span style={{ fontSize: 14 }}>⚡</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#F87171" }}>{t("nav_admin")}</span>
              <span style={{ marginLeft: "auto", fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(239,68,68,0.15)", color: "#F87171", fontWeight: 700, letterSpacing: "0.05em" }}>ADMIN</span>
            </div>
          </Link>
        )}

        <div className="sidebar-footer">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)",
              background: "var(--card)", cursor: "pointer", fontFamily: "inherit",
              fontSize: 13, color: "var(--text2)", marginBottom: 0, transition: "all 0.15s",
            }}
          >
            <span>{theme === "dark" ? `🌙 ${t("dark_theme")}` : `☀️ ${t("light_theme")}`}</span>
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

          {/* Language selector */}
          <div style={{ position: "relative", marginTop: 8 }}>
            <button
              onClick={() => setShowLangMenu(v => !v)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)",
                background: "var(--card)", cursor: "pointer", fontFamily: "inherit",
                fontSize: 13, color: "var(--text2)", transition: "all 0.15s",
              }}
            >
              <span>{currentLocale.flag} {currentLocale.label}</span>
              <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>
            </button>

            {showLangMenu && (
              <>
                {/* Overlay za zatvaranje */}
                <div
                  onClick={() => setShowLangMenu(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 99 }}
                />
                <div style={{
                  position: "absolute", bottom: "calc(100% + 6px)", left: 0, right: 0,
                  background: "var(--bg, #0E0E12)", border: "1px solid var(--border)",
                  borderRadius: 10, overflow: "hidden", zIndex: 9999,
                  boxShadow: "0 -8px 32px rgba(0,0,0,0.7)",
                  backdropFilter: "none",
                }}>
                  {LOCALES.map(loc => (
                    <button
                      key={loc.value}
                      onClick={() => { setLocale(loc.value as Locale); setShowLangMenu(false); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", background: locale === loc.value ? "rgba(124,58,237,0.2)" : "var(--bg, #0E0E12)",
                        border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
                        fontFamily: "inherit", fontSize: 13, color: locale === loc.value ? "#A78BFA" : "var(--text2)",
                        fontWeight: locale === loc.value ? 700 : 400, transition: "background 0.1s",
                        textAlign: "left",
                      }}
                      onMouseEnter={e => { if (locale !== loc.value) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={e => { if (locale !== loc.value) (e.currentTarget as HTMLElement).style.background = "var(--bg, #0E0E12)"; }}
                    >
                      <span style={{ fontSize: 16 }}>{loc.flag}</span>
                      {loc.label}
                      {locale === loc.value && <span style={{ marginLeft: "auto", fontSize: 11 }}>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="sidebar-user" style={{ marginTop: 8 }}>
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt="avatar" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              : <div className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>{profile.initials}</div>
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{profile.firstName} {profile.lastName}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>{profile.plan === "pro" ? t("pro_plan") : t("free_plan")}</div>
            </div>
            <button onClick={handleLogout} title={t("nav_logout")} style={{
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

          {/* Policy linkovi — samo na dashboardu */}
          {path === "/dashboard" && (
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
          )}
        </div>
      </aside>
      <main className="main-content">
        {children}
        {/* Policy linkovi — samo mobilna verzija, samo na dashboardu */}
        {path === "/dashboard" && (
        <div className="mobile-only" style={{ textAlign: "center", padding: "8px 0 24px", display: "flex", justifyContent: "center", gap: 16 }}>
          <a href="/uslovi" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: "var(--text3)", textDecoration: "none" }}>
            Uslovi korišćenja
          </a>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>·</span>
          <a href="/privatnost" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: "var(--text3)", textDecoration: "none" }}>
            Politika privatnosti
          </a>
        </div>
        )}
      </main>

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
          <span>{t("nav_logout")}</span>
        </button>
      </nav>
    </div>
  );
}
