"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://pikmi.today/reset-password",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="card" style={{ padding: "40px 36px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Provjeri email</h2>
        <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 28, lineHeight: 1.6 }}>
          Poslali smo link za reset lozinke na <strong>{email}</strong>. Klikni na link u emailu da nastaviš.
        </p>
        <Link href="/login" style={{ fontSize: 14, color: "#A78BFA", fontWeight: 600 }}>
          ← Nazad na prijavu
        </Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "40px 36px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Zaboravljena lozinka 🔑</h1>
      <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 32 }}>
        Upiši email i poslaćemo ti link za reset.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
          {loading ? "Slanje..." : "Pošalji reset link →"}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "var(--text2)" }}>
        <Link href="/login" style={{ color: "#A78BFA", fontWeight: 600 }}>
          ← Nazad na prijavu
        </Link>
      </div>
    </div>
  );
}
