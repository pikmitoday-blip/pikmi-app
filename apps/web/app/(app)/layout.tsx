"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import PikmiLogo from "../components/PikmiLogo";
import { supabase } from "../../lib/supabase";
import { LanguageProvider, LOCALES, useLanguage, initLocale, type Locale } from "../../lib/i18n";
import { UserProvider } from "../../lib/UserContext";

interface ViewNotif {
  id: string;
  pitch_link_id: string;
  linkTitle: string;
  linkSlug: string;
  viewed_at: string;
  device: string | null;
}

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
      <UserProvider>
        <AppLayoutInner>{children}</AppLayoutInner>
      </UserProvider>
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
  const [notifications, setNotifications] = useState<ViewNotif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBell, setShowBell] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Zatvori bell dropdown klikom van njega
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowBell(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Instant sync kada korisnik sačuva ime/avatar/podatke na bilo kojoj stranici
  useEffect(() => {
    function onProfileChanged(e: Event) {
      const detail = (e as CustomEvent<Partial<SidebarProfile>>).detail;
      setProfile(prev => {
        const updated = { ...prev, ...detail };
        try { sessionStorage.setItem("pikmi-sidebar", JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
    window.addEventListener("pikmi-profile-changed", onProfileChanged);
    return () => window.removeEventListener("pikmi-profile-changed", onProfileChanged);
  }, []);

  // Inicijalizuj jezik iz localStorage
  useEffect(() => { initLocale(); }, []);

  useEffect(() => {
    const saved = localStorage.getItem("pikmi-theme") as "dark"|"light" | null;
    if (saved) { setTheme(saved); document.documentElement.dataset.theme = saved; }

    async function loadSidebarProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
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

          // Učitaj notifikacije — zadnjih 30 pregleda pitch linkova
          try {
            const { data: links } = await supabase
              .from("pitch_links")
              .select("id, title, slug")
              .eq("user_id", user.id);
            if (links && links.length > 0) {
              const linkIds = links.map(l => l.id);
              const { data: viewsData } = await supabase
                .from("link_views")
                .select("id, pitch_link_id, viewed_at, device")
                .in("pitch_link_id", linkIds)
                .order("viewed_at", { ascending: false })
                .limit(30);
              if (viewsData) {
                const enriched: ViewNotif[] = viewsData.map(v => ({
                  id: v.id,
                  pitch_link_id: v.pitch_link_id,
                  linkTitle: links.find(l => l.id === v.pitch_link_id)?.title || "—",
                  linkSlug: links.find(l => l.id === v.pitch_link_id)?.slug || "",
                  viewed_at: v.viewed_at,
                  device: v.device,
                }));
                setNotifications(enriched);
                // Unread = broj pregleda od poslednjeg otvaranja bell-a
                const lastSeen = localStorage.getItem("pikmi-bell-seen") || "1970-01-01";
                setUnreadCount(enriched.filter(n => n.viewed_at > lastSeen).length);
              }
            }
          } catch {}
          return;
        }
      } catch {}
    }

    async function manageSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
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
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        if (user) {
          await supabase.from("user_sessions")
            .delete()
            .eq("user_id", user.id)
            .eq("session_id", sessionId);
        }
        localStorage.removeItem("pikmi-session-id");
      }
    } catch {}
    // Resetuj temu i obrisi sve keširane podatke pri odjavljivanju
    localStorage.removeItem("pikmi-theme");
    localStorage.removeItem("pikmi-session-ts");
    localStorage.removeItem("pikmi-remember"); // sprečava auto-login pri sledećem posetu /login
    document.documentElement.dataset.theme = "dark";
    try { sessionStorage.clear(); } catch {}
    await supabase.auth.signOut();
    router.push("/login");
  }

  function openBell() {
    setShowBell(v => !v);
    if (!showBell) {
      // Označi sve kao pročitano
      const now = new Date().toISOString();
      localStorage.setItem("pikmi-bell-seen", now);
      setUnreadCount(0);
    }
  }

  function timeAgoNotif(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "upravo";
    if (mins < 60) return `pre ${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `pre ${hrs}h`;
    return `pre ${Math.floor(hrs / 24)}d`;
  }

  // Grupiše notifikacije po linku za prikaz
  const notifByLink = notifications.reduce((acc, n) => {
    if (!acc[n.pitch_link_id]) acc[n.pitch_link_id] = { title: n.linkTitle, slug: n.linkSlug, count: 0, last: n.viewed_at };
    acc[n.pitch_link_id].count++;
    if (n.viewed_at > acc[n.pitch_link_id].last) acc[n.pitch_link_id].last = n.viewed_at;
    return acc;
  }, {} as Record<string, { title: string; slug: string; count: number; last: string }>);

  const notifGroups = Object.entries(notifByLink).sort((a, b) => b[1].last.localeCompare(a[1].last));

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
    { href: "/outreach",     label: t("nav_outreach"),     icon: "✉️" },
    { href: "/billing",      label: t("nav_billing"),      icon: "💳" },
  ];

  const mobileLinks = [
    { href: "/dashboard",    label: t("mob_home"),      icon: "🏠" },
    { href: "/moj-profil",   label: t("mob_profile"),   icon: "👤" },
    { href: "/pitch-link",   label: t("mob_links"),     icon: "🔗" },
    { href: "/analytics",    label: t("mob_analytics"), icon: "📊" },
    { href: "/outreach",     label: t("mob_outreach"),  icon: "✉️" },
    { href: "/billing",      label: t("nav_billing"),   icon: "💳" },
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

        <div className="sidebar-footer">
          {/* Admin link — vidljiv samo adminima */}
          {isAdmin && (
            <Link href="/admin" style={{ textDecoration: "none", display: "block", marginBottom: 8 }}>
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

          <div className="sidebar-user" style={{ marginTop: 8, flexDirection: "column", gap: 4 }}>
            {/* Profil link — cela širina */}
            <Link href="/account" title="Podešavanja naloga" style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              textDecoration: "none", padding: "6px 8px", borderRadius: 8, transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt="avatar" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                : <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}>{profile.initials}</div>
              }
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.firstName} {profile.lastName}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{profile.plan === "pro" ? t("pro_plan") : t("free_plan")}</div>
              </div>
            </Link>
            {/* Odjava dugme — cela širina ispod profila */}
            <button onClick={handleLogout} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)",
              cursor: "pointer", color: "#F87171", fontSize: 12, fontWeight: 600,
              padding: "7px 12px", borderRadius: 8, transition: "all 0.15s", fontFamily: "inherit",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.18)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(248,113,113,0.4)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.08)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(248,113,113,0.18)";
            }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Odjava
            </button>
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
      {/* ── Mobile top header ── */}
      <header className="mobile-top-header">
        {/* Logo — samo tekst */}
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 900, fontSize: 20, background: "linear-gradient(135deg, #7C3AED, #3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            pikmi
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Bell */}
          <div ref={bellRef} style={{ position: "relative" }}>
            <button onClick={openBell} style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 17, position: "relative",
            }}>
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: -2, right: -2,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#EF4444", color: "#fff",
                  fontSize: 10, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid var(--bg)",
                }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showBell && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 1000,
                width: 300, maxHeight: 380, overflowY: "auto",
                background: "var(--surface, #111116)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              }}>
                <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                  🔔 Pregledi pitch linkova
                </div>

                {notifGroups.length === 0 ? (
                  <div style={{ padding: "28px 16px", textAlign: "center", color: "#4B5563", fontSize: 13 }}>
                    Još nema pregleda.
                  </div>
                ) : (
                  notifGroups.map(([id, g]) => (
                    <Link key={id} href={`/analytics`} onClick={() => setShowBell(false)} style={{ textDecoration: "none" }}>
                      <div style={{
                        padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                        display: "flex", alignItems: "center", gap: 12,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16, fontWeight: 800, color: "#A78BFA",
                        }}>
                          {g.count}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {g.title}
                          </div>
                          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                            {g.count === 1 ? "1 pregled" : `${g.count} pregleda`} · {timeAgoNotif(g.last)}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: "#4B5563", fontFamily: "monospace" }}>/{g.slug}</span>
                      </div>
                    </Link>
                  ))
                )}

                <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                  <Link href="/analytics" onClick={() => setShowBell(false)} style={{ fontSize: 12, color: "#A78BFA", textDecoration: "none", fontWeight: 600 }}>
                    Svi pregledi →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Avatar → /account */}
          <Link href="/account" style={{ textDecoration: "none" }}>
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt="avatar" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(124,58,237,0.4)" }} />
              : <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, color: "#fff",
                }}>
                  {profile.initials || "?"}
                </div>
            }
          </Link>
        </div>
      </header>

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
      </nav>
    </div>
  );
}
