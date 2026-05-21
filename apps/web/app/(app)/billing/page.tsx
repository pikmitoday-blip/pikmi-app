"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

interface BillingProfile {
  plan: "free" | "pro";
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
}

interface SubDetails {
  status: string;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  currentPeriodEnd: string;
  currentPeriodStart: string;
  amount: number;
  currency: string;
  card: { brand: string; last4: string; expMonth: number; expYear: number } | null;
  lastInvoiceAmount: number | null;
  lastInvoiceDate: string | null;
  lastInvoicePdf: string | null;
}

function BillingContent() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<BillingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelAt, setCancelAt] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [subDetails, setSubDetails] = useState<SubDetails | null>(null);

  const successMsg = searchParams.get("success") === "1";
  const cancelledMsg = searchParams.get("cancelled") === "1";
  const paymentUpdatedMsg = searchParams.get("payment_updated") === "1";

  // Resetuj loading state kad se stranica restorira iz bfcache (browser back dugme)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setPortalLoading(false);
        setCheckoutLoading(false);
        setCancelLoading(false);
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

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

      const profileData = data as BillingProfile ?? { plan: "free", trial_ends_at: null, stripe_subscription_id: null };
      setProfile(profileData);

      // Fetch subscription details if Pro
      if (profileData?.plan === "pro" && profileData?.stripe_subscription_id) {
        try {
          const subRes = await fetch("/api/stripe/subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          });
          const subData = await subRes.json();
          if (subData.subscription) {
            setSubDetails(subData.subscription);
            if (subData.subscription.cancelAt) {
              setCancelAt(subData.subscription.cancelAt);
            }
          }
        } catch {}
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/update-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        // Ne resetuj loading — stranica se odlazi
      } else {
        setPortalLoading(false);
      }
    } catch {
      setPortalLoading(false);
    }
  }

  async function handleCancel() {
    setCancelLoading(true);
    try {
      const res = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.ok) {
        setCancelAt(data.cancelAt);
        setShowCancelModal(false);
      }
    } catch {}
    setCancelLoading(false);
  }

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
      {paymentUpdatedMsg && (
        <div style={{
          padding: "14px 18px", borderRadius: 10, marginBottom: 20,
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
          color: "#4ADE80", fontSize: 14, fontWeight: 600,
        }}>
          ✓ Način plaćanja je uspješno ažuriran.
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

      {/* Subscription details (Pro only) */}
      {isPro && subDetails && (
        <div className="card mb-8" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 18 }}>
            Detalji pretplate
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: subDetails.card || subDetails.lastInvoiceAmount !== null ? 20 : 0 }}>
            {/* Next billing */}
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6, fontWeight: 600 }}>
                {subDetails.cancelAtPeriodEnd ? "⚠ Ističe" : "Sledeća naplata"}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: subDetails.cancelAtPeriodEnd ? "#FCD34D" : "var(--text)" }}>
                {new Date(subDetails.currentPeriodEnd).toLocaleDateString("sr-RS", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
            {/* Amount */}
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6, fontWeight: 600 }}>Iznos pretplate</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {subDetails.amount ? `${(subDetails.amount / 100).toLocaleString("sr-RS")} ${subDetails.currency.toUpperCase()}` : "—"}
                <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text3)" }}>/mes</span>
              </div>
            </div>
            {/* Status */}
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6, fontWeight: 600 }}>Status</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                <span style={{
                  padding: "3px 9px", borderRadius: 6, fontSize: 12,
                  background: subDetails.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(251,191,36,0.1)",
                  color: subDetails.status === "active" ? "#4ADE80" : "#FCD34D",
                  border: `1px solid ${subDetails.status === "active" ? "rgba(34,197,94,0.25)" : "rgba(251,191,36,0.25)"}`,
                }}>
                  {subDetails.status === "active" ? "✓ Aktivna" : subDetails.status}
                </span>
              </div>
            </div>
          </div>

          {/* Payment method + last invoice */}
          {(subDetails.card || subDetails.lastInvoiceAmount !== null) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              {subDetails.card && (
                <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 22 }}>
                    {subDetails.card.brand === "visa" ? "💳" : subDetails.card.brand === "mastercard" ? "💳" : "💳"}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 3, fontWeight: 600 }}>Kartica</div>
                    <div style={{ fontSize: 14, fontWeight: 700, textTransform: "capitalize" }}>
                      {subDetails.card.brand} •••• {subDetails.card.last4}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>
                      Ističe {subDetails.card.expMonth}/{subDetails.card.expYear}
                    </div>
                  </div>
                </div>
              )}
              {subDetails.lastInvoiceAmount !== null && (
                <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6, fontWeight: 600 }}>Poslednja faktura</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                    {(subDetails.lastInvoiceAmount / 100).toLocaleString("sr-RS")} {subDetails.currency.toUpperCase()}
                  </div>
                  {subDetails.lastInvoiceDate && (
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>
                      {new Date(subDetails.lastInvoiceDate).toLocaleDateString("sr-RS", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  )}
                  {subDetails.lastInvoicePdf && (
                    <a href={subDetails.lastInvoicePdf} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: "var(--purple)", textDecoration: "none", fontWeight: 600, display: "inline-block", marginTop: 6 }}>
                      Preuzmi PDF ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cancelAt ? (
                <div style={{
                  padding: "12px 14px", borderRadius: 10,
                  background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
                  fontSize: 13, color: "#FCD34D", textAlign: "center",
                }}>
                  ⚠ Pretplata ističe {new Date(cancelAt).toLocaleDateString("sr-RS", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              ) : (
                <div className="btn btn-ghost" style={{ justifyContent: "center", cursor: "default" }}>✓ Tvoj trenutni plan</div>
              )}
              <button
                className="btn btn-sm"
                style={{ justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text2)" }}
                onClick={handlePortal}
                disabled={portalLoading}
              >
                {portalLoading ? "Učitavanje..." : "💳 Promeni način plaćanja"}
              </button>
              {!cancelAt && (
                <button
                  className="btn btn-sm"
                  style={{ justifyContent: "center", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}
                  onClick={() => setShowCancelModal(true)}
                >
                  Otkaži pretplatu
                </button>
              )}
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

      {/* Legal linkovi */}
      <div style={{ marginTop: 32, padding: "16px 20px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 12, color: "var(--text3)" }}>
          Korišćenjem Pike Pro plana prihvataš naše pravne uslove.
        </span>
        <div style={{ display: "flex", gap: 16 }}>
          <a href="/uslovi" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: "var(--purple)", textDecoration: "none", fontWeight: 600 }}>
            Uslovi korišćenja ↗
          </a>
          <a href="/privatnost" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: "var(--purple)", textDecoration: "none", fontWeight: 600 }}>
            Politika privatnosti ↗
          </a>
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
      {/* Modal za potvrdu otkazivanja */}
      {showCancelModal && (
        <div
          onClick={() => setShowCancelModal(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "var(--card)", borderRadius: 16, padding: "32px 28px",
              width: "100%", maxWidth: 420,
              border: "1px solid var(--border)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 16 }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, textAlign: "center" }}>
              Otkaži Pro pretplatu?
            </h3>
            <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6, textAlign: "center", marginBottom: 8 }}>
              Zadržaćeš pristup svim Pro funkcijama do kraja trenutnog obračunskog perioda.
            </p>
            <p style={{ fontSize: 13, color: "var(--text3)", textAlign: "center", marginBottom: 28 }}>
              Nakon isteka, nalog se automatski prebacuje na Free plan.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  flex: 1, padding: "12px", borderRadius: 10,
                  background: "var(--surface)", border: "1px solid var(--border)",
                  color: "var(--text)", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Zadrži Pro
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                style={{
                  flex: 1, padding: "12px", borderRadius: 10,
                  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                  color: "#F87171", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                {cancelLoading ? "Otkazivanje..." : "Da, otkaži"}
              </button>
            </div>
          </div>
        </div>
      )}
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
