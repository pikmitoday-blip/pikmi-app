"use client";
import React, { useState, useRef, useEffect } from "react";

// PIKMI — Hero "tri karte u ruci" sa PRAVIM portfolijima.
// Klik na kartu otvara živi portfolio u novom tabu.

interface Paket { name: string; price: string; desc: string; }
interface Theme { inner: string; accent: string; badgeBg: string; pkBg: string; hardShadow: string | null; }
interface Portfolio {
  id: string; label: string; url: string;
  name1: string; name2: string; city: string; years: number;
  role: string; desc: string; paketi: Paket[]; theme: Theme; avatar?: string;
}

const PORTFOLIOS: Portfolio[] = [
  {
    id: "petar",
    label: "Video editor",
    url: "https://www.pikmi.today/petar-video-editing",
    name1: "Petar", name2: "Nemanjić", city: "Beograd", years: 7,
    role: "Video montaža za Reels, TikTok i YouTube",
    desc: "Pomažem brendovima i kreatorima da kroz profesionalnu video montažu kreiraju sadržaj koji ljudi gledaju do kraja.",
    paketi: [
      { name: "🎬 Cut", price: "€300", desc: "4 kratka videa, titlovi, osnovni efekti, jedna revizija po videu" },
      { name: "⚡ Viral", price: "€550", desc: "8 kratkih videa, napredna montaža, titlovi i animacije" },
    ],
    theme: { inner: "linear-gradient(165deg, #1C1A30 0%, #3A2541 28%, #D84059 70%, #E49924 100%)", accent: "#C2410C", badgeBg: "#FEF3E8", pkBg: "#F7F6F2", hardShadow: null },
  },
  {
    id: "nevena",
    label: "UGC kreator",
    url: "https://www.pikmi.today/nevenamarkovic",
    name1: "Nevena", name2: "Marković", city: "Beograd", years: 5,
    role: "UGC sadržaj za Meta i TikTok",
    desc: "Pomažem brendovima da kroz autentičan video sadržaj povećaju prodaju, angažovanje i poverenje kupaca.",
    paketi: [
      { name: "🚀 Starter", price: "€300", desc: "2 UGC videa, pisanje skripti, snimanje i montaža. Jedna revizija po videu." },
      { name: "📈 Growth", price: "€500", desc: "2 UGC videa, pisanje skripti, snimanje i montaža. Po 3 hooka po videu." },
    ],
    theme: { inner: "linear-gradient(150deg, #FFF7FC 0%, #94D8ED 38%, #CDB9F6 72%, #D6C7E8 100%)", accent: "#7C3AED", badgeBg: "#F3EEFC", pkBg: "#F6F4FA", hardShadow: null },
  },
  {
    id: "jelena",
    label: "Dizajner",
    url: "https://www.pikmi.today/jelena-dizajn",
    name1: "Jelena", name2: "Marinković", city: "Beograd", years: 4,
    role: "Grafički Dizajn za Ecommerce i Personalne brendove",
    desc: "Pomažem brendovima da kroz moderan i prepoznatljiv dizajn ostave profesionalan utisak i privuku više kupaca.",
    paketi: [
      { name: "🎨 Creative", price: "€250", desc: "5 dizajna za društvene mreže, 1 cover/banner, jedna revizija po dizajnu" },
      { name: "🎁 Brand Kit", price: "€450", desc: "10 dizajna za društvene mreže, 2 banera ili reklame, izvorni fajlovi" },
    ],
    theme: { inner: "linear-gradient(150deg, #EDBFED 0%, #FBB8BF 38%, #FFD4C7 70%, #FBEBB7 100%)", accent: "#DB2777", badgeBg: "#FCEAF1", pkBg: "#FBF2F6", hardShadow: "4px 4px 0px rgba(190,70,110,0.35)" },
  },
];

const POSITIONS: Record<string, { rotate: number; x: number; y: number; z: number; scale: number }> = {
  petar:  { rotate: -13, x: -182, y: 32, z: 1, scale: 0.9 },
  nevena: { rotate: 0,   x: 0,    y: 0,  z: 3, scale: 1 },
  jelena: { rotate: 13,  x: 182,  y: 32, z: 1, scale: 0.9 },
};

// Na telefonu zbijemo karte (i clipujemo ivice) da bi mogle da budu ~2x veće.
const POSITIONS_MOBILE: Record<string, { rotate: number; x: number; y: number; z: number; scale: number }> = {
  petar:  { rotate: -11, x: -126, y: 26, z: 1, scale: 0.92 },
  nevena: { rotate: 0,   x: 0,    y: 0,  z: 3, scale: 1 },
  jelena: { rotate: 11,  x: 126,  y: 26, z: 1, scale: 0.92 },
};

const DESIGN_W = 680;
const DESIGN_H = 600;

