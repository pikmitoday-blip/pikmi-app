"use client";
import React, { useState, useEffect } from "react";
import { THEMES, themeTokens, type BlockStyleId } from "../../lib/themes";

// ── A single imaginary portfolio persona ──────────────────────────────────────
interface Persona {
  themeId: number;
  blockStyle: BlockStyleId;
  first: string; last: string; city: string; years: string;
  title: string;
  tags: string[];
  packages: { name: string; price: string }[];
  works: string[]; // labels for portfolio placeholders
}

const PERSONAS: Persona[] = [
  {
    themeId: 6, blockStyle: "rounded",
    first: "Milica", last: "Đorđević", city: "Beograd", years: "3",
    title: "UGC sadržaj za Meta i TikTok",
    tags: ["UGC", "TikTok", "Reels", "Skripte"],
    packages: [{ name: "Starter", price: "€300" }, { name: "Growth", price: "€500" }],
    works: ["Lumea", "BeautyLab", "SKINOVA", "Aure"],
  },
  {
    themeId: 15, blockStyle: "sharp",
    first: "Stefan", last: "Nikolić", city: "Novi Sad", years: "7",
    title: "Video editing za brendove i kreatore",
    tags: ["Premiere", "After Effects", "Color", "Motion"],
    packages: [{ name: "Basic", price: "€200" }, { name: "Pro", price: "€450" }],
    works: ["GymShark", "NovaTech", "Balkan", "RunWild"],
  },
  {
    themeId: 7, blockStyle: "pill",
    first: "Jovana", last: "Ilić", city: "Beograd", years: "4",
    title: "Grafički dizajn za brendove koji žele da se izdvoje",
    tags: ["Figma", "Illustrator", "Branding", "Print"],
    packages: [{ name: "Logo", price: "€250" }, { name: "Brand", price: "€600" }],
    works: ["Bloom", "CaféNoir", "VitaFit", "Eko"],
  },
  {
    themeId: 11, blockStyle: "rounded",
    first: "Marko", last: "Petrović", city: "Niš", years: "6",
    title: "Web development za startape i agencije",
    tags: ["Next.js", "React", "Node", "Figma"],
    packages: [{ name: "Landing", price: "€400" }, { name: "App", price: "€1200" }],
    works: ["FinTechRS", "ShopLab", "Medio", "Orbit"],
  },
  {
    themeId: 43, blockStyle: "rounded",
    first: "Ana", last: "Jovanović", city: "Beograd", years: "5",
    title: "Fotografija proizvoda i brendova",
    tags: ["Product", "Lifestyle", "Retouch", "Studio"],
    packages: [{ name: "Mini", price: "€180" }, { name: "Full", price: "€500" }],
    works: ["Aura", "Mliva", "Senka", "Polje"],
  },
];

