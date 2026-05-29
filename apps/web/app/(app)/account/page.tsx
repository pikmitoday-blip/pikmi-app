"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../../lib/i18n";

export default function AccountSettings() {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "subscription">("profile");

  // Profile state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
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
          .select("first_name, last_name, profile_data, plan")
          .eq("user_id", user.id)
          .single();
        if (data) {
          setFirstName(data.first_name ?? "");
          setLastName(data.last_name ?? "");
          const currentPlan = data.plan ?? "free";
          setPlan(currentPlan);
          const pd = data.profile_data as Record<string, string> | null;
          if (pd?.avatarUrl) setAvatarUrl(pd.avatarUrl);

          // Dohvati detalje pretplate za Pro korisnike
          if (currentPlan === "pro") {
            try {
              const subRes = await fetch("/api/stripe/subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
    setUploadingAvatar(true);
    setAvatarError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setUploadingAvatar(false); return; }
      if (file.size > 2 * 1024 * 1024) {
        setAvatarError(t("account_err_too_large"));
        setUploadingAvatar(false);
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage
        .from("pikmi-uploads")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) {
        setAvatarError(error.message);
        setUploadingAvatar(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("pikmi-uploads").getPublicUrl(path);
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
      const { data: profileRow } = await supabase.from("profiles").select("profile_data").eq("user_id", user.id).single();
      const existing = (profileRow?.profile_data as Record<string, unknown>) ?? {};
      const { error: updateError } = await supabase.from("profiles").update({
        profile_data: { ...existing, avatarUrl: publicUrl },
      }).eq("user_id", user.id);
      if (updateError) {
        setAvatarError(updateError.message);
        setUploadingAvatar(false);
        return;
      }
      setAvatarUrl(urlWithCacheBust);
      try {
        window.dispatchEvent(new CustomEvent("pikmi-profile-changed", {
          detail: { avatarUrl: urlWithCacheBust },
        }));
      } catch {}
    } catch (e: any) {
      setAvatarError(e.message || "Upload error.");
    }
    setUploadingAvatar(false);
  }

  async function saveName() {
    if (!firstName.trim()) { setNameError(t("account_err_name_req")); return; }
    setNameSaving(true);
    setNameError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Fetch existing profile_data to merge firstName/lastName into it
      const { data: profileRow } = await supabase.from("profiles").select("profile_data").eq("user_id", user.id).single();
      const existingPd = (profileRow?.profile_data as Record<string, unknown>) ?? {};
      const fn = firstName.trim();
      const ln = lastName.trim();
      await supabase.from("profiles").update({
        first_name: fn,
        last_name: ln,
        profile_data: {
          ...existingPd,
          firstName: fn,
          lastName: ln,
          initials: (fn[0] ?? "").toUpperCase() + (ln[0] ?? "").toUpperCase(),
        },
      }).eq("user_id", user.id);
      // Instant update sidebara — bez refresha
      try {
        const initials = (fn[0] ?? "").toUpperCase() + (ln[0] ?? "").toUpperCase();
        window.dispatchEvent(new CustomEvent("pikmi-profile-changed", {
          detail: { firstName: fn, lastName: ln, initials },
        }));
        sessionStorage.removeItem("pikmi-moj-profil");
        sessionStorage.removeItem("pikmi-profile-edit");
      } catch {}
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    } catch (e: any) {
      setNameError(e.message || "Error saving.");
    }
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
      setPassSaved(true);
      setTimeout(() => setPassSaved(false), 2500);
    } catch (e: any) {
      setPassError(e.message || "Error changing password.");
    }
    setPassSaving(false);
  }

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userEmail: email }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {}
    setCheckoutLoading(false);
  }

  async function openPortal() {
    setPortalLoading(true);
    setSubError("");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setSubError(data.error || "Greška pri otvaranju portala.");
      }
    } catch (e: any) {
      setSubError(e.message || "Greška.");
    }
    setPortalLoading(false);
  }

  async function cancelSubscription() {
    if (!confirm(t("sub_cancel_confirm"))) return;
    setCancelling(true);
    setSubError("");
    try {
      const res = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.ok) {
        setCancelledUntil(data.cancelAt
          ? new Date(data.cancelAt).toLocaleDateString("sr-Latn", { day: "numeric", month: "long", year: "numeric" })
          : null
        );
      } else {
        setSubError(data.error || "Greška pri otkazivanju.");
      }
    } catch (e: any) {
      setSubError(e.message || "Greška.");
    }
    setCancelling(false);
  }

  const initials = (firstName[0] ?? "").toUpperCase() + (lastName[0] ?? "").toUpperCase();

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header">
        <h1 className="page-title">{t("account_title")}</h1>
        <p className="page-subtitle">{t("account_subtitle")}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {(["profile", "subscription"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "7px 20px", borderRadius: 8, border: "none", cursor: "pointer",
            background: activeTab === tab ? "#7C3AED" : "transparent",
            color: activeTab === tab ? "#fff" : "#6B7280",
            fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s",
          }}>
            {tab === "profile" ? `👤 ${t("account_tab_profile")}` : `💳 ${t("account_tab_sub")}`}
          </button>
        ))}
      </div>

      {/* ── TAB: PROFIL ── */}
      {activeTab === "profile" && (
        <>
          {/* Avatar + Ime */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#A78BFA" }} />
              {t("account_avatar_section")}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24, padding: 16, background: "rgba(124,58,237,0.05)", borderRadius: 12, border: "1px solid rgba(124,58,237,0.15)" }}>
              <div style={{ flexShrink: 0 }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--purple)" }} />
                  : <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff" }}>{initials || "?"}</div>
                }
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{t("account_avatar_label")}</div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10 }}>{t("account_avatar_hint")}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <label style={{ cursor: "pointer" }}>
                    <span className="btn btn-ghost btn-sm" style={{ pointerEvents: "none" }}>
                      {uploadingAvatar ? t("account_avatar_uploading") : t("account_avatar_change")}
                    </span>
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
                  </label>
                  {avatarUrl && (
                    <button className="btn btn-ghost btn-sm" style={{ color: "#F87171" }}
                      onClick={async () => {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;
                        const { data: profileRow } = await supabase.from("profiles").select("profile_data").eq("user_id", user.id).single();
                        const existing = (profileRow?.profile_data as Record<string, unknown>) ?? {};
                        await supabase.from("profiles").update({ profile_data: { ...existing, avatarUrl: "" } }).eq("user_id", user.id);
                        setAvatarUrl("");
                        try {
                          window.dispatchEvent(new CustomEvent("pikmi-profile-changed", {
                            detail: { avatarUrl: "" },
                          }));
                        } catch {}
                      }}>
                      {t("account_avatar_remove")}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {avatarError && (
              <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: 13 }}>
                ⚠️ {avatarError}
              </div>
            )}

            <div className="edit-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">{t("account_first_name")}</label>
                <input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Marko" />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">{t("account_last_name")}</label>
                <input className="input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Jovanović" />
              </div>
            </div>

            <div className="field" style={{ marginBottom: 16 }}>
              <label className="label">{t("account_email")}</label>
              <input className="input" value={email} disabled style={{ opacity: 0.5, cursor: "not-allowed" }} />
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{t("account_email_note")}</div>
            </div>

            {nameError && (
              <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: 13 }}>
                ⚠️ {nameError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-primary" onClick={saveName} disabled={nameSaving}>
                {nameSaving ? t("account_saving") : nameSaved ? t("account_saved") : t("account_save")}
              </button>
            </div>
          </div>

          {/* Promena lozinke */}
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#A78BFA" }} />
              {t("account_password_section")}
            </div>

            <div className="field">
              <label className="label">{t("account_current_pass")}</label>
              <div style={{ position: "relative" }}>
                <input className="input" type={showCurrent ? "text" : "password"} value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowCurrent(v => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 16, padding: 0 }}>
                  {showCurrent ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <div className="field">
              <label className="label">{t("account_new_pass")}</label>
              <div style={{ position: "relative" }}>
                <input className="input" type={showNew ? "text" : "password"} value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} placeholder={t("account_new_pass_ph")} style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 16, padding: 0 }}>
                  {showNew ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <div className="field">
              <label className="label">{t("account_confirm_pass")}</label>
              <div style={{ position: "relative" }}>
                <input className="input" type={showConfirm ? "text" : "password"} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} placeholder={t("account_confirm_pass_ph")} style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 16, padding: 0 }}>
                  {showConfirm ? "🙈" : "👁"}
                </button>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <div style={{ fontSize: 12, color: "#F87171", marginTop: 4 }}>{t("account_pass_no_match")}</div>
              )}
              {newPassword && confirmPassword && newPassword === confirmPassword && (
                <div style={{ fontSize: 12, color: "#1AA877", marginTop: 4 }}>{t("account_pass_match")}</div>
              )}
            </div>

            {passError && (
              <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: 13 }}>
                ⚠️ {passError}
              </div>
            )}
            {passSaved && (
              <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 12, background: "rgba(26,168,119,0.1)", border: "1px solid rgba(26,168,119,0.3)", color: "#1AA877", fontSize: 13 }}>
                {t("account_pass_changed")}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-primary" onClick={savePassword}
                disabled={passSaving || !currentPassword || !newPassword || !confirmPassword}>
                {passSaving ? t("account_changing_pass") : t("account_change_pass")}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── TAB: PRETPLATA ── */}
      {activeTab === "subscription" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Trenutni plan */}
          <div className="card" style={{
            background: plan === "pro" ? "rgba(124,58,237,0.06)" : "var(--card)",
            border: plan === "pro" ? "1px solid rgba(124,58,237,0.3)" : "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                background: plan === "pro" ? "linear-gradient(135deg,#7C3AED,#3B82F6)" : "var(--surface)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
              }}>
                {plan === "pro" ? "⚡" : "🎯"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                  {plan === "pro" ? t("billing_pro") : t("billing_free")}
                </div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>
                  {plan === "pro" ? t("billing_access_all") : t("billing_trial_expired")}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                background: plan === "pro" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                color: plan === "pro" ? "#4ADE80" : "#6B7280",
                border: `1px solid ${plan === "pro" ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
              }}>
                {plan === "pro" ? "✓ Pro" : "Free"}
              </span>
            </div>
          </div>

          {/* Detalji pretplate — samo Pro */}
          {plan === "pro" && subDetails && (
            <div className="card">
              <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#A78BFA" }} />
                {t("billing_details")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: subDetails.card ? 10 : 0 }}>
                <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, fontWeight: 600 }}>
                    {subDetails.cancelAtPeriodEnd ? t("billing_expires_on") : t("billing_next")}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: subDetails.cancelAtPeriodEnd ? "#FCD34D" : "var(--text)" }}>
                    {new Date(subDetails.currentPeriodEnd).toLocaleDateString("sr-RS", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
                <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, fontWeight: 600 }}>{t("billing_amount")}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {subDetails.amount ? `${(subDetails.amount / 100).toLocaleString("sr-RS")} ${subDetails.currency.toUpperCase()}` : "—"}
                    <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text3)" }}>{t("months_per")}</span>
                  </div>
                </div>
              </div>
              {subDetails.card && (
                <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>💳</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: "capitalize" as const }}>
                      {subDetails.card.brand} •••• {subDetails.card.last4}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>
                      {t("billing_card_exp")} {subDetails.card.expMonth}/{subDetails.card.expYear}
                    </div>
                  </div>
                  {subDetails.lastInvoicePdf && (
                    <a href={subDetails.lastInvoicePdf} target="_blank" rel="noopener noreferrer"
                      style={{ marginLeft: "auto", fontSize: 11, color: "#A78BFA", textDecoration: "none", fontWeight: 600 }}>
                      {t("billing_pdf")} ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Promena kartice — samo za Pro */}
          {plan === "pro" && (
            <div className="card">
              <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#A78BFA" }} />
                {t("sub_manage_card")}
              </div>
              <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14, lineHeight: 1.6 }}>
                {t("sub_manage_card_desc")}
              </p>
              <button className="btn btn-ghost" onClick={openPortal} disabled={portalLoading}>
                {portalLoading ? t("sub_managing") : `🔗 ${t("sub_manage_btn")}`}
              </button>
            </div>
          )}

          {/* Otkazivanje — samo za Pro */}
          {plan === "pro" && (
            <div className="card" style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#F87171", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F87171" }} />
                {t("sub_cancel_title")}
              </div>
              <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14, lineHeight: 1.6 }}>
                {t("sub_cancel_desc")}
              </p>
              {cancelledUntil ? (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", color: "#FBBF24", fontSize: 13 }}>
                  ⚠️ {t("sub_cancelled")} {cancelledUntil}
                </div>
              ) : (
                <button onClick={cancelSubscription} disabled={cancelling} style={{
                  padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)",
                  background: "rgba(239,68,68,0.08)", color: "#F87171",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  opacity: cancelling ? 0.6 : 1,
                }}>
                  {cancelling ? t("sub_cancelling") : t("sub_cancel_btn")}
                </button>
              )}
              {subError && (
                <div style={{ padding: "10px 14px", borderRadius: 8, marginTop: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: 13 }}>
                  ⚠️ {subError}
                </div>
              )}
            </div>
          )}

          {/* Free → Pro upgrade kartica */}
          {plan === "free" && !subLoading && (
            <div className="card" style={{
              border: "1.5px solid rgba(124,58,237,0.5)",
              background: "linear-gradient(160deg,rgba(124,58,237,0.1) 0%,rgba(59,130,246,0.05) 100%)",
              position: "relative", overflow: "visible",
              boxShadow: "0 4px 24px rgba(124,58,237,0.18)",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#7C3AED,#3B82F6,#7C3AED)", borderRadius: "12px 12px 0 0" }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10, marginTop: 4 }}>Pro plan</div>
              <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 2 }}>990 din<span style={{ fontSize: 14, fontWeight: 500, color: "var(--text3)" }}>/mes</span></div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>{t("cancel_anytime")}</div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {["Neograničeno pitch linkova", "Real-time tracking i notifikacije", "Outreach kit", "Prioritetna podrška"].map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)" }}>
                    <span style={{ color: "#A78BFA", fontSize: 11 }}>✦</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={handleCheckout} disabled={checkoutLoading} style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "12px 20px", borderRadius: 10, border: "none",
                background: checkoutLoading ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg,#7C3AED,#6D28D9)",
                color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                cursor: checkoutLoading ? "wait" : "pointer",
                boxShadow: checkoutLoading ? "none" : "0 4px 16px rgba(124,58,237,0.45)",
                transition: "all 0.2s", opacity: checkoutLoading ? 0.7 : 1,
              }}>
                {checkoutLoading ? "Učitavanje..." : <>{t("billing_subscribe")} <span style={{ fontSize: 16 }}>→</span></>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Odjava — samo mobilna verzija ── */}
      <div className="mobile-only" style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Odjava</h2>
        <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 16 }}>
          Odjavićeš se sa svog pikmi naloga na ovom uređaju.
        </p>
        <button
          onClick={async () => {
            try {
              const sessionId = localStorage.getItem("pikmi-session-id");
              if (sessionId) {
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user ?? null;
                if (user) {
                  await supabase.from("user_sessions").delete().eq("user_id", user.id).eq("session_id", sessionId);
                }
                localStorage.removeItem("pikmi-session-id");
              }
            } catch {}
            localStorage.removeItem("pikmi-theme");
            localStorage.removeItem("pikmi-session-ts");
            localStorage.removeItem("pikmi-remember");
            document.documentElement.dataset.theme = "dark";
            try { sessionStorage.clear(); } catch {}
            await supabase.auth.signOut();
            router.push("/login");
          }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10,
            background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
            color: "#F87171", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.18)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(248,113,113,0.4)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.08)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(248,113,113,0.2)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Odjavi se
        </button>
      </div>
    </div>
  );
}
