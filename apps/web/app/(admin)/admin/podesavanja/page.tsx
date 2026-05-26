"use client";
import { useState } from "react";

export default function AdminPodesavanja() {
  const [adminEmail, setAdminEmail] = useState(
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? ""
  );
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    showToast("Kopirano!");
  }

  const sections = [
    {
      title: "Admin pristup",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7 }}>
            Admin pristup se kontroliše putem <code style={{ background: "#0D0D12", padding: "2px 6px", borderRadius: 4, fontSize: 12, color: "#A78BFA" }}>NEXT_PUBLIC_ADMIN_EMAIL</code> environment varijable u Vercel projektu.
            Za više admina, odvoji emailove zarezom.
          </p>
          <div style={{ padding: "14px 16px", borderRadius: 8, background: "#0D0D12", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 11, color: "#4B5563", marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Trenutna vrijednost</div>
            <div style={{ fontSize: 13, color: adminEmail ? "#4ADE80" : "#F87171", fontWeight: 500 }}>
              {adminEmail || "⚠️ Nije postavljen — svi korisnici su blokirani"}
            </div>
          </div>
          <div style={{ padding: "14px 16px", borderRadius: 8, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
            <div style={{ fontSize: 12, color: "#A78BFA", fontWeight: 600, marginBottom: 8 }}>Kako dodati novog admina:</div>
            <ol style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
              <li>Idi na Vercel → pikmi projekt → Settings → Environment Variables</li>
              <li>Pronađi ili dodaj <code style={{ color: "#A78BFA" }}>NEXT_PUBLIC_ADMIN_EMAIL</code></li>
              <li>Upiši email (ili više emailova odvojenih zarezom)</li>
              <li>Redeploy projekt da promena stupi na snagu</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      title: "Korisni linkovi",
      content: (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Supabase Dashboard", url: "https://supabase.com/dashboard", icon: "🗄" },
            { label: "Vercel Deployments",  url: "https://vercel.com/dashboard",   icon: "▲" },
            { label: "Stripe Dashboard",    url: "https://dashboard.stripe.com",   icon: "💳" },
            { label: "Resend Dashboard",    url: "https://resend.com/overview",    icon: "📧" },
            { label: "GitHub repo",         url: "https://github.com",             icon: "🐙" },
            { label: "pikmi.today",         url: "https://pikmi.today",            icon: "🌐" },
          ].map(l => (
            <a key={l.label} href={l.url} target="_blank" rel="noreferrer" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 14px", borderRadius: 8,
              background: "#0D0D12", border: "1px solid rgba(255,255,255,0.06)",
              textDecoration: "none", color: "#9CA3AF", fontSize: 13,
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 16 }}>{l.icon}</span>
              {l.label} ↗
            </a>
          ))}
        </div>
      ),
    },
    {
      title: "Verzija platforme",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Platform",  value: "pikmi" },
            { label: "Verzija",   value: "1.0.0" },
            { label: "Framework", value: "Next.js 14 (App Router)" },
            { label: "Baza",      value: "Supabase (PostgreSQL)" },
            { label: "Hosting",   value: "Vercel" },
            { label: "Auth",      value: "Supabase Auth" },
            { label: "Plaćanje",  value: "Stripe" },
            { label: "Email",     value: "Resend" },
          ].map(i => (
            <div key={i.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: 13, color: "#4B5563" }}>{i.label}</span>
              <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}>{i.value}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          padding: "10px 18px", borderRadius: 8,
          background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
          color: "#4ADE80", fontSize: 13, fontWeight: 600,
        }}>
          ✓ {toast}
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F9FAFB", marginBottom: 4 }}>Podešavanja platforme</h1>
        <p style={{ fontSize: 13, color: "#6B7280" }}>Konfiguracija, integracije i informacije o platformi</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {sections.map(s => (
          <div key={s.title} style={{
            background: "#111116", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12, overflow: "hidden",
          }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#E5E7EB" }}>{s.title}</h2>
            </div>
            <div style={{ padding: "20px" }}>
              {s.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
