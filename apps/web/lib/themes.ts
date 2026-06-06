// ─── Portfolio Themes ────────────────────────────────────────────────────────

export interface PortfolioTheme {
  id: number;
  name: string;
  category: string;
  bg: string;          // CSS background for the page
  dark: boolean;       // true = dark bg → white text on bg
  accent: string;      // main accent colour (last name, prices, highlights)
}

// Derive all other colour tokens from the 3 base values
export function themeTokens(t: PortfolioTheme, blockStyle: BlockStyleId) {
  const blockBg      = t.dark ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.90)";
  const blockBorder  = t.dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.055)";
  const blockShadow  = t.dark
    ? "0 2px 12px rgba(0,0,0,0.28)"
    : "0 1px 6px rgba(0,0,0,0.055)";

  const textPrimary  = t.dark ? "#ffffff"               : "#1a1a2e";
  const textSecond   = t.dark ? "rgba(255,255,255,0.65)" : "#555566";
  const textMuted    = t.dark ? "rgba(255,255,255,0.38)" : "#9898a6";

  const accentBg     = t.accent + "18";
  const tagBg        = t.dark ? "rgba(255,255,255,0.10)" : t.accent + "12";
  const tagText      = t.dark ? "rgba(255,255,255,0.80)" : t.accent;
  const tagBorder    = t.dark ? "rgba(255,255,255,0.08)" : t.accent + "30";

  const divider      = t.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.045)";
  const sectionBg    = t.dark ? "rgba(255,255,255,0.045)" : "rgba(0,0,0,0.018)";

  // Glass override
  const isGlass = blockStyle === "glass";
  const glassExtra = isGlass
    ? { backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }
    : {};

  // Outline override
  const isOutline = blockStyle === "outline";
  const outlineBg  = isOutline ? "transparent" : blockBg;
  const outlineBdr = isOutline
    ? (t.dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.14)")
    : blockBorder;

  const radius = BLOCK_RADIUS[blockStyle] ?? 18;

  return {
    pageBg: t.bg,
    textPrimary, textSecond, textMuted,
    accent: t.accent, accentBg, accentLight: accentBg,
    tagBg, tagText, tagBorder,
    divider, sectionBg,
    blockBg: outlineBg, blockBorder: outlineBdr, blockShadow,
    blockRadius: radius, glassExtra,
  };
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

// ─── Block Styles ─────────────────────────────────────────────────────────────

export type BlockStyleId = "default" | "rounded" | "sharp" | "pill" | "glass" | "outline" | "flat";

export interface BlockStyleDef {
  id: BlockStyleId;
  name: string;
  previewRadius: number;
}

export const BLOCK_STYLES: BlockStyleDef[] = [
  { id: "default", name: "Standardni", previewRadius: 16 },
  { id: "rounded", name: "Zaobljeni",  previewRadius: 24 },
  { id: "sharp",   name: "Oštar",      previewRadius: 4  },
  { id: "pill",    name: "Pilula",     previewRadius: 32 },
  { id: "glass",   name: "Staklo",     previewRadius: 18 },
  { id: "outline", name: "Okvir",      previewRadius: 16 },
  { id: "flat",    name: "Flat",       previewRadius: 10 },
];

export const BLOCK_RADIUS: Record<BlockStyleId, number> = {
  default: 18,
  rounded: 26,
  sharp:   5,
  pill:    36,
  glass:   18,
  outline: 18,
  flat:    10,
};

// Helper: get theme by id
export function getTheme(id?: number): PortfolioTheme {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}

export const DEFAULT_THEME_ID    = 33; // Pure White (safe default)
export const DEFAULT_BLOCK_STYLE: BlockStyleId = "default";

export interface PortfolioAppearance {
  templateId:  number;
  blockStyle:  BlockStyleId;
}
