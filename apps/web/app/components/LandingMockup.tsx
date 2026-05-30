"use client";
import { useState, useEffect } from "react";

export interface MockupLink {
  name: string; slug: string; views: number; hot: boolean;
}

interface Props {
  links: MockupLink[];
  hotleadName: string;
  hotleadViews: string;
  hotleadTime: string;
  hotleadDuration: string;
  hotleadOpens: string;
}

export default function LandingMockup({ links, hotleadName, hotleadViews, hotleadTime, hotleadDuration, hotleadOpens }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 300);
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }, 3000);
    return () => { clearTimeout(t); clearInterval(interval); };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", boxSizing: "border-box" }}>
      {/* Pitch links card */}
      <div style={{
        background: "linear-gradient(160deg, rgba(20,20,35,0.95), rgba(14,14,24,0.98))",
        border: "1px solid rgba(139,92,246,0.15)",
        borderRadius: 22, padding: "20px 20px 16px",
        width: "100%", boxSizing: "border-box",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.05)",
        transform: loaded ? "perspective(1000px) rotateX(0deg)" : "perspective(1000px) rotateX(4deg)",
        transition: "transform 0.8s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.3, color: "#fff" }}>Moji pitch linkovi</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", padding: "3px 10px", borderRadius: 100, display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px #10B981" }} />
            Live
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 0 8px", borderBottom: "1px solid rgba(255,255,255,0.04)", marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>Klijent</span>
          <div style={{ display: "flex", gap: 28 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>Pregledi</span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>Status</span>
          </div>
        </div>

        {links.map((link, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "11px 0",
            borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none",
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(8px)",
            transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${0.5 + i * 0.12}s`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: link.hot ? "rgba(239,68,68,0.12)" : "rgba(139,92,246,0.1)",
                border: `1px solid ${link.hot ? "rgba(239,68,68,0.2)" : "rgba(139,92,246,0.15)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: link.hot ? "#EF4444" : "#8B5CF6",
              }}>{link.name.charAt(0)}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{link.name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>/{link.slug} ↗</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontFamily: "monospace", color: link.hot ? "#EF4444" : "rgba(255,255,255,0.4)" }}>
                {link.hot && <span>🔥</span>}
                {link.views}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.12)", padding: "3px 10px", borderRadius: 100 }}>
                Aktivan
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hot Lead card */}
      <div style={{
        position: "relative", zIndex: 10,
        marginTop: -12, marginLeft: 16, marginRight: 16,
        background: "linear-gradient(160deg, rgba(22,14,28,0.98), rgba(14,14,24,0.99))",
        border: `1px solid ${pulse ? "rgba(239,68,68,0.35)" : "rgba(139,92,246,0.12)"}`,
        borderRadius: 16, padding: "14px 16px",
        boxShadow: pulse
          ? "0 16px 48px rgba(239,68,68,0.18), 0 0 0 1px rgba(239,68,68,0.08)"
          : "0 8px 28px rgba(0,0,0,0.4)",
        transform: pulse ? "translateY(-6px) scale(1.02)" : "translateY(0) scale(1)",
        transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: "#EF4444",
            }}>{hotleadName.charAt(0)}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                {hotleadName}
                <span>🔥</span>
                <span style={{ fontSize: 11, color: "#EF4444", fontFamily: "monospace", fontWeight: 700 }}>{hotleadViews}</span>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                pikmi.today/{hotleadName.toLowerCase().replace(/\s+/g, "-")}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", padding: "4px 12px", borderRadius: 100, whiteSpace: "nowrap" }}>
            🔥 Hot lead
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{hotleadTime}</span>
          <span style={{ fontSize: 10, fontFamily: "monospace", color: "#A855F7", background: "rgba(139,92,246,0.1)", padding: "3px 10px", borderRadius: 8, border: "1px solid rgba(139,92,246,0.12)" }}>
            {hotleadDuration}
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>·</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{hotleadOpens}× otvorio</span>
        </div>
      </div>
    </div>
  );
}
