export default function PikmiLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 122" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pg" x1="0" y1="0" x2="0" y2="122" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#C084FC" />
          <stop offset="42%"  stopColor="#8B3CF7" />
          <stop offset="100%" stopColor="#3730A3" />
        </linearGradient>
      </defs>

      {/* Bubble — zaobljeni PRAVOUGAONIK, nije krug */}
      <rect x="7" y="5" width="86" height="66" rx="22" fill="url(#pg)" />

      {/* Stem/descender — nastavlja se levo-dole, bez kukice */}
      <rect x="7" y="50" width="26" height="58" rx="13" fill="url(#pg)" />

      {/* Tačka/rep na dnu — ide pravo dole, BEZ kukice */}
      <path d="M 7 100 Q 7 118 20 120 Q 33 118 33 100 Z" fill="url(#pg)" />

      {/* Tamna unutrašnjost bubble-a */}
      <rect x="21" y="17" width="58" height="42" rx="15" fill="#0d0820" />

      {/* 3 ljubičaste tačke */}
      <circle cx="37" cy="38" r="5.2" fill="#A855F7" />
      <circle cx="52" cy="38" r="5.2" fill="#A855F7" />
      <circle cx="67" cy="38" r="5.2" fill="#A855F7" />
    </svg>
  );
}
