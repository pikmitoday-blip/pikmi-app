"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

interface Props {
  style?: React.CSSProperties;
  label?: string;
}

export default function Checkout3MButton({ style, label = "Pretplati se na 3 meseca" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/register?plan=pro3m";
      return;
    }

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_3M,
        }),
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

  const defaultStyle: React.CSSProperties = {
    display: "block", textAlign: "center", width: "100%",
    padding: "14px 0", borderRadius: 14, border: "none",
    background: loading ? "rgba(16,185,129,0.5)" : "#10B981",
    color: "#08080F", fontSize: 15, fontWeight: 700,
    cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
    boxShadow: loading ? "none" : "0 4px 24px rgba(16,185,129,0.25)",
    transition: "all 0.2s", opacity: loading ? 0.7 : 1,
  };

  return (
    <button onClick={handleClick} disabled={loading} style={{ ...defaultStyle, ...style }}>
      {loading ? "Učitavanje..." : label}
    </button>
  );
}
