"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);

    // Provjeri da li je korisnik ulogovan
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Nije ulogovan — idi na registraciju, pa će billing page otvoriti checkout
      window.location.href = "/register?plan=pro";
      return;
    }

    // Ulogovan — pozovi Stripe checkout
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = "/billing";
      }
    } catch {
      window.location.href = "/billing";
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
