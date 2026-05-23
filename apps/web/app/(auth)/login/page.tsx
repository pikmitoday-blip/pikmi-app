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
  const [error, setError] = useState("");
  const [sessionWarning, setSessionWarning] = useState(false);

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

      // Učitaj zapamćene login podatke
      try {
        const saved = localStorage.getItem(REMEMBER_KEY);
        if (saved) {
          const { email: savedEmail, password: savedPassword } = JSON.parse(saved);
          if (savedEmail) setEmail(savedEmail);
          if (savedPassword) setPassword(savedPassword);
          setRememberMe(true);
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
