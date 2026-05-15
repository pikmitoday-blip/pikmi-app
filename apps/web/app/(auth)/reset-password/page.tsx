"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "expired" | "done">("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSession() {
      const hash = window.location.hash;

      // Provjeri error u hash-u (npr. otp_expired)
      if (hash && hash.includes("error=")) {
        setStatus("expired");
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      // PKCE flow — ?code=
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          window.history.replaceState(null, "", "/reset-password");
          setStatus("ready");
          return;
        }
      }

      // Implicit flow — #access_token=
      if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error) {
            window.history.replaceState(null, "", "/reset-password");
            setStatus("ready");
            return;
          }
        }
      }

      // Postojeća sesija
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus("ready");
        return;
      }

      setStatus("expired");
    }

    checkSession();
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Lozinke se ne podudaraju."); return; }
    if (password.length < 6) { setError("Lozinka mora imati najmanje 6 karaktera."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); }
    else { setStatus("done"); setTimeout(() => router.push("/dashboard"), 2000); }
  }

  if (status === "done") {
    return (
      <main className="auth-page">
        <div className="card" style={{ padding: "40px 36px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Lozinka promijenjena!</h2>
          <p style={{ fontSize: 14, color: "var(--text2)" }}>Preusmjeravamo te na dashboard...</p>
        </div>
      </main>
    );
  }

  if (status === "expired") {
    return (
      <main className="auth-page">
        <div className="card" style={{ padding: "40px 36px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Link je istekao</h2>
          <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 24 }}>
            Reset link važi samo 1 sat. Pošalji novi link i odmah klikni.
          </p>
          <button
            onClick={() => router.push("/forgot-password")}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            ← Pošalji novi link
          </button>
        </div>
      </main>
    );
  }

  if (status === "loading") {
    return (
      <main className="auth-page">
        <div className="card" style={{ padding: "40px 36px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
          <p style={{ fontSize: 14, color: "var(--text2)" }}>Verifikacija u toku...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="card" style={{ padding: "40px 36px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Nova lozinka 🔐</h1>
        <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 32 }}>
          Unesi novu lozinku za tvoj pikmi nalog.
        </p>
        <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>
              Nova lozinka
            </label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required placeholder="••••••••  (min. 6 karaktera)"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>
              Potvrdi lozinku
            </label>
            <input
              type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              required placeholder="••••••••"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Čuvanje..." : "Sačuvaj novu lozinku →"}
          </button>
        </form>
      </div>
    </main>
  );
}
