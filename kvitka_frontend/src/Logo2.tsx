import { COLORS } from "./colors";

interface LogoProps {
  size?: number;
}

export function Logo2({ size = 36 }: LogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        background: COLORS.white,
        color: COLORS.red,
        fontWeight: 800,
        fontSize: size * 0.5,
        padding: `${size * 0.15}px ${size * 0.3}px`,
        borderRadius: 15,
        letterSpacing: 1,
        fontFamily: "'Segoe UI', sans-serif",
        userSelect: "none",
      }}>КВІТКА AI</div>
    </div>
  );
}
export function Logo2light({ size = 36 }: LogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        background: COLORS.red,
        color: COLORS.white,
        fontWeight: 800,
        fontSize: size * 0.5,
        padding: `${size * 0.15}px ${size * 0.3}px`,
        borderRadius: 15,
        letterSpacing: 1,
        fontFamily: "'Segoe UI', sans-serif",
        userSelect: "none",
      }}>КВІТКА AI</div>
    </div>
  );
}


