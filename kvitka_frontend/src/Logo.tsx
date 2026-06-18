import { COLORS } from "./colors";

interface LogoProps {
  size?: number;
}

export function Logo({ size = 36 }: LogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        background: COLORS.red,
        color: "#fff",
        fontWeight: 800,
        fontSize: size * 0.45,
        padding: `${size * 0.15}px ${size * 0.3}px`,
        borderRadius: 4,
        letterSpacing: 1,
        fontFamily: "'Segoe UI', sans-serif",
        userSelect: "none",
      }}>КВІТКА</div>
    </div>
  );
}
