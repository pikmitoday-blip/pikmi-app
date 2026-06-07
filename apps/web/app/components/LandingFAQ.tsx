"use client";
import { useState } from "react";

export interface FaqItem { q: string; a: string; }

export default function LandingFAQ({ title, items }: { title: string; items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (!items.length) return null;

  return (
    <section style={{ width: "100%", padding: "64px 24px 24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "linear-gradient(135deg,#A855F7,#D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 14 }}>FAQ</div>
          <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1, lineHeight: 1.12, color: "#fff" }}>{title}</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${isOpen ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s",
              }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                    padding: "18px 22px", background: "none", border: "none", cursor: "pointer",
                    textAlign: "left", fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>{it.q}</span>
                  <span style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: "50%",
                    background: isOpen ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 16, transition: "all 0.25s",
                    transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                  }}>+</span>
                </button>
                <div style={{
                  maxHeight: isOpen ? 600 : 0, overflow: "hidden",
                  transition: "max-height 0.35s cubic-bezier(0.16,1,0.3,1)",
                }}>
                  <p style={{ margin: 0, padding: "0 22px 20px", fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {it.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