// ── Full portfolio preview card (filled, like the HTML references) ────────────
function TemplateMockup({ p }: { p: Persona }) {
  const theme = THEMES.find(t => t.id === p.themeId)!;
  const TK = themeTokens(theme, p.blockStyle);
  const g = TK.geom;
  const initials = p.first[0] + p.last[0];

  const block: React.CSSProperties = {
    background: TK.blockBg, border: `1px solid ${TK.blockBorder}`,
    borderRadius: Math.min(g.block, 18), boxShadow: TK.blockShadow,
    padding: 12, marginBottom: 8,
  };
  const csGrad = [
    "linear-gradient(145deg,#fce4ec,#f8bbd0)",
    "linear-gradient(145deg,#e8eaf6,#c5cae9)",
    "linear-gradient(145deg,#fff3e0,#ffe0b2)",
    "linear-gradient(145deg,#e0f2f1,#b2dfdb)",
  ];

  return (
    <div style={{
      width: "100%", height: "100%", overflow: "hidden",
      background: TK.pageBg, backgroundSize: "cover",
      borderRadius: 22, padding: 12,
    }}>
      {/* Profile */}
      <div style={block}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 42, height: 42, borderRadius: typeof g.avatar === "string" ? g.avatar : Math.min(g.avatar, 14), background: `linear-gradient(135deg,${TK.accent},${TK.accent}aa)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TK.textPrimary, lineHeight: 1.1 }}>{p.first}</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TK.accent, lineHeight: 1.1 }}>{p.last}</p>
            <p style={{ margin: "2px 0 0", fontSize: 9, color: TK.textMuted }}>→ {p.city}</p>
          </div>
        </div>
        <div style={{ marginTop: 8, display: "inline-block", background: TK.accentBg, color: TK.accent, padding: "3px 10px", borderRadius: g.pill, fontSize: 9, fontWeight: 600 }}>
          Godine iskustva: {p.years}
        </div>
      </div>

      {/* Šta radim */}
      <div style={block}>
        <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 700, color: TK.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Šta radim</p>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: TK.textPrimary, lineHeight: 1.25 }}>{p.title}</p>
      </div>

      {/* Paketi */}
      <div style={block}>
        <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 700, color: TK.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Paketi</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {p.packages.map((pk, i) => (
            <div key={i} style={{ background: TK.sectionBg, borderRadius: Math.min(g.inner, 12), padding: "8px 10px" }}>
              <p style={{ margin: 0, fontSize: 9, color: TK.textMuted }}>{pk.name}</p>
              <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 800, color: TK.accent }}>{pk.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Prethodni radovi — placeholders */}
      <div style={block}>
        <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 700, color: TK.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Prethodni radovi</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {p.works.map((w, i) => (
            <div key={i}>
              <div style={{ position: "relative", aspectRatio: "4/3", borderRadius: Math.min(g.inner, 12), overflow: "hidden", background: csGrad[i % csGrad.length], display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 10, marginLeft: 2 }}>▶</span>
                </div>
              </div>
              <p style={{ margin: "3px 0 0", fontSize: 9, fontWeight: 600, color: TK.textPrimary }}>{w}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Veštine */}
      <div style={block}>
        <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 700, color: TK.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Veštine</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {p.tags.map((tag, i) => (
            <span key={i} style={{ fontSize: 9, padding: "4px 9px", borderRadius: g.pill, background: i < 2 ? TK.accentBg : TK.sectionBg, color: i < 2 ? TK.accent : TK.textSecond, fontWeight: 500 }}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Circular auto-rotating carousel ───────────────────────────────────────────
export default function PortfolioCarousel() {
  const [active, setActive] = useState(0);
  const n = PERSONAS.length;

  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % n), 4000);
    return () => clearInterval(id);
  }, [n]);

  return (
    <div className="pc-stage" style={{ position: "relative", width: "100%", height: 560, perspective: 1400, overflow: "hidden" }}>
      {PERSONAS.map((p, i) => {
        let rel = ((i - active) % n + n) % n;
        if (rel > n / 2) rel -= n; // → range [-2 .. 2]
        const abs = Math.abs(rel);
        const isCenter = rel === 0;

        const tx = rel * 46;                       // % horizontal offset
        const scale = abs === 0 ? 1 : abs === 1 ? 0.8 : 0.62;
        const opacity = abs === 0 ? 1 : abs === 1 ? 0.5 : 0.22;
        const blur = abs === 0 ? 0 : abs === 1 ? 2 : 4;
        const rotY = rel === 0 ? 0 : rel < 0 ? 22 : -22;
        const z = 10 - abs;

        return (
          <div
            key={i}
            onClick={() => setActive(i)}
            style={{
              position: "absolute", top: 0, left: "50%",
              width: 300, height: 510,
              transform: `translateX(-50%) translateX(${tx}%) scale(${scale}) rotateY(${rotY}deg)`,
              opacity, zIndex: z, filter: `blur(${blur}px)`,
              transition: "transform 0.8s cubic-bezier(0.16,1,0.3,1), opacity 0.8s ease, filter 0.8s ease",
              cursor: isCenter ? "default" : "pointer",
              pointerEvents: abs > 1 ? "none" : "auto",
            }}
          >
            <div style={{
              width: "100%", height: "100%", borderRadius: 26, overflow: "hidden",
              boxShadow: isCenter ? "0 30px 80px rgba(0,0,0,0.5)" : "0 16px 50px rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <TemplateMockup p={p} />
            </div>
          </div>
        );
      })}

      {/* Dots */}
      <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 7, zIndex: 20 }}>
        {PERSONAS.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            width: i === active ? 22 : 7, height: 7, borderRadius: 7,
            border: "none", cursor: "pointer", padding: 0,
            background: i === active ? "linear-gradient(135deg,#A855F7,#D946EF)" : "rgba(255,255,255,0.2)",
            transition: "all 0.3s",
          }} />
        ))}
      </div>
    </div>
  );
}
