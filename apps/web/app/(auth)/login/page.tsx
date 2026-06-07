"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const REMEMBER_KEY = "pikmi-remember";
const SESSION_TS_KEY = "pikmi-session-ts";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 sata

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionWarning, setSessionWarning] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) { setError(error.message); setGoogleLoading(false); }
    } catch (e: any) {
      setError(e?.message ?? "Greška pri prijavi.");
      setGoogleLoading(false);
    }
  }

  // Učitaj zapamćene podatke + provjeri aktivnu sesiju
  useEffect(() => {
    if (searchParams.get("reason") === "limit") {
      setSessionWarning(true);
      return; // Ne radi auto-redirect ako je istisnuta sesija
    }

    // Auto-redirect ako postoji aktivna sesija unutar 24h
    async function checkSession() {
      try {
        const ts = localStorage.getItem(SESSION_TS_KEY);
        if (ts && Date.now() - Number(ts) < SESSION_TTL_MS) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            router.replace("/dashboard");
            return;
          }
        }
        // Istekao ili nema sesije — obriši timestamp
        localStorage.removeItem(SESSION_TS_KEY);
      } catch {}

      // Učitaj zapamćene login podatke i odmah prijavi
      try {
        const saved = localStorage.getItem(REMEMBER_KEY);
        if (saved) {
          const { email: savedEmail, password: savedPassword } = JSON.parse(saved);
          if (savedEmail && savedPassword) {
            setEmail(savedEmail);
            setPassword(savedPassword);
            setRememberMe(true);
            // Auto-login — ne čekaj klik na dugme
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({
              email: savedEmail,
              password: savedPassword,
            });
            if (!error) {
              localStorage.setItem(SESSION_TS_KEY, Date.now().toString());
              router.replace("/dashboard");
              return;
            }
            // Kredencijali više ne važe — obriši ih
            localStorage.removeItem(REMEMBER_KEY);
            setLoading(false);
          }
        }
      } catch {}
    }

    checkSession();
  }, [searchParams, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Pogrešan email ili lozinka."
        : error.message);
      setLoading(false);
    } else {
      // Zapamti ili zaboravi podatke
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email, password }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      // Snimi timestamp sesije (auto-redirect narednih 24h)
      localStorage.setItem(SESSION_TS_KEY, Date.now().toString());
      router.push("/dashboard");
    }
  }

  return (
    <div className="card" style={{ padding: "40px 36px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Dobrodošao nazad 👋</h1>
      <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: sessionWarning ? 16 : 32 }}>
        Uloguj se da pristupiš svom profilu
      </p>

      {sessionWarning && (
        <div style={{
          padding: "10px 14px", borderRadius: 8, marginBottom: 20,
          background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)",
          color: "#FCD34D", fontSize: 13,
        }}>
          📱 Prijavljen si na previše uređaja (max 3). Ovaj uređaj je odjavljen. Prijavi se ponovo.
        </div>
      )}

      {/* Google login */}
      <button type="button" onClick={handleGoogle} disabled={googleLoading}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          width: "100%", padding: "11px 16px", borderRadius: 10, marginBottom: 18,
          background: "#fff", border: "1px solid var(--border)",
          color: "#1a1a2e", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          opacity: googleLoading ? 0.6 : 1,
        }}>
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
        {googleLoading ? "Povezivanje..." : "Prijavi se sa Google"}
      </button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: 12, color: "var(--text3)" }}>ili putem emaila</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>
            Email adresa
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="tvoj@email.com"
            autoComplete="email"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              background: "var(--surface)", border: "1px solid var(--border)",
              color: "var(--text)", fontSize: 14, outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>
            Lozinka
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="current-password"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              background: "var(--surface)", border: "1px solid var(--border)",
              color: "var(--text)", fontSize: 14, outline: "none",
              boxSizing: "border-box",
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

        {/* Zapamti me + Zaboravili ste lozinku */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: -4 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
            <div
              onClick={() => setRememberMe(v => !v)}
              style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                border: rememberMe ? "none" : "1.5px solid var(--border)",
                background: rememberMe ? "var(--purple, #7C3AED)" : "var(--surface)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {rememberMe && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>Zapamti me</span>
          </label>

          <Link href="/forgot-password" style={{ fontSize: 13, color: "#A78BFA", fontWeight: 500 }}>
            Zaboravili ste lozinku?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", marginTop: 4, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Prijavljivanje..." : "Prijavi se →"}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "var(--text2)" }}>
        Nemaš nalog?{" "}
        <Link href="/register" style={{ color: "#A78BFA", fontWeight: 600 }}>
          Registruj se besplatno
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="card" style={{ padding: "40px 36px", textAlign: "center", color: "var(--text3)" }}>
        Učitavanje...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
