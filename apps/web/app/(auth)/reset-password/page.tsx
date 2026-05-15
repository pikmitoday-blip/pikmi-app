"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function checkSession() {
      // 1. Ručno parsiramo hash jer createBrowserClient ne obrađuje automatski
      const hash = window.location.hash;
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
            // Ukloni hash iz URL-a
            window.history.replaceState(null, "", window.location.pathname);
            setReady(true);
            return;
          }
        }
      }

      // 2. Provjeri da li već postoji sesija
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setReady(true);
        return;
      }

      // 3. Nema sesije — link je nevažeći ili istekao
      router.replace("/forgot-password?expired=1");
    }

    checkSession();
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Lozinke se ne podudaraju.");
      return;
    }
    if (password.length < 6) {
      setError("Lozinka mora imati najmanje 6 karaktera.");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  }

  if (done) {
    return (
      <div className="card" style={{ padding: "40px 36px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
          Lozinka promijenjena!
        </h2>
        <p style={{ fontSize: 14, color: "var(--text2)" }}>
          Preusmjeravamo te na dashboard...
        </p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="card" style={{ padding: "40px 36px", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
        <p style={{ fontSize: 14, color: "var(--text2)" }}>
          Verifikacija u toku...
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "40px 36px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
        Nova lozinka 🔐
      </h1>
      <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 32 }}>
        Unesi novu lozinku za tvoj pikmi nalog.
      </p>

      <form
        onSubmit={handleReset}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>
            Nova lozinka
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••  (min. 6 karaktera)"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              background: "var(--surface)", border: "1px solid var(--border)",
              color: "var(--text)", fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>
            Potvrdi lozinku
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="••••••••"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              background: "var(--surface)", border: "1px solid var(--border)",
              color: "var(--text)", fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#F87171", fontSize: 13,
          }}>
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", marginTop: 4, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Čuvanje..." : "Sačuvaj novu lozinku →"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text3)" }}>
        Učitavanje...
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
