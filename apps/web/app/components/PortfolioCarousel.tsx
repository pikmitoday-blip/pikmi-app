"use client";
import React, { useState, useEffect, useRef } from "react";
import { THEMES, themeTokens, type BlockStyleId } from "../../lib/themes";

// ── A single imaginary portfolio persona ──────────────────────────────────────
interface Persona {
  themeId: number;
  blockStyle: BlockStyleId;
  first: string; last: string; city: string; years: string;
  title: string;
  desc: string;
  tags: string[];
  packages: { name: string; price: string; desc: string }[];
  works: string[]; // labels for portfolio placeholders
}

// 5 totally different colours + patterns + shapes (rounded / sharp / torn / hard)
const PERSONAS: Persona[] = [
  {
    themeId: 6, blockStyle: "rounded",          // soft pink · confetti
    first: "Milica", last: "Đorđević", city: "Beograd", years: "3",
    title: "UGC sadržaj za Meta i TikTok",
    desc: "Pomažem brendovima da kroz autentičan video poveća prodaju, angažovanje i poverenje kupaca.",
    tags: ["UGC", "TikTok", "Reels", "Skripte"],
    packages: [
      { name: "Starter", price: "€300", desc: "2 UGC videa, skripte, snimanje i montaža." },
      { name: "Growth",  price: "€500", desc: "2 videa, po 3 hooka, montaža + revizije." },
    ],
    works: ["Lumea", "BeautyLab", "SKINOVA", "Aure"],
  },
  {
    themeId: 11, blockStyle: "sharp",           // dark navy · circuit grid
    first: "Marko", last: "Petrović", city: "Niš", years: "6",
    title: "Web development za startape i agencije",
    desc: "Gradim brze, moderne sajtove i web aplikacije koje konvertuju posetioce u klijente.",
    tags: ["Next.js", "React", "Node", "Figma"],
    packages: [
      { name: "Landing", price: "€400",  desc: "Responsive one-page sajt, do 5 sekcija." },
      { name: "App",     price: "€1200", desc: "Full-stack web app, integracije, deploy." },
    ],
    works: ["FinTechRS", "ShopLab", "Medio", "Orbit"],
  },
  {
    themeId: 23, blockStyle: "hard",            // bold orange · chevron · hard shadow
    first: "Stefan", last: "Nikolić", city: "Novi Sad", years: "7",
    title: "Fitnes i sportski video sadržaj",
    desc: "Montiram dinamičan video koji drži pažnju do kraja i pretvara gledaoce u članove.",
    tags: ["Premiere", "Color", "Motion", "Reels"],
    packages: [
      { name: "Basic", price: "€200", desc: "1 video do 60s, color grading + titlovi." },
      { name: "Pro",   price: "€450", desc: "3 videa mesečno, motion grafika i zvuk." },
    ],
    works: ["GymShark", "RunWild", "FitZone", "Pulse"],
  },
  {
    themeId: 34, blockStyle: "hard",            // neutral linen · weave
    first: "Jovana", last: "Ilić", city: "Beograd", years: "4",
    title: "Grafički dizajn za brendove koji žele da se izdvoje",
    desc: "Kreiram vizuelni identitet i social dizajn koji izgleda profesionalno i pamti se.",
    tags: ["Figma", "Illustrator", "Branding", "Print"],
    packages: [
      { name: "Logo",  price: "€250", desc: "Logo, paleta boja i 2 varijacije." },
      { name: "Brand", price: "€600", desc: "Logo, boje, fontovi i brand book." },
    ],
    works: ["Bloom", "CaféNoir", "VitaFit", "Eko"],
  },
  {
    themeId: 42, blockStyle: "rounded",         // special mesh gradient · scatter circles
    first: "Ana", last: "Jovanović", city: "Beograd", years: "5",
    title: "Fotografija proizvoda i brendova",
    desc: "Snimam proizvode i brendove sa stilom — studio i lifestyle fotografija za prodaju.",
    tags: ["Product", "Lifestyle", "Retouch", "Studio"],
    packages: [
      { name: "Mini", price: "€180", desc: "10 profesionalno obrađenih fotografija." },
      { name: "Full", price: "€500", desc: "30 fotografija + reels + napredni retuš." },
    ],
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
    borderRadius: Math.min(g.block, 16), boxShadow: TK.blockShadow,
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
      borderRadius: 22, padding: 12, position: "relative",
    }}>
      {/* Theme pattern overlay */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: TK.pattern.image, backgroundSize: TK.pattern.size, backgroundRepeat: "repeat", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1 }}>
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
        <p style={{ margin: "0 0 5px", fontSize: 12, fontWeight: 700, color: TK.textPrimary, lineHeight: 1.25 }}>{p.title}</p>
        <p style={{ margin: 0, fontSize: 9.5, color: TK.textSecond, lineHeight: 1.5 }}>{p.desc}</p>
      </div>

      {/* Paketi */}
      <div style={block}>
        <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 700, color: TK.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Paketi</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {p.packages.map((pk, i) => (
            <div key={i} style={{ background: TK.sectionBg, borderRadius: Math.min(g.inner, 12), padding: "8px 10px" }}>
              <p style={{ margin: 0, fontSize: 9, color: TK.textMuted }}>{pk.name}</p>
              <p style={{ margin: "2px 0 4px", fontSize: 15, fontWeight: 800, color: TK.accent }}>{pk.price}</p>
              <p style={{ margin: 0, fontSize: 8.5, color: TK.textSecond, lineHeight: 1.4 }}>{pk.desc}</p>
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
            <span key={i} style={{ fontSize: 9, padding: "4px 9px", borderRadius: g.pill, border: `1px solid ${TK.tagBorder}`, background: TK.tagBg, color: i < 2 ? TK.tagText : TK.textSecond, fontWeight: 600 }}>{tag}</span>
          ))}
        </div>
      </div>
      </div>{/* end content layer */}
    </div>
  );
}

