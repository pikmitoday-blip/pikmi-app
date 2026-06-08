// ─── Portfolio Themes ────────────────────────────────────────────────────────
import { getThemePattern } from "./patterns";

export interface PortfolioTheme {
  id: number;
  name: string;
  category: string;
  bg: string;          // CSS background for the page
  dark: boolean;       // true = dark bg → white text on bg
  accent: string;      // main accent colour (last name, prices, highlights)
}

// Derive all other colour tokens from the 3 base values.
//
// DESIGN RULE: blocks are ALWAYS white-ish (lighter than the page bg) so there
// is always contrast against the themed background. Text inside blocks is always
// dark. Only the page background changes colour per theme. (Matches the pikmi
// HTML references where every block is white on a coloured bg.)
export function themeTokens(t: PortfolioTheme, blockStyle: BlockStyleId) {
  // Geometry for the whole portfolio (cards, avatar, tags, thumbnails…)
  const geom = BLOCK_GEOM[blockStyle] ?? BLOCK_GEOM.rounded;

  // Readable accent for text/elements that sit on WHITE blocks. Some themes
  // (especially BOLD) use a very light accent for contrast on their saturated
  // background — that becomes invisible on a white block, so we darken it.
  const accent = readableAccent(t.accent);

  // Blocks are SOLID white (never transparent) with just a faint wash of the
  // theme accent (~5%). White always dominates the card.
  const blockBg      = `linear-gradient(0deg, ${accent}0d, ${accent}0d), #ffffff`;
  const blockBorder  = t.dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.05)";
  // Hard offset shadow (no blur) for the "Tvrda senka" style; otherwise soft.
  const blockShadow  = geom.hardShadow
    ? `4px 4px 0px ${accent}4d`
    : t.dark
    ? "0 4px 18px rgba(0,0,0,0.32)"
    : "0 2px 12px rgba(0,0,0,0.07)";

  // The PAGE keeps only a soft hint of the theme colour. For light themes we wash
  // the gradient toward white so the page reads pale — colour shows only as
  // details (in the gaps between the white blocks). Dark themes stay rich.
  const pageBg = t.dark
    ? t.bg
    : `linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), ${t.bg}`;

  // Text always dark — it sits on white blocks regardless of theme.
  const textPrimary  = "#1a1a2e";
  const textSecond   = "#555566";
  const textMuted    = "#9898a6";

  const accentBg     = accent + "18";
  // Badges/tags stay mostly WHITE with only a faint accent tint; border keeps
  // the theme colour for definition.
  const tagBg        = `linear-gradient(0deg, ${accent}0a, ${accent}0a), #ffffff`;
  const tagText      = accent;
  const tagBorder    = accent + "30";
  // Testimonial card — a touch MORE tinted than the section block (which is ~5%)
  // so it reads as a slightly deeper card with a visible accent border.
  const quoteBg      = `linear-gradient(0deg, ${accent}1c, ${accent}1c), #ffffff`;
  const quoteBorder  = accent + "33";

  const divider      = "rgba(0,0,0,0.05)";
  const sectionBg    = "rgba(0,0,0,0.02)";

  return {
    pageBg,
    textPrimary, textSecond, textMuted,
    accent, accentBg, accentLight: accentBg,
    tagBg, tagText, tagBorder, quoteBg, quoteBorder,
    divider, sectionBg,
    blockBg, blockBorder, blockShadow,
    blockRadius: geom.block,
    geom,
    isTorn: geom.torn,
    hardShadow: !!geom.hardShadow,
    pattern: getThemePattern(t.id, t.dark, t.accent),
    glassExtra: {} as Record<string, never>,
  };
}

// Darken an accent only if it's too light to read on white.
function readableAccent(hex: string): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Relative luminance (0-1)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (lum <= 0.55) return hex; // already readable
  // Mix toward a deep ink until readable
  const mix = (c: number) => Math.round(c * 0.32 + 26 * 0.68); // blend 68% toward #1a (26)
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

