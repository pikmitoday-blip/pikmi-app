"use client";
import Link from "next/link";
import PikmiLogo from "../components/PikmiLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      {/* Logo */}
      <Link href="/" style={{
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 22, fontWeight: 800, color: "var(--text)",
        textDecoration: "none", marginBottom: 40,
      }}>
        <PikmiLogo size={28} />
        pikmi
      </Link>

      {/* Decorative glow */}
      <div className="hero-glow" style={{
        position: "fixed", top: "20%", left: "50%",
        transform: "translateX(-50%)", pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 440, position: "relative" }}>
        {children}
      </div>
    </div>
  );
}