// ── Circular auto-rotating carousel ───────────────────────────────────────────
export default function PortfolioCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cardW, setCardW] = useState(300);
  const n = PERSONAS.length;
  const touchX = useRef<number | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Responsive card width so side cards fit fully (no harsh slicing on mobile)
  useEffect(() => {
    const update = () => setCardW(window.innerWidth <= 768 ? 232 : 300);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive(a => (a + 1) % n), 4500);
    return () => clearInterval(id);
  }, [n, paused]);

  function go(dir: 1 | -1) { setActive(a => (a + dir + n) % n); }
  function pauseThenResume() {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 6000);
  }

  function onTouchStart(e: React.TouchEvent) { touchX.current = e.touches[0].clientX; setPaused(true); }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 36) go(dx < 0 ? 1 : -1);
    touchX.current = null;
    pauseThenResume();
  }

  const cardH = Math.round(cardW * 1.72);

  return (
    <div
      className="pc-stage"
      style={{ position: "relative", width: "100%", height: cardH + 44, perspective: 1600, overflow: "hidden", touchAction: "pan-y" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      
      {PERSONAS.map((p, i) => {
        let rel = ((i - active) % n + n) % n;
        if (rel > n / 2) rel -= n; // → range [-2 .. 2]
        const abs = Math.abs(rel);
        const isCenter = rel === 0;

        // Side cards tuck BEHIND the centre card (smaller + faded) so their
        // rounded edge peeks out — never sliced flat by the viewport.
        const tx = rel === 0 ? 0 : (rel < 0 ? -1 : 1) * (abs === 1 ? 30 : 52);
        const scale = abs === 0 ? 1 : abs === 1 ? 0.84 : 0.66;
        const opacity = abs === 0 ? 1 : abs === 1 ? 0.78 : 0.34;
        const blur = abs === 0 ? 0 : abs === 1 ? 1.2 : 3;
        const rotY = rel === 0 ? 0 : rel < 0 ? 14 : -14;
        const z = 10 - abs;

        return (
          <div
            key={i}
            onClick={() => { if (!isCenter) { setActive(i); pauseThenResume(); } }}
            style={{
              position: "absolute", top: 22, left: "50%",
              width: cardW, height: cardH,
              transformOrigin: "center center",
              transform: `translateX(-50%) translateX(${tx}%) scale(${scale}) rotateY(${rotY}deg)`,
              opacity, zIndex: z, filter: blur ? `blur(${blur}px)` : "none",
              transition: "transform 0.7s cubic-bezier(0.22,1,0.36,1), opacity 0.7s ease, filter 0.7s ease",
              willChange: "transform, opacity",
              cursor: isCenter ? "default" : "pointer",
              pointerEvents: abs > 1 ? "none" : "auto",
            }}
          >
            <div style={{
              width: "100%", height: "100%", borderRadius: 26, overflow: "hidden",
              boxShadow: isCenter ? "0 30px 80px rgba(0,0,0,0.5)" : "0 16px 44px rgba(0,0,0,0.32)",
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