// ─── 50 Themes ───────────────────────────────────────────────────────────────

const T = (
  id: number, name: string, category: string,
  bg: string, dark: boolean, accent: string,
): PortfolioTheme => ({ id, name, category, bg, dark, accent });

export const THEMES: PortfolioTheme[] = [
  // ── Feminine / Soft Light (1-10) ─────────────────────────────────────────
  T(1,  "Rose Dream",     "soft",    "linear-gradient(145deg,#fdf2f8 0%,#fce4ec 50%,#f8bbd0 100%)",                  false, "#c2185b"),
  T(2,  "Peach Glow",     "soft",    "linear-gradient(145deg,#fff8f0 0%,#ffe0b2 60%,#ffccbc 100%)",                  false, "#e64a19"),
  T(3,  "Lavender Sky",   "soft",    "linear-gradient(145deg,#f3e5f5 0%,#e1bee7 60%,#ce93d8 100%)",                  false, "#7b1fa2"),
  T(4,  "Mint Garden",    "soft",    "linear-gradient(145deg,#e8f5e9 0%,#c8e6c9 60%,#a5d6a7 100%)",                  false, "#2e7d32"),
  T(5,  "Golden Hour",    "soft",    "linear-gradient(145deg,#fff8e1 0%,#ffe082 50%,#ffca28 100%)",                  false, "#f57f17"),
  T(6,  "Cherry Blossom", "soft",    "linear-gradient(160deg,#fff0f3 0%,#ffd6e0 50%,#ffadc2 100%)",                  false, "#e91e63"),
  T(7,  "Lilac Mist",     "soft",    "linear-gradient(145deg,#f5f0ff 0%,#ede7f6 50%,#d1c4e9 100%)",                  false, "#6a1b9a"),
  T(8,  "Coral Sunset",   "soft",    "linear-gradient(160deg,#fff3e0 0%,#ffe0b2 40%,#ffccbc 80%,#f8bbd0 100%)",     false, "#bf360c"),
  T(9,  "Sky Breeze",     "soft",    "linear-gradient(145deg,#e3f2fd 0%,#bbdefb 60%,#90caf9 100%)",                  false, "#1565c0"),
  T(10, "Cotton Candy",   "soft",    "linear-gradient(135deg,#fce4ec 0%,#f3e5f5 50%,#e3f2fd 100%)",                  false, "#ad1457"),

  // ── Dark / Masculine (11-20) ──────────────────────────────────────────────
  T(11, "Midnight Navy",  "dark",    "linear-gradient(145deg,#0a0e1a 0%,#0d1b2a 50%,#1a2744 100%)",                  true,  "#6366f1"),
  T(12, "Deep Space",     "dark",    "linear-gradient(145deg,#050510 0%,#0f0820 50%,#1a0a2e 100%)",                  true,  "#7c3aed"),
  T(13, "Dark Forest",    "dark",    "linear-gradient(145deg,#0a1a0d 0%,#0d2211 50%,#1a3a1e 100%)",                  true,  "#22c55e"),
  T(14, "Volcanic",       "dark",    "linear-gradient(145deg,#1a0505 0%,#2d0a0a 50%,#3d1010 100%)",                  true,  "#ef4444"),
  T(15, "Steel",          "dark",    "linear-gradient(145deg,#0f1419 0%,#1a2433 50%,#1e2d3d 100%)",                  true,  "#60a5fa"),
  T(16, "Obsidian",       "dark",    "linear-gradient(145deg,#050505 0%,#0f0f0f 50%,#1a1a1a 100%)",                  true,  "#a78bfa"),
  T(17, "Ink Blue",       "dark",    "linear-gradient(145deg,#060c1a 0%,#0a1428 50%,#0f1e3c 100%)",                  true,  "#3b82f6"),
  T(18, "Deep Teal",      "dark",    "linear-gradient(145deg,#050e10 0%,#081a1e 50%,#0a2428 100%)",                  true,  "#06b6d4"),
  T(19, "Charcoal",       "dark",    "linear-gradient(145deg,#111111 0%,#1a1a1a 50%,#252525 100%)",                  true,  "#818cf8"),
  T(20, "Shadow Purple",  "dark",    "linear-gradient(145deg,#0d0614 0%,#1a0d2e 50%,#2a1048 100%)",                  true,  "#c084fc"),

  // ── Bold / Colorful (21-30) ───────────────────────────────────────────────
  T(21, "Electric Blue",  "bold",    "linear-gradient(145deg,#1e40af 0%,#2563eb 50%,#3b82f6 100%)",                  true,  "#bfdbfe"),
  T(22, "Neon Night",     "bold",    "linear-gradient(145deg,#052e16 0%,#14532d 50%,#166534 100%)",                  true,  "#4ade80"),
  T(23, "Solar Flare",    "bold",    "linear-gradient(145deg,#9a3412 0%,#c2410c 50%,#ea580c 100%)",                  true,  "#fed7aa"),
  T(24, "Hot Pink",       "bold",    "linear-gradient(145deg,#9d174d 0%,#be185d 50%,#db2777 100%)",                  true,  "#fce7f3"),
  T(25, "Royal Purple",   "bold",    "linear-gradient(145deg,#4c1d95 0%,#5b21b6 50%,#6d28d9 100%)",                  true,  "#e9d5ff"),
  T(26, "Tropical",       "bold",    "linear-gradient(145deg,#0e7490 0%,#0891b2 50%,#06b6d4 100%)",                  true,  "#cffafe"),
  T(27, "Sunshine",       "bold",    "linear-gradient(145deg,#78350f 0%,#92400e 50%,#b45309 100%)",                  true,  "#fef3c7"),
  T(28, "Crimson",        "bold",    "linear-gradient(145deg,#7f1d1d 0%,#991b1b 50%,#b91c1c 100%)",                  true,  "#fee2e2"),
  T(29, "Ocean Depth",    "bold",    "linear-gradient(145deg,#1e3a5f 0%,#1e40af 50%,#1d4ed8 100%)",                  true,  "#93c5fd"),
  T(30, "Emerald Isle",   "bold",    "linear-gradient(145deg,#064e3b 0%,#065f46 50%,#047857 100%)",                  true,  "#6ee7b7"),

  // ── Neutral / Minimal (31-40) ─────────────────────────────────────────────
  T(31, "Warm Sand",      "neutral", "linear-gradient(145deg,#fdf6ec 0%,#f5ebe0 50%,#eddccc 100%)",                  false, "#92400e"),
  T(32, "Desert Dune",    "neutral", "linear-gradient(145deg,#fef3c7 0%,#fde68a 50%,#fcd34d 100%)",                  false, "#78350f"),
  T(33, "Pure White",     "neutral", "#ffffff",                                                                       false, "#6366f1"),
  T(34, "Linen",          "neutral", "linear-gradient(145deg,#faf5ef 0%,#f0e8dc 60%,#e8ddd0 100%)",                  false, "#7c2d12"),
  T(35, "Stone",          "neutral", "linear-gradient(145deg,#f4f4f5 0%,#e4e4e7 60%,#d4d4d8 100%)",                  false, "#374151"),
  T(36, "Parchment",      "neutral", "linear-gradient(145deg,#fefce8 0%,#fef9c3 60%,#fef08a 100%)",                  false, "#713f12"),
  T(37, "Frost",          "neutral", "linear-gradient(145deg,#f8fafc 0%,#f1f5f9 60%,#e2e8f0 100%)",                  false, "#1e40af"),
  T(38, "Warm Grey",      "neutral", "linear-gradient(145deg,#fafaf9 0%,#f2f2f0 60%,#e8e8e4 100%)",                  false, "#44403c"),
  T(39, "Champagne",      "neutral", "linear-gradient(145deg,#fdf8f0 0%,#f7edd8 50%,#f0e0c0 100%)",                  false, "#78350f"),
  T(40, "Ivory",          "neutral", "linear-gradient(145deg,#fefdf8 0%,#faf7ee 60%,#f5f0e0 100%)",                  false, "#a16207"),

  // ── Special / Artistic (41-50) ────────────────────────────────────────────
  T(41, "Aurora",         "special", "linear-gradient(135deg,#0f0c29 0%,#302b63 35%,#24243e 65%,#0f2027 100%)",      true,  "#a78bfa"),
  T(42, "Mesh Gradient",  "special", "radial-gradient(at 40% 20%, #ff6b9d 0px, transparent 50%), radial-gradient(at 80% 0%, #7c3aed 0px, transparent 50%), radial-gradient(at 0% 50%, #06b6d4 0px, transparent 50%), radial-gradient(at 80% 50%, #ec4899 0px, transparent 50%), radial-gradient(at 0% 100%, #8b5cf6 0px, transparent 50%), #fdf2f8", false, "#7c3aed"),
  T(43, "Sunset Blaze",   "special", "linear-gradient(135deg,#f093fb 0%,#f5576c 30%,#fda085 65%,#f6d365 100%)",      false, "#be185d"),
  T(44, "Cosmos",         "special", "linear-gradient(135deg,#0c0c1d 0%,#1a1a3e 30%,#0d1b3e 65%,#080820 100%)",      true,  "#818cf8"),
  T(45, "Prism",          "special", "linear-gradient(135deg,#667eea 0%,#764ba2 25%,#f093fb 50%,#f5576c 75%,#fda085 100%)", true, "#fde68a"),
  T(46, "Dusk",           "special", "linear-gradient(135deg,#1a1a2e 0%,#16213e 30%,#e94560 65%,#f5a623 100%)",      true,  "#fbbf24"),
  T(47, "Matrix",         "special", "linear-gradient(145deg,#001a00 0%,#002900 50%,#003300 100%)",                   true,  "#4ade80"),
  T(48, "Chrome",         "special", "linear-gradient(135deg,#868f96 0%,#596164 35%,#4a4e69 70%,#9a8c98 100%)",      true,  "#e2e8f0"),
  T(49, "Tropical Vibes", "special", "linear-gradient(135deg,#0093e9 0%,#80d0c7 50%,#a8e063 100%)",                  false, "#065f46"),
  T(50, "Neo Purple",     "special", "linear-gradient(135deg,#1a0533 0%,#3d0066 30%,#5b00a0 65%,#7c00d4 100%)",      true,  "#e9d5ff"),
];

