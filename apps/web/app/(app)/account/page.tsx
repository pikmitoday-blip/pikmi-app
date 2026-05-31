"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../../lib/i18n";
import Checkout3MButton from "../../components/Checkout3MButton";

function AccountSettingsInner() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"profile" | "subscription">(() =>
    searchParams.get("tab") === "subscription" ? "subscription" : "profile"
  );

  // Profile state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passSaved, setPassSaved] = useState(false);
  const [passError, setPassError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Subscription state
  const [userId, setUserId] = useState("");
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [subLoading, setSubLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelledUntil, setCancelledUntil] = useState<string | null>(null);
  const [subError, setSubError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [subDetails, setSubDetails] = useState<{
    status: string; cancelAtPeriodEnd: boolean; cancelAt: string | null;
    currentPeriodEnd: string; amount: number; currency: string;
    card: { brand: string; last4: string; expMonth: number; expYear: number } | null;
    lastInvoiceAmount: number | null; lastInvoiceDate: string | null; lastInvoicePdf: string | null;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        if (!user) return;
        setEmail(user.email ?? "");
        setUserId(user.id);
        const { data } = await supabase
          .from("profiles")
          .select("first_name, last_name, profile_data, plan, profile_url")
          .eq("user_id", user.id)
          .single();
        if (data) {
          setFirstName(data.first_name ?? "");
          setLastName(data.last_name ?? "");
          setProfileUrl(data.profile_url ?? "");
          const currentPlan = data.plan ?? "free";
          setPlan(currentPlan);
          const pd = data.profile_data as Record<string, string> | null;
          if (pd?.avatarUrl) setAvatarUrl(pd.avatarUrl);
          if (currentPlan === "pro") {
            try {
              const subRes = await fetch("/api/stripe/subscription", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id }),
              });
              const subData = await subRes.json();
              if (subData.subscription) setSubDetails(subData.subscription);
            } catch {}
          }
        }
      } catch {}
      setSubLoading(false);
    }
    load();
  }, []);

  async function uploadAvatar(file: File) {
    setUploadingAvatar(true); setAvatarError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setUploadingAvatar(false); return; }
      if (file.size > 2 * 1024 * 1024) { setAvatarError(t("account_err_too_large")); setUploadingAvatar(false); return; }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage.from("pikmi-uploads").upload(path, file, { upsert: true, contentType: file.type });
      if (error) { setAvatarError(error.message); setUploadingAvatar(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("pikmi-uploads").getPublicUrl(path);
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
      const { data: profileRow } = await supabase.from("profiles").select("profile_data").eq("user_id", user.id).single();
      const existing = (profileRow?.profile_data as Record<string, unknown>) ?? {};
      const { error: updateError } = await supabase.from("profiles").update({ profile_data: { ...existing, avatarUrl: publicUrl } }).eq("user_id", user.id);
      if (updateError) { setAvatarError(updateError.message); setUploadingAvatar(false); return; }
      setAvatarUrl(urlWithCacheBust);
      try { window.dispatchEvent(new CustomEvent("pikmi-profile-changed", { detail: { avatarUrl: urlWithCacheBust } })); } catch {}
    } catch (e: any) { setAvatarError(e.message || "Upload error."); }
    setUploadingAvatar(false);
  }

  async function saveName() {
    if (!firstName.trim()) { setNameError(t("account_err_name_req")); return; }
    setNameSaving(true); setNameError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profileRow } = await supabase.from("profiles").select("profile_data").eq("user_id", user.id).single();
      const existingPd = (profileRow?.profile_data as Record<string, unknown>) ?? {};
      const fn = firstName.trim(); const ln = lastName.trim();
      await supabase.from("profiles").update({
        first_name: fn, last_name: ln, profile_url: profileUrl.trim() || undefined,
        profile_data: { ...existingPd, firstName: fn, lastName: ln, initials: (fn[0] ?? "").toUpperCase() + (ln[0] ?? "").toUpperCase() },
      }).eq("user_id", user.id);
      try {
        const initials = (fn[0] ?? "").toUpperCase() + (ln[0] ?? "").toUpperCase();
        window.dispatchEvent(new CustomEvent("pikmi-profile-changed", { detail: { firstName: fn, lastName: ln, initials } }));
        sessionStorage.removeItem("pikmi-moj-profil"); sessionStorage.removeItem("pikmi-profile-edit");
        if (profileUrl.trim()) { try { sessionStorage.setItem("pikmi-profile-url", profileUrl.trim()); } catch {} }
      } catch {}
      setNameSaved(true); setTimeout(() => setNameSaved(false), 2500);
    } catch (e: any) { setNameError(e.message || "Error saving."); }
    setNameSaving(false);
  }

  async function savePassword() {
    setPassError("");
    if (!newPassword) { setPassError(t("account_err_pass_new")); return; }
    if (newPassword.length < 6) { setPassError(t("account_err_pass_short")); return; }
    if (newPassword !== confirmPassword) { setPassError(t("account_err_pass_match")); return; }
    setPassSaving(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (signInError) { setPassError(t("account_err_pass_wrong")); setPassSaving(false); return; }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { setPassError(error.message); setPassSaving(false); return; }
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPassSaved(true); setTimeout(() => setPassSaved(false), 2500);
    } catch (e: any) { setPassError(e.message || "Error changing password."); }
    setPassSaving(false);
  }

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, userEmail: email }) });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {} setCheckoutLoading(false);
  }

  async function openPortal() {
    setPortalLoading(true); setSubError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setSubError(data.error || "Greška.");
    } catch (e: any) { setSubError(e.message || "Greška."); }
    setPortalLoading(false);
  }

  async function cancelSubscription() {
    if (!confirm(t("sub_cancel_confirm"))) return;
    setCancelling(true); setSubError("");
    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      const data = await res.json();
      if (data.ok) setCancelledUntil(data.cancelAt ? new Date(data.cancelAt).toLocaleDateString("sr-Latn", { day: "numeric", month: "long", year: "numeric" }) : null);
      else setSubError(data.error || "Greška pri otkazivanju.");
    } catch (e: any) { setSubError(e.message || "Greška."); }
    setCancelling(false);
  }

  const initials = (firstName[0] ?? "").toUpperCase() + (lastName[0] ?? "").toUpperCase();

  // ── Shared styles matching JSX reference ────────────────────────────────
  const INP: React.CSSProperties = {
    width: "100%", padding: "13px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(139,92,246,0.12)",
    borderRadius: 12, color: "var(--text)",
    fontSize: 14, fontFamily: "inherit", outline: "none",
    transition: "border-color 0.2s", boxSizing: "border-box",
  };
  const LBL: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)",
    marginBottom: 8, display: "block", letterSpacing: 0.3,
  };
  const SECTION: React.CSSProperties = {
    background: "rgba(139,92,246,0.03)",
    border: "1px solid rgba(139,92,246,0.08)",
    borderRadius: 18, padding: "20px 18px", marginBottom: 14,
  };
  const SECTION_TITLE: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
    textTransform: "uppercase", color: "#A855F7",
    marginBottom: 16, display: "flex", alignItems: "center", gap: 6,
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header">
        <h1 className="page-title">{t("account_title")}</h1>
        <p className="page-subtitle">{t("account_subtitle")}</p>
      </div>

      {/* ── Tabs — JSX style ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {([
          { id: "profile"      as const, icon: "👤", label: t("account_tab_profile") },
          { id: "subscription" as const, icon: "⚡", label: t("account_tab_sub") },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "10px 20px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
            border: activeTab === tab.id ? "none" : "1px solid rgba(139,92,246,0.12)",
            background: activeTab === tab.id ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(139,92,246,0.04)",
            color: activeTab === tab.id ? "#fff" : "rgba(255,255,255,0.45)",
            fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.15s",
          }}>
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: PROFIL ══ */}
      {activeTab === "profile" && (
        <>
          {/* Avatar */}
          <div style={SECTION}>
            <div style={SECTION_TITLE}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#A855F7", display: "inline-block" }} />
              {t("account_avatar_section")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flexShrink: 0 }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover" }} />
                  : <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg,#7C3AED,#6366F1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff" }}>
                      {initials || "?"}
                    </div>
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <label style={{ cursor: "pointer" }}>
                    <div style={{ padding: "9px 16px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 10, color: "#A855F7", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      {uploadingAvatar ? t("account_avatar_uploading") : t("account_avatar_change")}
                    </div>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
                  </label>
                  {avatarUrl && (
                    <button onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return;
                      const { data: profileRow } = await supabase.from("profiles").select("profile_data").eq("user_id", user.id).single();
                      const existing = (profileRow?.profile_data as Record<string, unknown>) ?? {};
                      await supabase.from("profiles").update({ profile_data: { ...existing, avatarUrl: "" } }).eq("user_id", user.id);
                      setAvatarUrl("");
                      try { window.dispatchEvent(new CustomEvent("pikmi-profile-changed", { detail: { avatarUrl: "" } })); } catch {}
                    }} style={{ padding: "9px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, color: "#F87171", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      {t("account_avatar_remove")}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{t("account_avatar_hint")}</div>
              </div>
            </div>
            {avatarError && <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: 13 }}>⚠️ {avatarError}</div>}
          </div>

          {/* Personal Info + Profile URL */}
          <div style={SECTION}>
            <div style={SECTION_TITLE}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#A855F7", display: "inline-block" }} />
              {t("account_avatar_section") === "Profilna slika" ? "Lični podaci" : t("account_avatar_section")}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={LBL}>{t("account_first_name")}</label>
                <input style={INP} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Marko" />
              </div>
              <div>
                <label style={LBL}>{t("account_last_name")}</label>
                <input style={INP} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Jovanović" />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={LBL}>{t("account_email")}</label>
              <div style={{ ...INP, background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{email}</span>
                <span style={{ fontSize: 14 }}>🔒</span>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", marginTop: 5 }}>{t("account_email_note")}</div>
            </div>

            {/* Profile URL */}
            <div style={{ marginBottom: 20 }}>
              <label style={LBL}>{t("account_email") === "Email adresa" ? "URL profila" : "Profile URL"}</label>
              <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(139,92,246,0.12)" }}>
                <div style={{ padding: "13px 12px", background: "rgba(139,92,246,0.08)", fontSize: 12, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap", borderRight: "1px solid rgba(139,92,246,0.1)" }}>
                  pikmi.today/
                </div>
                <input style={{ ...INP, border: "none", borderRadius: 0, flex: 1 }}
                  value={profileUrl} placeholder="tvoj-url"
                  onChange={e => setProfileUrl(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
              </div>
            </div>

            {nameError && <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: 13 }}>⚠️ {nameError}</div>}

            <button onClick={saveName} disabled={nameSaving} style={{
              width: "100%", padding: "13px 0",
              background: nameSaving ? "rgba(124,58,237,0.5)" : nameSaved ? "rgba(16,185,129,0.2)" : "linear-gradient(135deg,#7C3AED,#6366F1)",
              border: nameSaved ? "1px solid rgba(16,185,129,0.3)" : "none",
              borderRadius: 12, color: nameSaved ? "#4ADE80" : "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              boxShadow: nameSaved ? "none" : "0 4px 20px rgba(124,58,237,0.25)", transition: "all 0.2s",
            }}>
              {nameSaving ? t("account_saving") : nameSaved ? `✓ ${t("account_saved")}` : t("account_save")}
            </button>
          </div>

          {/* Password — collapsible */}
          <div style={SECTION}>
            <div onClick={() => setShowPasswordSection(v => !v)} style={{ ...SECTION_TITLE, cursor: "pointer", justifyContent: "space-between", marginBottom: showPasswordSection ? 16 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#A855F7", display: "inline-block" }} />
                {t("account_password_section")}
              </div>
              <span style={{ fontSize: 16, color: "rgba(255,255,255,0.2)", transform: showPasswordSection ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>⌄</span>
            </div>

            {showPasswordSection && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={LBL}>{t("account_current_pass")}</label>
                  <div style={{ position: "relative" }}>
                    <input style={{ ...INP, paddingRight: 44 }} type={showCurrent ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowCurrent(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 16, padding: 0 }}>
                      {showCurrent ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={LBL}>{t("account_new_pass")}</label>
                  <div style={{ position: "relative" }}>
                    <input style={{ ...INP, paddingRight: 44 }} type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t("account_new_pass_ph")} />
                    <button type="button" onClick={() => setShowNew(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 16, padding: 0 }}>
                      {showNew ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={LBL}>{t("account_confirm_pass")}</label>
                  <div style={{ position: "relative" }}>
                    <input style={{ ...INP, paddingRight: 44 }} type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t("account_confirm_pass_ph")} />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 16, padding: 0 }}>
                      {showConfirm ? "🙈" : "👁"}
                    </button>
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && <div style={{ fontSize: 12, color: "#F87171", marginTop: 4 }}>{t("account_pass_no_match")}</div>}
                  {newPassword && confirmPassword && newPassword === confirmPassword && <div style={{ fontSize: 12, color: "#4ADE80", marginTop: 4 }}>{t("account_pass_match")}</div>}
                </div>
                {passError && <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: 13 }}>⚠️ {passError}</div>}
                {passSaved && <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#4ADE80", fontSize: 13 }}>{t("account_pass_changed")}</div>}
                <button onClick={savePassword} disabled={passSaving || !currentPassword || !newPassword || !confirmPassword} style={{
                  width: "100%", padding: "12px 0", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
                  borderRadius: 12, color: "#A855F7", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  opacity: (passSaving || !currentPassword || !newPassword || !confirmPassword) ? 0.5 : 1,
                }}>
                  {passSaving ? t("account_changing_pass") : t("account_change_pass")}
                </button>
              </>
            )}
          </div>

          {/* Mobile logout */}
          <div className="mobile-only" style={{ marginTop: 8 }}>
            <button onClick={async () => {
              try {
                const sessionId = localStorage.getItem("pikmi-session-id");
                if (sessionId) {
                  const { data: { session } } = await supabase.auth.getSession();
                  const user = session?.user ?? null;
                  if (user) await supabase.from("user_sessions").delete().eq("user_id", user.id).eq("session_id", sessionId);
                  localStorage.removeItem("pikmi-session-id");
                }
              } catch {}
              localStorage.removeItem("pikmi-theme"); localStorage.removeItem("pikmi-session-ts"); localStorage.removeItem("pikmi-remember");
              document.documentElement.dataset.theme = "dark";
              try { sessionStorage.clear(); } catch {}
              await supabase.auth.signOut();
              router.push("/login");
            }} style={{
              width: "100%", padding: "13px 0",
              background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)",
              borderRadius: 14, color: "rgba(239,68,68,0.7)", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Odjavi se
            </button>
          </div>
        </>
      )}

      {/* ══ TAB: PRETPLATA ══ */}
      {activeTab === "subscription" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Plan price card — JSX reference style */}
          <div style={{
            background: plan === "pro"
              ? "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(99,102,241,0.08))"
              : "rgba(255,255,255,0.02)",
            border: `1px solid ${plan === "pro" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 18, padding: "22px 18px", position: "relative", overflow: "hidden",
          }}>
            {plan === "pro" && (
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{
                background: plan === "pro" ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(255,255,255,0.06)",
                padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 6, color: "#fff",
              }}>
                {plan === "pro" ? "⚡ Pro Plan" : "🎯 Free Plan"}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: plan === "pro" ? "#10B981" : "#6B7280",
                background: plan === "pro" ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)",
                padding: "4px 10px", borderRadius: 100,
              }}>
                {plan === "pro" ? t("billing_active") : "Free"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{
                fontSize: 36, fontWeight: 800, letterSpacing: -1.5,
                ...(plan === "pro" ? { background: "linear-gradient(135deg,#A855F7,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : { color: "var(--text)" }),
              }}>
                {plan === "pro"
                  ? subDetails?.amount ? `${(subDetails.amount / 100).toLocaleString("sr-RS")}` : "990"
                  : "0"
                }
              </span>
              <span style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                {plan === "pro" ? ` ${subDetails?.currency?.toUpperCase() ?? "RSD"}/mes` : " din"}
              </span>
            </div>
            {plan === "pro" && subDetails && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                {subDetails.cancelAtPeriodEnd ? t("billing_expires_on") : t("billing_next")}: {new Date(subDetails.currentPeriodEnd).toLocaleDateString("sr-RS", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            )}
            {plan === "free" && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{t("billing_trial_expired")}</div>
            )}
          </div>

          {/* Promeni plan — Pro korisnici */}
          {plan === "pro" && (
            <div style={SECTION}>
              <div style={SECTION_TITLE}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#A855F7", display: "inline-block" }} />
                Promeni plan
              </div>
              <div style={{
                background: "rgba(16,185,129,0.04)", border: "1.5px solid rgba(16,185,129,0.15)",
                borderRadius: 14, padding: "16px 14px", marginBottom: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#10B981", textTransform: "uppercase" as const, letterSpacing: 1 }}>Pro 3 meseca</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "3px 10px", borderRadius: 100 }}>Uštedi 17%</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: "#10B981" }}>2490 din</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>/3 mes</span>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 14 }}>~830 din mesečno · ušteda ~480 din</div>
                <Checkout3MButton label="Pređi na 3-mesečni plan →" style={{ borderRadius: 10, padding: "11px 0", fontSize: 13 }} />
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
                Trenutni mesečni plan ostaje aktivan do kraja perioda
              </div>
            </div>
          )}

          {/* Detalji kartice — Pro */}
          {plan === "pro" && subDetails?.card && (
            <div style={SECTION}>
              <div style={SECTION_TITLE}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#A855F7", display: "inline-block" }} />
                {t("billing_card")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>💳</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, textTransform: "capitalize" }}>{subDetails.card.brand} •••• {subDetails.card.last4}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{t("billing_card_exp")} {subDetails.card.expMonth}/{subDetails.card.expYear}</div>
                </div>
                {subDetails.lastInvoicePdf && (
                  <a href={subDetails.lastInvoicePdf} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto", fontSize: 11, color: "#A855F7", textDecoration: "none", fontWeight: 600 }}>
                    {t("billing_pdf")} ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Promena kartice — Pro */}
          {plan === "pro" && (
            <div style={SECTION}>
              <div style={SECTION_TITLE}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#A855F7", display: "inline-block" }} />
                {t("sub_manage_card")}
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 14, lineHeight: 1.6 }}>{t("sub_manage_card_desc")}</p>
              <button onClick={openPortal} disabled={portalLoading} style={{
                width: "100%", padding: "13px 0",
                background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)",
                borderRadius: 12, color: "#A855F7", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                💳 {portalLoading ? t("sub_managing") : t("sub_manage_btn")}
              </button>
            </div>
          )}

          {/* Otkazivanje — Pro */}
          {plan === "pro" && (
            <div style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.08)", borderRadius: 16, padding: "18px 18px", marginBottom: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" as const, color: "rgba(239,68,68,0.6)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(239,68,68,0.6)", display: "inline-block" }} />
                {t("sub_cancel_title")}
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.5, marginBottom: 14 }}>{t("sub_cancel_desc")}</p>
              {cancelledUntil ? (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#FBBF24", fontSize: 13 }}>
                  ⚠️ {t("sub_cancelled")} {cancelledUntil}
                </div>
              ) : (
                <button onClick={cancelSubscription} disabled={cancelling} style={{
                  padding: "10px 20px", background: "transparent",
                  border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10,
                  color: "rgba(239,68,68,0.6)", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", opacity: cancelling ? 0.5 : 1,
                }}>
                  {cancelling ? t("sub_cancelling") : t("sub_cancel_btn")}
                </button>
              )}
              {subError && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171", fontSize: 13 }}>⚠️ {subError}</div>}
            </div>
          )}

          {/* FAQ */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" as const, color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>{t("billing_faq")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[{ q: t("billing_faq_q1"), a: t("billing_faq_a1") }, { q: t("billing_faq_q2"), a: t("billing_faq_a2") }, { q: t("billing_faq_q3"), a: t("billing_faq_a3") }].map(item => (
                <div key={item.q} style={{ ...SECTION, padding: "14px 16px", marginBottom: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{item.q}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>{item.a}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Free → Pro upgrade */}
          {plan === "free" && !subLoading && (
            <div style={{ ...SECTION, background: "linear-gradient(160deg,rgba(124,58,237,0.1) 0%,rgba(59,130,246,0.05) 100%)", border: "1.5px solid rgba(124,58,237,0.3)", position: "relative", overflow: "visible", boxShadow: "0 4px 24px rgba(124,58,237,0.15)", marginBottom: 0 }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#7C3AED,#3B82F6,#7C3AED)", borderRadius: "18px 18px 0 0" }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: "#A855F7", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10, marginTop: 4 }}>Pro plan</div>
              <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 2 }}>990 din<span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.3)" }}>/mes</span></div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>{t("cancel_anytime")}</div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {["Neograničeno pitch linkova", "Real-time tracking i notifikacije", "Outreach kit", "Prioritetna podrška"].map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)" }}>
                    <span style={{ color: "#A855F7", fontSize: 11 }}>✦</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={handleCheckout} disabled={checkoutLoading} style={{
                width: "100%", padding: "13px 0", background: checkoutLoading ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg,#7C3AED,#6366F1)",
                border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: checkoutLoading ? "wait" : "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 20px rgba(124,58,237,0.3)", transition: "all 0.2s", opacity: checkoutLoading ? 0.7 : 1,
              }}>
                {checkoutLoading ? "Učitavanje..." : <>{t("billing_subscribe")} →</>}
              </button>
            </div>
          )}
        </div>
      )}
      {/* ── Uslovi i privatnost ── */}

      <div style={{ display: "flex", gap: 16, justifyContent: "center", paddingTop: 32, paddingBottom: 8 }}>
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
    </div>
  );
}

export default function AccountSettings() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--text3)" }}>Učitavanje...</div>}>
      <AccountSettingsInner />
    </Suspense>
  );
}
