export function HeroArt({
  enrollment,
  faculty,
  copc,
  licensure,
}: {
  enrollment: string;
  faculty: string;
  copc: string;
  licensure: string;
}) {
  return (
    <svg
      viewBox="0 0 560 420"
      role="img"
      aria-label="Illustration of university performance, enrollment, personnel and research indicators"
      className="h-auto w-full max-w-xl"
    >
      <defs>
        <linearGradient id="hero-panel" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#1a3a6b" />
          <stop offset="100%" stopColor="#0d2a52" />
        </linearGradient>
        <linearGradient id="hero-gold" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffd45a" />
          <stop offset="100%" stopColor="#f7b918" />
        </linearGradient>
      </defs>
      <rect x="36" y="48" width="488" height="328" rx="32" fill="url(#hero-panel)" stroke="rgba(255,255,255,0.14)" />
      <rect x="60" y="72" width="168" height="92" rx="18" fill="rgba(255,255,255,0.08)" />
      <text x="78" y="98" fill="#f7b918" fontSize="11" fontFamily="Outfit, sans-serif" fontWeight="700" letterSpacing="1.4">
        ENROLLMENT
      </text>
      <text x="78" y="136" fill="white" fontSize="28" fontFamily="Outfit, sans-serif" fontWeight="700">
        {enrollment}
      </text>
      <rect x="244" y="72" width="140" height="92" rx="18" fill="rgba(255,255,255,0.08)" />
      <text x="262" y="98" fill="#f7b918" fontSize="11" fontFamily="Outfit, sans-serif" fontWeight="700" letterSpacing="1.4">
        FACULTY
      </text>
      <text x="262" y="136" fill="white" fontSize="28" fontFamily="Outfit, sans-serif" fontWeight="700">
        {faculty}
      </text>
      <rect x="400" y="72" width="100" height="92" rx="18" fill="url(#hero-gold)" />
      <text x="418" y="98" fill="#071f46" fontSize="11" fontFamily="Outfit, sans-serif" fontWeight="700" letterSpacing="1.2">
        COPC
      </text>
      <text x="418" y="136" fill="#071f46" fontSize="26" fontFamily="Outfit, sans-serif" fontWeight="700">
        {copc}
      </text>
      <rect x="60" y="184" width="280" height="160" rx="20" fill="rgba(7,31,70,0.45)" />
      <text x="78" y="212" fill="rgba(255,255,255,0.7)" fontSize="11" fontFamily="Outfit, sans-serif" fontWeight="700" letterSpacing="1.4">
        PERFORMANCE TREND
      </text>
      <polyline
        points="86,300 132,268 178,276 224,238 270,248 316,214"
        fill="none"
        stroke="#f7b918"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="86,312 132,296 178,292 224,280 270,274 316,268"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="3"
        strokeDasharray="7 6"
        strokeLinecap="round"
      />
      <circle cx="316" cy="214" r="6" fill="#f7b918" />
      <rect x="360" y="184" width="140" height="72" rx="18" fill="rgba(255,255,255,0.08)" />
      <text x="378" y="210" fill="#f7b918" fontSize="11" fontFamily="Outfit, sans-serif" fontWeight="700" letterSpacing="1.2">
        RESEARCH
      </text>
      <text x="378" y="240" fill="white" fontSize="22" fontFamily="Outfit, sans-serif" fontWeight="700">
        FY 2026
      </text>
      <rect x="360" y="272" width="140" height="72" rx="18" fill="rgba(255,255,255,0.08)" />
      <text x="378" y="298" fill="#f7b918" fontSize="11" fontFamily="Outfit, sans-serif" fontWeight="700" letterSpacing="1.2">
        LICENSURE
      </text>
      <text x="378" y="328" fill="white" fontSize="22" fontFamily="Outfit, sans-serif" fontWeight="700">
        {licensure}
      </text>
    </svg>
  );
}