function PortfolioCard({ p }: { p: Portfolio }) {
  const t = p.theme;
  return (
    <div style={{ borderRadius: 22, padding: 14, height: "100%", position: "relative", overflow: "hidden", background: t.inner }}>
      {/* PROFIL */}
      <div style={{ background: "#fff", borderRadius: 18, padding: 16, marginBottom: 13, boxShadow: t.hardShadow || "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, flexShrink: 0, background: "#D9D2E9", overflow: "hidden" }}>
            {p.avatar && <img src={p.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.08, color: "#1A1523" }}>{p.name1}</div>
            <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.08, color: t.accent }}>{p.name2}</div>
            <div style={{ fontSize: 11, marginTop: 4, color: "#9A93A8" }}>→ {p.city}</div>
          </div>
        </div>
        <div style={{ display: "inline-block", fontSize: 9, fontWeight: 600, padding: "5px 11px", borderRadius: 100, marginTop: 13, background: t.badgeBg, color: t.accent }}>
          Godine iskustva: {p.years}
        </div>
      </div>

      {/* ŠTA RADIM */}
      <div style={{ background: "#fff", borderRadius: 18, padding: 16, marginBottom: 13, boxShadow: t.hardShadow || "none" }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 9, color: "#6B6478" }}>Šta radim</div>
        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.18, marginBottom: 9, color: "#1A1523" }}>{p.role}</div>
        <div style={{ fontSize: 9.5, lineHeight: 1.5, color: "#8A8398" }}>{p.desc}</div>
      </div>

      {/* PAKETI */}
      <div style={{ background: "#fff", borderRadius: 18, padding: 16, boxShadow: t.hardShadow || "none" }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: "#1A1523" }}>Paketi</div>
        <div style={{ display: "flex", gap: 9 }}>
          {p.paketi.map((pk, i) => (
            <div key={i} style={{ flex: 1, borderRadius: 13, padding: 12, background: t.pkBg }}>
              <div style={{ fontSize: 9, fontWeight: 600, marginBottom: 6, color: "#8A8398" }}>{pk.name}</div>
              <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 6, color: t.accent }}>{pk.price}</div>
              <div style={{ fontSize: 7.5, lineHeight: 1.45, color: "#A29BB0" }}>{pk.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PikmiHeroCards() {
  const [hovered, setHovered] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(560);

  // Prati širinu kontejnera da bismo skalirali dizajn da stane (desktop i mobilni).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setCw(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Mobilni: karte ~2x veće (klipujemo ivice da nema horizontalnog skrola).
  const isNarrow = cw < 600;
  const scale = isNarrow ? Math.min(1.2, cw / 340) : Math.min(1, cw / DESIGN_W);
  const positions = isNarrow ? POSITIONS_MOBILE : POSITIONS;

  return (
    <div ref={wrapRef} style={{ width: "100%", position: "relative", height: DESIGN_H * scale, overflow: isNarrow ? "hidden" : "visible" }}>
      <div style={{
        position: "absolute", top: 0, left: "50%",
        width: DESIGN_W, height: DESIGN_H,
        transform: `translateX(-50%) scale(${scale})`, transformOrigin: "top center",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        {/* Cards stage */}
        <div style={{ position: "relative", width: DESIGN_W, height: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* glow */}
          <div style={{ position: "absolute", width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 65%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

          {PORTFOLIOS.map((p) => {
            const pos = positions[p.id];
            const isHovered = hovered === p.id;
            return (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: "absolute",
                  width: 270, height: 440, borderRadius: 30,
                  cursor: "pointer", textDecoration: "none", padding: 9, background: "#0E0E18",
                  transform: `translate(${pos.x}px, ${isHovered ? pos.y - 20 : pos.y}px) rotate(${pos.rotate}deg) scale(${isHovered ? pos.scale + 0.04 : pos.scale})`,
                  zIndex: isHovered ? 10 : pos.z,
                  transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease",
                  boxShadow: isHovered
                    ? "0 32px 72px rgba(139,92,246,0.42), 0 0 0 1px rgba(139,92,246,0.3)"
                    : pos.z === 3
                    ? "0 30px 68px rgba(139,92,246,0.32), 0 0 0 1px rgba(139,92,246,0.22)"
                    : "0 16px 44px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
                }}
              >
                {/* label profesije */}
                <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", zIndex: 5, background: "#1A1530", border: "1px solid rgba(139,92,246,0.3)", color: "#C4B5FD", fontSize: 10, fontWeight: 700, padding: "5px 14px", borderRadius: 100, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                  {p.label}
                </div>

                <PortfolioCard p={p} />

                {/* hover overlay "Pogledaj uživo" */}
                <div style={{
                  position: "absolute", inset: 9, borderRadius: 22,
                  background: "linear-gradient(to top, rgba(124,58,237,0.92) 0%, rgba(124,58,237,0) 55%)",
                  display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 24,
                  opacity: isHovered ? 1 : 0, transition: "opacity 0.3s ease", pointerEvents: "none",
                }}>
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}>
                    Pogledaj uživo <span style={{ fontSize: 16 }}>→</span>
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        {/* caption */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.65)", fontSize: isNarrow ? 19 : 16, fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 10px #34D399" }} />
            Klikni na portfolio da ga vidiš uživo
          </div>
        </div>
      </div>
    </div>
  );
}
