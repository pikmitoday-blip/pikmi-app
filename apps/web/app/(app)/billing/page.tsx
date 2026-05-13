"use client";
import { useState, useEffect } from "react";

export default function Billing() {
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const userId = "1";

  useEffect(() => {
    fetch(`http://localhost:4000/api/billing/${userId}`)
      .then(r => r.json())
      .then(data => { setSub(data); setLoading(false); })
      .catch(() => { setSub({ status: "free" }); setLoading(false); });
  }, []);

  async function subscribe(plan: string) {
    setActionLoading(true);
    const r = await fetch("http://localhost:4000/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, plan, provider: "stripe" }),
    });
    setSub(await r.json());
    setActionLoading(false);
  }

  async function cancel() {
    setActionLoading(true);
    await fetch(`http://localhost:4000/api/billing/${userId}`, { method: "DELETE" });
    setSub((s: any) => ({ ...s, status: "cancelled" }));
    setActionLoading(false);
  }

  if (loading) return <div style={{ padding: 40, color: "var(--text3)" }}>Učitavanje...</div>;

  const isActive = sub?.status === "active";
  const isFree = sub?.status === "free" || !sub?.status;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Naplata</h1>
        <p className="page-subtitle">Upravljaj pretplatom i planom</p>
      </div>

      {/* Current status */}
      <div className="card mb-8" style={{ background: isActive ? "rgba(124,58,237,0.06)" : "var(--card)", border: isActive ? "1px solid rgba(124,58,237,0.25)" : "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div style={{ width: 48, height: 48, borderRadius: 12, background: isActive ? "var(--grad)" : "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              {isActive ? "⚡" : "🎯"}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                {isActive ? `Pro plan aktivan` : "Free plan"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>
                {isActive && sub?.endsAt
                  ? `Obnavlja se ${new Date(sub.endsAt).toLocaleDateString("sr")}`
                  : "Nadogradi na Pro za sve funkcionalnosti"}
              </div>
            </div>
          </div>
          <span className={`badge ${isActive ? "badge-green" : "badge-purple"}`}>
            {isActive ? "✓ Aktivna" : "Free"}
          </span>
        </div>
        {sub?.status === "cancelled" && (
          <div className="mt-4 text-sm" style={{ color: "var(--text3)" }}>⚠ Pretplata je otkazana. Možeš je ponovo aktivirati ispod.</div>
        )}
      </div>

      {/* Plans */}
      <div className="grid-2" style={{ gap: 24 }}>
        {/* Free */}
        <div className="card" style={{ opacity: isActive ? 0.6 : 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Free</div>
          <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 4 }}>0€</div>
          <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 28 }}>zauvek besplatno</div>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {["1 pitch link", "Osnovni profil", "Statistika pregleda"].map(f => (
              <li key={f} className="flex items-center gap-2" style={{ fontSize: 14, color: "var(--text2)" }}>
                <span style={{ color: "#4ADE80", fontSize: 12 }}>✓</span> {f}
              </li>
            ))}
          </ul>
          {isFree && <div className="btn btn-ghost w-full" style={{ justifyContent: "center", cursor: "default" }}>Tvoj trenutni plan</div>}
        </div>

        {/* Pro */}
        <div className="card glow" style={{ border: "1px solid rgba(124,58,237,0.35)", background: "rgba(124,58,237,0.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <div style={{ fontSize: 12, fontWeight: 600, color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.08em" }}>Pro</div>
            <span className="badge badge-purple">Popularno</span>
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 4 }}>8€<span style={{ fontSize: 16, fontWeight: 500, color: "var(--text2)" }}>/mes</span></div>
          <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 28 }}>ili 72€/godišnje (uštedi 25%)</div>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {[
              "Neograničeno pitch linkova",
              "Sve sekcije profila",
              "Real-time tracking",
              "Push notifikacije",
              "Outreach kit",
              "Custom boje i fontovi",
              "Prioritetna podrška",
            ].map(f => (
              <li key={f} className="flex items-center gap-2" style={{ fontSize: 14, color: "var(--text2)" }}>
                <span style={{ color: "#A78BFA", fontSize: 12 }}>✦</span> {f}
              </li>
            ))}
          </ul>
          {!isActive ? (
            <button className="btn btn-primary w-full" style={{ justifyContent: "center" }}
              onClick={() => subscribe("pro")} disabled={actionLoading}>
              {actionLoading ? "Obrađujem..." : "Pretplati se na Pro →"}
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="btn btn-ghost w-full" style={{ justifyContent: "center", cursor: "default" }}>✓ Tvoj trenutni plan</div>
              <button className="btn btn-danger btn-sm w-full" style={{ justifyContent: "center" }}
                onClick={cancel} disabled={actionLoading}>
                {actionLoading ? "Otkazujem..." : "Otkaži pretplatu"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-8">
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Česta pitanja</h2>
        <div className="flex flex-col gap-3">
          {[
            { q: "Mogu li da otkažem u bilo kom trenutku?", a: "Da, pretplatu možeš otkazati kada god želiš. Imaćeš Pro pristup do kraja plaćenog perioda." },
            { q: "Koja je razlika između Free i Pro?", a: "Pro plan daje neograničen broj pitch linkova, real-time notifikacije i naprednu analitiku." },
            { q: "Da li su podaci bezbedni?", a: "Svi podaci su šifrovani i sigurno čuvani. Nikada ne delimo tvoje podatke sa trećim stranama." },
          ].map((item) => (
            <div key={item.q} className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{item.q}</div>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