// ─── Block Styles (4 curated shapes) ─────────────────────────────────────────
// Each shape defines a full GEOMETRY scale applied across the whole portfolio —
// not just the cards. Picking "sharp" makes everything sharp (avatar, tags,
// badges, thumbnails…); "pill" makes everything super-round; "torn" gives the
// ripped-paper edge look from the Linktree references.

export type BlockStyleId = "rounded" | "sharp" | "hard" | "torn";

export interface BlockGeometry {
  block:  number;          // main section/card radius
  inner:  number;          // package cards, thumbnails, inner cards
  pill:   number;          // tags, badges, buttons
  avatar: number | string; // avatar radius (string allows "50%")
  torn:   boolean;         // ripped-paper edges on blocks
  hardShadow?: boolean;    // hard offset shadow (no blur)
}

export interface BlockStyleDef {
  id: BlockStyleId;
  name: string;
  previewRadius: number;   // radius for the picker button itself
  geom: BlockGeometry;
}

export const BLOCK_STYLES: BlockStyleDef[] = [
  { id: "rounded", name: "Zaobljeni",   previewRadius: 20, geom: { block: 20, inner: 14, pill: 999, avatar: 20, torn: false } },
  { id: "sharp",   name: "Oštri",       previewRadius: 3,  geom: { block: 3,  inner: 3,  pill: 4,   avatar: 4,  torn: false } },
  { id: "hard",    name: "Tvrda senka", previewRadius: 8,  geom: { block: 12, inner: 10, pill: 8,   avatar: 12, torn: false, hardShadow: true } },
  { id: "torn",    name: "Pocepano",    previewRadius: 12, geom: { block: 0,  inner: 10, pill: 999, avatar: 16, torn: true  } },
];

