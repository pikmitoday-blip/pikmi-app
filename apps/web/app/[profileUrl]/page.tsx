"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import PikmiLogo from "../components/PikmiLogo";

export default function PublicProfile({ params }: { params: { profileUrl: string } }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:4000/api/profile/${params.profileUrl}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));

    // Track view
    fetch("http://localhost:4000/api/dashboard/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "1", pitchSlug: params.profileUrl, clientName: "Visitor", duration: 0, sections: [] }),
    }).catch(() => {});
  }, [params.profileUrl]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ textAlign: "center" }}>
        <div className="nav-logo-icon" style={{ width: 40, height: 40, fontSize: 20, margin: "0 auto 16px" }}>p</div>
        <div style={{ color: "var(--text3)", fontSize: 14 }}>Učitavanje profila...</div>
      </div>
    </div>
  );

  if (!profile) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 32 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Profil nije pronađen</h1>
        <p style={{ color: "var(--text2)", marginBottom: 24 }}>Pikmi profil <strong>/{params.profileUrl}</strong> ne postoji ili nije javno dostupan.</p>
        <Link href="/" className="btn btn-primary">← Nazad na pikmi</Link>
      </div>
    </div>
  );

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Mini nav */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(11,15,25,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" className="nav-logo" style={{ fontSize: 16 }}>
          <PikmiLogo size={26} />
          pikmi
        </Link>
        <Link href="/onboarding" className="btn btn-primary btn-sm">Kreiraj tvoj profil</Link>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Hero */}
        <div className="card" style={{ textAlign: "center", padding: "48px 32px", marginBottom: 24, background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div className="avatar" style={{ width: 72, height: 72, fontSize: 28, margin: "0 auto 20px" }}>
            {(profile.name || "?")[0].toUpperCase()}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>{profile.name || "Ime"}</h1>
          <div style={{ fontSize: 16, color: "#A78BFA", fontWeight: 600, marginBottom: 4 }}>{profile.profession || "Profesija"}</div>
          <div style={{ fontSize: 14, color: "var(--text3)", marginBottom: 24 }}>📍 {profile.city || "Lokacija"}</div>
          <a href="#contact" className="btn btn-primary">Kontaktiraj me →</a>
        </div>

        {/* Bio */}
        {profile.content && (
          <div className="card mb-4">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>O meni</h2>
            <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7 }}>{profile.content}</p>
          </div>
        )}

        {/* Services */}
        <div className="card mb-4">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Šta radim</h2>
          <div className="grid-2" style={{ gap: 12 }}>
            {["Dizajn", "Development", "Branding", "Konsultacije"].map(s => (
              <div key={s} style={{ padding: "12px 16px", background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", fontSize: 14, fontWeight: 500 }}>
                ✦ {s}
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio */}
        <div className="card mb-4">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Moji radovi</h2>
          <div className="grid-2" style={{ gap: 12 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ aspectRatio: "16/9", borderRadius: 10, background: `rgba(${[124,59,236][i % 3]},${[58,130,72][i % 3]},${[237,246,153][i % 3]},0.1)`, border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "var(--text3)", fontSize: 13 }}>Projekat {i}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div id="contact" className="card" style={{ textAlign: "center", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Hajde da sarađujemo</h2>
          <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>Slobodno me kontaktiraj — odgovorim u roku od 24h.</p>
          <div className="flex gap-3 justify-center">
            <a href="mailto:hello@example.com" className="btn btn-primary">📧 Pošalji email</a>
            <a href="#" className="btn btn-ghost">📅 Zakaži poziv</a>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "20px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "var(--text3)" }}>
          Ovaj profil je napravljen na{" "}
          <Link href="/" style={{ color: "#A78BFA", fontWeight: 600 }}>pikmi.app</Link>
        </div>
      </div>
    </div>
  );
}
