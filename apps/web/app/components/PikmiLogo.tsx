export default function PikmiLogo({ size = 32 }: { size?: number }) {
  const h = Math.round(size * 1.2);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Diagonal gradient: hot-pink top-left → cobalt blue bottom-right */}
        <linearGradient id="pg" x1="0" y1="0" x2="100" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#EE33FF" />
          <stop offset="48%"  stopColor="#8B28F0" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        {/* 3-D top-left highlight shimmer */}
        <linearGradient id="hl" x1="0" y1="0" x2="60" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.35)" />
          <stop offset="55%"  stopColor="rgba(255,255,255,0.07)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
        </linearGradient>
      </defs>

      {/*
        ── P STEM ──
        Full-height vertical bar, thicker (~28px) with rounded ends.
      */}
      <rect x="5" y="5" width="28" height="108" rx="14" fill="url(#pg)" />

      {/*
        ── P BOWL ──
        D-shape: flat left edge + cubic-bezier curve on the right that
        bulges to ~x=94 and comes back, giving a proper round bowl.
      */}
      <path
        d="M 5 6
           Q 5 5 6 5
           L 50 5
           C 96 5, 96 72, 50 72
           L 6 72
           Q 5 72 5 71
           Z"
        fill="url(#pg)"
      />

      {/*
        ── SPEECH BUBBLE TAIL ──
        Small curved pointer at bottom-right of stem, like a chat bubble.
      */}
      <path
        d="M 25 109
           C 27 120, 40 120, 43 114
           C 40 108, 25 107, 25 109
           Z"
        fill="url(#pg)"
      />

      {/* 3-D highlight overlay — same shapes, white gradient on top */}
      <rect x="5" y="5" width="28" height="108" rx="14" fill="url(#hl)" />
      <path
        d="M 5 6 Q 5 5 6 5 L 50 5 C 96 5, 96 72, 50 72 L 6 72 Q 5 72 5 71 Z"
        fill="url(#hl)"
      />

      {/*
        ── DARK INNER CUTOUT ──
        Tall rounded-rect inside the bowl, rx=18 makes it very circular.
        Offset to the right so the eye reads it as inside the bowl, not the stem.
      */}
      <rect x="29" y="17" width="54" height="44" rx="20" fill="#060010" />

      {/* ── THREE TYPING DOTS ── */}
      <circle cx="43" cy="39" r="5.2" fill="#CC66FF" />
      <circle cx="56" cy="39" r="5.2" fill="#AA44EE" />
      <circle cx="69" cy="39" r="5.2" fill="#9333EA" />
    </svg>
  );
}
