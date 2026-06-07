"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { pixel } from "../../../lib/pixel";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Capture the slug typed on the landing page (?slug=…) for the onboarding step
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get("slug");
      if (slug) localStorage.setItem("pikmi-pending-slug", slug);
    } catch {}
  }, []);

  async function handleOAuth(provider: "google" | "apple") {
    setOauthLoading(provider);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/onboarding` },
      });
      if (error) {
        setError(error.message);
        setOauthLoading(null);
      }
      // On success the browser redirects to the provider, then back to /onboarding.
    } catch (e: any) {
      setError(e?.message ?? "Greška pri prijavi.");
      setOauthLoading(null);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Lozinka mora imati najmanje 6 karaktera.");
      setLoading(false);
      return;
    }

    // Provjeri device trial (lokalna zaštita od abuse)
    let deviceId = localStorage.getItem("pikmi-device-id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
    }

    const { data: existingTrial } = await supabase
      .from("device_trials")
      .select("used_at")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (existingTrial) {
      setError("Na ovom uređaju je već iskorišćen besplatni trial. Kupi Pro plan da nastaviš.");
      setLoading(false);
      return;
    }

    // Registracija
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    });

    if (error) {
      setError(error.message === "User already registered"
        ? "Email je već registrovan. Prijavi se ili resetuj lozinku."
        : error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Kreiraj profil sa trial periodom
      await supabase.from("profiles").insert({
        user_id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        plan: "free",
        trial_ends_at: trialEndsAt,
      });

      // Zabilježi device kao iskorišćen za trial
      localStorage.setItem("pikmi-device-id", deviceId);
      await supabase.from("device_trials").insert({ device_id: deviceId });

      // Sačuvaj trial info lokalno
      localStorage.setItem("pikmi-trial-ends", trialEndsAt);

      // Meta Pixel: korisnik završio registraciju
      pixel.completeRegistration();
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="card" style={{ padding: "40px 36px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Nalog je kreiran!</h2>
        <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 8, lineHeight: 1.6 }}>
          Proveri email (<strong>{email}</strong>) i klikni na link za potvrdu.
        </p>
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 24,
          background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
          fontSize: 13, color: "#A78BFA", lineHeight: 1.6,
        }}>
          🎁 Tvoj <strong>7-dnevni besplatni trial</strong> počinje od danas — imaš pristup svim funkcijama!
        </div>
        <Link href="/login" className="btn btn-primary" style={{ justifyContent: "center", display: "flex" }}>
          Idi na prijavu →
        </Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "40px 36px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Kreiraj pikmi profil ✨</h1>
      <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 8 }}>
        Besplatno. Bez kreditne kartice.
      </p>
      <div style={{
        padding: "10px 14px", borderRadius: 8, marginBottom: 20,
        background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
        fontSize: 13, color: "#A78BFA",
      }}>
        🎁 7 dana besplatnog triala — sve funkcije uključene
      </div>

      {/* ── OAuth ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        <button type="button" onClick={() => handleOAuth("google")} disabled={oauthLoading !== null}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            width: "100%", padding: "11px 16px", borderRadius: 10,
            background: "#fff", border: "1px solid var(--border)",
            color: "#1a1a2e", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            opacity: oauthLoading === "google" ? 0.6 : 1,
          }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
          {oauthLoading === "google" ? "Povezivanje..." : "Nastavi sa Google"}
        </button>
        <button type="button" onClick={() => handleOAuth("apple")} disabled={oauthLoading !== null}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            width: "100%", padding: "11px 16px", borderRadius: 10,
            background: "#000", border: "1px solid #000",
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            opacity: oauthLoading === "apple" ? 0.6 : 1,
          }}>
          <svg width="16" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.05 12.04c-.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.1-2.01-3.77-2.04-1.6-.16-3.13.94-3.94.94-.81 0-2.07-.92-3.4-.9-1.75.03-3.36 1.02-4.26 2.58-1.82 3.16-.46 7.83 1.3 10.39.86 1.25 1.88 2.66 3.22 2.61 1.29-.05 1.78-.83 3.34-.83 1.56 0 2 .83 3.37.81 1.39-.03 2.27-1.28 3.12-2.54.98-1.46 1.38-2.87 1.4-2.94-.03-.01-2.69-1.03-2.72-4.08zM14.6 4.42c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.98-1.08 3.15 1.14.09 2.3-.58 3.01-1.44z"/></svg>
          {oauthLoading === "apple" ? "Povezivanje..." : "Nastavi sa Apple"}
        </button>
      </div>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: 12, color: "var(--text3)" }}>ili putem emaila</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

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
            autoComplete="off"
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
            autoComplete="new-password"
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