export const BLOCK_GEOM: Record<BlockStyleId, BlockGeometry> = {
  rounded: BLOCK_STYLES[0].geom,
  sharp:   BLOCK_STYLES[1].geom,
  hard:    BLOCK_STYLES[2].geom,
  torn:    BLOCK_STYLES[3].geom,
};

export const BLOCK_RADIUS: Record<BlockStyleId, number> = {
  rounded: 20,
  sharp:   3,
  hard:    12,
  torn:    0,
};

// Torn-paper mask — fixed-height teeth that tile horizontally, so the rip stays
// crisp regardless of block height. Teeth are tall (12px) and jagged so the
// effect reads clearly even on pale (soft/neutral) backgrounds. A stronger
// drop-shadow gives the torn silhouette definition. Applied via `.pf-torn`.
export const TORN_TOP = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='12' viewBox='0 0 28 12' preserveAspectRatio='none'%3E%3Cpath d='M0 12 L0 6 L2 9 L4 3 L7 8 L10 2 L13 7 L16 1 L19 7 L22 3 L25 8 L28 5 L28 12 Z' fill='%23000'/%3E%3C/svg%3E";
export const TORN_BOTTOM = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='12' viewBox='0 0 28 12' preserveAspectRatio='none'%3E%3Cpath d='M0 0 L0 6 L2 3 L4 9 L7 4 L10 10 L13 5 L16 11 L19 5 L22 9 L25 4 L28 7 L28 0 Z' fill='%23000'/%3E%3C/svg%3E";
export const TORN_LEFT = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='28' viewBox='0 0 12 28' preserveAspectRatio='none'%3E%3Cpath d='M12 0 L12 28 L6 28 L9 24 L4 20 L8 16 L5 12 L9 8 L4 4 L7 0 Z' fill='%23000'/%3E%3C/svg%3E";
export const TORN_RIGHT = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='28' viewBox='0 0 12 28' preserveAspectRatio='none'%3E%3Cpath d='M0 0 L0 28 L6 28 L3 24 L8 20 L4 16 L7 12 L3 8 L8 4 L5 0 Z' fill='%23000'/%3E%3C/svg%3E";
// Torn on ALL FOUR sides → the whole block reads as a torn-paper shape (no boxy
// rectangle). A crisp + soft drop-shadow defines the silhouette even on pale bg.
export const TORN_CSS = `
  .pf-torn {
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    filter: drop-shadow(0 1px 1px rgba(0,0,0,0.30)) drop-shadow(0 6px 14px rgba(0,0,0,0.16));
    -webkit-mask:
      linear-gradient(#000 0 0) center / calc(100% - 22px) calc(100% - 22px) no-repeat,
      url("${TORN_TOP}") top / 28px 12px repeat-x,
      url("${TORN_BOTTOM}") bottom / 28px 12px repeat-x,
      url("${TORN_LEFT}") left / 12px 28px repeat-y,
      url("${TORN_RIGHT}") right / 12px 28px repeat-y;
    -webkit-mask-composite: source-over;
    mask:
      linear-gradient(#000 0 0) center / calc(100% - 22px) calc(100% - 22px) no-repeat,
      url("${TORN_TOP}") top / 28px 12px repeat-x,
      url("${TORN_BOTTOM}") bottom / 28px 12px repeat-x,
      url("${TORN_LEFT}") left / 12px 28px repeat-y,
      url("${TORN_RIGHT}") right / 12px 28px repeat-y;
    mask-composite: add;
  }
`;

// Helper: get theme by id
export function getTheme(id?: number): PortfolioTheme {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}

export const DEFAULT_THEME_ID    = 33; // Pure White (safe default)
export const DEFAULT_BLOCK_STYLE: BlockStyleId = "rounded";

export interface PortfolioAppearance {
  templateId:  number;
  blockStyle:  BlockStyleId;
}
