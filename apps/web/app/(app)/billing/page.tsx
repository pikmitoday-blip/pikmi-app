"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

interface BillingProfile {
  plan: "free" | "pro";
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
}

function BillingContent() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<BillingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  const successMsg = searchParams.get("success") === "1";
  const cancelledMsg = searchParams.get("cancelled") === "1";

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      setUserEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("plan, trial_ends_at, stripe_subscription_id")
        .eq("user_id", user.id)
        .single();

      setProfile(data as BillingProfile ?? { plan: "free", trial_ends_at: null, stripe_subscription_id: null });
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubscribe() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userEmail }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setCheckoutLoading(false);
    }
  }

  if (loading) return <div style={{ padding: 40, color: "var(--text3)" }}>Učitavanje...</div>;

  const isPro = profile?.plan === "pro";
  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
  const trialActive = trialDaysLeft > 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Naplata</h1>
        <p className="page-subtitle">Upravljaj pretplatom i planom</p>
      </div>

      {/* Success/cancel banners */}
      {successMsg && (
        <div style={{
          padding: "14px 18px", borderRadius: 10, marginBottom: 20,
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
          color: "#4ADE80", fontSize: 14, fontWeight: 600,
        }}>
          🎉 Uspešno! Tvoj Pro plan je aktiviran.
        </div>
      )}
      {cancelledMsg && (
        <div style={{
          padding: "14px 18px", borderRadius: 10, marginBottom: 20,
          background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
          color: "#FCD34D", fontSize: 14,
        }}>
          Plaćanje je otkazano. Možeš pokušati ponovo u bilo kom trenutku.
        </div>
      )}

      {/* Current plan card */}
      <div className="card mb-8" style={{
        background: isPro ? "rgba(124,58,237,0.06)" : "var(--card)",
        border: isPro ? "1px solid rgba(124,58,237,0.3)" : "1px solid var(--border)",
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: isPro ? "linear-gradient(135deg, #7C3AED, #3B82F6)" : "var(--surface)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
            }}>
              {isPro ? "⚡" : "🎯"}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 3 }}>
                {isPro ? "Pro plan" : "Free plan"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>
                {isPro
                  ? "Imaš pristup svim funkcijama"
                  : trialActive
                  ? `Trial ističe za ${trialDaysLeft} ${trialDaysLeft === 1 ? "dan" : "dana"}`
                  : "Trial istekao — nadogradi na Pro"}
              </div>
            </div>
          </div>
          <span className={`badge ${isPro ? "badge-green" : trialActive ? "badge-purple" : ""}`}
            style={!isPro && !trialActive ? { background: "rgba(255,255,255,0.05)", color: "var(--text3)" } : {}}>
            {isPro ? "✓ Pro" : trialActive ? "Trial" : "Free"}
          </span>
        </div>
      </div>

      {/* Plans */}
      <div className="grid-2" style={{ gap: 24 }}>
        {/* Free */}
        <div className="card" style={{ opacity: isPro ? 0.5 : 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Free</div>
          <div style={{ fontSize: 38, fontWeight: 900, marginBottom: 4 }}>0 din</div>
          <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 24 }}>zauvek besplatno</div>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {[
              "Neograničen broj pitch linkova",
              "Potpun profil",
              "Statistika pregleda",
              "Sve sekcije profila",
            ].map(f => (
              <li key={f} className="flex items-center gap-2" style={{ fontSize: 14, color: "var(--text2)" }}>
                <span style={{ color: "#4ADE80", fontSize: 12 }}>✓</span> {f}
              </li>
            ))}
            <li className="flex items-center gap-2" style={{ fontSize: 14, color: "var(--text3)" }}>
              <span style={{ color: "var(--text3)", fontSize: 12 }}>✗</span>
              <span>Outreach kit <span style={{ fontSize: 11, color: "var(--text3)" }}>(zaključano)</span></span>
            </li>
          </ul>
          <div className="btn btn-ghost" style={{ justifyContent: "center", cursor: "default", opacity: 0.6 }}>
            {!isPro ? "Tvoj trenutni plan" : "Free plan"}
          </div>
        </div>

        {/* Pro */}
        <div className="card glow" style={{
          border: "1px solid rgba(124,58,237,0.35)",
          background: "rgba(124,58,237,0.06)",
          position: "relative",
        }}>
          <div style={{
            position: "absolute", top: -12, right: 16,
            background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
            color: "white", fontSize: 11, fontWeight: 700,
            padding: "4px 12px", borderRadius: 100, letterSpacing: "0.05em",
          }}>POPULARNO</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#A78BFA", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pro</div>
          <div style={{ fontSize: 38, fontWeight: 900, marginBottom: 4 }}>
            990 din<span style={{ fontSize: 15, fontWeight: 500, color: "var(--text2)" }}>/mes</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 24 }}>Otkaži u bilo kom trenutku</div>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {[
              "Sve iz Free plana",
              "✦ Outreach kit — Cold DM, Email, Follow-up",
              "✦ Srpski i engleski šabloni",
              "✦ Personalizacija jednim klikom",
              "✦ Buduće Pro funkcionalnosti",
              "✦ Prioritetna podrška",
            ].map(f => (
              <li key={f} className="flex items-center gap-2" style={{ fontSize: 14, color: f.startsWith("✦") ? "var(--text)" : "var(--text2)" }}>
                <span style={{ color: "#A78BFA", fontSize: 12 }}>✦</span>
                {f.replace("✦ ", "")}
              </li>
            ))}
          </ul>

          {isPro ? (
            <div className="btn btn-ghost" style={{ justifyContent: "center", cursor: "default" }}>
              ✓ Tvoj trenutni plan
            </div>
          ) : (
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleSubscribe}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? "Preusmjeravam..." : "Pretplati se na Pro →"}
            </button>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Česta pitanja</h2>
        <div className="flex flex-col gap-3">
          {[
            { q: "Mogu li da otkažem u bilo kom trenutku?", a: "Da, pretplatu možeš otkazati kada god želiš direktno u Stripe portalu. Pro pristup ostaje aktivan do kraja plaćenog perioda." },
            { q: "Zašto je Outreach kit jedina razlika?", a: "Vjerujemo da svaki freelancer zaslužuje odličan profil i pitch linkove — besplatno. Outreach kit je premium alat za one koji žele da skaliraju akviziciju klijenata." },
            { q: "Koliko dugo traje besplatni trial?", a: "7 dana od registracije. Tokom triala imaš pristup svim funkcijama uključujući Outreach kit — bez kreditne kartice." },
            { q: "Da li su podaci bezbedni?", a: "Plaćanje se vrši direktno kroz Stripe — mi nikada ne vidimo podatke tvoje kartice. Profil podaci su enkriptovani i sigurno čuvani." },
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

export default function Billing() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--text3)" }}>Učitavanje...</div>}>
      <BillingContent />
    </Suspense>
  );
}
