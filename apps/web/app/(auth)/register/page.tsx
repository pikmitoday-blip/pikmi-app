"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Lozinka mora imati najmanje 6 karaktera.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Kreiraj profil u bazi
    if (data.user) {
      await supabase.from("profiles").insert({
        user_id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
      });
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="card" style={{ padding: "40px 36px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Nalog je kreiran!</h2>
        <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 28, lineHeight: 1.6 }}>
          Proveri email (<strong>{email}</strong>) i klikni na link za potvrdu. Nakon potvrde možeš se prijaviti.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ justifyContent: "center", display: "flex" }}>
          Idi na prijavu →
        </Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "40px 36px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Kreiraj pikmi profil ✨</h1>
      <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 32 }}>
        Besplatno. Bez kreditne kartice.
      </p>

      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>
              Ime
            </label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
              placeholder="Marko"
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
              Prezime
            </label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              required
              placeholder="Nikolić"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                background: "var(--surface)", border: "1px solid var(--border)",
                color: "var(--text)", fontSize: 14, outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

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
            placeholder="••••••••  (min. 6 karaktera)"
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
          {loading ? "Kreiranje naloga..." : "Kreiraj besplatni nalog →"}
        </button>

        <p style={{ fontSize: 12, color: "var(--text3)", textAlign: "center", lineHeight: 1.5 }}>
          Registracijom prihvataš naše{" "}
          <a href="#" style={{ color: "#A78BFA" }}>Uslove korišćenja</a>{" "}i{" "}
          <a href="#" style={{ color: "#A78BFA" }}>Politiku privatnosti</a>.
        </p>
      </form>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "var(--text2)" }}>
        Već imaš nalog?{" "}
        <Link href="/login" style={{ color: "#A78BFA", fontWeight: 600 }}>
          Prijavi se
        </Link>
      </div>
    </div>
  );
}
