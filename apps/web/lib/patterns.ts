// ─── Portfolio background patterns ───────────────────────────────────────────
// Each theme gets a subtle textured pattern (8–12% opacity) tinted to the theme.
// Light themes → dark accent ink; dark themes → light ink. Rendered as a fixed
// overlay so it shows through the gaps between the (opaque white) section blocks.

export interface Pattern { image: string; size: string; }

function hexToRgba(hex: string, a: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function svg(w: number, h: number, inner: string): string {
  const s = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${inner}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
}

type Gen = (c: string, a: number) => Pattern;

// ── Gradient-based (perfectly tileable, lightweight) ──────────────────────────
const dots: Gen = (c, a) => ({
  image: `radial-gradient(${hexToRgba(c, a)} 2px, transparent 2px)`,
  size: "26px 26px",
});
const pixelGrid: Gen = (c, a) => ({
  image: `repeating-linear-gradient(0deg,${hexToRgba(c, a)} 0 1px,transparent 1px 5px),repeating-linear-gradient(90deg,${hexToRgba(c, a)} 0 1px,transparent 1px 5px)`,
  size: "auto",
});
const linesH: Gen = (c, a) => ({
  image: `repeating-linear-gradient(0deg,${hexToRgba(c, a)} 0 1px,transparent 1px 18px)`,
  size: "auto",
});
const diag45: Gen = (c, a) => ({
  image: `repeating-linear-gradient(45deg,${hexToRgba(c, a)} 0 1px,transparent 1px 22px)`,
  size: "auto",
});
const diagNeg45: Gen = (c, a) => ({
  image: `repeating-linear-gradient(-45deg,${hexToRgba(c, a)} 0 1px,transparent 1px 22px)`,
  size: "auto",
});
const diamonds: Gen = (c, a) => ({
  image: `repeating-linear-gradient(45deg,${hexToRgba(c, a)} 0 1px,transparent 1px 32px),repeating-linear-gradient(-45deg,${hexToRgba(c, a)} 0 1px,transparent 1px 32px)`,
  size: "auto",
});
const weave: Gen = (c, a) => ({
  image: `repeating-linear-gradient(0deg,${hexToRgba(c, a)} 0 1px,transparent 1px 16px),repeating-linear-gradient(90deg,${hexToRgba(c, a)} 0 1px,transparent 1px 16px)`,
  size: "auto",
});
const grid: Gen = (c, a) => ({
  image: `radial-gradient(${hexToRgba(c, a * 1.6)} 1.5px,transparent 1.5px),repeating-linear-gradient(0deg,${hexToRgba(c, a * 0.7)} 0 1px,transparent 1px 50px),repeating-linear-gradient(90deg,${hexToRgba(c, a * 0.7)} 0 1px,transparent 1px 50px)`,
  size: "50px 50px, auto, auto",
});
const isometric: Gen = (c, a) => ({
  image: `repeating-linear-gradient(60deg,${hexToRgba(c, a)} 0 1px,transparent 1px 30px),repeating-linear-gradient(-60deg,${hexToRgba(c, a)} 0 1px,transparent 1px 30px),repeating-linear-gradient(0deg,${hexToRgba(c, a)} 0 1px,transparent 1px 26px)`,
  size: "auto",
});

// ── SVG-based (distinctive shapes) ────────────────────────────────────────────
const waves: Gen = (c, a) => ({
  image: svg(120, 22, `<path d='M0 11 q30 -9 60 0 t60 0' fill='none' stroke='${c}' stroke-opacity='${a}' stroke-width='1'/>`),
  size: "120px 22px",
});
const scatterCircles: Gen = (c, a) => ({
  image: svg(160, 160, `<g fill='none' stroke='${c}' stroke-opacity='${a}' stroke-width='1'><circle cx='30' cy='40' r='22'/><circle cx='120' cy='30' r='16'/><circle cx='90' cy='110' r='28'/><circle cx='30' cy='130' r='14'/><circle cx='140' cy='130' r='20'/></g>`),
  size: "160px 160px",
});
const topographic: Gen = (c, a) => ({
  image: svg(160, 160, `<g fill='none' stroke='${c}' stroke-opacity='${a}' stroke-width='1'>${[10, 20, 30, 40, 50].map(r => `<ellipse cx='45' cy='55' rx='${r}' ry='${r * 0.8}'/>`).join("")}${[8, 18, 28, 38].map(r => `<ellipse cx='120' cy='120' rx='${r}' ry='${r * 0.9}'/>`).join("")}</g>`),
  size: "160px 160px",
});
const confetti: Gen = (c, a) => ({
  image: svg(80, 80, `<g stroke='${c}' stroke-opacity='${a}' stroke-width='2' stroke-linecap='round'><line x1='10' y1='12' x2='18' y2='8'/><line x1='40' y1='20' x2='46' y2='30'/><line x1='65' y1='14' x2='72' y2='18'/><line x1='20' y1='50' x2='28' y2='44'/><line x1='55' y1='55' x2='60' y2='66'/><line x1='12' y1='70' x2='22' y2='72'/></g>`),
  size: "80px 80px",
});
const stars: Gen = (c, a) => ({
  image: svg(60, 60, `<g fill='${c}' fill-opacity='${a}'>${[[14, 16], [42, 12], [50, 44], [18, 48]].map(([x, y]) => `<path d='M${x} ${y - 5} L${x + 1.2} ${y - 1.2} L${x + 5} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 5} L${x - 1.2} ${y + 1.2} L${x - 5} ${y} L${x - 1.2} ${y - 1.2} Z'/>`).join("")}</g>`),
  size: "60px 60px",
});
const grain: Gen = (_c, a) => ({
  image: svg(140, 140, `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='140' height='140' filter='url(%23n)' opacity='${a}'/>`),
  size: "140px 140px",
});
const crosses: Gen = (c, a) => ({
  image: svg(32, 32, `<path d='M16 13 v6 M13 16 h6' stroke='${c}' stroke-opacity='${a}' stroke-width='1'/>`),
  size: "32px 32px",
});
const triangles: Gen = (c, a) => ({
  image: svg(70, 70, `<g fill='none' stroke='${c}' stroke-opacity='${a}' stroke-width='1'><path d='M12 40 l9 -16 l9 16 z'/><path d='M44 26 l7 -12 l7 12 z'/><path d='M40 62 l8 -14 l8 14 z'/></g>`),
  size: "70px 70px",
});
const chevron: Gen = (c, a) => ({
  image: svg(24, 20, `<path d='M0 16 L12 4 L24 16' fill='none' stroke='${c}' stroke-opacity='${a}' stroke-width='1'/>`),
  size: "24px 20px",
});
const brick: Gen = (c, a) => ({
  image: svg(40, 20, `<g stroke='${c}' stroke-opacity='${a}' stroke-width='1' fill='none'><path d='M0 0 h40 M0 10 h40 M0 20 h40 M20 0 v10 M0 10 v10 M40 10 v10'/></g>`),
  size: "40px 20px",
});
const barcode: Gen = (c, a) => ({
  image: svg(44, 40, `<g fill='${c}' fill-opacity='${a}'><rect x='2' width='1' height='40'/><rect x='6' width='3' height='40'/><rect x='13' width='1' height='40'/><rect x='19' width='2' height='40'/><rect x='28' width='1' height='40'/><rect x='34' width='3' height='40'/></g>`),
  size: "44px 40px",
});
const arrows: Gen = (c, a) => ({
  image: svg(44, 44, `<g fill='none' stroke='${c}' stroke-opacity='${a}' stroke-width='1' stroke-linecap='round'><path d='M8 10 l5 5 l-5 5'/><path d='M28 6 l5 5 l-5 5'/><path d='M18 28 l5 5 l-5 5'/><path d='M34 30 l5 5 l-5 5'/></g>`),
  size: "44px 44px",
});

const GEN: Record<string, Gen> = {
  dots, pixelGrid, linesH, diag45, diagNeg45, diamonds, weave, grid, isometric,
  waves, scatterCircles, topographic, confetti, stars, grain, crosses, triangles,
  chevron, brick, barcode, arrows,
};

// ── Map each theme id → pattern type (per spec) ───────────────────────────────
const THEME_PATTERN: Record<number, string> = {
  // SOFT 1-10
  1: "dots", 2: "waves", 3: "scatterCircles", 4: "topographic", 5: "linesH",
  6: "confetti", 7: "diamonds", 8: "waves", 9: "grid", 10: "stars",
  // DARK 11-20
  11: "grid", 12: "diagNeg45", 13: "topographic", 14: "grain", 15: "dots",
  16: "crosses", 17: "dots", 18: "waves", 19: "isometric", 20: "triangles",
  // BOLD 21-30
  21: "diag45", 22: "topographic", 23: "chevron", 24: "scatterCircles", 25: "confetti",
  26: "waves", 27: "brick", 28: "grain", 29: "isometric", 30: "dots",
  // NEUTRAL 31-40
  31: "dots", 32: "linesH", 33: "diagNeg45", 34: "weave", 35: "crosses",
  36: "confetti", 37: "diamonds", 38: "grid", 39: "topographic", 40: "pixelGrid",
  // SPECIAL 41-50
  41: "barcode", 42: "scatterCircles", 43: "waves", 44: "grid", 45: "confetti",
  46: "topographic", 47: "waves", 48: "barcode", 49: "isometric", 50: "arrows",
};

/**
 * Returns the pattern overlay for a theme.
 * @param themeId  theme id (1-50)
 * @param dark     dark theme? (light ink) vs light theme (accent ink)
 * @param accent   theme accent hex (used as ink on light themes)
 */
export function getThemePattern(themeId: number, dark: boolean, accent: string): Pattern {
  const key = THEME_PATTERN[themeId] ?? "dots";
  const gen = GEN[key] ?? dots;
  const ink = dark ? "#ffffff" : accent;
  // grain reads better a touch lower; everything else within 8–12%.
  const opacity = key === "grain" ? 0.07 : key === "grid" ? 0.10 : 0.10;
  return gen(ink, opacity);
}
