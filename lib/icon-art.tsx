/* Shared artwork for generated PNG icons (rendered by next/og ImageResponse). */
export function IconArt({ size, rounded = true }: { size: number; rounded?: boolean }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #1b2c52 0%, #0f1b33 60%, #0a1326 100%)",
        borderRadius: rounded ? size * 0.22 : 0,
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 48 48">
        <path
          d="M24 6.5 38 11.6v11.1c0 8.6-5.9 15.3-14 18.8C15.9 38 10 31.3 10 22.7V11.6Z"
          fill="none"
          stroke="#d4b27a"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M20.6 15.5h6.8v1.7h-2.2v12.6h2.2v1.7h-6.8v-1.7h2.2V17.2h-2.2Z" fill="#d4b27a" />
      </svg>
    </div>
  );
}
