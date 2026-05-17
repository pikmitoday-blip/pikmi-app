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
      className="btn btn-primary w-full"
      style={{ justifyContent: "center", opacity: loading ? 0.7 : 1 }}
    >
      {loading ? "Učitavanje..." : "Pretplati se na Pro"}
    </button>
  );
}
