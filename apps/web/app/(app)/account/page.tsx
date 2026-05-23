"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function AccountSettings() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setEmail(user.email ?? "");
        const { data } = await supabase
          .from("profiles")
          .select("first_name, last_name, profile_data")
          .eq("user_id", user.id)
          .single();
        if (data) {
          setFirstName(data.first_name ?? "");
          setLastName(data.last_name ?? "");
          const pd = data.profile_data as Record<string, string> | null;
          if (pd?.avatarUrl) setAvatarUrl(pd.avatarUrl);
        }
      } catch {}
    }
    load();
  }, []);

  async function uploadAvatar(file: File) {
    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage
        .from("pikmi-uploads")
        .upload(path, file, { upsert: true });
      if (error) { console.error(error); return; }
      const { data: { publicUrl } } = supabase.storage
        .from("pikmi-uploads")
        .getPublicUrl(path);

      // Update profile_data with new avatar
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("profile_data")
        .eq("user_id", user.id)
        .single();
      const existing = (profileRow?.profile_data as Record<string, unknown>) ?? {};
      await supabase.from("profiles").update({
        profile_data: { ...existing, avatarUrl: publicUrl },
      }).eq("user_id", user.id);

      setAvatarUrl(publicUrl);
      try { sessionStorage.removeItem("pikmi-sidebar"); } catch {}
    } catch (e) { console.error(e); }
    setUploadingAvatar(false);
  }

  async function saveName() {
    if (!firstName.trim()) { setNameError("Ime je obavezno."); return; }
    setNameSaving(true);
    setNameError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("profiles").update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      }).eq("user_id", user.id);
      try { sessionStorage.removeItem("pikmi-sidebar"); } catch {}
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    } catch (e: any) {
      setNameError(e.message || "Greška pri čuvanju.");
    }
    setNameSaving(false);
  }

  async function savePassword() {
    setPassError("");
    if (!newPassword) { setPassError("Unesite novu lozinku."); return; }
    if (newPassword.length < 6) { setPassError("Lozinka mora imati najmanje 6 karaktera."); return; }
    if (newPassword !== confirmPassword) { setPassError("Lozinke se ne poklapaju."); return; }

    setPassSaving(true);
    try {
      // Re-autentifikuj s trenutnom lozinkom
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) {
        setPassError("Trenutna lozinka nije ispravna.");
        setPassSaving(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { setPassError(error.message); setPassSaving(false); return; }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPassSaved(true);
      setTimeout(() => setPassSaved(false), 2500);
    } catch (e: any) {
      setPassError(e.message || "Greška pri promjeni lozinke.");
    }
    setPassSaving(false);
  }

  const initials = (firstName[0] ?? "").toUpperCase() + (lastName[0] ?? "").toUpperCase();

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header">
        <h1 className="page-title">Podešavanja naloga</h1>
        <p className="page-subtitle">Uredi ime, profilnu sliku i lozinku</p>
      </div>

      {/* Avatar + Ime */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#A78BFA" }} />
          Profilna slika i ime
        </div>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24, padding: 16, background: "rgba(124,58,237,0.05)", borderRadius: 12, border: "1px solid rgba(124,58,237,0.15)" }}>
          <div style={{ flexShrink: 0 }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--purple)" }} />
              : <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff" }}>{initials || "?"}</div>
            }
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Profilna slika</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10 }}>JPG ili PNG · max 2MB</div>
            <div style={{ display: "flex", gap: 8 }}>
              <label style={{ cursor: "pointer" }}>
                <span className="btn btn-ghost btn-sm" style={{ pointerEvents: "none" }}>
                  {uploadingAvatar ? "Uploading..." : "📷 Promijeni sliku"}
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
                    try { sessionStorage.removeItem("pikmi-sidebar"); } catch {}
                  }}>
                  Ukloni
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ime */}
        <div className="edit-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Ime</label>
            <input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Marko" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Prezime</label>
            <input className="input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Jovanović" />
          </div>
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label className="label">Email adresa</label>
          <input className="input" value={email} disabled style={{ opacity: 0.5, cursor: "not-allowed" }} />
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>Email se ne može mijenjati</div>
        </div>

        {nameError && (
          <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: 13 }}>
            ⚠️ {nameError}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={saveName} disabled={nameSaving}>
            {nameSaving ? "Čuvanje..." : nameSaved ? "✓ Sačuvano!" : "💾 Sačuvaj"}
          </button>
        </div>
      </div>

      {/* Promjena lozinke */}
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#A78BFA" }} />
          Promjena lozinke
        </div>

        <div className="field">
          <label className="label">Trenutna lozinka</label>
          <div style={{ position: "relative" }}>
            <input
              className="input"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(v => !v)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 16, padding: 0 }}
            >
              {showCurrent ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        <div className="field">
          <label className="label">Nova lozinka</label>
          <div style={{ position: "relative" }}>
            <input
              className="input"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 6 karaktera"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowNew(v => !v)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 16, padding: 0 }}
            >
              {showNew ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        <div className="field">
          <label className="label">Potvrdi novu lozinku</label>
          <div style={{ position: "relative" }}>
            <input
              className="input"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Ponovi lozinku"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 16, padding: 0 }}
            >
              {showConfirm ? "🙈" : "👁"}
            </button>
          </div>
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <div style={{ fontSize: 12, color: "#F87171", marginTop: 4 }}>Lozinke se ne poklapaju</div>
          )}
          {newPassword && confirmPassword && newPassword === confirmPassword && (
            <div style={{ fontSize: 12, color: "#1AA877", marginTop: 4 }}>✓ Lozinke se poklapaju</div>
          )}
        </div>

        {passError && (
          <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: 13 }}>
            ⚠️ {passError}
          </div>
        )}

        {passSaved && (
          <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 12, background: "rgba(26,168,119,0.1)", border: "1px solid rgba(26,168,119,0.3)", color: "#1AA877", fontSize: 13 }}>
            ✓ Lozinka je uspješno promijenjena!
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            className="btn btn-primary"
            onClick={savePassword}
            disabled={passSaving || !currentPassword || !newPassword || !confirmPassword}
          >
            {passSaving ? "Mijenjanje..." : "Promijeni lozinku"}
          </button>
        </div>
      </div>
    </div>
  );
}
