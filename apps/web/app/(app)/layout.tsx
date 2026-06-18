"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import PikmiLogo from "../components/PikmiLogo";
import { supabase } from "../../lib/supabase";
import { pixel } from "../../lib/pixel";
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
  const [showAllNotifs, setShowAllNotifs] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const desktopBellRef = useRef<HTMLDivElement>(null);
  const [showBugReport, setShowBugReport] = useState(false);
  const [bugMsg,        setBugMsg]        = useState("");
  const [bugSending,    setBugSending]    = useState(false);
  const [bugSent,       setBugSent]       = useState(false);

  // ── Setup fullscreen (popunjavanje portfolija pri registraciji → bez menija) ──
  const [setupFlag, setSetupFlag] = useState<boolean>(() => {
    try { return typeof window !== "undefined" && sessionStorage.getItem("pikmi-setup-active") === "1"; } catch { return false; }
  });
  // Klijentska navigacija ne re-mountuje layout → re-čitaj flag na svaku promenu rute.
  useEffect(() => {
    try { setSetupFlag(sessionStorage.getItem("pikmi-setup-active") === "1"); } catch {}
  }, [path]);
  // Meni se krije samo na /moj-profil dok traje setup.
  const setupFullscreen = setupFlag && path === "/moj-profil";

  // ── Trial expired ─────────────────────────────────────────────────────────
  const [trialExpired,    setTrialExpired]    = useState(false);
  const [proPrice,        setProPrice]        = useState("990 din");
  const [pro3Price,       setPro3Price]       = useState("2490 din");
  const [checkoutLoading, setCheckoutLoading] = useState<"monthly" | "3m" | null>(null);

  async function handleTrialCheckout(plan: "monthly" | "3m") {
    setCheckoutLoading(plan);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const priceId = plan === "3m" ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_3M : undefined;
      pixel.initiateCheckout(plan === "3m" ? 2190 : 990, session.user.id, session.user.email);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, userEmail: session.user.email, priceId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {}
    setCheckoutLoading(null);
  }

  async function sendBugReport() {
    if (!bugMsg.trim() || bugSending) return;
    setBugSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch("/api/bug-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ message: bugMsg }),
      });
      setBugSent(true);
      setBugMsg("");
      setTimeout(() => { setShowBugReport(false); setBugSent(false); }, 2000);
    } catch {}
    setBugSending(false);
  }

  // Zatvori bell dropdown klikom van njega
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const inMobile = bellRef.current && bellRef.current.contains(e.target as Node);
      const inDesktop = desktopBellRef.current && desktopBellRef.current.contains(e.target as Node);
      if (!inMobile && !inDesktop) setShowBell(false);
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
            .select("first_name, last_name, profile_data, plan, profile_url, trial_ends_at")
            .eq("user_id", user.id)
            .single();

          // Setup mod (needsSetup) → sinhronizuj flag iz baze (izvor istine na svežem učitavanju).
          const pdSetup = (data?.profile_data as any) || {};
          const inSetup = !!pdSetup.needsSetup;
          try {
            if (inSetup) sessionStorage.setItem("pikmi-setup-active", "1");
            else sessionStorage.removeItem("pikmi-setup-active");
          } catch {}
          setSetupFlag(inSetup);

          // Provjeri da li je free trial istekao (7 dana od registracije,
          // ili je trial odbijen zbog već iskorišćene IP adrese → trial_ends_at u prošlosti)
          if (data?.plan === "free" || !data?.plan) {
            const createdAt = new Date(user.created_at).getTime();
            const daysSince = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
            const trialEnded = data?.trial_ends_at ? new Date(data.trial_ends_at).getTime() < Date.now() : false;
            if (daysSince >= 7 || trialEnded) {
              setTrialExpired(true);
              // Učitaj cijene iz platform_settings
              try {
                const { data: settings } = await supabase
                  .from("platform_settings")
                  .select("key, value")
                  .in("key", ["pricing_pro_price", "pricing_pro3_price"]);
                if (settings) {
                  const pp = settings.find((s: any) => s.key === "pricing_pro_price")?.value;
                  const p3 = settings.find((s: any) => s.key === "pricing_pro3_price")?.value;
                  if (pp) setProPrice(pp);
                  if (p3) setPro3Price(p3);
                }
              } catch {}
            }
          }

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
  ];

  const mobileLinks = [
    { href: "/dashboard",    label: t("mob_home"),      icon: "🏠" },
    { href: "/moj-profil",   label: t("mob_profile"),   icon: "👤" },
    { href: "/pitch-link",   label: t("mob_links"),     icon: "🔗" },
    { href: "/analytics",    label: t("mob_analytics"), icon: "📊" },
    { href: "/outreach",     label: t("mob_outreach"),  icon: "✉️" },
  ];

  const currentLocale = LOCALES.find(l => l.value === locale)!;

  // ── Onboarding: fullscreen quiz only — hide all platform chrome so the user
  // can't navigate anywhere until the quiz is finished. ──
  if (path.includes("/onboarding") || (setupFullscreen && path === "/moj-profil")) {
    return <>{children}</>;
  }

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

        <div className="sidebar-footer" style={{ display: "flex", flexDirection: "column", gap: 6 }}>

          {/* Bug report — iznad bell-a */}
          <button onClick={() => { setShowBugReport(true); setBugSent(false); }} style={{
            width: "100%", padding: "8px 12px", borderRadius: 10,
            background: "transparent", border: "none",
            color: "rgba(167,139,250,0.5)", fontSize: 12, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            transition: "color 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(167,139,250,0.85)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(167,139,250,0.5)")}
          >
            🐛 prijavi bag
          </button>

          {/* Desktop bell — na vrhu footer-a */}
          <div ref={desktopBellRef} style={{ position: "relative" }}>
            <button onClick={openBell} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)",
              background: "var(--card)", cursor: "pointer", fontFamily: "inherit",
              fontSize: 13, color: "var(--text2)", transition: "all 0.15s",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>🔔 Obaveštenja</span>
              {unreadCount > 0 && (
                <span style={{ minWidth: 20, height: 20, borderRadius: 10, background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showBell && (
              <div style={{
                position: "absolute", bottom: "calc(100% + 8px)", left: 0, right: 0, zIndex: 1000,
                background: "var(--bg, #0E0E12)", border: "1px solid var(--border)",
                borderRadius: 14, boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
                maxHeight: 360, overflowY: "auto",
              }}>
                <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                  🔔 Pregledi pitch linkova
                </div>
                {notifGroups.length === 0 ? (
                  <div style={{ padding: "28px 16px", textAlign: "center", color: "#4B5563", fontSize: 13 }}>Još nema pregleda.</div>
                ) : (
                  notifGroups.map(([id, g]) => (
                    <Link key={id} href="/analytics" onClick={() => setShowBell(false)} style={{ textDecoration: "none" }}>
                      <div style={{ padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 10, transition: "background 0.1s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#A78BFA" }}>
                          {g.count}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.title}</div>
                          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{g.count === 1 ? "1 pregled" : `${g.count} pregleda`} · {timeAgoNotif(g.last)}</div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
                <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button onClick={() => { setShowBell(false); setShowAllNotifs(true); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#A78BFA", fontWeight: 600, padding: 0 }}>
                    Pogledaj sva obaveštenja →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Admin link — vidljiv samo adminima */}
          {isAdmin && (
            <Link href="/admin" style={{ textDecoration: "none", display: "block" }}>
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s",
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
          <button onClick={toggleTheme} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)",
            background: "var(--card)", cursor: "pointer", fontFamily: "inherit",
            fontSize: 13, color: "var(--text2)", transition: "all 0.15s",
          }}>
            <span>{theme === "dark" ? `🌙 ${t("dark_theme")}` : `☀️ ${t("light_theme")}`}</span>
            <div style={{ width: 36, height: 20, borderRadius: 100, background: theme === "light" ? "var(--purple)" : "var(--border)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 2, left: theme === "light" ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
            </div>
          </button>

          {/* Language selector */}
          <div style={{ position: "relative" }}>
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

          <div className="sidebar-user" style={{ flexDirection: "column", gap: 4 }}>
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

        </div>
      </aside>
      {/* ── Mobile top header ── */}
      <header className="mobile-top-header">
        {/* Logo */}
        <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 7 }}>
          <img src="/pikmilogo.jpg" alt="pikmi" width={28} height={28} style={{ objectFit: "contain", display: "block" }} />
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

                <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button onClick={() => { setShowBell(false); setShowAllNotifs(true); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#A78BFA", fontWeight: 600, padding: 0 }}>
                    Pogledaj sva obaveštenja →
                  </button>
                  <Link href="/analytics" onClick={() => setShowBell(false)} style={{ fontSize: 11, color: "#6B7280", textDecoration: "none" }}>
                    Analitika ↗
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
        {/* Mobile bug report trigger — na kraju dashboard stranice */}
        {path === "/dashboard" && (
          <div className="mobile-only" style={{ padding: "4px 0 8px", textAlign: "center" }}>
            <button onClick={() => { setShowBugReport(true); setBugSent(false); }} style={{
              background: "none", border: "none", padding: "6px 10px",
              color: "rgba(167,139,250,0.5)", fontSize: 12, fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              🐛 prijavi bag
            </button>
          </div>
        )}
      </main>

      {/* ── Sva obaveštenja — modal ── */}
      {showAllNotifs && (
        <div onClick={() => setShowAllNotifs(false)} style={{
          position: "fixed", inset: 0, zIndex: 2000,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "var(--surface, #111116)", border: "1px solid var(--border)",
            borderRadius: 18, width: "100%", maxWidth: 520, maxHeight: "80vh",
            display: "flex", flexDirection: "column",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>🔔 Sva obaveštenja</div>
              <button onClick={() => setShowAllNotifs(false)} style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 16, color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>Još nema obaveštenja.</div>
              ) : (
                notifications.map((n, i) => (
                  <Link key={n.id} href="/analytics" onClick={() => setShowAllNotifs(false)} style={{ textDecoration: "none" }}>
                    <div style={{
                      padding: "14px 20px", borderBottom: "1px solid var(--border)",
                      display: "flex", alignItems: "center", gap: 12, transition: "background 0.1s",
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#A78BFA", fontWeight: 700 }}>
                        {n.linkTitle?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {n.linkTitle}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2, display: "flex", gap: 8 }}>
                          <span>{timeAgoNotif(n.viewed_at)}</span>
                          {n.device && <span>· {n.device === "mobile" ? "📱" : "🖥"} {n.device}</span>}
                          <span style={{ fontFamily: "monospace" }}>/{n.linkSlug}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 10, color: "var(--text3)", flexShrink: 0 }}>
                        {new Date(n.viewed_at).toLocaleDateString("sr-RS", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text3)" }}>{notifications.length} obaveštenja ukupno</span>
              <Link href="/analytics" onClick={() => setShowAllNotifs(false)} style={{ fontSize: 12, color: "#A78BFA", fontWeight: 600, textDecoration: "none" }}>
                Otvori analitiku →
              </Link>
            </div>
          </div>
        </div>
      )}

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

      {/* ── Trial expired modal (blocking) ── */}
      {trialExpired && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.92)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20, backdropFilter: "blur(8px)",
        }}>
          <div style={{
            width: "100%", maxWidth: 480,
            background: "#0F0B1F",
            border: "1px solid rgba(139,92,246,0.25)",
            borderRadius: 24, padding: "36px 28px",
            boxShadow: "0 32px 100px rgba(0,0,0,0.8)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>
              Tvoj nalog je zaključan
            </h2>
            <p style={{ margin: "0 0 28px", fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              Isteklo je 7 dana besplatnog korišćenja.<br/>
              Da nastaviš da koristiš pikmi, pretplati se na Pro ili Pro 3 meseca.
            </p>

            {/* Plan cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {/* Mesečni */}
              <button onClick={() => handleTrialCheckout("monthly")} disabled={checkoutLoading !== null} style={{
                background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)",
                borderRadius: 16, padding: "20px 14px", cursor: checkoutLoading ? "wait" : "pointer",
                textAlign: "center", transition: "all 0.2s", fontFamily: "inherit",
              }}
                onMouseEnter={e => { if (!checkoutLoading) e.currentTarget.style.background = "rgba(139,92,246,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(139,92,246,0.08)"; }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Pro mesečno</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{proPrice}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>/ mesec</div>
                <div style={{
                  padding: "10px", borderRadius: 10, border: "none",
                  background: checkoutLoading === "monthly" ? "rgba(139,92,246,0.5)" : "linear-gradient(135deg,#7C3AED,#6366F1)",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                }}>
                  {checkoutLoading === "monthly" ? "..." : "Odaberi →"}
                </div>
              </button>

              {/* 3-mesečni */}
              <button onClick={() => handleTrialCheckout("3m")} disabled={checkoutLoading !== null} style={{
                background: "rgba(139,92,246,0.12)", border: "2px solid rgba(139,92,246,0.5)",
                borderRadius: 16, padding: "20px 14px", cursor: checkoutLoading ? "wait" : "pointer",
                textAlign: "center", transition: "all 0.2s", fontFamily: "inherit", position: "relative",
              }}
                onMouseEnter={e => { if (!checkoutLoading) e.currentTarget.style.background = "rgba(139,92,246,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(139,92,246,0.12)"; }}
              >
                <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#7C3AED,#6366F1)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
                  NAJPOPULARNIJE
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Pro 3 meseca</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{pro3Price}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>/ 3 meseca</div>
                <div style={{
                  padding: "10px", borderRadius: 10, border: "none",
                  background: checkoutLoading === "3m" ? "rgba(139,92,246,0.5)" : "linear-gradient(135deg,#7C3AED,#6366F1)",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                }}>
                  {checkoutLoading === "3m" ? "..." : "Odaberi →"}
                </div>
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
              Sigurno plaćanje • Otkaži bilo kad
            </p>
          </div>
        </div>
      )}

      {/* ── Bug report modal ── */}
      {showBugReport && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowBugReport(false); }} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            width: "100%", maxWidth: 420,
            background: "#1A1A2E", border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: 20, padding: 28,
            boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#fff" }}>🐛 Prijavi bag</h3>
              <button onClick={() => setShowBugReport(false)} style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(255,255,255,0.08)", border: "none",
                color: "rgba(255,255,255,0.5)", fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>×</button>
            </div>

            {bugSent ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <p style={{ margin: 0, color: "var(--text2)", fontSize: 14 }}>Hvala! Primili smo tvoj report.</p>
              </div>
            ) : (
              <>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                  Opiši šta se desilo — gde, šta si radio i šta je pošlo po krivu.
                </p>
                <textarea
                  autoFocus
                  rows={5}
                  value={bugMsg}
                  onChange={e => setBugMsg(e.target.value)}
                  placeholder="npr. Kada kliknem na dugme 'Sačuvaj' na Moj profil ništa se ne desi..."
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "12px 14px", borderRadius: 12,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.2)",
                    color: "#fff", fontSize: 13, fontFamily: "inherit",
                    resize: "vertical", outline: "none", lineHeight: 1.6,
                  }}
                />
                <button
                  onClick={sendBugReport}
                  disabled={!bugMsg.trim() || bugSending}
                  style={{
                    width: "100%", marginTop: 14, padding: "13px",
                    borderRadius: 12, border: "none",
                    background: bugMsg.trim() && !bugSending
                      ? "linear-gradient(135deg,#7C3AED,#6366F1)"
                      : "rgba(255,255,255,0.06)",
                    color: bugMsg.trim() && !bugSending ? "#fff" : "rgba(255,255,255,0.25)",
                    fontSize: 14, fontWeight: 700, cursor: bugMsg.trim() && !bugSending ? "pointer" : "not-allowed",
                    fontFamily: "inherit", transition: "all 0.2s",
                    boxShadow: bugMsg.trim() && !bugSending ? "0 4px 20px rgba(124,58,237,0.35)" : "none",
                  }}
                >
                  {bugSending ? "Slanje..." : "Pošalji report →"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
