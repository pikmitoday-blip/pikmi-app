"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionWarning, setSessionWarning] = useState(false);

  useEffect(() => {
    if (searchParams.get("reason") === "limit") {
      setSessionWarning(true);
    }
  }, [searchParams]);

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
