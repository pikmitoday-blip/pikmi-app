export default function PikmiLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.22)}
      viewBox="0 0 100 122"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Main diagonal gradient: hot-pink → purple → blue */}
        <linearGradient id="pg" x1="5" y1="5" x2="95" y2="118" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#DD44FF" />
          <stop offset="44%"  stopColor="#8B2FF5" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        {/* 3-D highlight: white shimmer top-left only */}
        <linearGradient id="hl" x1="5" y1="5" x2="54" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.30)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
        </linearGradient>
      </defs>

      {/* ── P-shape: thick left stem (full height) ── */}
      <rect x="7" y="7" width="24" height="107" rx="12" fill="url(#pg)" />

      {/* ── P-shape: rounded bowl (top ~55% of height) ── */}
      <rect x="7" y="7" width="86" height="65" rx="21" fill="url(#pg)" />

      {/* ── Speech-bubble tail (bottom-right of stem) ── */}
      <path
        d="M 23 109 C 26 118, 37 120, 39 122 C 34 125, 21 122, 19 110 Z"
        fill="url(#pg)"
      />

      {/* ── 3-D highlight overlay ── */}
      <rect x="7" y="7" width="24" height="107" rx="12" fill="url(#hl)" />
      <rect x="7" y="7" width="86" height="65" rx="21" fill="url(#hl)" />

      {/* ── Dark inner cutout (speech bubble interior) ── */}
      <rect x="26" y="18" width="56" height="43" rx="13" fill="#07001A" />

      {/* ── Three typing dots ── */}
      <circle cx="41"  cy="39.5" r="5" fill="#C084FC" />
      <circle cx="54"  cy="39.5" r="5" fill="#A855F7" />
      <circle cx="67"  cy="39.5" r="5" fill="#9333EA" />
    </svg>
  );
}
