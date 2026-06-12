"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { pixel } from "../../lib/pixel";

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  // Resetuj loading kada korisnik klikne "back" u browseru (bfcache restore)
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) setLoading(false); };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function handleClick() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/register?plan=pro";
      return;
    }

    // Provjeri trenutni plan — ako je već Pro, vodi na pretplatu
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user.id)
        .single();
      if (profile?.plan === "pro") {
        window.location.href = "/account?tab=subscription";
        return;
      }
    } catch {}

    // Nije Pro — InitiateCheckout (client + CAPI, isti event_id) pa Stripe checkout
    pixel.initiateCheckout(990, user.id, user.email);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, userEmail: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = "/account?tab=subscription";
      }
    } catch {
      window.location.href = "/account?tab=subscription";
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "14px 20px", borderRadius: 12, border: "none",
        cursor: loading ? "wait" : "pointer",
        background: loading ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
        color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "inherit",
        boxShadow: loading ? "none" : "0 6px 24px rgba(124,58,237,0.5), 0 2px 8px rgba(0,0,0,0.2)",
        transition: "all 0.2s",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? "Učitavanje..." : <>Pretplati se na Pro <span style={{ fontSize: 17 }}>→</span></>}
    </button>
  );
}
