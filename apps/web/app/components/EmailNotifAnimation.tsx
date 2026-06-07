import React from "react";

export default function EmailNotifAnimation({
  client = "Coca Cola",
  when = "02.06.2026. 16:27",
  device = "Telefon",
  views = "5",
}: { client?: string; when?: string; device?: string; views?: string }) {
  return (
    <div className="enotif-stage" style={{ perspective: 1300, width: "100%", maxWidth: 420, padding: "26px 14px", overflow: "visible" }}>
      <style>{`
        @keyframes enotifFloat {
          0%   { transform: rotateX(4deg) rotateY(-6deg) translateY(0); }
          50%  { transform: rotateX(4deg) rotateY(-6deg) translateY(-9px); }
          100% { transform: rotateX(4deg) rotateY(-6deg) translateY(0); }
        }
        @keyframes enotifGlow {
          0%,100% { box-shadow: 0 26px 60px rgba(0,0,0,0.5), 0 8px 30px rgba(124,58,237,0.12); }
          50%     { box-shadow: 0 34px 75px rgba(0,0,0,0.5), 0 12px 40px rgba(124,58,237,0.28); }
        }
        .enotif-card {
          transform-style: preserve-3d;
          animation: enotifFloat 6s ease-in-out infinite, enotifGlow 6s ease-in-out infinite;
          will-change: transform;
        }
        .enotif-pulse { animation: enotifPulse 1.8s ease-in-out infinite; }
        @keyframes enotifPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
      `}</style>

      <div className="enotif-card" style={{
        background: "#1A1A22", borderRadius: 22, overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Purple header */}
        <div style={{
          background: "linear-gradient(120deg,#7C3AED 0%,#8B5CF6 60%,#A855F7 100%)",
          padding: "26px 24px",
        }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: "#0B0B14", letterSpacing: -0.5 }}>pikmi</span>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 22px 24px" }}>
          <p style={{ margin: "0 0 18px", fontSize: 17, fontWeight: 500, color: "#fff", lineHeight: 1.45 }}>
            👁 Tvoj portfolio je upravo otvoren od strane{" "}
            <span style={{ color: "#A855F7", fontWeight: 800 }}>{client}</span>{" "}
            <span className="enotif-pulse">🔥</span>
          </p>

          {/* Detail card */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "6px 16px" }}>
            {[
              { icon: "🕐", label: "Kada", value: when, hot: false },
              { icon: "📱", label: "Uređaj", value: device, hot: false },
              { icon: "📊", label: "Ukupno pregleda", value: views, hot: true },
            ].map((row, i, arr) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                padding: "14px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "rgba(255,255,255,0.45)" }}>
                  <span style={{ fontSize: 16 }}>{row.icon}</span> {row.label}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: row.hot ? "#F472B6" : "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                  {row.value}{row.hot && <span className="enotif-pulse">🔥</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
