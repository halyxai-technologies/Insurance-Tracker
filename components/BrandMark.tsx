export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="brandmark">
      <defs>
        <linearGradient id="bm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1b2c52" />
          <stop offset="1" stopColor="#0a1326" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#bm-bg)" />
      <rect x=".5" y=".5" width="47" height="47" rx="11.5" fill="none" stroke="#d4b27a" strokeOpacity=".35" />
      <path
        d="M24 9.5 35 13.5v8.7c0 6.8-4.6 12-11 14.8-6.4-2.8-11-8-11-14.8v-8.7Z"
        fill="none"
        stroke="#d4b27a"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M21.4 16.8h5.2v1.3h-1.7v9.7h1.7v1.3h-5.2v-1.3h1.7v-9.7h-1.7Z" fill="#d4b27a" />
    </svg>
  );
}
